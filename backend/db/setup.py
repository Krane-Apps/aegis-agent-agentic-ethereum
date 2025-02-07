from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

def setup():
    # Create SQLite database engine
    engine = create_engine('sqlite:///aegis.db')
    
    # Create all tables including wallet table
    Base.metadata.create_all(engine)
    
    # Create and return session maker
    return sessionmaker(bind=engine) 