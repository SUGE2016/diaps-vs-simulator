"""全局配置模型 - 工艺步骤类型、工作站类型等"""
from typing import Optional
from pydantic import BaseModel, Field


class OperationTypeBase(BaseModel):
    """工艺步骤类型基础模型"""
    name: str = Field(..., description="类型名称")
    description: Optional[str] = Field(None, description="描述")


class OperationTypeCreate(OperationTypeBase):
    """创建工艺步骤类型"""
    pass


class OperationType(OperationTypeBase):
    """工艺步骤类型完整模型"""
    id: str = Field(..., description="类型ID")

    class Config:
        from_attributes = True


class WorkstationTypeBase(BaseModel):
    """工作站类型基础模型"""
    name: str = Field(..., description="类型名称")
    description: Optional[str] = Field(None, description="描述")


class WorkstationTypeCreate(WorkstationTypeBase):
    """创建工作站类型"""
    pass


class WorkstationType(WorkstationTypeBase):
    """工作站类型完整模型"""
    id: str = Field(..., description="类型ID")

    class Config:
        from_attributes = True


class MaterialTypeBase(BaseModel):
    """物料类型基础模型"""
    name: str = Field(..., description="类型名称")
    description: Optional[str] = Field(None, description="描述")


class MaterialTypeCreate(MaterialTypeBase):
    """创建物料类型"""
    pass


class MaterialType(MaterialTypeBase):
    """物料类型完整模型"""
    id: str = Field(..., description="类型ID")

    class Config:
        from_attributes = True

