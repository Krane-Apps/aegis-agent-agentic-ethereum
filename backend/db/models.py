from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Contract(Base):
    __tablename__ = 'contracts'
    
    id = Column(Integer, primary_key=True)
    address = Column(String(42), nullable=False)
    network = Column(String(50), nullable=False)
    emergency_function = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    alert_threshold = Column(String(20), default='Medium')
    monitoring_frequency = Column(String(10), default='5min')
    status = Column(String(20), default='Healthy')
    threat_level = Column(String(20), default='Low')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    alerts = relationship("Alert", back_populates="contract")
    emails = relationship("AlertEmail", back_populates="contract")

class Alert(Base):
    __tablename__ = 'alerts'
    
    id = Column(Integer, primary_key=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'))
    type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    contract = relationship("Contract", back_populates="alerts")

class AlertEmail(Base):
    __tablename__ = 'alert_emails'
    
    id = Column(Integer, primary_key=True)
    contract_id = Column(Integer, ForeignKey('contracts.id'))
    email = Column(String(255), nullable=False)
    
    contract = relationship("Contract", back_populates="emails") 