from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

# --- Shift Type ---
class ShiftTypeBase(BaseModel):
    name: str
    time_range: str

class ShiftTypeCreate(ShiftTypeBase):
    pass

class ShiftTypeOut(ShiftTypeBase):
    id: int
    class Config:
        from_attributes = True

# --- Team Member ---
class TeamMemberBase(BaseModel):
    name: str

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberOut(TeamMemberBase):
    id: int
    class Config:
        from_attributes = True

# --- Shift ---
class ShiftBase(BaseModel):
    date: date
    shift_type_id: int
    outgoing_engineer_id: int
    incoming_engineer_id: int
    ongoing_incidents: Optional[str] = None
    new_alerts: str
    actions_taken: str
    pending_tasks: Optional[str] = None
    planned_maintenance: str
    known_issues: str
    escalations: str
    additional_notes: Optional[str] = None

class ShiftCreate(ShiftBase):
    pass

class ShiftOut(ShiftBase):
    id: int
    created_at: datetime
    shift_type: ShiftTypeOut
    outgoing_engineer: TeamMemberOut
    incoming_engineer: TeamMemberOut

    class Config:
        from_attributes = True
