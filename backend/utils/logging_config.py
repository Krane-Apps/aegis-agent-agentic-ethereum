import logging
import os
from logging.handlers import RotatingFileHandler
from utils.db_logger import DatabaseLogHandler

def setup_logging(session_maker):
    # create logs directory if it doesn't exist
    if not os.path.exists('logs'):
        os.makedirs('logs')

    # configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # create file handler
    file_handler = RotatingFileHandler(
        'logs/aegis.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    ))

    # add file handler to root logger
    logging.getLogger('').addHandler(file_handler)

    # create specific logger for contract monitoring
    contract_logger = logging.getLogger('contract_monitor')
    contract_logger.setLevel(logging.INFO)

    # create contract monitoring specific file handler
    contract_file_handler = RotatingFileHandler(
        'logs/contracts.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    contract_file_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(message)s'
    ))
    contract_logger.addHandler(contract_file_handler)

    # add database handler
    db_handler = DatabaseLogHandler(session_maker)
    db_handler.setFormatter(logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    ))
    
    # add to root logger
    logging.getLogger('').addHandler(db_handler)
    
    # add to contract monitor logger
    contract_logger.addHandler(db_handler) 