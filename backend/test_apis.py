import requests
import json

BASE_URL = 'http://localhost:5000'

def test_apis():
    # test get contracts (should be empty initially)
    response = requests.get(f'{BASE_URL}/api/contracts')
    print("Initial contracts:", response.json())

    # add a contract
    contract_data = {
        "contractAddress": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        "network": "ethereum",
        "emergencyFunction": "pause()",
        "emails": ["test@example.com"]
    }
    response = requests.post(
        f'{BASE_URL}/api/contracts',
        json=contract_data
    )
    print("Add contract response:", response.json())

    # verify contract was added
    response = requests.get(f'{BASE_URL}/api/contracts')
    print("Contracts after adding:", response.json())

    # check stats
    response = requests.get(f'{BASE_URL}/api/stats')
    print("Stats:", response.json())

    # check alert settings
    response = requests.get(f'{BASE_URL}/api/alerts/settings')
    print("Alert settings:", response.json())

if __name__ == "__main__":
    test_apis() 