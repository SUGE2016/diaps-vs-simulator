"""流转路径API路由"""
import uuid
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import RoutineDB, RoutineStepDB, RoutineStepLinkDB
from ..models.routine import (
    Routine, RoutineCreate, RoutineUpdate, RoutineStep,
    RoutineStepBase, RoutineStepLink, RoutineStepLinkBase, RoutineStepLinkCreate
)

router = APIRouter()


def step_to_dict(step: RoutineStepDB) -> dict:
    """将步骤DB对象转换为字典"""
    return {
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
        "next_step": step.next_step,
        "position": json.loads(step.position) if step.position else None
    }


def link_to_dict(link: RoutineStepLinkDB) -> dict:
    """将连接DB对象转换为字典"""
    return {
        "id": link.id,
        "routine_id": link.routine_id,
        "from_step_id": link.from_step_id,
        "to_step_id": link.to_step_id
    }


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
        
        links = db.query(RoutineStepLinkDB).filter(
            RoutineStepLinkDB.routine_id == routine.id
        ).all()
        
        routine_dict = {
            "id": routine.id,
            "production_line_id": routine.production_line_id,
            "name": routine.name,
            "material_type": routine.material_type,
            "start_location": routine.start_location,
            "end_location": routine.end_location,
            "description": routine.description,
            "steps": [step_to_dict(step) for step in steps],
            "step_links": [link_to_dict(link) for link in links]
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
    
    links = db.query(RoutineStepLinkDB).filter(
        RoutineStepLinkDB.routine_id == routine_id
    ).all()
    
    return {
        "id": routine.id,
        "production_line_id": routine.production_line_id,
        "name": routine.name,
        "material_type": routine.material_type,
        "start_location": routine.start_location,
        "end_location": routine.end_location,
        "description": routine.description,
        "steps": [step_to_dict(step) for step in steps],
        "step_links": [link_to_dict(link) for link in links]
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
            next_step=step.next_step,
            position=json.dumps(step.position.dict()) if step.position else None
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
            "next_step": step.next_step,
            "position": step.position.dict() if step.position else None
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
        "steps": steps_data,
        "step_links": []
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
    
    # 获取最新的连接
    links = db.query(RoutineStepLinkDB).filter(
        RoutineStepLinkDB.routine_id == routine_id
    ).all()
    
    return {
        "id": db_routine.id,
        "production_line_id": db_routine.production_line_id,
        "name": db_routine.name,
        "material_type": db_routine.material_type,
        "start_location": db_routine.start_location,
        "end_location": db_routine.end_location,
        "description": db_routine.description,
        "steps": steps_data,
        "step_links": [link_to_dict(link) for link in links]
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


# ==================== 步骤管理 API ====================

@router.post("/{routine_id}/steps", response_model=RoutineStep, status_code=201)
def create_step(routine_id: str, step: RoutineStepBase, db: Session = Depends(get_db)):
    """创建工艺步骤"""
    routine = db.query(RoutineDB).filter(RoutineDB.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail=f"流转路径 {routine_id} 不存在")
    
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
        next_step=step.next_step,
        position=json.dumps(step.position.dict()) if step.position else None
    )
    db.add(db_step)
    db.commit()
    db.refresh(db_step)
    
    return step_to_dict(db_step)


@router.put("/{routine_id}/steps/{step_id}", response_model=RoutineStep)
def update_step(routine_id: str, step_id: str, step: RoutineStepBase, db: Session = Depends(get_db)):
    """更新工艺步骤"""
    db_step = db.query(RoutineStepDB).filter(
        RoutineStepDB.id == step_id,
        RoutineStepDB.routine_id == routine_id
    ).first()
    if not db_step:
        raise HTTPException(status_code=404, detail=f"步骤 {step_id} 不存在")
    
    db_step.step_id = step.step_id
    db_step.workstation_id = step.workstation_id
    db_step.operation = step.operation
    db_step.processing_time = step.processing_time
    db_step.value_added = step.value_added
    db_step.value_amount = step.value_amount
    db_step.conditions = json.dumps(step.conditions.dict()) if step.conditions else None
    db_step.parallel = step.parallel
    db_step.branches = json.dumps([b.dict() for b in step.branches]) if step.branches else None
    db_step.merge_condition = step.merge_condition
    db_step.next_step = step.next_step
    db_step.position = json.dumps(step.position.dict()) if step.position else None
    
    db.commit()
    db.refresh(db_step)
    
    return step_to_dict(db_step)


@router.delete("/{routine_id}/steps/{step_id}", status_code=204)
def delete_step(routine_id: str, step_id: str, db: Session = Depends(get_db)):
    """删除工艺步骤"""
    db_step = db.query(RoutineStepDB).filter(
        RoutineStepDB.id == step_id,
        RoutineStepDB.routine_id == routine_id
    ).first()
    if not db_step:
        raise HTTPException(status_code=404, detail=f"步骤 {step_id} 不存在")
    
    # 同时删除相关的连接
    db.query(RoutineStepLinkDB).filter(
        (RoutineStepLinkDB.from_step_id == step_id) | 
        (RoutineStepLinkDB.to_step_id == step_id)
    ).delete(synchronize_session=False)
    
    db.delete(db_step)
    db.commit()
    return None


# ==================== 步骤连接 API ====================

@router.post("/{routine_id}/links", response_model=RoutineStepLink, status_code=201)
def create_link(routine_id: str, link: RoutineStepLinkBase, db: Session = Depends(get_db)):
    """创建步骤连接"""
    routine = db.query(RoutineDB).filter(RoutineDB.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail=f"流转路径 {routine_id} 不存在")
    
    # 验证步骤存在
    from_step = db.query(RoutineStepDB).filter(RoutineStepDB.id == link.from_step_id).first()
    to_step = db.query(RoutineStepDB).filter(RoutineStepDB.id == link.to_step_id).first()
    if not from_step or not to_step:
        raise HTTPException(status_code=400, detail="无效的步骤ID")
    
    link_id = f"link_{uuid.uuid4().hex[:8]}"
    db_link = RoutineStepLinkDB(
        id=link_id,
        routine_id=routine_id,
        from_step_id=link.from_step_id,
        to_step_id=link.to_step_id
    )
    db.add(db_link)
    db.commit()
    db.refresh(db_link)
    
    return link_to_dict(db_link)


@router.delete("/{routine_id}/links/{link_id}", status_code=204)
def delete_link(routine_id: str, link_id: str, db: Session = Depends(get_db)):
    """删除步骤连接"""
    db_link = db.query(RoutineStepLinkDB).filter(
        RoutineStepLinkDB.id == link_id,
        RoutineStepLinkDB.routine_id == routine_id
    ).first()
    if not db_link:
        raise HTTPException(status_code=404, detail=f"连接 {link_id} 不存在")
    
    db.delete(db_link)
    db.commit()
    return None

