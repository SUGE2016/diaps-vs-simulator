"""流转路径API路由"""
import uuid
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import RoutineDB, RoutineStepDB
from ..models.routine import Routine, RoutineCreate, RoutineUpdate, RoutineStep

router = APIRouter()


@router.get("/", response_model=List[Routine])
def list_routines(
    production_line_id: str = None,
    db: Session = Depends(get_db)
):
    """获取所有流转路径，可按产线过滤"""
    query = db.query(RoutineDB)
    if production_line_id:
        query = query.filter(RoutineDB.production_line_id == production_line_id)
    routines = query.all()
    
    # 转换为响应格式
    result = []
    for routine in routines:
        steps = db.query(RoutineStepDB).filter(
            RoutineStepDB.routine_id == routine.id
        ).order_by(RoutineStepDB.step_id).all()
        
        steps_data = []
        for step in steps:
            step_dict = {
                "id": step.id,
                "step_id": step.step_id,
                "workstation_id": step.workstation_id,
                "operation": step.operation,
                "processing_time": step.processing_time,
                "value_added": step.value_added,
                "value_amount": step.value_amount,
                "conditions": json.loads(step.conditions) if step.conditions else None,
                "parallel": step.parallel,
                "branches": json.loads(step.branches) if step.branches else None,
                "merge_condition": step.merge_condition,
                "next_step": step.next_step
            }
            steps_data.append(step_dict)
        
        routine_dict = {
            "id": routine.id,
            "production_line_id": routine.production_line_id,
            "name": routine.name,
            "material_type": routine.material_type,
            "start_location": routine.start_location,
            "end_location": routine.end_location,
            "description": routine.description,
            "steps": steps_data
        }
        result.append(routine_dict)
    
    return result


@router.get("/{routine_id}", response_model=Routine)
def get_routine(routine_id: str, db: Session = Depends(get_db)):
    """获取指定流转路径"""
    routine = db.query(RoutineDB).filter(RoutineDB.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail=f"流转路径 {routine_id} 不存在")
    
    steps = db.query(RoutineStepDB).filter(
        RoutineStepDB.routine_id == routine_id
    ).order_by(RoutineStepDB.step_id).all()
    
    steps_data = []
    for step in steps:
        step_dict = {
            "id": step.id,
            "step_id": step.step_id,
            "workstation_id": step.workstation_id,
            "operation": step.operation,
            "processing_time": step.processing_time,
            "value_added": step.value_added,
            "value_amount": step.value_amount,
            "conditions": json.loads(step.conditions) if step.conditions else None,
            "parallel": step.parallel,
            "branches": json.loads(step.branches) if step.branches else None,
            "merge_condition": step.merge_condition,
            "next_step": step.next_step
        }
        steps_data.append(step_dict)
    
    return {
        "id": routine.id,
        "production_line_id": routine.production_line_id,
        "name": routine.name,
        "material_type": routine.material_type,
        "start_location": routine.start_location,
        "end_location": routine.end_location,
        "description": routine.description,
        "steps": steps_data
    }


@router.post("/", response_model=Routine, status_code=201)
def create_routine(routine: RoutineCreate, db: Session = Depends(get_db)):
    """创建流转路径"""
    routine_id = f"routine_{uuid.uuid4().hex[:8]}"
    db_routine = RoutineDB(
        id=routine_id,
        production_line_id=routine.production_line_id,
        name=routine.name,
        material_type=routine.material_type,
        start_location=routine.start_location,
        end_location=routine.end_location,
        description=routine.description
    )
    db.add(db_routine)
    
    # 创建步骤
    steps_data = []
    for step in routine.steps:
        step_id = f"step_{uuid.uuid4().hex[:8]}"
        db_step = RoutineStepDB(
            id=step_id,
            routine_id=routine_id,
            step_id=step.step_id,
            workstation_id=step.workstation_id,
            operation=step.operation,
            processing_time=step.processing_time,
            value_added=step.value_added,
            value_amount=step.value_amount,
            conditions=json.dumps(step.conditions.dict()) if step.conditions else None,
            parallel=step.parallel,
            branches=json.dumps([b.dict() for b in step.branches]) if step.branches else None,
            merge_condition=step.merge_condition,
            next_step=step.next_step
        )
        db.add(db_step)
        steps_data.append({
            "id": step_id,
            "step_id": step.step_id,
            "workstation_id": step.workstation_id,
            "operation": step.operation,
            "processing_time": step.processing_time,
            "value_added": step.value_added,
            "value_amount": step.value_amount,
            "conditions": step.conditions.dict() if step.conditions else None,
            "parallel": step.parallel,
            "branches": [b.dict() for b in step.branches] if step.branches else None,
            "merge_condition": step.merge_condition,
            "next_step": step.next_step
        })
    
    db.commit()
    db.refresh(db_routine)
    
    return {
        "id": db_routine.id,
        "production_line_id": db_routine.production_line_id,
        "name": db_routine.name,
        "material_type": db_routine.material_type,
        "start_location": db_routine.start_location,
        "end_location": db_routine.end_location,
        "description": db_routine.description,
        "steps": steps_data
    }


