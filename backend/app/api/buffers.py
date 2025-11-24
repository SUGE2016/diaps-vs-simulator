"""缓冲区API路由"""
import uuid
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import BufferDB
from ..models.buffer import Buffer, BufferCreate, BufferUpdate

router = APIRouter()


@router.get("/", response_model=List[Buffer])
def list_buffers(
    production_line_id: str = None,
    db: Session = Depends(get_db)
):
    """获取所有缓冲区，可按产线过滤"""
    query = db.query(BufferDB)
    if production_line_id:
        query = query.filter(BufferDB.production_line_id == production_line_id)
    buffers = query.all()
    
    # 转换JSON字段
    result = []
    for buf in buffers:
        buf_dict = {
            "id": buf.id,
            "production_line_id": buf.production_line_id,
            "name": buf.name,
            "capacity": buf.capacity,
            "current_level": buf.current_level,
            "location": buf.location,
            "position": json.loads(buf.position) if buf.position else None,
            "properties": json.loads(buf.properties) if buf.properties else {}
        }
        result.append(buf_dict)
    
    return result


@router.get("/{buf_id}", response_model=Buffer)
def get_buffer(buf_id: str, db: Session = Depends(get_db)):
    """获取指定缓冲区"""
    buf = db.query(BufferDB).filter(BufferDB.id == buf_id).first()
    if not buf:
        raise HTTPException(status_code=404, detail=f"缓冲区 {buf_id} 不存在")
    
    return {
        "id": buf.id,
        "production_line_id": buf.production_line_id,
        "name": buf.name,
        "capacity": buf.capacity,
        "current_level": buf.current_level,
        "location": buf.location,
        "position": json.loads(buf.position) if buf.position else None,
        "properties": json.loads(buf.properties) if buf.properties else {}
    }


@router.post("/", response_model=Buffer, status_code=201)
def create_buffer(buf: BufferCreate, db: Session = Depends(get_db)):
    """创建缓冲区"""
    buf_id = f"buf_{uuid.uuid4().hex[:8]}"
    db_buf = BufferDB(
        id=buf_id,
        production_line_id=buf.production_line_id,
        name=buf.name,
        capacity=buf.capacity,
        current_level=0,
        location=buf.location,
        position=json.dumps(buf.position) if buf.position else None,
        properties=json.dumps(buf.properties) if buf.properties else None
    )
    db.add(db_buf)
    db.commit()
    db.refresh(db_buf)
    
    return {
        "id": db_buf.id,
        "production_line_id": db_buf.production_line_id,
        "name": db_buf.name,
        "capacity": db_buf.capacity,
        "current_level": db_buf.current_level,
        "location": db_buf.location,
        "position": json.loads(db_buf.position) if db_buf.position else None,
        "properties": json.loads(db_buf.properties) if db_buf.properties else {}
    }


@router.put("/{buf_id}", response_model=Buffer)
def update_buffer(
    buf_id: str,
    buf_update: BufferUpdate,
    db: Session = Depends(get_db)
):
    """更新缓冲区"""
    db_buf = db.query(BufferDB).filter(BufferDB.id == buf_id).first()
    if not db_buf:
        raise HTTPException(status_code=404, detail=f"缓冲区 {buf_id} 不存在")
    
    update_data = buf_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "position" and value is not None:
            setattr(db_buf, field, json.dumps(value))
        elif field == "properties" and value is not None:
            setattr(db_buf, field, json.dumps(value))
        else:
            setattr(db_buf, field, value)
    
    db.commit()
    db.refresh(db_buf)
    
    return {
        "id": db_buf.id,
        "production_line_id": db_buf.production_line_id,
        "name": db_buf.name,
        "capacity": db_buf.capacity,
        "current_level": db_buf.current_level,
        "location": db_buf.location,
        "position": json.loads(db_buf.position) if db_buf.position else None,
        "properties": json.loads(db_buf.properties) if db_buf.properties else {}
    }


@router.delete("/{buf_id}", status_code=204)
def delete_buffer(buf_id: str, db: Session = Depends(get_db)):
    """删除缓冲区"""
    db_buf = db.query(BufferDB).filter(BufferDB.id == buf_id).first()
    if not db_buf:
        raise HTTPException(status_code=404, detail=f"缓冲区 {buf_id} 不存在")
    
    db.delete(db_buf)
    db.commit()
    return None

