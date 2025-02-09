import requests
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def query_subgraph(subgraph_url: str, query: str) -> Optional[Dict[str, Any]]:
    """
    Query The Graph's API with the provided subgraph URL and GraphQL query.
    
    Args:
        subgraph_url: The URL of the subgraph to query
        query: The GraphQL query string
    
    Returns:
        Optional[Dict[str, Any]]: The query results or None if the request fails
    """
    try:
        logger.info(f"Querying subgraph at URL: {subgraph_url}")
        logger.debug(f"Query: {query}")
        
        # prepare the request payload
        payload = {
            "query": query,
            "variables": {}
        }
        
        # make the request
        response = requests.post(
            subgraph_url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        # log response status
        logger.info(f"Subgraph response status: {response.status_code}")
        
        # check if request was successful
        if response.status_code == 200:
            data = response.json()
            if "errors" in data:
                logger.error(f"GraphQL errors: {data['errors']}")
                return None
            
            logger.info("Successfully fetched data from subgraph")
            logger.debug(f"Response data: {data}")
            return data.get("data")
        else:
            logger.error(f"Failed to query subgraph. Status code: {response.status_code}")
            logger.error(f"Response text: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Error querying subgraph: {str(e)}")
        return None

def get_contract_activity(subgraph_url: str, contract_address: str) -> Optional[Dict[str, Any]]:
    """
    Get data from the subgraph using a simple query.
    
    Args:
        subgraph_url: The URL of the subgraph to query
        contract_address: The contract address (not used in the basic query)
    
    Returns:
        Optional[Dict[str, Any]]: Subgraph data or None if the request fails
    """
    try:
        # basic query @TODO take this as input from the user from frontend!
        query = """
        {
            approvals(first: 5) {
                id
                owner
                spender
                value
            }
            crosschainBurns(first: 5) {
                id
                from
                amount
                sender
            }
        }
        """
        
        logger.info(f"[graph_service] Querying subgraph at: {subgraph_url}")
        
        # prepare the request payload exactly as in the working curl command
        payload = {
            "query": query,
            "operationName": "Subgraphs",
            "variables": {}
        }
        
        # make the request
        response = requests.post(
            subgraph_url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        logger.info(f"[graph_service] Subgraph response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "errors" in data:
                logger.error(f"[graph_service] GraphQL errors: {data['errors']}")
                return None
                
            logger.info("[graph_service] Successfully fetched subgraph data")
            logger.debug(f"[graph_service] Response data: {data}")
            
            # return the entire data object
            return data.get("data")
        else:
            logger.error(f"[graph_service] Failed to fetch subgraph data. Status: {response.status_code}")
            logger.error(f"[graph_service] Response: {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"[graph_service] Error fetching subgraph data: {str(e)}")
        return None 