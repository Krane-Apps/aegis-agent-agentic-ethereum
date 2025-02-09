import os
import constants
import json

from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.prebuilt import create_react_agent

from cdp_langchain.agent_toolkits import CdpToolkit
from cdp_langchain.utils import CdpAgentkitWrapper

from db.wallet import add_wallet_info, get_wallet_info
from agent.custom_actions.get_latest_block import get_latest_block
from agent.custom_actions.get_last_transactions import get_last_transactions, format_transaction_log
from agent.custom_actions.send_alert_email import send_alert_email

def initialize_agent():
    """Initialize the agent with CDP Agentkit and monitoring tools."""
    # initialize llm
    llm = ChatOpenAI(model=constants.AGENT_MODEL)

    # read wallet data from environment variable or database
    wallet_id = os.getenv(constants.WALLET_ID_ENV_VAR)
    wallet_seed = os.getenv(constants.WALLET_SEED_ENV_VAR)
    wallet_info = json.loads(get_wallet_info()) if get_wallet_info() else None

    # configure CDP Agentkit Langchain Extension.
    values = {}

    # load agent wallet information from database or environment variables
    if wallet_info:
        wallet_id = wallet_info["wallet_id"]
        wallet_seed = wallet_info["seed"]
        print("Initialized CDP Agentkit with wallet data from database:", wallet_id, wallet_seed, flush=True)
        values = {"cdp_wallet_data": json.dumps({ "wallet_id": wallet_id, "seed": wallet_seed })}
    elif wallet_id and wallet_seed:
        print("Initialized CDP Agentkit with wallet data from environment:", wallet_id, wallet_seed, flush=True)
        values = {"cdp_wallet_data": json.dumps({ "wallet_id": wallet_id, "seed": wallet_seed })}

    agentkit = CdpAgentkitWrapper(**values)

    # export and store the updated wallet data back to environment variable
    wallet_data = agentkit.export_wallet()
    add_wallet_info(json.dumps(wallet_data))
    print("Exported wallet info", wallet_data, flush=True)

    # initialize CDP Agentkit Toolkit and get tools.
    cdp_toolkit = CdpToolkit.from_cdp_agentkit_wrapper(agentkit)
    
    # create descriptions for the monitoring tools
    get_latest_block.description = """
    Get real-time block data from the network, including:
    - Block number and timestamp
    - All addresses involved in transactions
    - Total value transferred
    - Transaction counts and gas usage
    Use this to monitor for suspicious blockchain activity.
    """
    
    get_last_transactions.description = """
    Get the last 10 transactions for a specific contract address.
    Provides detailed transaction data including:
    - Transaction hash
    - From/To addresses
    - Value transferred
    - Gas usage
    - Method calls
    - Timestamp
    Use this to analyze recent contract interactions and detect threats.
    """

    send_alert_email.description = """
    Send a security alert email when threats or suspicious activities are detected.
    Required parameters:
    - contract_address: The address of the contract being monitored
    - network: The blockchain network (ethereum, base, base-sepolia)
    - scan_results: Detailed findings from the security scan
    - threat_level: Risk level (Low, Medium, High)
    - to_email: Recipient's email address (defaults to hello@kraneapps.com)
    Use this to notify stakeholders about security findings.
    """

    # combine CDP tools with monitoring tools
    tools = cdp_toolkit.get_tools() + [
        get_latest_block,
        get_last_transactions,
        send_alert_email
    ]

    # store buffered conversation history in memory.
    memory = MemorySaver()

    # create ReAct Agent using the LLM and tools.
    agent = create_react_agent(
        llm,
        tools=tools,
        checkpointer=memory,
        state_modifier=constants.AGENT_PROMPT,
    )

    print("Initialized agent with monitoring tools", flush=True)
    return agent