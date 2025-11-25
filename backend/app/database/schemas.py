"""SQLAlchemy数据库模型"""
import json
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base


class ProductionLineDB(Base):
    """产线表"""
    __tablename__ = "production_lines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # 关系
    workstations = relationship("WorkstationDB", back_populates="production_line", cascade="all, delete-orphan")
    buffers = relationship("BufferDB", back_populates="production_line", cascade="all, delete-orphan")
    transport_paths = relationship("TransportPathDB", back_populates="production_line", cascade="all, delete-orphan")
    routines = relationship("RoutineDB", back_populates="production_line", cascade="all, delete-orphan")
    value_stream_configs = relationship("ValueStreamConfigDB", back_populates="production_line", cascade="all, delete-orphan")


class WorkstationDB(Base):
    """工作站表"""
    __tablename__ = "workstations"

    id = Column(String, primary_key=True, index=True)
    production_line_id = Column(String, ForeignKey("production_lines.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    capacity = Column(Integer, default=1)
    processing_time = Column(Text, nullable=False)  # JSON格式存储
    status = Column(String, default="idle")
    input_buffer_id = Column(String, nullable=True)
    output_buffer_id = Column(String, nullable=True)
    position = Column(Text, nullable=True)  # JSON格式存储 {x, y}
    properties = Column(Text, nullable=True)  # JSON格式存储

    # 关系
    production_line = relationship("ProductionLineDB", back_populates="workstations")


class BufferDB(Base):
    """缓冲区表"""
    __tablename__ = "buffers"

    id = Column(String, primary_key=True, index=True)
    production_line_id = Column(String, ForeignKey("production_lines.id"), nullable=False)
    name = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    current_level = Column(Integer, default=0)
    location = Column(String, nullable=True)
    position = Column(Text, nullable=True)  # JSON格式存储 {x, y}
    properties = Column(Text, nullable=True)  # JSON格式存储

    # 关系
    production_line = relationship("ProductionLineDB", back_populates="buffers")


class TransportPathDB(Base):
    """运输路径表"""
    __tablename__ = "transport_paths"

    id = Column(String, primary_key=True, index=True)
    production_line_id = Column(String, ForeignKey("production_lines.id"), nullable=False)
    from_location = Column(String, nullable=False)
    to_location = Column(String, nullable=False)
    transport_time = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=True)
    properties = Column(Text, nullable=True)  # JSON格式存储

    # 关系
    production_line = relationship("ProductionLineDB", back_populates="transport_paths")


class RoutineDB(Base):
    """流转路径表"""
    __tablename__ = "routines"

    id = Column(String, primary_key=True, index=True)
    production_line_id = Column(String, ForeignKey("production_lines.id"), nullable=False)
    name = Column(String, nullable=False)
    material_type = Column(String, nullable=False)
    start_location = Column(String, nullable=True)  # 改为可选，由图形化连线确定
    end_location = Column(String, nullable=True)    # 改为可选，由图形化连线确定
    description = Column(Text, nullable=True)

    # 关系
    production_line = relationship("ProductionLineDB", back_populates="routines")
    steps = relationship("RoutineStepDB", back_populates="routine", cascade="all, delete-orphan")
    step_links = relationship("RoutineStepLinkDB", back_populates="routine", cascade="all, delete-orphan")


class RoutineStepDB(Base):
    """流转步骤表"""
    __tablename__ = "routine_steps"

    id = Column(String, primary_key=True, index=True)
    routine_id = Column(String, ForeignKey("routines.id"), nullable=False)
    step_id = Column(Integer, nullable=False)
    workstation_id = Column(String, nullable=True)
    operation = Column(String, nullable=False)
    processing_time = Column(Float, nullable=True)
    value_added = Column(Boolean, default=False)
    value_amount = Column(Float, nullable=True)
    conditions = Column(Text, nullable=True)  # JSON格式存储
    parallel = Column(Boolean, default=False)
    branches = Column(Text, nullable=True)  # JSON格式存储
    merge_condition = Column(String, nullable=True)
    next_step = Column(String, nullable=True)
    position = Column(Text, nullable=True)  # JSON格式存储 {x, y} 画布位置

    # 关系
    routine = relationship("RoutineDB", back_populates="steps")


class RoutineStepLinkDB(Base):
    """工艺步骤连接表 - 图形化流程中的连线"""
    __tablename__ = "routine_step_links"

    id = Column(String, primary_key=True, index=True)
    routine_id = Column(String, ForeignKey("routines.id"), nullable=False)
    from_step_id = Column(String, ForeignKey("routine_steps.id"), nullable=False)
    to_step_id = Column(String, ForeignKey("routine_steps.id"), nullable=False)

    # 关系
    routine = relationship("RoutineDB", back_populates="step_links")


class ValueStreamConfigDB(Base):
    """价值流配置表"""
    __tablename__ = "value_stream_configs"

    id = Column(String, primary_key=True, index=True)
    production_line_id = Column(String, ForeignKey("production_lines.id"), nullable=False)
    name = Column(String, nullable=False)
    value_points = Column(Text, nullable=False)  # JSON格式存储
    cost_points = Column(Text, nullable=False)  # JSON格式存储

    # 关系
    production_line = relationship("ProductionLineDB", back_populates="value_stream_configs")


class OperationTypeDB(Base):
    """工艺步骤类型表 - 全局配置"""
    __tablename__ = "operation_types"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)


class WorkstationTypeDB(Base):
    """工作站类型表 - 全局配置"""
    __tablename__ = "workstation_types"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)


class MaterialTypeDB(Base):
    """物料类型表 - 全局配置"""
    __tablename__ = "material_types"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)

