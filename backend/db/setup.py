from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

def setup():
    # Add contract monitoring tables to existing setup
    engine = create_engine('sqlite:///aegis.db')
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine) 