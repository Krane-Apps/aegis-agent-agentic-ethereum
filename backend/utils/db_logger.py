import logging
from datetime import datetime
from db.models import Log

class DatabaseLogHandler(logging.Handler):
    def __init__(self, session_maker):
        super().__init__()
        self.session_maker = session_maker

    def emit(self, record):
        try:
            with self.session_maker() as session:
                # Extract contract_id from the record if available
                contract_id = None
                if hasattr(record, 'contract_id'):
                    contract_id = record.contract_id
                
                log = Log(
                    timestamp=datetime.fromtimestamp(record.created),
                    level=record.levelname,
                    source=record.name,
                    message=self.format(record),
                    contract_id=contract_id
                )
                session.add(log)
                session.commit()
        except Exception as e:
            print(f"Error saving log to database: {e}") 