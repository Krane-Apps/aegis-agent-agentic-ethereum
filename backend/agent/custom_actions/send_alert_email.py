import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def send_alert_email(
    contract_address: str,
    network: str,
    scan_results: str,
    threat_level: str = "Low",
    to_email: str = "hello@kraneapps.com"
) -> Dict[str, Any]:
    """
    Send a security alert email using SendGrid.
    
    Args:
        contract_address (str): The contract address that was scanned
        network (str): The network (ethereum, base, base-sepolia)
        scan_results (str): The detailed scan results
        threat_level (str): The threat level detected (Low, Medium, High)
        to_email (str): The recipient email address
    
    Returns:
        Dict[str, Any]: Response containing success status and message
    """
    try:
        # get color based on threat level
        threat_colors = {
            "Low": "green",
            "Medium": "orange",
            "High": "red"
        }
        color = threat_colors.get(threat_level, "gray")
        
        # create email content
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Smart Contract Security Scan Report</h2>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Contract Address:</strong> {contract_address}</p>
                <p><strong>Network:</strong> {network}</p>
                <p><strong>Threat Level:</strong> <span style="color: {color};">{threat_level}</span></p>
            </div>
            <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
                <h3 style="color: #444;">Scan Results:</h3>
                <pre style="background-color: #f8f8f8; padding: 10px; border-radius: 3px; white-space: pre-wrap;">{scan_results}</pre>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                This is an automated security scan report from Aegis AI Agent.
            </p>
        </div>
        """

        message = Mail(
            from_email='hello@kraneapps.com',
            to_emails=to_email,
            subject=f'[Aegis AI] Security Scan Report - {threat_level} Risk Detected',
            html_content=html_content
        )

        sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
        response = sg.send(message)
        
        if response.status_code == 202:
            logger.info(f"[send_alert_email] Successfully sent scan report to {to_email}")
            return {
                "success": True,
                "message": f"Email sent successfully to {to_email}",
                "status_code": response.status_code
            }
        else:
            error_msg = f"Failed to send email. Status code: {response.status_code}"
            logger.error(f"[send_alert_email] {error_msg}")
            return {
                "success": False,
                "message": error_msg,
                "status_code": response.status_code
            }

    except Exception as e:
        error_msg = f"Error sending email: {str(e)}"
        logger.error(f"[send_alert_email] {error_msg}")
        return {
            "success": False,
            "message": error_msg,
            "status_code": 500
        } 