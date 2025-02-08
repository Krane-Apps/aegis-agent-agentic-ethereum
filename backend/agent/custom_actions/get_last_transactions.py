from web3 import Web3
import os
import requests
from typing import Dict, List, Optional

def get_network_config(network: str) -> Dict[str, str]:
    """Get API configuration based on network"""
    configs = {
        'ethereum': {
            'api_url': 'https://api.etherscan.io/api',
            'api_key': os.getenv('ETHERSCAN_API_KEY')
        },
        'base': {
            'api_url': 'https://api.basescan.org/api',
            'api_key': os.getenv('BASESCAN_API_KEY')
        },
        'base-sepolia': {
            'api_url': 'https://api-sepolia.basescan.org/api',
            'api_key': os.getenv('BASESCAN_API_KEY')
        }
    }
    return configs.get(network, {})

def get_last_transactions(contract_address: str, network: str) -> List[Dict]:
    """
    Get last 10 transactions for a contract based on its network.
    
    Args:
        contract_address (str): The contract address to monitor
        network (str): The network (ethereum, base, base-sepolia)
    
    Returns:
        List[Dict]: List of last 10 transactions with details
    """
    try:
        config = get_network_config(network)
        if not config:
            raise ValueError(f"Unsupported network: {network}")
        
        # ensure contract address is checksummed
        contract_address = Web3.to_checksum_address(contract_address)
        
        # build API request
        params = {
            'module': 'account',
            'action': 'txlist',
            'address': contract_address,
            'startblock': 0,
            'endblock': 99999999,
            'page': 1,
            'offset': 10,  # get last 10 transactions
            'sort': 'desc',
            'apikey': config['api_key']
        }
        
        # make API request
        response = requests.get(config['api_url'], params=params)
        data = response.json()
        
        if data.get('status') != '1':
            raise Exception(f"API Error: {data.get('message', 'Unknown error')}")
        
        # process and format transactions
        transactions = []
        for tx in data.get('result', []):
            transactions.append({
                'hash': tx.get('hash'),
                'from': tx.get('from'),
                'to': tx.get('to'),
                'value': Web3.from_wei(int(tx.get('value', '0')), 'ether'),
                'timestamp': tx.get('timeStamp'),
                'gas_used': tx.get('gasUsed'),
                'is_error': tx.get('isError') == '1',
                'method': tx.get('functionName', '').split('(')[0] if tx.get('functionName') else 'Transfer',
                'block_number': tx.get('blockNumber')
            })
        
        return transactions
        
    except Exception as e:
        print(f"Error fetching transactions: {str(e)}")
        return []

def format_transaction_log(tx: Dict) -> str:
    """Format a transaction for logging"""
    return (
        f"Transaction: {tx['hash']}\n"
        f"Method: {tx['method']}\n"
        f"From: {tx['from']}\n"
        f"To: {tx['to']}\n"
        f"Value: {tx['value']} ETH\n"
        f"Status: {'Failed' if tx['is_error'] else 'Success'}\n"
        f"Gas Used: {tx['gas_used']}\n"
        f"Block: {tx['block_number']}\n"
        f"Timestamp: {tx['timestamp']}\n"
        "------------------------"
    ) 