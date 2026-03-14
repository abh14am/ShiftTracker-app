import os
import asyncio
from typing import Annotated
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import engine, get_db, Base, AsyncSessionLocal
import models
import schemas
import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database tables on startup
    retries = 5
    for i in range(retries):
        try:
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("Database initialized successfully.")
            
            # Seed the Admin user if no users exist
            async with AsyncSessionLocal() as db:
                print("Checking for existing users...")
                result = await db.execute(select(models.TeamMember))
                users = result.scalars().all()
                print(f"Found {len(users)} users.")
                if not users:
                    admin_user = os.getenv("ADMIN_USERNAME", "admin")
                    admin_pass = os.getenv("ADMIN_PASSWORD", "admin")
                    print(f"No users found. Creating default admin account: {admin_user}")
                    
                    hashed = auth.get_password_hash(admin_pass)
                    db_admin = models.TeamMember(
                        name=admin_user, 
                        hashed_password=hashed, 
                        is_admin=1,
                        is_primary_admin=1
                    )
                    db.add(db_admin)
                    await db.commit()
                    print("Admin user created successfully.")
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

# --- Auth API ---
@app.post("/api/auth/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.TeamMember).filter(models.TeamMember.name == form_data.username))
    user = result.scalars().first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.name}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "is_admin": bool(user.is_admin), 
        "is_primary_admin": bool(user.is_primary_admin),
        "user_id": user.id,
        "username": user.name
    }

@app.get("/api/auth/me", response_model=schemas.TeamMemberOut)
async def read_users_me(current_user: models.TeamMember = Depends(auth.get_current_user)):
    return current_user

# --- Team Members API ---
@app.post("/api/members", response_model=schemas.TeamMemberOut)
async def create_team_member(
    member: schemas.TeamMemberCreate, 
    db: AsyncSession = Depends(get_db),
    admin: models.TeamMember = Depends(auth.get_current_admin_user)
):
    hashed_pwd = auth.get_password_hash(member.password) if member.password else None
    
    # We must convert the Pydantic model to a dict, but we replace the plain password with the hashed one
    member_data = member.model_dump()
    member_data.pop("password", None)
    
    db_member = models.TeamMember(**member_data, hashed_password=hashed_pwd)
    db.add(db_member)
    try:
        await db.commit()
        await db.refresh(db_member)
        return db_member
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Team member already exists or invalid data.")

@app.get("/api/members", response_model=list[schemas.TeamMemberOut])
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    result = await db.execute(select(models.TeamMember))
    return result.scalars().all()

@app.delete("/api/members/{member_id}")
async def delete_team_member(
    member_id: int, 
    db: AsyncSession = Depends(get_db),
    admin: models.TeamMember = Depends(auth.get_current_admin_user)
):
    result = await db.execute(select(models.TeamMember).filter(models.TeamMember.id == member_id))
    member = result.scalars().first()
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    if member.is_primary_admin == 1:
        raise HTTPException(
            status_code=403, 
            detail="The Primary Administrator account cannot be deleted."
        )
    
    # Only primary admin can delete other admins
    if member.is_admin == 1 and admin.is_primary_admin != 1:
        raise HTTPException(
            status_code=403,
            detail="Only the Primary Administrator can delete other administrator accounts."
        )
    
    try:
        await db.delete(member)
        await db.commit()
        return {"status": "success", "message": "Team member deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete member (may be tied to existing shifts)")

# --- Shift Types API ---
@app.post("/api/shift-types", response_model=schemas.ShiftTypeOut)
async def create_shift_type(
    stype: schemas.ShiftTypeCreate, 
    db: AsyncSession = Depends(get_db),
    admin: models.TeamMember = Depends(auth.get_current_admin_user)
):
    db_stype = models.ShiftType(**stype.model_dump())
    db.add(db_stype)
    try:
        await db.commit()
        await db.refresh(db_stype)
        return db_stype
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Shift type already exists or invalid data.")

