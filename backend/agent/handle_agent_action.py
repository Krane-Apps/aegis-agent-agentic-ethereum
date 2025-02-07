import constants
import re 


def handle_agent_action(agent_action, content):
    """
    Adds handling for the agent action.
    In our sample app, we just add deployed tokens and NFTs to the database.
    """
    if agent_action == constants.DEPLOY_TOKEN:
        return
    if agent_action == constants.DEPLOY_NFT:
        return

    