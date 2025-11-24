"""配置管理API路由"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..services import ConfigService, ValidationService

router = APIRouter()


@router.post("/validate")
async def validate_config(config_data: Dict[str, Any]) -> Dict[str, Any]:
    """验证配置文件的有效性"""
    result = ValidationService.validate_config(config_data)
    return result


@router.post("/validate-file")
async def validate_config_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """验证上传的配置文件"""
    try:
        # 读取并解析文件
        file_content = await file.read()
        config_data = ConfigService.parse_uploaded_file(file_content, file.filename)
        
        # 验证配置
        result = ValidationService.validate_config(config_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"文件处理失败: {str(e)}")


@router.post("/import")
async def import_config(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """导入配置文件到数据库"""
    try:
        # 读取并解析文件
        file_content = await file.read()
        config_data = ConfigService.parse_uploaded_file(file_content, file.filename)
        
        # 验证配置
        validation_result = ValidationService.validate_config(config_data)
        if not validation_result["valid"]:
            return {
                "success": False,
                "message": "配置验证失败",
                "errors": validation_result["errors"],
                "warnings": validation_result["warnings"]
            }
        
        # 导入配置
        import_result = ConfigService.import_config(db, config_data)
        
        # 添加验证警告信息
        if validation_result["warnings"]:
            import_result["warnings"] = validation_result["warnings"]
        
        return import_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")


@router.post("/import-json")
async def import_config_json(
    config_data: Dict[str, Any],
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """直接导入JSON配置数据（不通过文件上传）"""
    try:
        # 验证配置
        validation_result = ValidationService.validate_config(config_data)
        if not validation_result["valid"]:
            return {
                "success": False,
                "message": "配置验证失败",
                "errors": validation_result["errors"],
                "warnings": validation_result["warnings"]
            }
        
        # 导入配置
        import_result = ConfigService.import_config(db, config_data)
        
        # 添加验证警告信息
        if validation_result["warnings"]:
            import_result["warnings"] = validation_result["warnings"]
        
        return import_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")


@router.get("/export/{production_line_id}")
async def export_config(
    production_line_id: str,
    format: str = "json",
    db: Session = Depends(get_db)
):
    """导出产线配置"""
    try:
        # 导出配置
        config_content = ConfigService.export_config(db, production_line_id, format)
        
        # 根据格式返回响应
        if format.lower() == "yaml":
            return Response(
                content=config_content,
                media_type="application/x-yaml",
                headers={
                    "Content-Disposition": f"attachment; filename=production_line_{production_line_id}.yaml"
                }
            )
        else:
            return Response(
                content=config_content,
                media_type="application/json",
                headers={
                    "Content-Disposition": f"attachment; filename=production_line_{production_line_id}.json"
                }
            )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


@router.get("/validate-production-line/{production_line_id}")
async def validate_production_line(
    production_line_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """验证数据库中的产线配置"""
    try:
        result = ValidationService.validate_production_line(db, production_line_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"验证失败: {str(e)}")

