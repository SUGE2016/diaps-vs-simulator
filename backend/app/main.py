"""FastAPI应用入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db

# 创建FastAPI应用
app = FastAPI(
    title="Plant Simulator API",
    description="价值流模拟器API服务",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化数据库"""
    init_db()
    print("数据库初始化完成")


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "Plant Simulator API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok"}


# 导入路由
from .api import production_lines, workstations, buffers, transport_paths, routines, config

app.include_router(production_lines.router, prefix="/api/production-lines", tags=["产线"])
app.include_router(workstations.router, prefix="/api/workstations", tags=["工作站"])
app.include_router(buffers.router, prefix="/api/buffers", tags=["缓冲区"])
app.include_router(transport_paths.router, prefix="/api/transport-paths", tags=["运输路径"])
app.include_router(routines.router, prefix="/api/routines", tags=["流转路径"])
app.include_router(config.router, prefix="/api/config", tags=["配置管理"])

