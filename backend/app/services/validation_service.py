"""配置验证服务 - 验证配置的有效性"""
from typing import Dict, Any, List, Set
from sqlalchemy.orm import Session
from ..database.schemas import WorkstationDB, BufferDB, TransportPathDB, RoutineDB


class ValidationService:
    """配置验证服务"""

    @staticmethod
    def validate_config(config_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证配置文件的有效性
        
        Args:
            config_data: 配置数据字典
            
        Returns:
            验证结果 {valid: bool, errors: List[str], warnings: List[str]}
        """
        errors = []
        warnings = []
        
        # 验证必需字段
        if "production_line" not in config_data:
            errors.append("缺少 production_line 字段")
            return {"valid": False, "errors": errors, "warnings": warnings}
        
        line_data = config_data["production_line"]
        
        # 验证产线基本信息
        if "name" not in line_data:
            errors.append("产线缺少 name 字段")
        
        # 收集所有ID用于引用检查
        workstation_ids = set()
        buffer_ids = set()
        
        # 验证工作站
        for i, ws in enumerate(line_data.get("workstations", [])):
            ws_errors = ValidationService._validate_workstation(ws, i)
            errors.extend(ws_errors)
            if "id" in ws:
                workstation_ids.add(ws["id"])
        
        # 验证缓冲区
        for i, buf in enumerate(line_data.get("buffers", [])):
            buf_errors = ValidationService._validate_buffer(buf, i)
            errors.extend(buf_errors)
            if "id" in buf:
                buffer_ids.add(buf["id"])
        
        # 收集所有位置ID（工作站和缓冲区）
        all_location_ids = workstation_ids | buffer_ids
        
        # 验证运输路径
        for i, path in enumerate(line_data.get("transport_paths", [])):
            path_errors = ValidationService._validate_transport_path(
                path, i, all_location_ids
            )
            errors.extend(path_errors)
        
        # 验证流转路径
        for i, routine in enumerate(config_data.get("routines", [])):
            routine_errors = ValidationService._validate_routine(
                routine, i, workstation_ids, all_location_ids
            )
            errors.extend(routine_errors)
        
        # 验证价值流配置
        if "value_stream" in config_data and config_data["value_stream"]:
            vs_errors = ValidationService._validate_value_stream(
                config_data["value_stream"], workstation_ids
            )
            errors.extend(vs_errors)
        
        # 检查运输路径连通性
        connectivity_warnings = ValidationService._check_connectivity(
            line_data.get("transport_paths", []), all_location_ids
        )
        warnings.extend(connectivity_warnings)
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    @staticmethod
    def _validate_workstation(ws: Dict[str, Any], index: int) -> List[str]:
        """验证工作站配置"""
        errors = []
        prefix = f"工作站[{index}]"
        
        # 必需字段
        if "name" not in ws:
            errors.append(f"{prefix}: 缺少 name 字段")
        if "type" not in ws:
            errors.append(f"{prefix}: 缺少 type 字段")
        elif ws["type"] not in ["processing", "assembly", "inspection", "packaging", "storage"]:
            errors.append(f"{prefix}: type 值无效，必须是: processing, assembly, inspection, packaging, storage")
        
        # 验证处理时间配置
        if "processing_time" not in ws:
            errors.append(f"{prefix}: 缺少 processing_time 字段")
        else:
            pt = ws["processing_time"]
            if "type" not in pt:
                errors.append(f"{prefix}: processing_time 缺少 type 字段")
            elif pt["type"] == "fixed":
                if "value" not in pt or pt["value"] <= 0:
                    errors.append(f"{prefix}: fixed 类型的 processing_time 需要正数 value")
            elif pt["type"] == "uniform":
                if "min" not in pt or "max" not in pt:
                    errors.append(f"{prefix}: uniform 类型需要 min 和 max")
                elif pt["min"] >= pt["max"]:
                    errors.append(f"{prefix}: uniform 类型的 min 必须小于 max")
            elif pt["type"] == "normal":
                if "mean" not in pt or "std" not in pt:
                    errors.append(f"{prefix}: normal 类型需要 mean 和 std")
                elif pt["std"] <= 0:
                    errors.append(f"{prefix}: normal 类型的 std 必须为正数")
        
        # 验证容量
        if "capacity" in ws and ws["capacity"] <= 0:
            errors.append(f"{prefix}: capacity 必须为正整数")
        
        return errors

    @staticmethod
    def _validate_buffer(buf: Dict[str, Any], index: int) -> List[str]:
        """验证缓冲区配置"""
        errors = []
        prefix = f"缓冲区[{index}]"
        
        if "name" not in buf:
            errors.append(f"{prefix}: 缺少 name 字段")
        if "capacity" not in buf:
            errors.append(f"{prefix}: 缺少 capacity 字段")
        elif buf["capacity"] <= 0:
            errors.append(f"{prefix}: capacity 必须为正整数")
        
        if "current_level" in buf and buf["current_level"] > buf.get("capacity", 0):
            errors.append(f"{prefix}: current_level 不能超过 capacity")
        
        return errors

    @staticmethod
    def _validate_transport_path(
        path: Dict[str, Any], 
        index: int, 
        valid_locations: Set[str]
    ) -> List[str]:
        """验证运输路径配置"""
        errors = []
        prefix = f"运输路径[{index}]"
        
        if "from_location" not in path:
            errors.append(f"{prefix}: 缺少 from_location 字段")
        elif path["from_location"] not in valid_locations:
            errors.append(f"{prefix}: from_location '{path['from_location']}' 引用的位置不存在")
        
        if "to_location" not in path:
            errors.append(f"{prefix}: 缺少 to_location 字段")
        elif path["to_location"] not in valid_locations:
            errors.append(f"{prefix}: to_location '{path['to_location']}' 引用的位置不存在")
        
        if "transport_time" not in path:
            errors.append(f"{prefix}: 缺少 transport_time 字段")
        elif path["transport_time"] <= 0:
            errors.append(f"{prefix}: transport_time 必须为正数")
        
        if "capacity" in path and path["capacity"] <= 0:
            errors.append(f"{prefix}: capacity 必须为正整数")
        
        return errors

    @staticmethod
    def _validate_routine(
        routine: Dict[str, Any], 
        index: int,
        valid_workstations: Set[str],
        valid_locations: Set[str]
    ) -> List[str]:
        """验证流转路径配置"""
        errors = []
        prefix = f"Routine[{index}]"
        
        if "name" not in routine:
            errors.append(f"{prefix}: 缺少 name 字段")
        if "material_type" not in routine:
            errors.append(f"{prefix}: 缺少 material_type 字段")
        if "start_location" not in routine:
            errors.append(f"{prefix}: 缺少 start_location 字段")
        elif routine["start_location"] not in valid_locations:
            errors.append(f"{prefix}: start_location 引用的位置不存在")
        
        if "end_location" not in routine:
            errors.append(f"{prefix}: 缺少 end_location 字段")
        elif routine["end_location"] not in valid_locations:
            errors.append(f"{prefix}: end_location 引用的位置不存在")
        
        # 验证步骤
        steps = routine.get("steps", [])
        step_ids = set()
        
        for i, step in enumerate(steps):
            step_errors = ValidationService._validate_routine_step(
                step, i, valid_workstations, prefix
            )
            errors.extend(step_errors)
            
            if "step_id" in step:
                if step["step_id"] in step_ids:
                    errors.append(f"{prefix}.步骤[{i}]: step_id {step['step_id']} 重复")
                step_ids.add(step["step_id"])
        
        return errors

    @staticmethod
    def _validate_routine_step(
        step: Dict[str, Any],
        index: int,
        valid_workstations: Set[str],
        routine_prefix: str
    ) -> List[str]:
        """验证流转步骤配置"""
        errors = []
        prefix = f"{routine_prefix}.步骤[{index}]"
        
        if "step_id" not in step:
            errors.append(f"{prefix}: 缺少 step_id 字段")
        
        if "operation" not in step:
            errors.append(f"{prefix}: 缺少 operation 字段")
        elif step["operation"] not in ["processing", "assembly", "inspection", "packaging", "storage"]:
            errors.append(f"{prefix}: operation 值无效")
        
        # 如果不是并行步骤，需要工作站ID
        if not step.get("parallel", False):
            if "workstation_id" not in step:
                errors.append(f"{prefix}: 非并行步骤需要 workstation_id")
            elif step["workstation_id"] not in valid_workstations:
                errors.append(f"{prefix}: workstation_id '{step['workstation_id']}' 引用的工作站不存在")
        
        # 验证并行分支
        if step.get("parallel", False):
            if "branches" not in step or not step["branches"]:
                errors.append(f"{prefix}: 并行步骤需要 branches 字段")
            else:
                for j, branch in enumerate(step["branches"]):
                    if "workstation_id" not in branch:
                        errors.append(f"{prefix}.分支[{j}]: 缺少 workstation_id")
                    elif branch["workstation_id"] not in valid_workstations:
                        errors.append(f"{prefix}.分支[{j}]: workstation_id 引用的工作站不存在")
        
        # 验证条件路由
        if "conditions" in step and step["conditions"]:
            cond = step["conditions"]
            if "type" not in cond:
                errors.append(f"{prefix}: conditions 缺少 type 字段")
            if cond.get("type") == "quality_check" and "pass_rate" in cond:
                if not (0 <= cond["pass_rate"] <= 1):
                    errors.append(f"{prefix}: pass_rate 必须在 0-1 之间")
        
        # 验证价值增加
        if step.get("value_added", False) and "value_amount" not in step:
            errors.append(f"{prefix}: value_added 为 true 时需要 value_amount")
        
        return errors

    @staticmethod
    def _validate_value_stream(
        vs: Dict[str, Any],
        valid_workstations: Set[str]
    ) -> List[str]:
        """验证价值流配置"""
        errors = []
        
        # 验证价值点
        for i, vp in enumerate(vs.get("value_points", [])):
            if "workstation_id" not in vp:
                errors.append(f"价值点[{i}]: 缺少 workstation_id")
            elif vp["workstation_id"] not in valid_workstations:
                errors.append(f"价值点[{i}]: workstation_id 引用的工作站不存在")
            
            if "value_added" not in vp:
                errors.append(f"价值点[{i}]: 缺少 value_added")
        
        # 验证成本点
        for i, cp in enumerate(vs.get("cost_points", [])):
            if "workstation_id" not in cp:
                errors.append(f"成本点[{i}]: 缺少 workstation_id")
            elif cp["workstation_id"] not in valid_workstations:
                errors.append(f"成本点[{i}]: workstation_id 引用的工作站不存在")
            
            if "cost_per_unit" not in cp:
                errors.append(f"成本点[{i}]: 缺少 cost_per_unit")
            if "cost_type" not in cp:
                errors.append(f"成本点[{i}]: 缺少 cost_type")
        
        return errors

    @staticmethod
    def _check_connectivity(
        transport_paths: List[Dict[str, Any]],
        all_locations: Set[str]
    ) -> List[str]:
        """检查运输路径连通性"""
        warnings = []
        
        # 构建邻接表
        graph = {loc: [] for loc in all_locations}
        for path in transport_paths:
            if "from_location" in path and "to_location" in path:
                from_loc = path["from_location"]
                to_loc = path["to_location"]
                if from_loc in graph:
                    graph[from_loc].append(to_loc)
        
        # 检查孤立节点
        for loc in all_locations:
            if not graph[loc] and not any(loc in graph[other] for other in all_locations):
                warnings.append(f"位置 '{loc}' 没有任何运输路径连接")
        
        return warnings

    @staticmethod
    def validate_production_line(db: Session, line_id: str) -> Dict[str, Any]:
        """
        验证数据库中已存在的产线配置
        
        Args:
            db: 数据库会话
            line_id: 产线ID
            
        Returns:
            验证结果
        """
        # 查询产线及相关数据
        workstations = db.query(WorkstationDB).filter(
            WorkstationDB.production_line_id == line_id
        ).all()
        
        buffers = db.query(BufferDB).filter(
            BufferDB.production_line_id == line_id
        ).all()
        
        transport_paths = db.query(TransportPathDB).filter(
            TransportPathDB.production_line_id == line_id
        ).all()
        
        routines = db.query(RoutineDB).filter(
            RoutineDB.production_line_id == line_id
        ).all()
        
        errors = []
        warnings = []
        
        # 收集ID
        ws_ids = {ws.id for ws in workstations}
        buf_ids = {buf.id for buf in buffers}
        all_ids = ws_ids | buf_ids
        
        # 检查工作站的缓冲区引用
        for ws in workstations:
            if ws.input_buffer_id and ws.input_buffer_id not in buf_ids:
                errors.append(f"工作站 '{ws.name}' 的 input_buffer_id 引用不存在")
            if ws.output_buffer_id and ws.output_buffer_id not in buf_ids:
                errors.append(f"工作站 '{ws.name}' 的 output_buffer_id 引用不存在")
        
        # 检查运输路径引用
        for path in transport_paths:
            if path.from_location not in all_ids:
                errors.append(f"运输路径 from_location '{path.from_location}' 引用不存在")
            if path.to_location not in all_ids:
                errors.append(f"运输路径 to_location '{path.to_location}' 引用不存在")
        
        # 检查Routine引用
        for routine in routines:
            if routine.start_location not in all_ids:
                errors.append(f"Routine '{routine.name}' 的 start_location 引用不存在")
            if routine.end_location not in all_ids:
                errors.append(f"Routine '{routine.name}' 的 end_location 引用不存在")
            
            for step in routine.steps:
                if step.workstation_id and step.workstation_id not in ws_ids:
                    errors.append(f"Routine '{routine.name}' 步骤 {step.step_id} 的 workstation_id 引用不存在")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

