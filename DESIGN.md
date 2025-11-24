# 价值流模拟器设计文档

## 1. 项目概述

价值流模拟器是一个用于模拟和可视化生产线上原材料、半成品和成品流转过程的离散事件仿真系统。系统通过模拟生产过程中的各种事件（如加工、运输、等待、质检等），帮助分析产线效率、瓶颈识别和优化方案。

## 2. 核心功能

### 2.1 产线建模
- 定义产线结构（工作站、缓冲区、运输路径）
- 配置工作站属性（加工时间、产能、设备状态）
- 设置原材料和产品的流转规则

### 2.2 离散事件模拟
- 事件调度引擎（加工开始/结束、运输、等待等）
- 时间推进机制
- 事件优先级管理
- 统计信息收集（吞吐量、等待时间、设备利用率等）

### 2.3 可视化展示
- 实时展示原材料和产品在产线上的位置
- 显示工作站状态（空闲、加工中、故障等）
- 展示缓冲区库存水平
- 时间轴和统计图表

### 2.4 数据分析
- 产线效率指标（OEE、产能利用率）
- 瓶颈识别
- 物料流转路径分析
- 历史数据查询和对比

## 3. 系统架构

### 3.1 B/S架构设计

```
┌─────────────────────────────────────────┐
│          Web前端 (Browser)              │
│  - React/Vue + D3.js/Canvas             │
│  - 产线可视化视图                        │
│  - 实时状态监控面板                      │
│  - 统计图表展示                          │
│  - 配置管理界面                          │
└─────────────────────────────────────────┘
                    │ HTTP/WebSocket
┌─────────────────────────────────────────┐
│         API服务层 (Backend)             │
│  - RESTful API (FastAPI/Flask)          │
│  - WebSocket (实时数据推送)              │
│  - 配置管理API                           │
│  - 模拟控制API                           │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        模拟引擎层                       │
│  - 事件调度器 (Event Scheduler)         │
│  - 时间管理器 (Time Manager)            │
│  - 状态管理器 (State Manager)           │
│  - Routine执行引擎                       │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        业务逻辑层                       │
│  - 产线模型 (Production Line Model)     │
│  - 物料管理 (Material Manager)          │
│  - 工作站管理 (Workstation Manager)     │
│  - 运输管理 (Transport Manager)         │
│  - 价值流计算 (Value Stream Calculator) │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│        数据层                           │
│  - 配置数据 (JSON/YAML)                 │
│  - 运行数据 (内存)                      │
│  - 统计数据 (数据库/文件)                │
└─────────────────────────────────────────┘
```

## 4. 数据模型

### 4.1 产线 (ProductionLine)
- `id`: 产线标识
- `name`: 产线名称
- `workstations`: 工作站列表
- `buffers`: 缓冲区列表
- `transport_paths`: 运输路径列表

### 4.2 工作站 (Workstation)
- `id`: 工作站标识
- `name`: 工作站名称
- `type`: 工作站类型（加工、装配、质检等）
- `capacity`: 处理能力（单位时间处理数量）
- `processing_time`: 加工时间（固定或分布）
- `status`: 状态（空闲、加工中、故障、维护）
- `input_buffer`: 输入缓冲区
- `output_buffer`: 输出缓冲区

### 4.3 缓冲区 (Buffer)
- `id`: 缓冲区标识
- `capacity`: 容量限制
- `current_level`: 当前库存
- `materials`: 物料列表

### 4.4 物料 (Material)
- `id`: 物料标识
- `type`: 物料类型（原材料、半成品、成品）
- `batch_id`: 批次号
- `current_location`: 当前位置
- `target_location`: 目标位置
- `state`: 状态（等待、运输中、加工中、完成）
- `created_time`: 创建时间
- `properties`: 属性字典（质量、规格等）

### 4.5 事件 (Event)
- `id`: 事件标识
- `type`: 事件类型（加工开始、加工结束、运输开始、运输结束等）
- `timestamp`: 事件时间戳
- `entity_id`: 关联实体ID（物料或工作站）
- `priority`: 优先级
- `data`: 事件数据

### 4.6 运输路径 (TransportPath)
- `id`: 路径标识
- `from_location`: 起始位置
- `to_location`: 目标位置
- `transport_time`: 运输时间
- `capacity`: 运输能力

### 4.7 流转路径 (Routine)
- `id`: 路径标识
- `name`: 路径名称
- `material_type`: 适用的物料类型
- `steps`: 流转步骤列表
  - `workstation_id`: 工作站ID
  - `operation`: 操作类型（加工、装配、质检等）
  - `processing_time`: 处理时间
  - `value_added`: 是否价值增加点
  - `value_amount`: 价值增加量
  - `conditions`: 条件判断（用于分支路由）
- `start_location`: 起始位置
- `end_location`: 结束位置