@router.put("/{routine_id}", response_model=Routine)
def update_routine(
    routine_id: str,
    routine_update: RoutineUpdate,
    db: Session = Depends(get_db)
):
    """更新流转路径"""
    db_routine = db.query(RoutineDB).filter(RoutineDB.id == routine_id).first()
    if not db_routine:
        raise HTTPException(status_code=404, detail=f"流转路径 {routine_id} 不存在")
    
    update_data = routine_update.dict(exclude_unset=True)
    
    # 如果更新步骤，先删除旧步骤
    if "steps" in update_data and update_data["steps"] is not None:
        db.query(RoutineStepDB).filter(RoutineStepDB.routine_id == routine_id).delete()
        
        # 创建新步骤
        for step in update_data["steps"]:
            step_id = f"step_{uuid.uuid4().hex[:8]}"
            db_step = RoutineStepDB(
                id=step_id,
                routine_id=routine_id,
                step_id=step["step_id"],
                workstation_id=step.get("workstation_id"),
                operation=step["operation"],
                processing_time=step.get("processing_time"),
                value_added=step.get("value_added", False),
                value_amount=step.get("value_amount"),
                conditions=json.dumps(step["conditions"]) if step.get("conditions") else None,
                parallel=step.get("parallel", False),
                branches=json.dumps(step["branches"]) if step.get("branches") else None,
                merge_condition=step.get("merge_condition"),
                next_step=step.get("next_step")
            )
            db.add(db_step)
        
        del update_data["steps"]
    
    # 更新Routine基本信息
    for field, value in update_data.items():
        setattr(db_routine, field, value)
    
    db.commit()
    db.refresh(db_routine)
    
    # 获取最新步骤
    steps = db.query(RoutineStepDB).filter(
        RoutineStepDB.routine_id == routine_id
    ).order_by(RoutineStepDB.step_id).all()
    
    steps_data = []
    for step in steps:
        step_dict = {
            "id": step.id,
            "step_id": step.step_id,
            "workstation_id": step.workstation_id,
            "operation": step.operation,
            "processing_time": step.processing_time,
            "value_added": step.value_added,
            "value_amount": step.value_amount,
            "conditions": json.loads(step.conditions) if step.conditions else None,
            "parallel": step.parallel,
            "branches": json.loads(step.branches) if step.branches else None,
            "merge_condition": step.merge_condition,
            "next_step": step.next_step
        }
        steps_data.append(step_dict)
    
    return {
        "id": db_routine.id,
        "production_line_id": db_routine.production_line_id,
        "name": db_routine.name,
        "material_type": db_routine.material_type,
        "start_location": db_routine.start_location,
        "end_location": db_routine.end_location,
        "description": db_routine.description,
        "steps": steps_data
    }


@router.delete("/{routine_id}", status_code=204)
def delete_routine(routine_id: str, db: Session = Depends(get_db)):
    """删除流转路径"""
    db_routine = db.query(RoutineDB).filter(RoutineDB.id == routine_id).first()
    if not db_routine:
        raise HTTPException(status_code=404, detail=f"流转路径 {routine_id} 不存在")
    
    db.delete(db_routine)
    db.commit()
    return None

