# Plant Simulator Backend

价值流模拟器后端API服务

## 技术栈

- Python 3.9+
- FastAPI
- SQLAlchemy
- SQLite

## 安装

```bash
cd backend
pip install -r requirements.txt
```

## 运行

```bash
# 开发模式
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 或使用以下命令
python -m uvicorn app.main:app --reload
```

API文档地址：http://localhost:8000/docs

## API概览

### 产线管理
- `GET /api/production-lines` - 获取所有产线
- `GET /api/production-lines/{id}` - 获取指定产线
- `POST /api/production-lines` - 创建产线
- `PUT /api/production-lines/{id}` - 更新产线
- `DELETE /api/production-lines/{id}` - 删除产线

### 工作站管理
- `GET /api/workstations` - 获取所有工作站
- `GET /api/workstations/{id}` - 获取指定工作站
- `POST /api/workstations` - 创建工作站
- `PUT /api/workstations/{id}` - 更新工作站
- `DELETE /api/workstations/{id}` - 删除工作站

### 缓冲区管理
- `GET /api/buffers` - 获取所有缓冲区
- `GET /api/buffers/{id}` - 获取指定缓冲区
- `POST /api/buffers` - 创建缓冲区
- `PUT /api/buffers/{id}` - 更新缓冲区
- `DELETE /api/buffers/{id}` - 删除缓冲区

### 运输路径管理
- `GET /api/transport-paths` - 获取所有运输路径
- `GET /api/transport-paths/{id}` - 获取指定运输路径
- `POST /api/transport-paths` - 创建运输路径
- `PUT /api/transport-paths/{id}` - 更新运输路径
- `DELETE /api/transport-paths/{id}` - 删除运输路径

### 流转路径管理
- `GET /api/routines` - 获取所有流转路径
- `GET /api/routines/{id}` - 获取指定流转路径
- `POST /api/routines` - 创建流转路径
- `PUT /api/routines/{id}` - 更新流转路径
- `DELETE /api/routines/{id}` - 删除流转路径

### 配置管理
- `POST /api/config/validate` - 验证配置JSON
- `POST /api/config/validate-file` - 验证上传的配置文件
- `POST /api/config/import` - 导入配置文件
- `POST /api/config/import-json` - 导入JSON配置
- `GET /api/config/export/{id}?format=json` - 导出配置（支持json/yaml）
- `GET /api/config/validate-production-line/{id}` - 验证产线配置

## 数据库

SQLite数据库文件位于 `plant_simulator.db`

## 配置示例

查看 `config/default_config.json` 获取配置文件示例