### 4.8 价值流配置 (ValueStreamConfig)
- `id`: 配置标识
- `name`: 价值流名称
- `routines`: 流转路径列表
- `value_points`: 价值增加点定义
- `cost_points`: 成本发生点定义

## 5. 离散事件模拟引擎

### 5.1 事件调度机制
- 使用优先队列（最小堆）管理事件
- 按时间戳排序，相同时间按优先级排序
- 支持事件插入、删除和修改

### 5.2 时间推进
- 离散时间推进（Next Event Time Advance）
- 支持暂停、继续、重置
- 可设置模拟速度（加速/减速）

### 5.3 事件类型
- **加工开始事件**: 物料进入工作站开始加工
- **加工结束事件**: 物料完成加工，准备移出
- **运输开始事件**: 物料开始从当前位置运输
- **运输结束事件**: 物料到达目标位置
- **缓冲区满事件**: 缓冲区达到容量上限
- **缓冲区空事件**: 缓冲区库存为零
- **设备故障事件**: 工作站发生故障
- **设备恢复事件**: 工作站故障恢复

### 5.4 状态更新
- 事件触发时更新相关实体状态
- 检查条件并生成新事件
- 记录统计数据

## 6. 实物流/价值流Routine配置

### 6.1 配置方式

Routine配置支持两种方式：
1. **JSON/YAML配置文件**: 静态配置，适合固定产线结构
2. **Web界面配置**: 通过前端界面动态创建和修改配置

### 6.2 配置文件结构

#### 6.2.1 基础配置格式 (JSON)

```json
{
  "production_line": {
    "id": "line_001",
    "name": "主产线",
    "workstations": [
      {
        "id": "ws_001",
        "name": "加工站A",
        "type": "processing",
        "capacity": 1,
        "processing_time": {
          "type": "fixed",
          "value": 10
        }
      }
    ],
    "buffers": [
      {
        "id": "buf_001",
        "name": "缓冲区1",
        "capacity": 50,
        "location": "before_ws_001"
      }
    ]
  },
  "routines": [
    {
      "id": "routine_001",
      "name": "标准产品流程",
      "material_type": "raw_material",
      "steps": [
        {
          "step_id": 1,
          "workstation_id": "ws_001",
          "operation": "processing",
          "processing_time": 10,
          "value_added": true,
          "value_amount": 100,
          "conditions": null
        },
        {
          "step_id": 2,
          "workstation_id": "ws_002",
          "operation": "assembly",
          "processing_time": 15,
          "value_added": true,
          "value_amount": 150,
          "conditions": {
            "type": "quality_check",
            "pass_route": "step_3",
            "fail_route": "step_4"
          }
        }
      ],
      "start_location": "entry_point",
      "end_location": "finished_goods"
    }
  ],
  "value_stream": {
    "value_points": [
      {
        "workstation_id": "ws_001",
        "value_added": 100,
        "description": "加工增值"
      }
    ],
    "cost_points": [
      {
        "workstation_id": "ws_001",
        "cost_per_unit": 50,
        "cost_type": "processing"
      }
    ]
  }
}
```

#### 6.2.2 流转步骤配置说明

每个流转步骤包含以下属性：

- **step_id**: 步骤序号，用于定义执行顺序
- **workstation_id**: 目标工作站ID
- **operation**: 操作类型
  - `processing`: 加工
  - `assembly`: 装配
  - `inspection`: 质检
  - `packaging`: 包装
  - `storage`: 存储
- **processing_time**: 处理时间（秒），支持：
  - 固定值: `{"type": "fixed", "value": 10}`
  - 均匀分布: `{"type": "uniform", "min": 8, "max": 12}`
  - 正态分布: `{"type": "normal", "mean": 10, "std": 2}`
- **value_added**: 布尔值，标识是否为价值增加点
- **value_amount**: 价值增加量（当value_added为true时）
- **conditions**: 条件路由配置（可选）
  - `type`: 条件类型（quality_check, quantity_check等）
  - `pass_route`: 满足条件时的下一步骤ID
  - `fail_route`: 不满足条件时的下一步骤ID
  - `condition_params`: 条件参数

#### 6.2.3 分支路由配置

支持基于条件的动态路由：

```json
{
  "step_id": 2,
  "workstation_id": "ws_inspection",
  "operation": "inspection",
  "conditions": {
    "type": "quality_check",
    "pass_rate": 0.95,
    "pass_route": "step_3",
    "fail_route": "step_5"
  }
}
```

#### 6.2.4 并行路径配置

支持物料在多个工作站并行处理：

```json
{
  "step_id": 1,
  "parallel": true,
  "branches": [
    {
      "workstation_id": "ws_001",
      "processing_time": 10
    },
    {
      "workstation_id": "ws_002",
      "processing_time": 12
    }
  ],
  "merge_condition": "all_complete",
  "next_step": "step_2"
}
```

