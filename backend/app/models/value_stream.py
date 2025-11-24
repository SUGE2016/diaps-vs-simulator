"""价值流配置数据模型"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ValuePoint(BaseModel):
    """价值增加点"""
    workstation_id: str = Field(..., description="工作站ID")
    value_added: float = Field(..., description="价值增加量")
    description: Optional[str] = Field(None, description="描述")


class CostPoint(BaseModel):
    """成本发生点"""
    workstation_id: str = Field(..., description="工作站ID")
    cost_per_unit: float = Field(..., description="单位成本")
    cost_type: str = Field(..., description="成本类型: processing, material, labor")
    description: Optional[str] = Field(None, description="描述")


class ValueStreamConfig(BaseModel):
    """价值流配置"""
    id: str = Field(..., description="配置ID")
    name: str = Field(..., description="价值流名称")
    production_line_id: str = Field(..., description="所属产线ID")
    value_points: List[ValuePoint] = Field(default_factory=list, description="价值增加点列表")
    cost_points: List[CostPoint] = Field(default_factory=list, description="成本发生点列表")

    class Config:
        from_attributes = True

