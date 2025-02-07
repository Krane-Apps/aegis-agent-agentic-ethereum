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
    logs = relationship("Log", back_populates="contract")

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

class Log(Base):
    __tablename__ = 'logs'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    level = Column(String(20), nullable=False)  # INFO, WARNING, ERROR
    source = Column(String(50), nullable=False)  # contract_monitor, agent, system
    message = Column(Text, nullable=False)
    contract_id = Column(Integer, ForeignKey('contracts.id'), nullable=True)
    
    contract = relationship("Contract", back_populates="logs")

class Wallet(Base):
    __tablename__ = 'wallet'
    
    id = Column(Integer, primary_key=True)
    wallet_id = Column(String(100), nullable=False)
    seed = Column(String(200), nullable=False)
    network_id = Column(String(50))
    default_address_id = Column(String(42))
    created_at = Column(DateTime, default=datetime.utcnow) 