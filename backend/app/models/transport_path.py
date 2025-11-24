"""运输路径数据模型"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class TransportPathBase(BaseModel):
    """运输路径基础模型"""
    from_location: str = Field(..., description="起始位置（工作站或缓冲区ID）")
    to_location: str = Field(..., description="目标位置（工作站或缓冲区ID）")
    transport_time: float = Field(..., description="运输时间（秒）")
    capacity: Optional[int] = Field(None, description="运输能力")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict, description="其他属性")


class TransportPathCreate(TransportPathBase):
    """创建运输路径"""
    production_line_id: str = Field(..., description="所属产线ID")


class TransportPathUpdate(BaseModel):
    """更新运输路径"""
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    transport_time: Optional[float] = None
    capacity: Optional[int] = None
    properties: Optional[Dict[str, Any]] = None


class TransportPath(TransportPathBase):
    """运输路径完整模型"""
    id: str = Field(..., description="路径ID")
    production_line_id: str = Field(..., description="所属产线ID")

    class Config:
        from_attributes = True