@app.put("/api/shift-types/{st_id}", response_model=schemas.ShiftTypeOut)
async def update_shift_type(
    st_id: int,
    st_update: schemas.ShiftTypeCreate,
    db: AsyncSession = Depends(get_db),
    admin: models.TeamMember = Depends(auth.get_current_admin_user)
):
    result = await db.execute(select(models.ShiftType).filter(models.ShiftType.id == st_id))
    db_st = result.scalars().first()
    if not db_st:
        raise HTTPException(status_code=404, detail="Shift type not found")
    
    for key, value in st_update.model_dump().items():
        setattr(db_st, key, value)
        
    try:
        await db.commit()
        await db.refresh(db_st)
        return db_st
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/shift-types/{st_id}")
async def delete_shift_type(
    st_id: int,
    db: AsyncSession = Depends(get_db),
    admin: models.TeamMember = Depends(auth.get_current_admin_user)
):
    result = await db.execute(select(models.ShiftType).filter(models.ShiftType.id == st_id))
    st = result.scalars().first()
    if not st:
        raise HTTPException(status_code=404, detail="Shift type not found")
    
    try:
        await db.delete(st)
        await db.commit()
        return {"status": "success", "message": "Shift type deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete shift type (may be tied to existing shifts)")

@app.get("/api/shift-types", response_model=list[schemas.ShiftTypeOut])
async def get_shift_types(
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    result = await db.execute(select(models.ShiftType))
    return result.scalars().all()

# --- Shifts API ---
@app.post("/api/shifts", response_model=schemas.ShiftOut)
async def create_shift(
    shift: schemas.ShiftCreate, 
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    db_shift = models.Shift(**shift.model_dump())
    
    # Ownership rules
    db_shift.created_by_id = user.id
    
    # Standard users can only hand over as themselves
    if user.is_admin != 1 and db_shift.outgoing_engineer_id != user.id:
         raise HTTPException(
             status_code=403,
             detail="Standard users can only submit handovers where they are the outgoing engineer."
         )
    
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
                selectinload(models.Shift.incoming_engineer),
                selectinload(models.Shift.created_by)
            )
            .filter_by(id=db_shift.id)
        )
        loaded_shift = result.scalars().first()
        return loaded_shift

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/shifts", response_model=list[schemas.ShiftOut])
async def get_shifts(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    result = await db.execute(
        select(models.Shift)
        .options(
            selectinload(models.Shift.shift_type),
            selectinload(models.Shift.outgoing_engineer),
            selectinload(models.Shift.incoming_engineer),
            selectinload(models.Shift.created_by)
        )
        .order_by(models.Shift.date.desc(), models.Shift.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

@app.get("/api/shifts/{shift_id}", response_model=schemas.ShiftOut)
async def get_shift(
    shift_id: int, 
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    result = await db.execute(
        select(models.Shift)
        .options(
            selectinload(models.Shift.shift_type),
            selectinload(models.Shift.outgoing_engineer),
            selectinload(models.Shift.incoming_engineer),
            selectinload(models.Shift.created_by)
        )
        .filter(models.Shift.id == shift_id)
    )
    shift = result.scalars().first()
    if shift is None:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift

@app.put("/api/shifts/{shift_id}", response_model=schemas.ShiftOut)
async def update_shift(
    shift_id: int, 
    shift_update: schemas.ShiftCreate, 
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    result = await db.execute(select(models.Shift).filter(models.Shift.id == shift_id))
    db_shift = result.scalars().first()
    if not db_shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Ownership check: Only admin or the creator can edit
    if user.is_admin != 1 and db_shift.created_by_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit handovers that you personally created."
        )
    
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
                selectinload(models.Shift.incoming_engineer),
                selectinload(models.Shift.created_by)
            )
            .filter_by(id=db_shift.id)
        )
        return result.scalars().first()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/shifts/{shift_id}")
async def delete_shift(
    shift_id: int, 
    db: AsyncSession = Depends(get_db),
    user: models.TeamMember = Depends(auth.get_current_user)
):
    result = await db.execute(select(models.Shift).filter(models.Shift.id == shift_id))
    shift = result.scalars().first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Ownership check: Only admin or the creator can delete
    if user.is_admin != 1 and shift.created_by_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete handovers that you personally created."
        )
    
    try:
        await db.delete(shift)
        await db.commit()
        return {"status": "success", "message": "Shift deleted"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
