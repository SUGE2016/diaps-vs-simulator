"""全局配置API - 工艺步骤类型、工作站类型、物料类型"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..database.schemas import OperationTypeDB, WorkstationTypeDB, MaterialTypeDB
from ..models.config import (
    OperationType, OperationTypeCreate,
    WorkstationType, WorkstationTypeCreate,
    MaterialType, MaterialTypeCreate
)

router = APIRouter()


# ============ 工艺步骤类型 API ============

@router.get("/operation-types", response_model=List[OperationType])
def list_operation_types(db: Session = Depends(get_db)):
    """获取所有工艺步骤类型"""
    types = db.query(OperationTypeDB).all()
    return [OperationType(id=t.id, name=t.name, description=t.description) for t in types]


@router.post("/operation-types", response_model=OperationType)
def create_operation_type(data: OperationTypeCreate, db: Session = Depends(get_db)):
    """创建工艺步骤类型"""
    # 检查名称是否已存在
    existing = db.query(OperationTypeDB).filter(OperationTypeDB.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型名称已存在")
    
    db_type = OperationTypeDB(
        id=f"optype_{uuid.uuid4().hex[:8]}",
        name=data.name,
        description=data.description
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return OperationType(id=db_type.id, name=db_type.name, description=db_type.description)


@router.put("/operation-types/{type_id}", response_model=OperationType)
def update_operation_type(type_id: str, data: OperationTypeCreate, db: Session = Depends(get_db)):
    """更新工艺步骤类型"""
    db_type = db.query(OperationTypeDB).filter(OperationTypeDB.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    # 检查名称是否与其他类型冲突
    existing = db.query(OperationTypeDB).filter(
        OperationTypeDB.name == data.name,
        OperationTypeDB.id != type_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型名称已存在")
    
    db_type.name = data.name
    db_type.description = data.description
    db.commit()
    db.refresh(db_type)
    return OperationType(id=db_type.id, name=db_type.name, description=db_type.description)


@router.delete("/operation-types/{type_id}")
def delete_operation_type(type_id: str, db: Session = Depends(get_db)):
    """删除工艺步骤类型"""
    db_type = db.query(OperationTypeDB).filter(OperationTypeDB.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    db.delete(db_type)
    db.commit()
    return {"message": "删除成功"}


# ============ 工作站类型 API ============

@router.get("/workstation-types", response_model=List[WorkstationType])
def list_workstation_types(db: Session = Depends(get_db)):
    """获取所有工作站类型"""
    types = db.query(WorkstationTypeDB).all()
    return [WorkstationType(id=t.id, name=t.name, description=t.description) for t in types]


@router.post("/workstation-types", response_model=WorkstationType)
def create_workstation_type(data: WorkstationTypeCreate, db: Session = Depends(get_db)):
    """创建工作站类型"""
    existing = db.query(WorkstationTypeDB).filter(WorkstationTypeDB.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型名称已存在")
    
    db_type = WorkstationTypeDB(
        id=f"wstype_{uuid.uuid4().hex[:8]}",
        name=data.name,
        description=data.description
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return WorkstationType(id=db_type.id, name=db_type.name, description=db_type.description)


@router.put("/workstation-types/{type_id}", response_model=WorkstationType)
def update_workstation_type(type_id: str, data: WorkstationTypeCreate, db: Session = Depends(get_db)):
    """更新工作站类型"""
    db_type = db.query(WorkstationTypeDB).filter(WorkstationTypeDB.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    existing = db.query(WorkstationTypeDB).filter(
        WorkstationTypeDB.name == data.name,
        WorkstationTypeDB.id != type_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型名称已存在")
    
    db_type.name = data.name
    db_type.description = data.description
    db.commit()
    db.refresh(db_type)
    return WorkstationType(id=db_type.id, name=db_type.name, description=db_type.description)


@router.delete("/workstation-types/{type_id}")
def delete_workstation_type(type_id: str, db: Session = Depends(get_db)):
    """删除工作站类型"""
    db_type = db.query(WorkstationTypeDB).filter(WorkstationTypeDB.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    db.delete(db_type)
    db.commit()
    return {"message": "删除成功"}


# ============ 物料类型 API ============

@router.get("/material-types", response_model=List[MaterialType])
def list_material_types(db: Session = Depends(get_db)):
    """获取所有物料类型"""
    types = db.query(MaterialTypeDB).all()
    return [MaterialType(id=t.id, name=t.name, description=t.description) for t in types]


@router.post("/material-types", response_model=MaterialType)
def create_material_type(data: MaterialTypeCreate, db: Session = Depends(get_db)):
    """创建物料类型"""
    existing = db.query(MaterialTypeDB).filter(MaterialTypeDB.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型名称已存在")
    
    db_type = MaterialTypeDB(
        id=f"mattype_{uuid.uuid4().hex[:8]}",
        name=data.name,
        description=data.description
    )
    db.add(db_type)
    db.commit()
    db.refresh(db_type)
    return MaterialType(id=db_type.id, name=db_type.name, description=db_type.description)


@router.put("/material-types/{type_id}", response_model=MaterialType)
def update_material_type(type_id: str, data: MaterialTypeCreate, db: Session = Depends(get_db)):
    """更新物料类型"""
    db_type = db.query(MaterialTypeDB).filter(MaterialTypeDB.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    existing = db.query(MaterialTypeDB).filter(
        MaterialTypeDB.name == data.name,
        MaterialTypeDB.id != type_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="该类型名称已存在")
    
    db_type.name = data.name
    db_type.description = data.description
    db.commit()
    db.refresh(db_type)
    return MaterialType(id=db_type.id, name=db_type.name, description=db_type.description)


@router.delete("/material-types/{type_id}")
def delete_material_type(type_id: str, db: Session = Depends(get_db)):
    """删除物料类型"""
    db_type = db.query(MaterialTypeDB).filter(MaterialTypeDB.id == type_id).first()
    if not db_type:
        raise HTTPException(status_code=404, detail="类型不存在")
    
    db.delete(db_type)
    db.commit()
    return {"message": "删除成功"}
