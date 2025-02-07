from web3 import Web3
import os
import time
import threading
from db.models import Contract, Alert, AlertEmail
from utils.email_service import send_alert_email
import logging

logger = logging.getLogger(__name__)

class ContractMonitor:
    def __init__(self, db_session):
        self.db_session = db_session
        self.monitors = {}
        
    def get_web3(self, network):
        providers = {
            'ethereum': os.getenv('ETH_RPC_URL'),
            'base': os.getenv('BASE_RPC_URL'),
            'base-sepolia': os.getenv('BASE_SEPOLIA_RPC_URL')
        }
        if network not in providers:
            raise ValueError(f"Unsupported network: {network}")
        return Web3(Web3.HTTPProvider(providers[network]))
    
    def monitor_contract(self, contract_id):
        while True:
            try:
                with self.db_session() as session:
                    contract = session.query(Contract).get(contract_id)
                    if not contract:
                        break
                        
                    web3 = self.get_web3(contract.network)
                    
                    # check contract balance and activity
                    balance = web3.eth.get_balance(contract.address)
                    latest_block = web3.eth.block_number
                    events = web3.eth.get_logs({
                        'fromBlock': latest_block - 100,
                        'toBlock': 'latest',
                        'address': contract.address
                    })
                    
                    # Detect threats
                    threats = self.detect_threats(web3, contract, events)
                    
                    if threats:
                        # update contract status
                        contract.status = 'Warning'
                        contract.threat_level = 'Medium'
                        
                        # create alerts
                        for threat in threats:
                            alert = Alert(
                                contract_id=contract.id,
                                type=threat['type'],
                                description=threat['description']
                            )
                            session.add(alert)
                        
                        # send email notifications
                        emails = session.query(AlertEmail).filter_by(contract_id=contract.id).all()
                        for email in emails:
                            send_alert_email(
                                email.email,
                                'Contract Security Alert',
                                f'Security threats detected for contract {contract.address}'
                            )
                        
                        session.commit()
                    
                time.sleep(60)  # check every minute
                
            except Exception as e:
                logger.error(f"Error monitoring contract {contract_id}: {str(e)}")
                time.sleep(60)
    
    def detect_threats(self, web3, contract, events):
        threats = []
        
        # check for unusual activity
        if len(events) > 50:
            threats.append({
                'type': 'high_activity',
                'description': 'Unusual number of events detected'
            })
        
        # will add more threat detection logic here
        
        return threats
    
    def start_monitoring(self, contract_id):
        if contract_id not in self.monitors:
            thread = threading.Thread(
                target=self.monitor_contract,
                args=(contract_id,)
            )
            thread.daemon = True
            thread.start()
            self.monitors[contract_id] = thread 