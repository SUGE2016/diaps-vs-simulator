"""运输路径API路由"""
import uuid
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import TransportPathDB
from ..models.transport_path import TransportPath, TransportPathCreate, TransportPathUpdate

router = APIRouter()


@router.get("/", response_model=List[TransportPath])
def list_transport_paths(
    production_line_id: str = None,
    db: Session = Depends(get_db)
):
    """获取所有运输路径，可按产线过滤"""
    query = db.query(TransportPathDB)
    if production_line_id:
        query = query.filter(TransportPathDB.production_line_id == production_line_id)
    paths = query.all()
    
    # 转换JSON字段
    result = []
    for path in paths:
        path_dict = {
            "id": path.id,
            "production_line_id": path.production_line_id,
            "from_location": path.from_location,
            "to_location": path.to_location,
            "transport_time": path.transport_time,
            "capacity": path.capacity,
            "properties": json.loads(path.properties) if path.properties else {}
        }
        result.append(path_dict)
    
    return result


@router.get("/{path_id}", response_model=TransportPath)
def get_transport_path(path_id: str, db: Session = Depends(get_db)):
    """获取指定运输路径"""
    path = db.query(TransportPathDB).filter(TransportPathDB.id == path_id).first()
    if not path:
        raise HTTPException(status_code=404, detail=f"运输路径 {path_id} 不存在")
    
    return {
        "id": path.id,
        "production_line_id": path.production_line_id,
        "from_location": path.from_location,
        "to_location": path.to_location,
        "transport_time": path.transport_time,
        "capacity": path.capacity,
        "properties": json.loads(path.properties) if path.properties else {}
    }


@router.post("/", response_model=TransportPath, status_code=201)
def create_transport_path(path: TransportPathCreate, db: Session = Depends(get_db)):
    """创建运输路径"""
    path_id = f"path_{uuid.uuid4().hex[:8]}"
    db_path = TransportPathDB(
        id=path_id,
        production_line_id=path.production_line_id,
        from_location=path.from_location,
        to_location=path.to_location,
        transport_time=path.transport_time,
        capacity=path.capacity,
        properties=json.dumps(path.properties) if path.properties else None
    )
    db.add(db_path)
    db.commit()
    db.refresh(db_path)
    
    return {
        "id": db_path.id,
        "production_line_id": db_path.production_line_id,
        "from_location": db_path.from_location,
        "to_location": db_path.to_location,
        "transport_time": db_path.transport_time,
        "capacity": db_path.capacity,
        "properties": json.loads(db_path.properties) if db_path.properties else {}
    }


@router.put("/{path_id}", response_model=TransportPath)
def update_transport_path(
    path_id: str,
    path_update: TransportPathUpdate,
    db: Session = Depends(get_db)
):
    """更新运输路径"""
    db_path = db.query(TransportPathDB).filter(TransportPathDB.id == path_id).first()
    if not db_path:
        raise HTTPException(status_code=404, detail=f"运输路径 {path_id} 不存在")
    
    update_data = path_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "properties" and value is not None:
            setattr(db_path, field, json.dumps(value))
        else:
            setattr(db_path, field, value)
    
    db.commit()
    db.refresh(db_path)
    
    return {
        "id": db_path.id,
        "production_line_id": db_path.production_line_id,
        "from_location": db_path.from_location,
        "to_location": db_path.to_location,
        "transport_time": db_path.transport_time,
        "capacity": db_path.capacity,
        "properties": json.loads(db_path.properties) if db_path.properties else {}
    }


@router.delete("/{path_id}", status_code=204)
def delete_transport_path(path_id: str, db: Session = Depends(get_db)):
    """删除运输路径"""
    db_path = db.query(TransportPathDB).filter(TransportPathDB.id == path_id).first()
    if not db_path:
        raise HTTPException(status_code=404, detail=f"运输路径 {path_id} 不存在")
    
    db.delete(db_path)
    db.commit()
    return None

