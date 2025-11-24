"""产线API路由"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import ProductionLineDB
from ..models.production_line import ProductionLine, ProductionLineCreate, ProductionLineUpdate

router = APIRouter()


@router.get("/", response_model=List[ProductionLine])
def list_production_lines(db: Session = Depends(get_db)):
    """获取所有产线"""
    lines = db.query(ProductionLineDB).all()
    return lines


@router.get("/{line_id}", response_model=ProductionLine)
def get_production_line(line_id: str, db: Session = Depends(get_db)):
    """获取指定产线"""
    line = db.query(ProductionLineDB).filter(ProductionLineDB.id == line_id).first()
    if not line:
        raise HTTPException(status_code=404, detail=f"产线 {line_id} 不存在")
    return line


@router.post("/", response_model=ProductionLine, status_code=201)
def create_production_line(line: ProductionLineCreate, db: Session = Depends(get_db)):
    """创建产线"""
    line_id = f"line_{uuid.uuid4().hex[:8]}"
    db_line = ProductionLineDB(
        id=line_id,
        name=line.name,
        description=line.description
    )
    db.add(db_line)
    db.commit()
    db.refresh(db_line)
    return db_line


@router.put("/{line_id}", response_model=ProductionLine)
def update_production_line(
    line_id: str, 
    line_update: ProductionLineUpdate, 
    db: Session = Depends(get_db)
):
    """更新产线"""
    db_line = db.query(ProductionLineDB).filter(ProductionLineDB.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail=f"产线 {line_id} 不存在")
    
    update_data = line_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_line, field, value)
    
    db.commit()
    db.refresh(db_line)
    return db_line


@router.delete("/{line_id}", status_code=204)
def delete_production_line(line_id: str, db: Session = Depends(get_db)):
    """删除产线"""
    db_line = db.query(ProductionLineDB).filter(ProductionLineDB.id == line_id).first()
    if not db_line:
        raise HTTPException(status_code=404, detail=f"产线 {line_id} 不存在")
    
    db.delete(db_line)
    db.commit()
    return None

