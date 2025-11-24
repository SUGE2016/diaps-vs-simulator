"""缓冲区数据模型"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class BufferBase(BaseModel):
    """缓冲区基础模型"""
    name: str = Field(..., description="缓冲区名称")
    capacity: int = Field(..., description="容量限制")
    location: Optional[str] = Field(None, description="位置描述")
    position: Optional[Dict[str, float]] = Field(None, description="界面位置坐标 {x, y}")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict, description="其他属性")


class BufferCreate(BufferBase):
    """创建缓冲区"""
    production_line_id: str = Field(..., description="所属产线ID")


class BufferUpdate(BaseModel):
    """更新缓冲区"""
    name: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    properties: Optional[Dict[str, Any]] = None


class Buffer(BufferBase):
    """缓冲区完整模型"""
    id: str = Field(..., description="缓冲区ID")
    production_line_id: str = Field(..., description="所属产线ID")
    current_level: int = Field(default=0, description="当前库存")

    class Config:
        from_attributes = True

