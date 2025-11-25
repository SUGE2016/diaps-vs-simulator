/**
 * 工艺路线画布 - 图形化编辑工艺步骤和连接
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { message, Tooltip } from 'antd';
import { routineAPI, operationTypeAPI } from '../../services/api';
import { 
  CONNECTION_HANDLE_STYLES, 
  ELEMENT_STYLES,
  STEP_SIZE,
  LINE_STYLES,
  calculateAdaptivePath,
} from '../shared/canvasUtils';
import { detectAlignmentAndSpacing } from '../ProductionLineEditor/alignmentUtils';

// 可拖拽的操作类型按钮（工具箱中）
const DraggableOpType = ({ opType }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NEW_STEP',
    item: { type: 'NEW_STEP', operation: opType.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [opType]);

  return (
    <div
      ref={drag}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 12px',
        background: isDragging ? '#e6f7ff' : '#fff',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        fontSize: '12px',
      }}
    >
      {opType.name}
    </div>
  );
};

// 可拖拽的连接点组件（用于步骤）
const StepConnectionHandle = ({ step, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'STEP_CONNECTION_HANDLE',
    item: { 
      sourceId: step.id, 
      sourceStep: step,
      handlePosition: position 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [step.id, position]);

  const getHandleStyle = () => {
    const baseStyle = {
      position: 'absolute',
      width: CONNECTION_HANDLE_STYLES.SIZE,
      height: CONNECTION_HANDLE_STYLES.SIZE,
      borderRadius: '50%',
      background: isDragging ? CONNECTION_HANDLE_STYLES.COLOR_DRAGGING : CONNECTION_HANDLE_STYLES.COLOR,
      border: CONNECTION_HANDLE_STYLES.BORDER,
      cursor: 'crosshair',
      zIndex: 1001,
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    };

    if (position === 'left') {
      return { 
        ...baseStyle, 
        left: -4,
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    } else if (position === 'right') {
      return { 
        ...baseStyle, 
        right: -4,
        top: '50%',
        transform: 'translate(50%, -50%)',
      };
    }
    return baseStyle;
  };

  return (
    <div
      ref={drag}
      style={getHandleStyle()}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    />
  );
};

// 可拖拽的步骤节点（画布中）
const DraggableStep = ({ 
  step, 
  workstations,
  isSelected, 
  onSelect, 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ROUTINE_STEP',
    item: { id: step.id, type: 'ROUTINE_STEP' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [step.id]);

  const workstation = workstations.find(ws => ws.id === step.workstation_id);

  return (
    <div
      ref={drag}
      style={{
        position: 'absolute',
        left: step.position?.x ?? 100,
        top: step.position?.y ?? 100,
        width: STEP_SIZE.width,
        height: STEP_SIZE.height,
        background: isSelected ? ELEMENT_STYLES.SELECTED_BG : ELEMENT_STYLES.DEFAULT_BG,
        borderWidth: `${ELEMENT_STYLES.BORDER_WIDTH}px`,
        borderStyle: 'solid',
        borderColor: isSelected ? ELEMENT_STYLES.SELECTED_BORDER : ELEMENT_STYLES.DEFAULT_BORDER,
        borderRadius: ELEMENT_STYLES.BORDER_RADIUS,
        padding: '8px',
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        boxShadow: isSelected ? ELEMENT_STYLES.SHADOW_SELECTED : ELEMENT_STYLES.SHADOW_DEFAULT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(step);
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
        {step.operation}
      </div>
      <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
        {workstation?.name || '未指定工作站'}
      </div>
      
      {/* 选中时显示连接点 - 拖拽创建连接 */}
      {isSelected && (
        <>
          <StepConnectionHandle step={step} position="left" />
          <StepConnectionHandle step={step} position="right" />
        </>
      )}
    </div>
  );
};

