import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import engine, get_db, Base
import models
import schemas

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database tables on startup
    retries = 5
    for i in range(retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("Database initialized successfully.")
            break
        except Exception as e:
            if i < retries - 1:
                print(f"Database connection failed, retrying in 5 seconds... ({i+1}/{retries})")
                await asyncio.sleep(5)
            else:
                print("Failed to connect to the database after multiple attempts.")
                raise e
    yield

app = FastAPI(title="Shift Tracker API", lifespan=lifespan)

# Allow CORS for development (React Vite default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, lock this down
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# --- Team Members API ---
@app.post("/api/members", response_model=schemas.TeamMemberOut)
async def create_team_member(member: schemas.TeamMemberCreate, db: AsyncSession = Depends(get_db)):
    db_member = models.TeamMember(**member.model_dump())
    db.add(db_member)
    try:
        await db.commit()
        await db.refresh(db_member)
        return db_member
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Team member already exists or invalid data.")

@app.get("/api/members", response_model=list[schemas.TeamMemberOut])
async def get_team_members(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.TeamMember))
    return result.scalars().all()

@app.delete("/api/members/{member_id}")
async def delete_team_member(member_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.TeamMember).filter(models.TeamMember.id == member_id))
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    try:
        await db.delete(member)
        await db.commit()
        return {"status": "success", "message": "Team member deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete member (may be tied to existing shifts)")

# --- Shift Types API ---
@app.post("/api/shift-types", response_model=schemas.ShiftTypeOut)
async def create_shift_type(stype: schemas.ShiftTypeCreate, db: AsyncSession = Depends(get_db)):
    db_stype = models.ShiftType(**stype.model_dump())
    db.add(db_stype)
    try:
        await db.commit()
        await db.refresh(db_stype)
        return db_stype
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Shift type already exists or invalid data.")

@app.get("/api/shift-types", response_model=list[schemas.ShiftTypeOut])
async def get_shift_types(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.ShiftType))
    return result.scalars().all()

# --- Shifts API ---
@app.post("/api/shifts", response_model=schemas.ShiftOut)
async def create_shift(shift: schemas.ShiftCreate, db: AsyncSession = Depends(get_db)):
    db_shift = models.Shift(**shift.model_dump())
    db.add(db_shift)
    try:
        await db.commit()
        await db.refresh(db_shift)
        
        # Load relationships before returning
        result = await db.execute(
            select(models.Shift)
            .options(
                selectinload(models.Shift.shift_type),
                selectinload(models.Shift.outgoing_engineer),
                selectinload(models.Shift.incoming_engineer)
            )
            .filter_by(id=db_shift.id)
        )
        loaded_shift = result.scalars().first()
        return loaded_shift

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/shifts", response_model=list[schemas.ShiftOut])
async def get_shifts(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Shift)
        .options(
            selectinload(models.Shift.shift_type),
            selectinload(models.Shift.outgoing_engineer),
            selectinload(models.Shift.incoming_engineer)
        )
        .order_by(models.Shift.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@app.get("/api/shifts/{shift_id}", response_model=schemas.ShiftOut)
async def get_shift(shift_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.Shift)
        .options(
            selectinload(models.Shift.shift_type),
            selectinload(models.Shift.outgoing_engineer),
            selectinload(models.Shift.incoming_engineer)
        )
        .filter(models.Shift.id == shift_id)
    )
    shift = result.scalars().first()
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift

@app.put("/api/shifts/{shift_id}", response_model=schemas.ShiftOut)
async def update_shift(shift_id: int, shift_update: schemas.ShiftCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Shift).filter(models.Shift.id == shift_id))
    db_shift = result.scalars().first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    for key, value in shift_update.model_dump().items():
        setattr(db_shift, key, value)
        
    try:
        await db.commit()
        await db.refresh(db_shift)
        
        # Load relationships
        result = await db.execute(
            select(models.Shift)
            .options(
                selectinload(models.Shift.shift_type),
                selectinload(models.Shift.outgoing_engineer),
                selectinload(models.Shift.incoming_engineer)
            )
            .filter_by(id=db_shift.id)
        )
        return result.scalars().first()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/shifts/{shift_id}")
async def delete_shift(shift_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Shift).filter(models.Shift.id == shift_id))
    shift = result.scalars().first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    try:
        await db.delete(shift)
        await db.commit()
        return {"status": "success", "message": "Shift deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
