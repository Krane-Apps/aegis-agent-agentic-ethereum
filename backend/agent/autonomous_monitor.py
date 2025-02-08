import time
import logging
from typing import Dict, Any
from langchain_core.messages import HumanMessage
from db.setup import setup
from db.models import Contract, Log
from agent.initialize_agent import initialize_agent
from datetime import datetime

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
                # save start of analysis log
                self.save_analysis_log(
                    session,
                    contract.id,
                    f"🔍 Starting Threat Analysis for contract {contract.address}",
                    "INFO"
                )

                # format the analysis request for the agent
                prompt = f"""You are a security monitoring agent. Analyze the latest transactions for contract {contract.address} on {contract.network} for security threats.

Contract Details:
- Type: {contract.description}
- Current Status: {contract.status}
- Current Threat Level: {contract.threat_level}
- Emergency Function: {contract.emergency_function}

Follow these steps:
1. Use get_last_transactions to fetch recent transactions for this contract
2. For each transaction:
   - Check for suspicious patterns (flash loans, reentrancy, etc.)
   - Analyze value transfers and gas usage
   - Look for known attack vectors
3. If high-risk threats are found:
   - Call the emergency function using CDP Agentkit
   - Update contract status
4. Log all findings with appropriate severity levels

Take action autonomously if threats are detected. You have access to all necessary tools through CDP Agentkit.

Format your analysis logs with emojis:
- 🟢 for safe/normal transactions
- 🟡 for suspicious but not critical patterns
- 🔴 for high-risk threats
- 🚨 for emergency actions taken"""

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
                        if "🔴" in message or "🚨" in message:
                            level = "ERROR"
                        elif "🟡" in message:
                            level = "WARNING"
                        
                        # save to database
                        self.save_analysis_log(session, contract.id, message, level)
                        logger.info(f"[autonomous_monitor] {message}")
                    
                    elif "tools" in chunk:
                        message = chunk["tools"]["messages"][0].content
                        self.save_analysis_log(session, contract.id, f"🛠️ {message}", "INFO")
                        logger.info(f"[autonomous_monitor] {message}")

                # save end of analysis log
                self.save_analysis_log(
                    session,
                    contract.id,
                    f"✅ Completed Threat Analysis for contract {contract.address}",
                    "INFO"
                )

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