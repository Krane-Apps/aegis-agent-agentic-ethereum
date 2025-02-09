from flask import Flask, request, Response, stream_with_context, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import logging
import threading
import os
from sqlalchemy.orm import Session
from datetime import datetime

from agent.initialize_agent import initialize_agent
from agent.run_agent import run_agent
from agent.autonomous_monitor import AutonomousMonitor
from db.setup import setup
from utils.logging_config import setup_logging

from db.models import Contract, Alert, AlertEmail, Log
from monitoring.contract_monitor import ContractMonitor

load_dotenv()
app = Flask(__name__)
CORS(app)

# setup database first
Session = setup()

# setup logging with the session maker
setup_logging(Session)
logger = logging.getLogger(__name__)

# initialize contract monitor after logging is setup
contract_monitor = ContractMonitor(Session)

# setup SQLite tables
setup()

# initialize the agent
agent_executor = initialize_agent()
app.agent_executor = agent_executor

# initialize and start autonomous monitor
autonomous_monitor = AutonomousMonitor()
monitor_thread = threading.Thread(target=autonomous_monitor.run, name="autonomous-monitor")
monitor_thread.daemon = True
monitor_thread.start()
logger.info("Started autonomous monitoring thread")

@app.route("/api/monitor/status", methods=['GET'])
def get_monitor_status():
    """Get autonomous monitor status"""
    return jsonify({
        "running": autonomous_monitor.running,
        "thread_alive": monitor_thread.is_alive()
    })

@app.route("/api/monitor/stop", methods=['POST'])
def stop_monitor():
    """Stop autonomous monitoring"""
    autonomous_monitor.stop()
    return jsonify({"success": True, "message": "Autonomous monitoring stopped"})

@app.route("/api/monitor/start", methods=['POST'])
def start_monitor():
    """Start autonomous monitoring"""
    global monitor_thread
    if not monitor_thread.is_alive():
        autonomous_monitor.running = False  # ensure old thread is stopped
        monitor_thread = threading.Thread(target=autonomous_monitor.run, name="autonomous-monitor")
        monitor_thread.daemon = True
        monitor_thread.start()
        return jsonify({"success": True, "message": "Autonomous monitoring started"})
    return jsonify({"success": False, "message": "Monitoring already running"})

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
                    "id": contract.id,
                    "address": contract.address,
                    "network": contract.network,
                    "description": contract.description,
                    "status": contract.status,
                    "threatLevel": contract.threat_level,
                    "monitoringFrequency": contract.monitoring_frequency
                } for contract in contracts]
            })
    except Exception as e:
        logger.error(f"Error fetching contracts: {str(e)}")
        return jsonify({"error": "Failed to fetch contracts"}), 500

@app.route("/api/contracts", methods=['POST'])
def add_contract():
    try:
        data = request.json
        logger.info(f"Adding new contract: {data['contractAddress']} on {data['network']}")
        
        with Session() as session:
            # Create new contract with additional fields
            contract = Contract(
                address=data['contractAddress'],
                network=data['network'],
                emergency_function=data['emergencyFunction'],
                description=data.get('description', ''),
                alert_threshold=data.get('alertThreshold', 'Medium'),
                monitoring_frequency=data.get('monitoringFrequency', '5min')
            )
            session.add(contract)
            session.flush()
            
            logger.info(f"Created contract with ID: {contract.id}")
            if contract.description:
                logger.info(f"Contract description: {contract.description}")
            
            # add email addresses
            for email in data['emails']:
                alert_email = AlertEmail(
                    contract_id=contract.id,
                    email=email
                )
                session.add(alert_email)
                logger.info(f"Added alert email: {email}")
            
            session.commit()
            
            # Start monitoring with new frequency
            contract_monitor.start_monitoring(contract.id)
            logger.info(f"Started monitoring for contract {contract.id}")
            
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

@app.route("/api/logs", methods=['GET'])
def get_logs():
    try:
        with Session() as session:
            # get query parameters
            contract_id = request.args.get('contract_id', type=int)
            limit = request.args.get('limit', default=100, type=int)
            
            # build query - only get contract_monitor logs
            query = session.query(Log).filter(Log.source == 'autonomous_monitor')
            
            if contract_id:
                query = query.filter(Log.contract_id == contract_id)
                
            # get latest logs
            logs = query.order_by(Log.timestamp.desc()).limit(limit).all()
            
            return jsonify({
                "logs": [{
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat(),
                    "level": log.level,
                    "source": log.source,
                    "message": log.message,
                    "contract_id": log.contract_id
                } for log in logs]
            })
    except Exception as e:
        logger.error(f"Error fetching logs: {str(e)}")
        return jsonify({"error": "Failed to fetch logs"}), 500

@app.route("/api/contracts/<int:contract_id>/logs", methods=['GET'])
def get_contract_logs(contract_id):
    try:
        with Session() as session:
            logs = session.query(Log)\
                .filter(Log.contract_id == contract_id)\
                .filter(Log.source == 'autonomous_monitor')\
                .order_by(Log.timestamp.desc())\
                .limit(100)\
                .all()
            
            return jsonify({
                "logs": [{
                    "id": log.id,
                    "timestamp": log.timestamp.isoformat(),
                    "level": log.level,
                    "source": log.source,
                    "message": log.message
                } for log in logs]
            })
    except Exception as e:
        logger.error(f"Error fetching contract logs: {str(e)}")
        return jsonify({"error": "Failed to fetch contract logs"}), 500

@app.route("/api/contracts/<int:contract_id>", methods=['DELETE'])
def delete_contract(contract_id):
    try:
        with Session() as session:
            contract = session.query(Contract).get(contract_id)
            if not contract:
                return jsonify({"error": "Contract not found"}), 404
            
            # stop monitoring thread if exists
            if contract_id in contract_monitor.monitors:
                # Note: You might need to implement a stop method in your monitor thread
                logger.info(f"Stopping monitor for contract {contract_id}")
                contract_monitor.monitors.pop(contract_id)
            
            # delete related records
            session.query(AlertEmail).filter_by(contract_id=contract_id).delete()
            session.query(Alert).filter_by(contract_id=contract_id).delete()
            session.query(Log).filter_by(contract_id=contract_id).delete()
            
            # delete contract
            session.delete(contract)
            session.commit()
            
            logger.info(f"Contract {contract_id} deleted successfully")
            return jsonify({"success": True, "message": "Contract deleted successfully"})
            
    except Exception as e:
        logger.error(f"Error deleting contract: {str(e)}")
        return jsonify({"error": "Failed to delete contract"}), 500

if __name__ == "__main__":
    # get port from environment variable or default to 5000
    port = int(os.environ.get("PORT", 5000))
    # run the app binding to 0.0.0.0
    app.run(host='0.0.0.0', port=port)
    