from web3 import Web3
import os
import time
import threading
from db.models import Contract, Alert, AlertEmail
from utils.email_service import send_alert_email
import logging
from eth_utils import to_checksum_address
from web3.exceptions import BlockNotFound
from agent.custom_actions.get_last_transactions import get_last_transactions, format_transaction_log

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] ContractMonitor: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

class ContractMonitor:
    def __init__(self, db_session):
        self.db_session = db_session
        self.monitors = {}
        self.stop_flags = {} 
        self.last_processed_block = {}
        logger = logging.getLogger('contract_monitor')
        logger.info("Contract monitor initialized and ready to track contracts")
    
    def get_web3(self, network):
        providers = {
            'ethereum': os.getenv('ETH_RPC_URL', 'https://eth-mainnet.g.alchemy.com/v2/api-key'),
            'base': os.getenv('BASE_RPC_URL', 'https://mainnet.base.org'),
            'base-sepolia': os.getenv('BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org')
        }
        if network not in providers:
            raise ValueError(f"Unsupported network: {network}")
        
        provider_url = providers[network]
        if not provider_url:
            raise ValueError(f"No RPC URL configured for network: {network}")
            
        logger.info(f"Connecting to {network} network at {provider_url}")
        return Web3(Web3.HTTPProvider(provider_url))
    
    def get_contract_transactions(self, web3, contract_address, from_block, to_block):
        """Get all transactions involving the contract"""
        try:
            # get transactions where contract is recipient
            to_contract = web3.eth.get_logs({
                'fromBlock': from_block,
                'toBlock': to_block,
                'address': contract_address
            })
            
            # get transactions where contract is sender
            from_contract = web3.eth.get_logs({
                'fromBlock': from_block,
                'toBlock': to_block,
                'topics': [None],  # Any event
                'address': contract_address
            })
            
            return to_contract + from_contract
            
        except BlockNotFound:
            logger.warning(f"Block range {from_block}-{to_block} not available, adjusting range")
            return []
    
    def analyze_transaction(self, web3, tx):
        """Analyze a transaction for potential threats"""
        threats = []
        logger = logging.getLogger('contract_monitor')
        
        try:
            tx_hash = tx.get('transactionHash', '').hex()
            if tx_hash:
                logger.info(f"Analyzing transaction: {tx_hash}")
                
                tx_details = web3.eth.get_transaction(tx_hash)
                receipt = web3.eth.get_transaction_receipt(tx_hash)
                
                # log transaction details
                logger.info(f"Transaction value: {web3.from_wei(tx_details.get('value', 0), 'ether')} ETH")
                logger.info(f"Gas used: {receipt.get('gasUsed', 0) if receipt else 'unknown'}")
                
                # check for high value transfers
                if tx_details.get('value', 0) > web3.to_wei(10, 'ether'):
                    threat_msg = f'High value transfer: {web3.from_wei(tx_details["value"], "ether")} ETH'
                    logger.warning(threat_msg)
                    threats.append({
                        'type': 'high_value_transfer',
                        'description': threat_msg
                    })
                
                # check for failed transactions
                if receipt and receipt.get('status') == 0:
                    threat_msg = f'Failed transaction detected: {tx_hash}'
                    logger.warning(threat_msg)
                    threats.append({
                        'type': 'failed_transaction',
                        'description': threat_msg
                    })
                
                # check for high gas usage
                if receipt and receipt.get('gasUsed', 0) > 1000000:
                    threat_msg = f'High gas usage: {receipt["gasUsed"]} gas'
                    logger.warning(threat_msg)
                    threats.append({
                        'type': 'high_gas_usage',
                        'description': threat_msg
                    })
                
                if not threats:
                    logger.info("No threats detected in transaction")
                
        except Exception as e:
            logger.error(f"Error analyzing transaction: {str(e)}")
        
        return threats
    
    def monitor_contract(self, contract_id):
        logger = logging.getLogger('contract_monitor')
        logger = logging.LoggerAdapter(logger, {'contract_id': contract_id})
        
        logger.info(f"Starting monitoring service for contract ID: {contract_id}")
        
        while True:
            try:
                with self.db_session() as session:
                    contract = session.query(Contract).get(contract_id)
                    if not contract:
                        logger.warning(f"Contract {contract_id} not found, stopping monitor")
                        break

                    logger.info(f"Monitoring contract {contract.address} on {contract.network}")
                    
                    # get last 10 transactions
                    transactions = get_last_transactions(contract.address, contract.network)
                    
                    if transactions:
                        logger.info(f"Retrieved {len(transactions)} recent transactions")
                        for tx in transactions:
                            logger.info(format_transaction_log(tx))
                            
                            # Analyze transaction for threats
                            if tx['is_error']:
                                logger.warning(f"Failed transaction detected: {tx['hash']}")
                            
                            if float(tx['value']) > 10:  # More than 10 ETH
                                logger.warning(f"High value transfer detected: {tx['value']} ETH")
                            
                            if int(tx['gas_used']) > 1000000:  # High gas usage
                                logger.warning(f"High gas usage detected: {tx['gas_used']}")
                    else:
                        logger.info("No recent transactions found")
                    
                    # sleep until next check
                    sleep_time = self.get_sleep_time(contract.monitoring_frequency)
                    logger.info(f"Next check in {sleep_time} seconds")
                    time.sleep(sleep_time)
                    
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                time.sleep(60)
    
    def send_notifications(self, session, contract, threats):
        """Send email notifications for detected threats"""
        try:
            emails = session.query(AlertEmail).filter_by(contract_id=contract.id).all()
            for email in emails:
                try:
                    message = (
                        f'Security threats detected for contract {contract.address}:\n\n' +
                        '\n'.join([f"- {t['type']}: {t['description']}" for t in threats])
                    )
                    send_alert_email(
                        email.email,
                        'Contract Security Alert',
                        message
                    )
                    logger.info(f"Sent alert email to {email.email}")
                except Exception as e:
                    logger.error(f"Failed to send email to {email.email}: {str(e)}")
        except Exception as e:
            logger.error(f"Error sending notifications: {str(e)}")
    
    def get_sleep_time(self, frequency):
        """Convert monitoring frequency to sleep seconds"""
        frequency_map = {
            '1min': 60,
            '5min': 300,
            '15min': 900,
            '30min': 1800,
            '1hour': 3600
        }
        return frequency_map.get(frequency, 300)
    
    def start_monitoring(self, contract_id):
        if contract_id not in self.monitors:
            logger.info(f"Starting new monitor thread for contract {contract_id}")
            thread = threading.Thread(
                target=self.monitor_contract,
                args=(contract_id,),
                name=f"contract-monitor-{contract_id}"
            )
            thread.daemon = True
            thread.start()
            self.monitors[contract_id] = thread
            logger.info(f"Monitor thread started for contract {contract_id}")
        else:
            logger.warning(f"Monitor already exists for contract {contract_id}")
    
    def stop_monitoring(self, contract_id):
        """Stop monitoring a specific contract"""
        if contract_id in self.monitors:
            self.stop_flags[contract_id] = True
            self.monitors.pop(contract_id, None)
            logger.info(f"Stopped monitoring contract {contract_id}") 