from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, List

from database import SessionLocal
from models.stack import Stack
from services.execution_service import execute_workflow
router = APIRouter()

class StackCreate(BaseModel):
    name: str
    description: str | None = None
    workflow_data: dict[str, Any]

class StackUpdate(BaseModel):
    name: str
    description: str | None = None
    workflow_data: dict[str, Any]

class StackResponseSimple(BaseModel):
    id: int
    name: str
    description: str | None = None
    
    class Config:
        from_attributes = True

class StackResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    workflow_data: dict[str, Any] | None = None

    class Config:
        from_attributes = True

class ExecuteRequest(BaseModel):
    query: str

class ExecuteResponse(BaseModel):
    response: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=StackResponse, status_code=status.HTTP_201_CREATED)
def create_stack(stack: StackCreate, db: Session = Depends(get_db)):
    """
    Create a new stack.
    """
    db_stack = Stack(
        name=stack.name,
        description=stack.description,
        workflow_data=stack.workflow_data
    )
    db.add(db_stack)
    db.commit()
    db.refresh(db_stack)
    return db_stack

@router.get("/", response_model=List[StackResponseSimple])
def read_stacks(db: Session = Depends(get_db)):
    """
    Retrieve all stacks.
    """
    stacks = db.query(Stack).order_by(Stack.id.desc()).all()
    return stacks

@router.get("/{stack_id}", response_model=StackResponse)
def read_stack(stack_id: int, db: Session = Depends(get_db)):
    db_stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")
    return db_stack

@router.put("/{stack_id}", response_model=StackResponse)
def update_stack(stack_id: int, stack: StackUpdate, db: Session = Depends(get_db)):
    db_stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")
    db_stack.name = stack.name
    db_stack.description = stack.description
    db_stack.workflow_data = stack.workflow_data
    db.commit()
    db.refresh(db_stack)
    return db_stack

@router.delete("/{stack_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stack(stack_id: int, db: Session = Depends(get_db)):
    db_stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if db_stack is None:
        raise HTTPException(status_code=404, detail="Stack not found")
    
    db.delete(db_stack)
    db.commit()
    return {"ok": True}

@router.post("/{stack_id}/execute", response_model=ExecuteResponse)
def execute_stack_workflow(stack_id: int, request: ExecuteRequest, db: Session = Depends(get_db)):
    try:
        final_response = execute_workflow(stack_id=stack_id, user_query=request.query, db=db)
        return ExecuteResponse(response=final_response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        raise HTTPException(status_code=500, detail="An internal error occurred during workflow execution.")

