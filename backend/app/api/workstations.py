"""工作站API路由"""
import uuid
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import WorkstationDB
from ..models.workstation import Workstation, WorkstationCreate, WorkstationUpdate

router = APIRouter()


@router.get("/", response_model=List[Workstation])
def list_workstations(
    production_line_id: str = None,
    db: Session = Depends(get_db)
):
    """获取所有工作站，可按产线过滤"""
    query = db.query(WorkstationDB)
    if production_line_id:
        query = query.filter(WorkstationDB.production_line_id == production_line_id)
    workstations = query.all()
    
    # 转换JSON字段
    result = []
    for ws in workstations:
        ws_dict = {
            "id": ws.id,
            "production_line_id": ws.production_line_id,
            "name": ws.name,
            "type": ws.type,
            "capacity": ws.capacity,
            "processing_time": json.loads(ws.processing_time),
            "status": ws.status,
            "input_buffer_id": ws.input_buffer_id,
            "output_buffer_id": ws.output_buffer_id,
            "position": json.loads(ws.position) if ws.position else None,
            "properties": json.loads(ws.properties) if ws.properties else {}
        }
        result.append(ws_dict)
    
    return result


@router.get("/{ws_id}", response_model=Workstation)
def get_workstation(ws_id: str, db: Session = Depends(get_db)):
    """获取指定工作站"""
    ws = db.query(WorkstationDB).filter(WorkstationDB.id == ws_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail=f"工作站 {ws_id} 不存在")
    
    return {
        "id": ws.id,
        "production_line_id": ws.production_line_id,
        "name": ws.name,
        "type": ws.type,
        "capacity": ws.capacity,
        "processing_time": json.loads(ws.processing_time),
        "status": ws.status,
        "input_buffer_id": ws.input_buffer_id,
        "output_buffer_id": ws.output_buffer_id,
        "position": json.loads(ws.position) if ws.position else None,
        "properties": json.loads(ws.properties) if ws.properties else {}
    }


@router.post("/", response_model=Workstation, status_code=201)
def create_workstation(ws: WorkstationCreate, db: Session = Depends(get_db)):
    """创建工作站"""
    ws_id = f"ws_{uuid.uuid4().hex[:8]}"
    db_ws = WorkstationDB(
        id=ws_id,
        production_line_id=ws.production_line_id,
        name=ws.name,
        type=ws.type,
        capacity=ws.capacity,
        processing_time=json.dumps(ws.processing_time.dict()),
        status="idle",
        input_buffer_id=ws.input_buffer_id,
        output_buffer_id=ws.output_buffer_id,
        position=json.dumps(ws.position) if ws.position else None,
        properties=json.dumps(ws.properties) if ws.properties else None
    )
    db.add(db_ws)
    db.commit()
    db.refresh(db_ws)
    
    return {
        "id": db_ws.id,
        "production_line_id": db_ws.production_line_id,
        "name": db_ws.name,
        "type": db_ws.type,
        "capacity": db_ws.capacity,
        "processing_time": json.loads(db_ws.processing_time),
        "status": db_ws.status,
        "input_buffer_id": db_ws.input_buffer_id,
        "output_buffer_id": db_ws.output_buffer_id,
        "position": json.loads(db_ws.position) if db_ws.position else None,
        "properties": json.loads(db_ws.properties) if db_ws.properties else {}
    }


@router.put("/{ws_id}", response_model=Workstation)
def update_workstation(
    ws_id: str,
    ws_update: WorkstationUpdate,
    db: Session = Depends(get_db)
):
    """更新工作站"""
    db_ws = db.query(WorkstationDB).filter(WorkstationDB.id == ws_id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail=f"工作站 {ws_id} 不存在")
    
    update_data = ws_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "processing_time" and value is not None:
            setattr(db_ws, field, json.dumps(value.dict()))
        elif field == "position" and value is not None:
            setattr(db_ws, field, json.dumps(value))
        elif field == "properties" and value is not None:
            setattr(db_ws, field, json.dumps(value))
        else:
            setattr(db_ws, field, value)
    
    db.commit()
    db.refresh(db_ws)
    
    return {
        "id": db_ws.id,
        "production_line_id": db_ws.production_line_id,
        "name": db_ws.name,
        "type": db_ws.type,
        "capacity": db_ws.capacity,
        "processing_time": json.loads(db_ws.processing_time),
        "status": db_ws.status,
        "input_buffer_id": db_ws.input_buffer_id,
        "output_buffer_id": db_ws.output_buffer_id,
        "position": json.loads(db_ws.position) if db_ws.position else None,
        "properties": json.loads(db_ws.properties) if db_ws.properties else {}
    }


@router.delete("/{ws_id}", status_code=204)
def delete_workstation(ws_id: str, db: Session = Depends(get_db)):
    """删除工作站"""
    db_ws = db.query(WorkstationDB).filter(WorkstationDB.id == ws_id).first()
    if not db_ws:
        raise HTTPException(status_code=404, detail=f"工作站 {ws_id} 不存在")
    
    db.delete(db_ws)
    db.commit()
    return None

