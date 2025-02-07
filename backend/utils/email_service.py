import smtplib
from email.mime.text import MIMEText
import os
import logging

logger = logging.getLogger(__name__)

def send_alert_email(to_email, subject, message):
    try:
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT'))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')

        msg = MIMEText(message)
        msg['Subject'] = subject
        msg['From'] = smtp_username
        msg['To'] = to_email

        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
            
        logger.info(f"Alert email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}") 