"""流转路径数据模型"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ConditionConfig(BaseModel):
    """条件配置"""
    type: str = Field(..., description="条件类型: quality_check, quantity_check")
    pass_route: Optional[str] = Field(None, description="满足条件时的下一步骤ID")
    fail_route: Optional[str] = Field(None, description="不满足条件时的下一步骤ID")
    pass_rate: Optional[float] = Field(None, description="合格率")
    condition_params: Optional[Dict[str, Any]] = Field(default_factory=dict, description="其他条件参数")


class ParallelBranch(BaseModel):
    """并行分支"""
    workstation_id: str = Field(..., description="工作站ID")
    processing_time: float = Field(..., description="处理时间")


class RoutineStepBase(BaseModel):
    """流转步骤基础模型"""
    step_id: int = Field(..., description="步骤序号")
    workstation_id: Optional[str] = Field(None, description="工作站ID")
    operation: str = Field(..., description="操作类型: processing, assembly, inspection, packaging, storage")
    processing_time: Optional[float] = Field(None, description="处理时间（秒）")
    value_added: bool = Field(default=False, description="是否为价值增加点")
    value_amount: Optional[float] = Field(None, description="价值增加量")
    conditions: Optional[ConditionConfig] = Field(None, description="条件路由配置")
    parallel: bool = Field(default=False, description="是否为并行步骤")
    branches: Optional[List[ParallelBranch]] = Field(None, description="并行分支列表")
    merge_condition: Optional[str] = Field(None, description="合并条件: all_complete, any_complete")
    next_step: Optional[str] = Field(None, description="下一步骤ID")


class RoutineStep(RoutineStepBase):
    """流转步骤完整模型"""
    id: str = Field(..., description="步骤ID")

    class Config:
        from_attributes = True


class RoutineBase(BaseModel):
    """流转路径基础模型"""
    name: str = Field(..., description="路径名称")
    material_type: str = Field(..., description="适用的物料类型")
    start_location: str = Field(..., description="起始位置")
    end_location: str = Field(..., description="结束位置")
    description: Optional[str] = Field(None, description="描述")


class RoutineCreate(RoutineBase):
    """创建流转路径"""
    production_line_id: str = Field(..., description="所属产线ID")
    steps: List[RoutineStepBase] = Field(default_factory=list, description="流转步骤列表")


class RoutineUpdate(BaseModel):
    """更新流转路径"""
    name: Optional[str] = None
    material_type: Optional[str] = None
    start_location: Optional[str] = None
    end_location: Optional[str] = None
    description: Optional[str] = None
    steps: Optional[List[RoutineStepBase]] = None


class Routine(RoutineBase):
    """流转路径完整模型"""
    id: str = Field(..., description="路径ID")
    production_line_id: str = Field(..., description="所属产线ID")
    steps: List[RoutineStep] = Field(default_factory=list, description="流转步骤列表")

    class Config:
        from_attributes = True

