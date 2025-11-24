# 价值流模拟器 - 建模工具

价值流模拟器的建模工具，用于配置产线、工作站、缓冲区、运输路径和流转路径。

## 项目结构

```
plant-simulator/
├── backend/           # 后端API服务 (FastAPI + SQLAlchemy + SQLite)
│   ├── app/
│   │   ├── api/      # API路由
│   │   ├── database/ # 数据库配置和模型
│   │   ├── models/   # Pydantic数据模型
│   │   ├── services/ # 业务逻辑服务
│   │   └── main.py   # 应用入口
│   └── requirements.txt
├── frontend/         # 前端Web应用 (React + Ant Design)
│   ├── src/
│   │   ├── components/ # 组件
│   │   ├── pages/      # 页面
│   │   └── services/   # API服务
│   └── package.json
├── DESIGN.md        # 设计文档
└── README.md
```

## 快速开始

### 后端启动

```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端API文档：http://localhost:8000/docs

### 前端启动

```bash
# 进入前端目录
cd frontend

# 安装依赖（使用国内镜像）
npm config set registry https://registry.npmmirror.com
npm install

# 启动开发服务器
npm run dev
```

前端应用：http://localhost:5173

## 功能特性

### 1. 产线建模
- 拖拽式产线布局编辑器
- 支持工作站（加工、装配、质检、包装、存储）
- 支持缓冲区
- 支持运输路径（带箭头的连接线）
- 实时位置调整和属性编辑

### 2. 工作站配置
- 多种工作站类型
- 灵活的处理时间配置（固定值、均匀分布、正态分布）
- 处理能力设置
- 输入/输出缓冲区关联

### 3. Routine配置
- 图形化流转路径编辑
- 步骤顺序调整（拖拽排序）
- 价值增加点标记
- 支持条件路由和并行路径

### 4. 配置导入/导出
- 支持JSON和YAML格式
- 配置文件验证（路径有效性、引用检查等）
- 批量导入产线配置
- 灵活的导出功能

## API概览

### 产线管理
- `GET /api/production-lines` - 获取所有产线
- `POST /api/production-lines` - 创建产线
- `PUT /api/production-lines/{id}` - 更新产线
- `DELETE /api/production-lines/{id}` - 删除产线

### 工作站管理
- `GET /api/workstations?production_line_id={id}` - 获取工作站
- `POST /api/workstations` - 创建工作站
- `PUT /api/workstations/{id}` - 更新工作站
- `DELETE /api/workstations/{id}` - 删除工作站

### 缓冲区管理
- `GET /api/buffers?production_line_id={id}` - 获取缓冲区
- `POST /api/buffers` - 创建缓冲区
- `PUT /api/buffers/{id}` - 更新缓冲区
- `DELETE /api/buffers/{id}` - 删除缓冲区

### 运输路径管理
- `GET /api/transport-paths?production_line_id={id}` - 获取运输路径
- `POST /api/transport-paths` - 创建运输路径
- `PUT /api/transport-paths/{id}` - 更新运输路径
- `DELETE /api/transport-paths/{id}` - 删除运输路径

### Routine管理
- `GET /api/routines?production_line_id={id}` - 获取Routine
- `POST /api/routines` - 创建Routine
- `PUT /api/routines/{id}` - 更新Routine
- `DELETE /api/routines/{id}` - 删除Routine

### 配置管理
- `POST /api/config/validate` - 验证配置JSON
- `POST /api/config/validate-file` - 验证上传的配置文件
- `POST /api/config/import` - 导入配置文件
- `GET /api/config/export/{id}?format=json` - 导出配置

## 配置文件示例

查看 `backend/config/default_config.json` 获取完整的配置文件示例。

## 技术栈

### 后端
- Python 3.9+
- FastAPI - Web框架
- SQLAlchemy - ORM
- Pydantic - 数据验证
- SQLite - 数据库

### 前端
- React 18+
- Ant Design - UI组件库
- React Router - 路由
- React DnD - 拖拽功能
- Axios - HTTP客户端
- Vite - 构建工具

## 数据模型

- **ProductionLine**: 产线
- **Workstation**: 工作站（加工、装配、质检、包装、存储）
- **Buffer**: 缓冲区
- **TransportPath**: 运输路径
- **Routine**: 流转路径（包含多个步骤）
- **RoutineStep**: 流转步骤
- **ValueStreamConfig**: 价值流配置

## 后续开发

当前实现的是第一阶段：建模工具。后续阶段包括：
- 离散事件模拟引擎
- 实时状态监控和可视化
- 统计数据分析和报表
- 瓶颈识别和优化建议

## 许可证

MIT

