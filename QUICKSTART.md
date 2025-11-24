# 快速开始指南

## 安装依赖

### 后端

```bash
cd backend
pip install -r requirements.txt
```

### 前端

```bash
cd frontend
npm install
```

## 启动服务

### 方式1：使用启动脚本

```bash
# 启动后端（新终端窗口）
./start-backend.sh

# 启动前端（新终端窗口）
./start-frontend.sh
```

### 方式2：手动启动

**后端**
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端**
```bash
cd frontend
npm run dev
```

## 访问地址

- **前端应用**: http://localhost:5173
- **后端API文档**: http://localhost:8000/docs
- **后端健康检查**: http://localhost:8000/health

## 使用流程

### 1. 创建产线
1. 访问首页
2. 点击"新建产线"按钮
3. 输入产线名称和描述
4. 点击"确定"创建

### 2. 编辑产线布局
1. 在产线列表中点击"编辑建模"
2. 从左侧工具箱拖拽工作站和缓冲区到画布
3. 按住Ctrl键点击两个元素创建运输路径
4. 点击元素查看和编辑属性

### 3. 配置Routine
1. 在编辑器页面切换到"Routine配置"标签
2. 点击"新建Routine"创建流转路径
3. 点击"编辑步骤"添加和配置流转步骤
4. 设置价值增加点和操作类型

### 4. 导入/导出配置
1. 访问"配置导入/导出"页面
2. **导入**: 拖拽JSON/YAML文件到上传区域，验证通过后导入
3. **导出**: 选择产线，点击"导出为JSON"或"导出为YAML"

## 示例配置

查看 `backend/config/default_config.json` 获取完整的配置示例。

可以直接导入此配置文件来快速创建一个示例产线。

## 故障排除

### 后端启动失败
- 检查Python版本（需要3.9+）
- 确认已安装所有依赖：`pip install -r requirements.txt`
- 检查8000端口是否被占用

### 前端启动失败
- 检查Node.js版本（需要16+）
- 确认已安装依赖：`npm install`
- 检查5173端口是否被占用

### 前端无法连接后端
- 确认后端服务已启动
- 检查CORS配置
- 查看浏览器控制台错误信息

### 导入配置失败
- 检查配置文件格式是否正确
- 查看验证错误信息
- 确保所有ID引用都存在

## 开发说明

### 后端开发
- 主应用: `backend/app/main.py`
- API路由: `backend/app/api/`
- 数据模型: `backend/app/models/`
- 数据库: SQLite (`plant_simulator.db`)

### 前端开发
- 组件: `frontend/src/components/`
- 页面: `frontend/src/pages/`
- API服务: `frontend/src/services/api.js`

## 下一步

建模工具已完成，后续可以开发：
1. 离散事件模拟引擎
2. 实时状态监控
3. 统计数据分析
4. 瓶颈识别和优化建议

