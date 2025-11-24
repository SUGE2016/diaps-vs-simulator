/**
 * 画布区域 - 显示和操作产线元素
 */
import { useRef, useState } from 'react';
import { useDrop, useDrag } from 'react-dnd';

function CanvasArea({
  workstations,
  buffers,
  transportPaths,
  selectedElement,
  onSelectElement,
  onAddWorkstation,
  onAddBuffer,
  onUpdatePosition,
  onCreatePath,
}) {
  const canvasRef = useRef(null);
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['WORKSTATION', 'BUFFER', 'CANVAS_ELEMENT'],
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: offset.x - canvasRect.left,
        y: offset.y - canvasRect.top,
      };

      const itemType = monitor.getItemType();
      
      // 从工具箱拖到画布 - 创建新元素
      // 调整位置使元素中心对齐鼠标位置
      if (itemType === 'WORKSTATION') {
        const adjustedPosition = {
          x: Math.max(0, Math.min(position.x - 40, canvasRect.width - 80)),
          y: Math.max(0, Math.min(position.y - 30, canvasRect.height - 60)),
        };
        onAddWorkstation(item.type, adjustedPosition);
        return { position: adjustedPosition };
      } else if (itemType === 'BUFFER') {
        const adjustedPosition = {
          x: Math.max(0, Math.min(position.x - 35, canvasRect.width - 70)),
          y: Math.max(0, Math.min(position.y - 25, canvasRect.height - 50)),
        };
        onAddBuffer(adjustedPosition);
        return { position: adjustedPosition };
      }
      // 画布内拖动 - 返回位置信息供end回调使用
      else if (itemType === 'CANVAS_ELEMENT') {
        // 确保位置在画布范围内
        const clampedPosition = {
          x: Math.max(0, Math.min(position.x, canvasRect.width)),
          y: Math.max(0, Math.min(position.y, canvasRect.height)),
        };
        return { position: clampedPosition };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // 处理元素点击
  const handleElementClick = (element, event) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+点击：连接模式
      if (!connectFrom) {
        setConnectFrom(element);
        setConnectMode(true);
      } else {
        if (connectFrom.id !== element.id) {
          onCreatePath(connectFrom.id, element.id);
        }
        setConnectFrom(null);
        setConnectMode(false);
      }
    } else {
      onSelectElement(element);
    }
  };

  // 可拖动的元素组件 - 工作站
  const DraggableWorkstation = ({ ws }) => {
    const isSelected = selectedElement?.id === ws.id;
    const isConnectSource = connectFrom?.id === ws.id;
    const elementType = 'workstation';
    
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'CANVAS_ELEMENT',
      item: { id: ws.id, elementType: 'workstation', element: ws },
      end: (item, monitor) => {
        // 画布内拖动：优先使用dropResult的位置
        const dropResult = monitor.getDropResult();
        const clientOffset = monitor.getClientOffset();
        
        if (!canvasRef.current) return;
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        let newPosition;
        
        // 如果dropResult存在且有position，说明是画布内拖动到新位置
        if (dropResult && dropResult.position) {
          newPosition = {
            x: dropResult.position.x - 40, // 减去元素宽度的一半，使鼠标位置对应元素中心
            y: dropResult.position.y - 30, // 减去元素高度的一半
          };
        } 
        // 如果dropResult不存在，说明拖动到了画布外，使用clientOffset
        else if (clientOffset) {
          newPosition = {
            x: clientOffset.x - canvasRect.left - 40,
            y: clientOffset.y - canvasRect.top - 30,
          };
        } else {
          return; // 没有有效的位置信息
        }
        
        // 确保位置在画布范围内（元素完全在画布内）
        newPosition.x = Math.max(0, Math.min(newPosition.x, canvasRect.width - 80));
        newPosition.y = Math.max(0, Math.min(newPosition.y, canvasRect.height - 60));
        
        onUpdatePosition(ws.id, 'workstation', newPosition);
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        key={ws.id}
        style={{
          position: 'absolute',
          left: ws.position?.x || 100,
          top: ws.position?.y || 100,
          width: 80,
          height: 60,
          background: isConnectSource ? '#52c41a' : isSelected ? '#1890ff' : '#fff',
          border: `2px solid ${isConnectSource ? '#52c41a' : isSelected ? '#1890ff' : '#d9d9d9'}`,
          borderRadius: '4px',
          padding: '8px',
          cursor: 'move',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
        }}
        onClick={(e) => {
          if (!isDragging) {
            handleElementClick({ ...ws, elementType: 'workstation' }, e);
          }
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{ws.name}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>{ws.type}</div>
      </div>
    );
  };

  // 可拖动的元素组件 - 缓冲区
  const DraggableBuffer = ({ buf }) => {
    const isSelected = selectedElement?.id === buf.id;
    const isConnectSource = connectFrom?.id === buf.id;
    const elementType = 'buffer';
    
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'CANVAS_ELEMENT',
      item: { id: buf.id, elementType: 'buffer', element: buf },
      end: (item, monitor) => {
        // 画布内拖动：优先使用dropResult的位置
        const dropResult = monitor.getDropResult();
        const clientOffset = monitor.getClientOffset();
        
        if (!canvasRef.current) return;
        
        const canvasRect = canvasRef.current.getBoundingClientRect();
        let newPosition;
        
        // 如果dropResult存在且有position，说明是画布内拖动到新位置
        if (dropResult && dropResult.position) {
          newPosition = {
            x: dropResult.position.x - 35, // 减去元素宽度的一半，使鼠标位置对应元素中心
            y: dropResult.position.y - 25, // 减去元素高度的一半
          };
        } 
        // 如果dropResult不存在，说明拖动到了画布外，使用clientOffset
        else if (clientOffset) {
          newPosition = {
            x: clientOffset.x - canvasRect.left - 35,
            y: clientOffset.y - canvasRect.top - 25,
          };
        } else {
          return; // 没有有效的位置信息
        }
        
        // 确保位置在画布范围内（元素完全在画布内）
        newPosition.x = Math.max(0, Math.min(newPosition.x, canvasRect.width - 70));
        newPosition.y = Math.max(0, Math.min(newPosition.y, canvasRect.height - 50));
        
        onUpdatePosition(buf.id, 'buffer', newPosition);
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        key={buf.id}
        style={{
          position: 'absolute',
          left: buf.position?.x || 100,
          top: buf.position?.y || 200,
          width: 70,
          height: 50,
          background: isConnectSource ? '#52c41a' : isSelected ? '#1890ff' : '#fafafa',
          border: `2px dashed ${isConnectSource ? '#52c41a' : isSelected ? '#1890ff' : '#d9d9d9'}`,
          borderRadius: '4px',
          padding: '8px',
          cursor: 'move',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          opacity: isDragging ? 0.5 : 1,
          zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
        }}
        onClick={(e) => {
          if (!isDragging) {
            handleElementClick({ ...buf, elementType: 'buffer' }, e);
          }
        }}
      >
        <div style={{ fontWeight: 'bold' }}>{buf.name}</div>
        <div style={{ fontSize: '10px', color: '#666' }}>{buf.capacity}</div>
      </div>
    );
  };

  // 渲染运输路径
  const renderPath = (path) => {
    const fromElement = [...workstations, ...buffers].find(e => e.id === path.from_location);
    const toElement = [...workstations, ...buffers].find(e => e.id === path.to_location);
    
    if (!fromElement || !toElement || !fromElement.position || !toElement.position) {
      return null;
    }

    const fromX = fromElement.position.x + 40;
    const fromY = fromElement.position.y + 30;
    const toX = toElement.position.x + 40;
    const toY = toElement.position.y + 30;

    return (
      <line
        key={path.id}
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="#1890ff"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
        style={{ cursor: 'pointer' }}
        onClick={() => onSelectElement({ ...path, elementType: 'path' })}
      />
    );
  };

  drop(canvasRef);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '600px',
        background: isOver ? '#f0f5ff' : '#fafafa',
        border: '2px dashed #d9d9d9',
        borderRadius: '4px',
        overflow: 'hidden', // 防止元素显示在画布外
      }}
    >
      {/* SVG层用于绘制连接线 */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#1890ff" />
          </marker>
        </defs>
        <g style={{ pointerEvents: 'auto' }}>
          {transportPaths.map(renderPath)}
        </g>
      </svg>

      {/* 工作站和缓冲区 */}
      {workstations.map(ws => (
        <DraggableWorkstation key={ws.id} ws={ws} />
      ))}
      {buffers.map(buf => (
        <DraggableBuffer key={buf.id} buf={buf} />
      ))}

      {/* 提示信息 */}
      {workstations.length === 0 && buffers.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#999',
        }}>
          <p>从左侧工具箱拖拽组件到这里</p>
          <p style={{ fontSize: '12px', marginTop: 8 }}>按住Ctrl点击两个元素创建连接</p>
        </div>
      )}

      {/* 连接模式提示 */}
      {connectMode && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#52c41a',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '14px',
        }}>
          连接模式：点击目标元素创建路径
        </div>
      )}
    </div>
  );
}

export default CanvasArea;

