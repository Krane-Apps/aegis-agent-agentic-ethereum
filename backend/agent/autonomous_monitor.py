import time
import logging
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from db.setup import setup
from db.models import Contract, Log, AlertEmail
from agent.initialize_agent import initialize_agent
from datetime import datetime
from agent.custom_actions.send_alert_email import send_alert_email
from utils.graph_service import get_contract_activity
import json

# setup logging
logger = logging.getLogger("autonomous_monitor")

class AutonomousMonitor:
    def __init__(self):
        """Initialize autonomous monitor with agent and database session"""
        self.Session = setup()
        self.agent_executor = initialize_agent()
        self.running = False
        logger.info("Autonomous monitor initialized")

    def save_analysis_log(self, session, contract_id: int, message: str, level: str = "INFO"):
        """Save analysis log to database"""
        try:
            log = Log(
                timestamp=datetime.utcnow(),
                level=level,
                source="autonomous_monitor",
                message=message,
                contract_id=contract_id
            )
            session.add(log)
            session.commit()
        except Exception as e:
            logger.error(f"Error saving analysis log: {str(e)}")

    def analyze_contract(self, contract: Contract) -> None:
        """Analyze a single contract's transactions using the agent"""
        try:
            with self.Session() as session:
                # get blacklisted addresses
                blacklisted_addresses = []
                blacklist_addresses_set = {addr.address.lower() for addr in blacklisted_addresses}
                
                # get email recipients for this contract
                email_recipients = session.query(AlertEmail.email).filter(
                    AlertEmail.contract_id == contract.id
                ).all()
                email_recipients = [email[0] for email in email_recipients]
                
                # save start of analysis log
                scan_start_msg = f"🔍 Starting Threat Analysis for contract {contract.address}"
                self.save_analysis_log(
                    session,
                    contract.id,
                    scan_start_msg,
                    "INFO"
                )

                # initialize scan results for email
                scan_results = [scan_start_msg]

                # Get subgraph data if URL is provided
                subgraph_data = None
                if contract.subgraph_url:
                    subgraph_data = get_contract_activity(contract.subgraph_url, contract.address)
                    if subgraph_data:
                        self.save_analysis_log(
                            session,
                            contract.id,
                            "📊 Retrieved data from subgraph",
                            "INFO"
                        )

                # format the analysis request for the agent
                prompt = f"""You are a security monitoring agent. Analyze the latest transactions for contract {contract.address} on {contract.network} for security threats.

Contract Details:
- Type: {contract.description}
- Current Status: {contract.status}
- Current Threat Level: {contract.threat_level}
- Emergency Function: {contract.emergency_function}

Blacklisted Addresses: {[addr for addr in blacklist_addresses_set]}

{"Subgraph Data:" + json.dumps(subgraph_data, indent=2) if subgraph_data else "No subgraph data available"}

Follow these steps:
1. Use get_last_transactions to fetch recent transactions for this contract
2. For each transaction:
   - Check if from_address or to_address is in blacklisted addresses (CRITICAL RISK)
   - Check for suspicious patterns (flash loans, reentrancy, etc.)
   - Analyze value transfers and gas usage
   - Look for known attack vectors
3. If subgraph data is available:
   - Analyze approval patterns and amounts
   - Check for suspicious cross-chain burns
   - Correlate on-chain data with subgraph events
4. If high-risk threats are found:
   - Call the emergency function using CDP Agentkit
   - Update contract status
5. Log all findings with appropriate severity levels
6. Send alert emails to stakeholders using send_alert_email tool

Take action autonomously if threats are detected. You have access to all necessary tools through CDP Agentkit.

Format your analysis logs with emojis:
- 🟢 for safe/normal transactions
- 🟡 for suspicious but not critical patterns
- 🔴 for high-risk threats
- 🚨 for emergency actions taken
- ⛔ for blacklisted address interactions
- 📊 for subgraph data analysis"""

                # run agent analysis
                logger.info(f"[autonomous_monitor] Analyzing contract {contract.address}")
                
                # stream agent's analysis
                for chunk in self.agent_executor.stream(
                    {"messages": [HumanMessage(content=prompt)]},
                    {"configurable": {"thread_id": f"contract-{contract.id}"}}
                ):
                    if "agent" in chunk:
                        message = chunk["agent"]["messages"][0].content
                        # determine log level based on emoji
                        level = "INFO"
                        if "🔴" in message or "🚨" in message or "⛔" in message:
                            level = "ERROR"
                            contract.status = "Critical"
                            contract.threat_level = "High"
                            session.commit()
                        elif "🟡" in message:
                            level = "WARNING"
                            if contract.threat_level == "Low":
                                contract.status = "Warning"
                                contract.threat_level = "Medium"
                                session.commit()
                        
                        # save to database and collect for email
                        self.save_analysis_log(session, contract.id, message, level)
                        scan_results.append(message)
                        logger.info(f"[autonomous_monitor] {message}")
                    
                    elif "tools" in chunk:
                        message = chunk["tools"]["messages"][0].content
                        self.save_analysis_log(session, contract.id, f"🛠️ {message}", "INFO")
                        scan_results.append(f"🛠️ {message}")
                        logger.info(f"[autonomous_monitor] {message}")

                # save end of analysis log
                completion_msg = f"✅ Completed Threat Analysis for contract {contract.address}"
                self.save_analysis_log(
                    session,
                    contract.id,
                    completion_msg,
                    "INFO"
                )
                scan_results.append(completion_msg)

                # send email report using the tool
                scan_report = "\n".join(scan_results)
                for email in email_recipients:
                    result = send_alert_email(
                        contract_address=contract.address,
                        network=contract.network,
                        scan_results=scan_report,
                        threat_level=contract.threat_level,
                        to_email=email
                    )
                    if result["success"]:
                        logger.info(f"[autonomous_monitor] Successfully sent alert email to {email}")
                    else:
                        logger.error(f"[autonomous_monitor] Failed to send alert email to {email}: {result['message']}")

        except Exception as e:
            error_msg = f"Error analyzing contract {contract.address}: {str(e)}"
            logger.error(f"[autonomous_monitor] {error_msg}")
            with self.Session() as session:
                self.save_analysis_log(session, contract.id, f"❌ {error_msg}", "ERROR")

    def run(self, interval: int = 5) -> None:
        """
        Run autonomous monitoring continuously
        
        Args:
            interval: Time between monitoring cycles in seconds (default: 5)
        """
        self.running = True
        logger.info(f"Starting autonomous monitoring with {interval}s interval")

        while self.running:
            try:
                # get all contracts from database
                with self.Session() as session:
                    contracts = session.query(Contract).all()
                    
                    if not contracts:
                        logger.info("No contracts found to monitor")
                    else:
                        logger.info(f"Found {len(contracts)} contracts to monitor")
                        
                        # Analyze each contract
                        for contract in contracts:
                            if self.running:  # Check if we should continue
                                self.analyze_contract(contract)
                            else:
                                break

                # sleep before next cycle
                if self.running:
                    time.sleep(interval)

            except Exception as e:
                logger.error(f"Error in monitoring cycle: {str(e)}")
                if self.running:
                    time.sleep(interval)  # sleep even on error

    def stop(self) -> None:
        """Stop the autonomous monitoring"""
        self.running = False
        logger.info("Stopping autonomous monitoring") 