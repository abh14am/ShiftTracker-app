from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, func
from sqlalchemy.orm import relationship
from database import Base
import datetime

class ShiftType(Base):
    __tablename__ = "shift_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g., "Morning Shift"
    time_range = Column(String, nullable=False) # e.g., "6am to 2pm"

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, default=datetime.date.today)
    
    shift_type_id = Column(Integer, ForeignKey("shift_types.id"), nullable=False)
    outgoing_engineer_id = Column(Integer, ForeignKey("team_members.id"), nullable=False)
    incoming_engineer_id = Column(Integer, ForeignKey("team_members.id"), nullable=False)
    
    ongoing_incidents = Column(Text, nullable=True) # Optional
    new_alerts = Column(Text, nullable=False)
    actions_taken = Column(Text, nullable=False)
    pending_tasks = Column(Text, nullable=True) # Optional
    planned_maintenance = Column(Text, nullable=False)
    known_issues = Column(Text, nullable=False)
    escalations = Column(Text, nullable=False)
    additional_notes = Column(Text, nullable=True) # Optional

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    shift_type = relationship("ShiftType")
    outgoing_engineer = relationship("TeamMember", foreign_keys=[outgoing_engineer_id])
    incoming_engineer = relationship("TeamMember", foreign_keys=[incoming_engineer_id])
