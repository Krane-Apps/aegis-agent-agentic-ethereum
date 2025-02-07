from flask import Flask, request, Response, stream_with_context, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
from sqlalchemy.orm import Session
from datetime import datetime

from agent.initialize_agent import initialize_agent
from agent.run_agent import run_agent
from db.setup import setup

from db.models import Contract, Alert, AlertEmail
from monitoring.contract_monitor import ContractMonitor

load_dotenv()
app = Flask(__name__)
CORS(app)

# configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# setup database
Session = setup()
contract_monitor = ContractMonitor(Session)

# setup SQLite tables
setup()

# initialize the agent
agent_executor = initialize_agent()
app.agent_executor = agent_executor

# Interact with the agent
@app.route("/api/chat", methods=['POST'])
def chat():
    try:
        data = request.get_json()
        # parse the user input from the request
        input = data['input']
        # use the conversation_id passed in the request for conversation memory
        config = {"configurable": {"thread_id": data['conversation_id']}}
        return Response(
            stream_with_context(run_agent(input, app.agent_executor, config)),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        )
    except Exception as e:
        app.logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500


@app.route("/api/contracts", methods=['GET'])
def get_contracts():
    try:
        with Session() as session:
            contracts = session.query(Contract).all()
            return jsonify({
                "contracts": [{
                    "id": c.id,
                    "address": c.address,
                    "status": c.status,
                    "threatLevel": c.threat_level,
                    "network": c.network
                } for c in contracts]
            })
    except Exception as e:
        logger.error(f"Error fetching contracts: {str(e)}")
        return jsonify({"error": "Failed to fetch contracts"}), 500

@app.route("/api/contracts", methods=['POST'])
def add_contract():
    try:
        data = request.json
        with Session() as session:
            # Create new contract
            contract = Contract(
                address=data['contractAddress'],
                network=data['network'],
                emergency_function=data['emergencyFunction']
            )
            session.add(contract)
            session.flush()  # get the contract id
            
            # add email addresses
            for email in data['emails']:
                alert_email = AlertEmail(
                    contract_id=contract.id,
                    email=email
                )
                session.add(alert_email)
            
            session.commit()
            
            # Start monitoring
            contract_monitor.start_monitoring(contract.id)
            
            return jsonify({
                "success": True,
                "message": "Contract added successfully",
                "contractId": contract.id
            })
    except Exception as e:
        logger.error(f"Error adding contract: {str(e)}")
        return jsonify({"error": "Failed to add contract"}), 500

@app.route("/api/stats", methods=['GET'])
def get_stats():
    try:
        with Session() as session:
            contracts_count = session.query(Contract).count()
            alerts_today = session.query(Alert).filter(
                Alert.created_at >= datetime.utcnow().date()
            ).count()
            active_threats = session.query(Contract).filter(
                Contract.threat_level != 'Low'
            ).count()
            
            return jsonify({
                "contractsMonitored": contracts_count,
                "alertsToday": alerts_today,
                "activeThreats": active_threats
            })
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        return jsonify({"error": "Failed to fetch stats"}), 500

@app.route("/api/alerts/settings", methods=['GET'])
def get_alert_settings():
    try:
        with Session() as session:
            emails = session.query(AlertEmail.email).distinct().all()
            return jsonify({
                "emailNotifications": True,
                "configuredEmails": [email[0] for email in emails],
                "alertTypes": ["flash_loan", "reentrancy", "oracle_manipulation"]
            })
    except Exception as e:
        logger.error(f"Error fetching alert settings: {str(e)}")
        return jsonify({"error": "Failed to fetch alert settings"}), 500

if __name__ == "__main__":
    app.run(debug=True)
    