### 6.3 Web界面配置

通过Web界面可以：
1. **可视化拖拽**: 拖拽工作站和缓冲区构建产线布局
2. **路径编辑器**: 图形化编辑物料流转路径
3. **参数配置**: 表单方式配置工作站参数、处理时间、价值点等
4. **条件设置**: 可视化设置分支条件和路由规则
5. **实时验证**: 配置时实时验证路径的有效性

### 6.4 Routine执行机制

1. **路径匹配**: 物料进入系统时，根据物料类型匹配对应的Routine
2. **步骤执行**: 按Routine定义的步骤顺序执行
3. **条件判断**: 遇到条件步骤时，根据条件结果选择下一步
4. **价值计算**: 经过价值增加点时，累加价值量
5. **状态跟踪**: 记录物料在每个步骤的状态和时间

### 6.5 配置API

提供RESTful API进行配置管理：

- `GET /api/routines`: 获取所有Routine配置
- `GET /api/routines/{id}`: 获取指定Routine
- `POST /api/routines`: 创建新Routine
- `PUT /api/routines/{id}`: 更新Routine配置
- `DELETE /api/routines/{id}`: 删除Routine
- `POST /api/routines/validate`: 验证Routine配置有效性

## 7. 关键算法

### 7.1 物料流转逻辑
```
1. 物料到达工作站输入缓冲区
2. 检查工作站是否空闲且缓冲区有物料
3. 如果满足条件，生成"加工开始"事件
4. 加工完成后，物料移至输出缓冲区
5. 检查运输路径，生成"运输开始"事件
6. 运输完成后，物料到达下一站输入缓冲区
```

### 7.2 瓶颈识别
- 监控各工作站等待队列长度
- 统计缓冲区平均库存水平
- 计算设备利用率
- 识别等待时间最长的环节

### 7.3 统计指标计算
- **吞吐量**: 单位时间内完成的产品数量
- **周期时间**: 物料从进入产线到完成的总时间
- **等待时间**: 物料在各缓冲区的等待时间
- **设备利用率**: 设备加工时间 / 总模拟时间
- **OEE**: 设备综合效率（可用率 × 性能率 × 质量率）

## 8. 技术栈建议

### 8.1 后端
- **语言**: Python
- **核心库**: 
  - `simpy`: 离散事件模拟框架（可选）
  - `numpy`: 数值计算
  - `pandas`: 数据处理
- **API框架**: Flask/FastAPI（如需提供API服务）

### 8.2 前端
- **框架**: React 或 Vue.js
- **可视化**: 
  - D3.js / Canvas API: 产线布局和实时状态展示
  - Chart.js / ECharts: 统计图表展示
- **通信**: 
  - RESTful API: 配置管理和控制
  - WebSocket: 实时状态推送

### 8.3 数据存储
- **配置数据**: JSON/YAML文件
- **运行数据**: 内存数据结构
- **统计数据**: CSV/数据库（SQLite/PostgreSQL）

## 9. 实现计划

### 阶段1: 核心引擎
- [ ] 事件调度器实现
- [ ] 时间管理器实现
- [ ] 基础数据模型定义

### 阶段2: 产线建模
- [ ] 工作站模型实现
- [ ] 缓冲区模型实现
- [ ] 运输路径模型实现
- [ ] 物料模型实现

### 阶段3: 业务逻辑
- [ ] 物料流转逻辑实现
- [ ] 工作站处理逻辑实现
- [ ] 运输逻辑实现

### 阶段4: Web前端
- [ ] 前端框架搭建
- [ ] 产线布局可视化组件
- [ ] 实时状态展示（WebSocket）
- [ ] 统计图表展示
- [ ] Routine配置界面

### 阶段5: 配置管理
- [ ] Routine配置API
- [ ] 配置文件解析和验证
- [ ] 配置界面（拖拽式编辑器）
- [ ] 配置导入/导出功能

### 阶段6: 优化与扩展
- [ ] 性能优化
- [ ] 更多事件类型支持
- [ ] 数据分析功能增强

## 10. 使用场景示例

### 场景1: 简单流水线
```
原材料 → 工作站A → 缓冲区1 → 工作站B → 缓冲区2 → 成品
```

### 场景2: 并行加工
```
原材料 → 分叉 → 工作站A ─┐
         └→ 工作站B ─┘ → 装配站 → 成品
```

### 场景3: 质检返工
```
工作站A → 质检站 → [合格] → 下一站
                  └→ [不合格] → 返工站 → 工作站A
```

## 11. 扩展方向

- 多产线协同模拟
- 动态调度优化
- 故障预测和维护计划
- 成本分析
- ~~3D可视化~~
- 实时数据接入（IoT设备）

