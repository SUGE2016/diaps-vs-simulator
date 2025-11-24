"""产线数据模型"""
from typing import Optional, List
from pydantic import BaseModel, Field


class ProductionLineBase(BaseModel):
    """产线基础模型"""
    name: str = Field(..., description="产线名称")
    description: Optional[str] = Field(None, description="产线描述")


class ProductionLineCreate(ProductionLineBase):
    """创建产线"""
    pass


class ProductionLineUpdate(BaseModel):
    """更新产线"""
    name: Optional[str] = None
    description: Optional[str] = None


class ProductionLine(ProductionLineBase):
    """产线完整模型"""
    id: str = Field(..., description="产线ID")

    class Config:
        from_attributes = True

