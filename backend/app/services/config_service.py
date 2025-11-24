"""配置管理服务 - 处理配置文件的导入和导出"""
import json
import yaml
import uuid
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..database.schemas import (
    ProductionLineDB, WorkstationDB, BufferDB, TransportPathDB,
    RoutineDB, RoutineStepDB, ValueStreamConfigDB
)


class ConfigService:
    """配置管理服务"""

    @staticmethod
    def import_config(db: Session, config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        导入配置：解析上传的JSON/YAML数据并保存到数据库
        
        Args:
            db: 数据库会话
            config_data: 配置数据字典
            
        Returns:
            导入结果信息
        """
        try:
            # 验证配置格式
            if "production_line" not in config_data:
                raise ValueError("配置文件缺少 production_line 字段")

            line_data = config_data["production_line"]
            
            # 生成或使用提供的ID
            line_id = line_data.get("id", f"line_{uuid.uuid4().hex[:8]}")
            
            # 检查产线是否已存在
            existing_line = db.query(ProductionLineDB).filter(ProductionLineDB.id == line_id).first()
            if existing_line:
                raise ValueError(f"产线ID {line_id} 已存在，请先删除或使用不同的ID")
            
            # 创建产线
            production_line = ProductionLineDB(
                id=line_id,
                name=line_data["name"],
                description=line_data.get("description")
            )
            db.add(production_line)
            
            # 导入工作站
            workstations_imported = 0
            for ws_data in line_data.get("workstations", []):
                ws_id = ws_data.get("id", f"ws_{uuid.uuid4().hex[:8]}")
                workstation = WorkstationDB(
                    id=ws_id,
                    production_line_id=line_id,
                    name=ws_data["name"],
                    type=ws_data["type"],
                    capacity=ws_data.get("capacity", 1),
                    processing_time=json.dumps(ws_data["processing_time"]),
                    status=ws_data.get("status", "idle"),
                    input_buffer_id=ws_data.get("input_buffer_id"),
                    output_buffer_id=ws_data.get("output_buffer_id"),
                    position=json.dumps(ws_data.get("position")) if ws_data.get("position") else None,
                    properties=json.dumps(ws_data.get("properties", {}))
                )
                db.add(workstation)
                workstations_imported += 1
            
            # 导入缓冲区
            buffers_imported = 0
            for buf_data in line_data.get("buffers", []):
                buf_id = buf_data.get("id", f"buf_{uuid.uuid4().hex[:8]}")
                buffer = BufferDB(
                    id=buf_id,
                    production_line_id=line_id,
                    name=buf_data["name"],
                    capacity=buf_data["capacity"],
                    current_level=buf_data.get("current_level", 0),
                    location=buf_data.get("location"),
                    position=json.dumps(buf_data.get("position")) if buf_data.get("position") else None,
                    properties=json.dumps(buf_data.get("properties", {}))
                )
                db.add(buffer)
                buffers_imported += 1
            
            # 导入运输路径
            paths_imported = 0
            for path_data in line_data.get("transport_paths", []):
                path_id = path_data.get("id", f"path_{uuid.uuid4().hex[:8]}")
                transport_path = TransportPathDB(
                    id=path_id,
                    production_line_id=line_id,
                    from_location=path_data["from_location"],
                    to_location=path_data["to_location"],
                    transport_time=path_data["transport_time"],
                    capacity=path_data.get("capacity"),
                    properties=json.dumps(path_data.get("properties", {}))
                )
                db.add(transport_path)
                paths_imported += 1
            
            # 导入流转路径
            routines_imported = 0
            for routine_data in config_data.get("routines", []):
                routine_id = routine_data.get("id", f"routine_{uuid.uuid4().hex[:8]}")
                routine = RoutineDB(
                    id=routine_id,
                    production_line_id=line_id,
                    name=routine_data["name"],
                    material_type=routine_data["material_type"],
                    start_location=routine_data["start_location"],
                    end_location=routine_data["end_location"],
                    description=routine_data.get("description")
                )
                db.add(routine)
                
                # 导入流转步骤
                for step_data in routine_data.get("steps", []):
                    step_id = step_data.get("id", f"step_{uuid.uuid4().hex[:8]}")
                    step = RoutineStepDB(
                        id=step_id,
                        routine_id=routine_id,
                        step_id=step_data["step_id"],
                        workstation_id=step_data.get("workstation_id"),
                        operation=step_data["operation"],
                        processing_time=step_data.get("processing_time"),
                        value_added=step_data.get("value_added", False),
                        value_amount=step_data.get("value_amount"),
                        conditions=json.dumps(step_data.get("conditions")) if step_data.get("conditions") else None,
                        parallel=step_data.get("parallel", False),
                        branches=json.dumps(step_data.get("branches")) if step_data.get("branches") else None,
                        merge_condition=step_data.get("merge_condition"),
                        next_step=step_data.get("next_step")
                    )
                    db.add(step)
                
                routines_imported += 1
            
            # 导入价值流配置
            value_streams_imported = 0
            if "value_stream" in config_data:
                vs_data = config_data["value_stream"]
                vs_id = vs_data.get("id", f"vs_{uuid.uuid4().hex[:8]}")
                value_stream = ValueStreamConfigDB(
                    id=vs_id,
                    production_line_id=line_id,
                    name=vs_data.get("name", "默认价值流"),
                    value_points=json.dumps(vs_data.get("value_points", [])),
                    cost_points=json.dumps(vs_data.get("cost_points", []))
                )
                db.add(value_stream)
                value_streams_imported += 1
            
            # 提交所有更改
            db.commit()
            
            return {
                "success": True,
                "message": "配置导入成功",
                "production_line_id": line_id,
                "statistics": {
                    "workstations": workstations_imported,
                    "buffers": buffers_imported,
                    "transport_paths": paths_imported,
                    "routines": routines_imported,
                    "value_streams": value_streams_imported
                }
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"配置导入失败: {str(e)}",
                "error": str(e)
            }

    @staticmethod
    def export_config(db: Session, production_line_id: str, format: str = "json") -> str:
        """
        导出配置：从数据库读取配置并转换为JSON/YAML格式
        
        Args:
            db: 数据库会话
            production_line_id: 产线ID
            format: 导出格式 (json 或 yaml)
            
        Returns:
            配置文件内容（字符串）
        """
        # 查询产线
        production_line = db.query(ProductionLineDB).filter(
            ProductionLineDB.id == production_line_id
        ).first()
        
        if not production_line:
            raise ValueError(f"产线 {production_line_id} 不存在")
        
        # 构建配置字典
        config = {
            "production_line": {
                "id": production_line.id,
                "name": production_line.name,
                "description": production_line.description,
                "workstations": [],
                "buffers": [],
                "transport_paths": []
            },
            "routines": [],
            "value_stream": None
        }
        
        # 导出工作站
        workstations = db.query(WorkstationDB).filter(
            WorkstationDB.production_line_id == production_line_id
        ).all()
        
        for ws in workstations:
            ws_dict = {
                "id": ws.id,
                "name": ws.name,
                "type": ws.type,
                "capacity": ws.capacity,
                "processing_time": json.loads(ws.processing_time),
                "status": ws.status,
                "input_buffer_id": ws.input_buffer_id,
                "output_buffer_id": ws.output_buffer_id,
            }
            if ws.position:
                ws_dict["position"] = json.loads(ws.position)
            if ws.properties:
                ws_dict["properties"] = json.loads(ws.properties)
            config["production_line"]["workstations"].append(ws_dict)
        
        # 导出缓冲区
        buffers = db.query(BufferDB).filter(
            BufferDB.production_line_id == production_line_id
        ).all()
        
        for buf in buffers:
            buf_dict = {
                "id": buf.id,
                "name": buf.name,
                "capacity": buf.capacity,
                "current_level": buf.current_level,
                "location": buf.location,
            }
            if buf.position:
                buf_dict["position"] = json.loads(buf.position)
            if buf.properties:
                buf_dict["properties"] = json.loads(buf.properties)
            config["production_line"]["buffers"].append(buf_dict)
        
        # 导出运输路径
        transport_paths = db.query(TransportPathDB).filter(
            TransportPathDB.production_line_id == production_line_id
        ).all()
        
        for path in transport_paths:
            path_dict = {
                "id": path.id,
                "from_location": path.from_location,
                "to_location": path.to_location,
                "transport_time": path.transport_time,
                "capacity": path.capacity,
            }
            if path.properties:
                path_dict["properties"] = json.loads(path.properties)
            config["production_line"]["transport_paths"].append(path_dict)
        
        # 导出流转路径
        routines = db.query(RoutineDB).filter(
            RoutineDB.production_line_id == production_line_id
        ).all()
        
        for routine in routines:
            routine_dict = {
                "id": routine.id,
                "name": routine.name,
                "material_type": routine.material_type,
                "start_location": routine.start_location,
                "end_location": routine.end_location,
                "description": routine.description,
                "steps": []
            }
            
            # 导出流转步骤
            steps = db.query(RoutineStepDB).filter(
                RoutineStepDB.routine_id == routine.id
            ).order_by(RoutineStepDB.step_id).all()
            
            for step in steps:
                step_dict = {
                    "step_id": step.step_id,
                    "workstation_id": step.workstation_id,
                    "operation": step.operation,
                    "processing_time": step.processing_time,
                    "value_added": step.value_added,
                    "value_amount": step.value_amount,
                    "parallel": step.parallel,
                    "merge_condition": step.merge_condition,
                    "next_step": step.next_step
                }
                if step.conditions:
                    step_dict["conditions"] = json.loads(step.conditions)
                if step.branches:
                    step_dict["branches"] = json.loads(step.branches)
                routine_dict["steps"].append(step_dict)
            
            config["routines"].append(routine_dict)
        
        # 导出价值流配置
        value_stream = db.query(ValueStreamConfigDB).filter(
            ValueStreamConfigDB.production_line_id == production_line_id
        ).first()
        
        if value_stream:
            config["value_stream"] = {
                "id": value_stream.id,
                "name": value_stream.name,
                "value_points": json.loads(value_stream.value_points),
                "cost_points": json.loads(value_stream.cost_points)
            }
        
        # 转换为指定格式
        if format.lower() == "yaml":
            return yaml.dump(config, allow_unicode=True, default_flow_style=False)
        else:
            return json.dumps(config, ensure_ascii=False, indent=2)

    @staticmethod
    def parse_uploaded_file(file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        解析上传的配置文件
        
        Args:
            file_content: 文件内容（字节）
            filename: 文件名
            
        Returns:
            解析后的配置字典
        """
        try:
            content_str = file_content.decode('utf-8')
            
            if filename.endswith('.json'):
                return json.loads(content_str)
            elif filename.endswith(('.yaml', '.yml')):
                return yaml.safe_load(content_str)
            else:
                raise ValueError(f"不支持的文件格式: {filename}")
        except Exception as e:
            raise ValueError(f"文件解析失败: {str(e)}")