// 主画布组件
function RoutineCanvas({ 
  routine, 
  workstations, 
  selectedStep,
  onSelectStep,
  selectedLink,
  onSelectLink,
  onRoutineUpdate,
  onOperationTypesChange
}) {
  const canvasRef = useRef(null);
  
  // 操作类型（从数据库加载）
  const [operationTypes, setOperationTypes] = useState([]);
  // 对齐参考线
  const [alignmentGuides, setAlignmentGuides] = useState({ horizontal: null, vertical: null });

  const steps = routine?.steps || [];
  const stepLinks = routine?.step_links || [];
  
  // 加载操作类型
  useEffect(() => {
    const loadOperationTypes = async () => {
      try {
        const data = await operationTypeAPI.list();
        setOperationTypes(data);
        if (onOperationTypesChange) {
          onOperationTypesChange(data);
        }
      } catch (error) {
        console.error('加载操作类型失败', error);
      }
    };
    loadOperationTypes();
  }, [onOperationTypesChange]);

  // 创建连接（拖拽连接点到目标步骤）
  const handleCreateLink = async (fromStepId, toStepId) => {
    if (!routine) return;
    
    // 检查是否已存在连接
    const existingLink = stepLinks.find(
      link => link.from_step_id === fromStepId && link.to_step_id === toStepId
    );
    
    if (existingLink) {
      message.warning('连接已存在');
      return;
    }

    try {
      await routineAPI.createLink(routine.id, {
        from_step_id: fromStepId,
        to_step_id: toStepId,
      });
      message.success('连接创建成功');
      onRoutineUpdate();
    } catch (error) {
      message.error('创建连接失败');
    }
  };

  // 处理画布drop
  const [, drop] = useDrop(() => ({
    accept: ['ROUTINE_STEP', 'NEW_STEP', 'STEP_CONNECTION_HANDLE'],
    hover: (item, monitor) => {
      // 只处理步骤拖动时的对齐检测
      if (monitor.getItemType() !== 'ROUTINE_STEP') return;
      
      const currentStep = steps.find(s => s.id === item.id);
      if (!currentStep || !currentStep.position) return;
      
      // 获取拖动偏移量
      const initialOffset = monitor.getInitialSourceClientOffset();
      const currentOffset = monitor.getSourceClientOffset();
      if (!initialOffset || !currentOffset) return;
      
      // 计算当前拖动位置
      const diff = {
        x: currentOffset.x - initialOffset.x,
        y: currentOffset.y - initialOffset.y,
      };
      const currentX = currentStep.position.x + diff.x;
      const currentY = currentStep.position.y + diff.y;
      
      // 获取其他步骤进行对齐检测
      const otherSteps = steps
        .filter(s => s.id !== item.id)
        .map(s => ({ ...s, elementType: 'step' }));
      
      // 检测对齐（只获取参考线，不吸附）
      const { alignmentGuide } = detectAlignmentAndSpacing(
        item.id,
        'step',
        currentX,
        currentY,
        otherSteps
      );
      
      setAlignmentGuides(alignmentGuide);
    },
    drop: (item, monitor) => {
      // 清除对齐参考线
      setAlignmentGuides({ horizontal: null, vertical: null });
      
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      // 考虑画布滚动偏移
      const position = {
        x: offset.x - canvasRect.left + canvasRef.current.scrollLeft,
        y: offset.y - canvasRect.top + canvasRef.current.scrollTop,
      };

      const itemType = monitor.getItemType();

      // 连接点拖拽处理 - 与产线布局一致
      if (itemType === 'STEP_CONNECTION_HANDLE') {
        const targetStep = steps.find(step => {
          if (!step.position) return false;
          return position.x >= step.position.x && position.x <= step.position.x + STEP_SIZE.width &&
                 position.y >= step.position.y && position.y <= step.position.y + STEP_SIZE.height;
        });
        
        if (targetStep && targetStep.id !== item.sourceId) {
          handleCreateLink(item.sourceId, targetStep.id);
          return { connected: true };
        }
        return { connected: false };
      }

      // 步骤拖动 - 应用对齐吸附
      if (item.type === 'ROUTINE_STEP') {
        const currentStep = steps.find(s => s.id === item.id);
        if (!currentStep || !currentStep.position) return;
        
        // 获取拖动偏移量
        const initialOffset = monitor.getInitialSourceClientOffset();
        const currentOffset = monitor.getSourceClientOffset();
        if (!initialOffset || !currentOffset) return;
        
        const diff = {
          x: currentOffset.x - initialOffset.x,
          y: currentOffset.y - initialOffset.y,
        };
        const rawX = currentStep.position.x + diff.x;
        const rawY = currentStep.position.y + diff.y;
        
        // 获取其他步骤进行对齐检测
        const otherSteps = steps
          .filter(s => s.id !== item.id)
          .map(s => ({ ...s, elementType: 'step' }));
        
        // 应用对齐吸附
        const { snapX, snapY } = detectAlignmentAndSpacing(
          item.id,
          'step',
          rawX,
          rawY,
          otherSteps
        );
        
        const newPosition = {
          x: Math.max(0, snapX),
          y: Math.max(0, snapY),
        };
        
        handleUpdateStepPosition(item.id, newPosition);
        return;
      }

      // 新建步骤
      if (item.type === 'NEW_STEP') {
        const adjustedPosition = {
          x: Math.max(0, position.x - STEP_SIZE.width / 2),
          y: Math.max(0, position.y - STEP_SIZE.height / 2),
        };
        handleCreateStep(adjustedPosition, item.operation);
      }
    },
  }), [routine, steps, stepLinks]);

  // 更新步骤位置
  const handleUpdateStepPosition = async (stepId, position) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;

    try {
      await routineAPI.updateStep(routine.id, stepId, {
        ...step,
        position,
      });
      onRoutineUpdate();
    } catch (error) {
      message.error('更新位置失败');
    }
  };

  // 创建新步骤（直接使用拖入的操作类型）
  const handleCreateStep = async (position, operation) => {
    if (!routine) return;
    
    try {
      await routineAPI.createStep(routine.id, {
        step_id: steps.length + 1,
        operation: operation,
        position,
      });
      message.success('步骤创建成功');
      onRoutineUpdate();
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 处理画布点击（取消选中）
  const handleCanvasClick = useCallback((e) => {
    // 如果点击的是SVG连线，不处理
    if (e.target.tagName === 'line' || e.target.tagName === 'g') {
      return;
    }
    if (onSelectStep) {
      onSelectStep(null);
    }
    if (onSelectLink) {
      onSelectLink(null);
    }
  }, [onSelectStep, onSelectLink]);

  // 渲染连接线（与产线布局样式一致）
  const renderLinks = () => {
    return stepLinks.map(link => {
      const fromStep = steps.find(s => s.id === link.from_step_id);
      const toStep = steps.find(s => s.id === link.to_step_id);
      if (!fromStep?.position || !toStep?.position) return null;

      // 使用自适应路径计算（从元素边缘到元素边缘，留出箭头空间）
      const pathPoints = calculateAdaptivePath(
        fromStep,
        toStep,
        STEP_SIZE,
        STEP_SIZE
      );
      
      if (!pathPoints) return null;
      const { fromX, fromY, toX, toY } = pathPoints;
      
      const isSelected = selectedLink?.id === link.id;

      return (
        <g key={link.id}>
          {/* 可见的连线 */}
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke={isSelected ? '#52c41a' : LINE_STYLES.COLOR}
            strokeWidth={isSelected ? 3 : LINE_STYLES.WIDTH}
            markerEnd="url(#routine-arrowhead)"
            style={{ pointerEvents: 'none' }}
          />
          {/* 不可见的宽点击区域 */}
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="transparent"
            strokeWidth={LINE_STYLES.CLICK_AREA_WIDTH}
            style={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              // 点击选中连线，而不是直接删除
              if (onSelectLink) {
                onSelectLink({ ...link, elementType: 'link' });
              }
              // 清除步骤选中
              if (onSelectStep) {
                onSelectStep(null);
              }
            }}
          />
        </g>
      );
    });
  };

  if (!routine) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>请先选择一个工艺路线</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 工具栏 */}
      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>拖入步骤：</span>
        {operationTypes.map(opType => (
          <DraggableOpType key={opType.id} opType={opType} />
        ))}
        {operationTypes.length === 0 && (
          <span style={{ color: '#999', fontSize: '12px' }}>请先在"配置管理"中添加工艺步骤类型</span>
        )}
        
        <span style={{ marginLeft: 'auto', color: '#999', fontSize: '12px' }}>
          {selectedStep ? '拖拽连接点创建连接，在右侧面板编辑属性' : '选中元素后拖拽连接点创建连接'}
        </span>
      </div>

      {/* 画布区域 */}
      <div
        ref={(node) => {
          canvasRef.current = node;
          drop(node);
        }}
        style={{
          flex: 1,
          position: 'relative',
          background: '#fafafa',
          border: '2px dashed #d9d9d9',
          borderRadius: '4px',
          overflow: 'auto',
          minHeight: '400px',
        }}
        onClick={handleCanvasClick}
      >
        {/* SVG层 */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <marker
              id="routine-arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="4"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill={LINE_STYLES.COLOR} />
            </marker>
          </defs>
          <g style={{ pointerEvents: 'auto' }}>
            {renderLinks()}
          </g>
          {/* 对齐参考线 */}
          {alignmentGuides.horizontal !== null && (
            <line
              x1="0"
              y1={alignmentGuides.horizontal}
              x2="100%"
              y2={alignmentGuides.horizontal}
              stroke="#52c41a"
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{ pointerEvents: 'none' }}
            />
          )}
          {alignmentGuides.vertical !== null && (
            <line
              x1={alignmentGuides.vertical}
              y1="0"
              x2={alignmentGuides.vertical}
              y2="100%"
              stroke="#52c41a"
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>

        {/* 步骤节点 */}
        {steps.map(step => (
          <DraggableStep
            key={step.id}
            step={step}
            workstations={workstations}
            isSelected={selectedStep?.id === step.id}
            onSelect={onSelectStep}
          />
        ))}

        {steps.length === 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            color: '#999',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div>暂无工艺步骤</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>从上方拖拽步骤类型到画布中</div>
          </div>
        )}
      </div>

    </div>
  );
}

export default RoutineCanvas;
