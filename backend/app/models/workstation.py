"""工作站数据模型"""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ProcessingTimeConfig(BaseModel):
    """处理时间配置"""
    type: str = Field(..., description="时间类型: fixed, uniform, normal")
    value: Optional[float] = Field(None, description="固定值")
    min: Optional[float] = Field(None, description="最小值（均匀分布）")
    max: Optional[float] = Field(None, description="最大值（均匀分布）")
    mean: Optional[float] = Field(None, description="平均值（正态分布）")
    std: Optional[float] = Field(None, description="标准差（正态分布）")


class WorkstationBase(BaseModel):
    """工作站基础模型"""
    name: str = Field(..., description="工作站名称")
    type: str = Field(..., description="工作站类型: processing, assembly, inspection, packaging, storage")
    capacity: int = Field(1, description="处理能力")
    processing_time: ProcessingTimeConfig = Field(..., description="加工时间配置")
    input_buffer_id: Optional[str] = Field(None, description="输入缓冲区ID")
    output_buffer_id: Optional[str] = Field(None, description="输出缓冲区ID")
    position: Optional[Dict[str, float]] = Field(None, description="界面位置坐标 {x, y}")
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict, description="其他属性")


class WorkstationCreate(WorkstationBase):
    """创建工作站"""
    production_line_id: str = Field(..., description="所属产线ID")


class WorkstationUpdate(BaseModel):
    """更新工作站"""
    name: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    processing_time: Optional[ProcessingTimeConfig] = None
    input_buffer_id: Optional[str] = None
    output_buffer_id: Optional[str] = None
    position: Optional[Dict[str, float]] = None
    properties: Optional[Dict[str, Any]] = None


class Workstation(WorkstationBase):
    """工作站完整模型"""
    id: str = Field(..., description="工作站ID")
    production_line_id: str = Field(..., description="所属产线ID")
    status: str = Field(default="idle", description="状态: idle, processing, breakdown, maintenance")

    class Config:
        from_attributes = True

