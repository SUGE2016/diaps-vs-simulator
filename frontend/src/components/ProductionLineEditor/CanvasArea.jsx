/**
 * 画布区域 - 显示和操作产线元素
 */
import { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { DraggableElement } from './DraggableElement';
import { renderPath } from './pathUtils';
import { ELEMENT_SIZES, CANVAS_CONFIG } from './constants';
import { detectAlignmentAndSpacing } from './alignmentUtils';
import { createArrowMarker } from '../shared/canvasUtils';

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
  const [alignmentGuides, setAlignmentGuides] = useState({ horizontal: null, vertical: null });
  const [draggingElement, setDraggingElement] = useState(null);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['WORKSTATION', 'BUFFER', 'CANVAS_ELEMENT', 'CONNECTION_HANDLE'],
    hover: (item, monitor) => {
      // 只处理画布内元素拖动
      if (monitor.getItemType() !== 'CANVAS_ELEMENT') return;
      
      const currentElement = [...workstations, ...buffers].find(el => el.id === item.id);
      if (!currentElement || !currentElement.position) return;
      
      // 获取拖动偏移量
      const initialOffset = monitor.getInitialSourceClientOffset();
      const currentOffset = monitor.getSourceClientOffset();
      if (!initialOffset || !currentOffset) return;
      
      // 计算当前拖动位置
      const diff = {
        x: currentOffset.x - initialOffset.x,
        y: currentOffset.y - initialOffset.y,
      };
      const currentX = currentElement.position.x + diff.x;
      const currentY = currentElement.position.y + diff.y;
      
      // 获取其他元素进行对齐检测
      const allElements = [
        ...workstations.filter(ws => ws.id !== item.id).map(ws => ({ ...ws, elementType: 'workstation' })),
        ...buffers.filter(buf => buf.id !== item.id).map(buf => ({ ...buf, elementType: 'buffer' }))
      ];
      
      // 检测对齐（只获取参考线，不吸附）
      const { alignmentGuide } = detectAlignmentAndSpacing(
        item.id,
        item.elementType,
        currentX,
        currentY,
        allElements
      );
      
      setAlignmentGuides(alignmentGuide);
    },
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      if (!offset || !canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      // 考虑画布滚动偏移
      const position = {
        x: offset.x - canvasRect.left + canvasRef.current.scrollLeft,
        y: offset.y - canvasRect.top + canvasRef.current.scrollTop,
      };

      const itemType = monitor.getItemType();
      
      // 连接点拖拽处理
      if (itemType === 'CONNECTION_HANDLE') {
        const allElements = [
          ...workstations.map(ws => ({ ...ws, elementType: 'workstation' })),
          ...buffers.map(buf => ({ ...buf, elementType: 'buffer' }))
        ];
        const targetElement = allElements.find(el => {
          if (!el.position) return false;
          const { width, height } = el.elementType === 'workstation' 
            ? ELEMENT_SIZES.WORKSTATION 
            : ELEMENT_SIZES.BUFFER;
          return position.x >= el.position.x && position.x <= el.position.x + width &&
                 position.y >= el.position.y && position.y <= el.position.y + height;
        });
        
        if (targetElement && targetElement.id !== item.sourceId) {
          onCreatePath(item.sourceId, targetElement.id);
          return { connected: true };
        }
        return { connected: false };
      }
      
      // 从工具箱拖到画布 - 创建新元素
      if (itemType === 'WORKSTATION') {
        const { width, height } = ELEMENT_SIZES.WORKSTATION;
        const adjustedPosition = {
          x: Math.max(0, position.x - width / 2),
          y: Math.max(0, position.y - height / 2),
        };
        onAddWorkstation(item.type, adjustedPosition);
        return { position: adjustedPosition };
      } else if (itemType === 'BUFFER') {
        const { width, height } = ELEMENT_SIZES.BUFFER;
        const adjustedPosition = {
          x: Math.max(0, position.x - width / 2),
          y: Math.max(0, position.y - height / 2),
        };
        onAddBuffer(adjustedPosition);
        return { position: adjustedPosition };
      }
      
      // 画布内拖动 - 在这里计算新位置
      else if (itemType === 'CANVAS_ELEMENT') {
        // 获取元素当前位置
        const allElements = [...workstations, ...buffers];
        const currentElement = allElements.find(el => el.id === item.id);
        if (!currentElement || !currentElement.position) {
          return null;
        }
        
        // 获取拖动偏移量
        const initialOffset = monitor.getInitialSourceClientOffset();
        const currentOffset = monitor.getSourceClientOffset();
        
        if (!initialOffset || !currentOffset) {
          return null;
        }
        
        // 计算移动量
        const diff = {
          x: currentOffset.x - initialOffset.x,
          y: currentOffset.y - initialOffset.y,
        };
        
        // 计算原始新位置（不限制边界）
        const rawX = currentElement.position.x + diff.x;
        const rawY = currentElement.position.y + diff.y;
        
        // 获取其他元素进行对齐检测
        const otherElements = [
          ...workstations.filter(ws => ws.id !== item.id).map(ws => ({ ...ws, elementType: 'workstation' })),
          ...buffers.filter(buf => buf.id !== item.id).map(buf => ({ ...buf, elementType: 'buffer' }))
        ];
        
        // 应用对齐吸附
        const { snapX, snapY } = detectAlignmentAndSpacing(
          item.id,
          item.elementType,
          rawX,
          rawY,
          otherElements
        );
        
        // 最终位置（限制不能为负）
        const newPosition = {
          x: Math.max(0, snapX),
          y: Math.max(0, snapY),
        };
        
        // 清除对齐参考线
        setAlignmentGuides({ horizontal: null, vertical: null });
        
        return { newPosition, elementId: item.id, elementType: item.elementType };
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [workstations, buffers, onCreatePath, onAddWorkstation, onAddBuffer]);

  // 处理元素点击
  const handleElementClick = (element, event) => {
    if (event.ctrlKey || event.metaKey) {
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

  // 计算画布内容区域的实际尺寸
  const calculateContentSize = () => {
    let maxX = CANVAS_CONFIG.MIN_WIDTH;
    let maxY = CANVAS_CONFIG.MIN_HEIGHT;
    
    [...workstations, ...buffers].forEach(el => {
      if (el.position) {
        const { width, height } = workstations.some(ws => ws.id === el.id) 
          ? ELEMENT_SIZES.WORKSTATION 
          : ELEMENT_SIZES.BUFFER;
        maxX = Math.max(maxX, el.position.x + width + CANVAS_CONFIG.PADDING);
        maxY = Math.max(maxY, el.position.y + height + CANVAS_CONFIG.PADDING);
      }
    });

    return { width: maxX, height: maxY };
  };

  const contentSize = calculateContentSize();

  drop(canvasRef);

  return (
    <div
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        minWidth: `${Math.max(CANVAS_CONFIG.MIN_WIDTH, contentSize.width)}px`,
        height: `${contentSize.height}px`,
        minHeight: `${CANVAS_CONFIG.MIN_HEIGHT}px`,
        background: isOver ? '#f0f5ff' : '#fafafa',
        border: '2px dashed #d9d9d9',
        borderRadius: '4px',
      }}
    >
      {/* SVG层用于绘制连接线 */}
        <svg 
          style={{ 
            position: 'absolute', 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none',
            top: 0,
            left: 0,
          }}
        >
        {createArrowMarker()}
        <g style={{ pointerEvents: 'auto' }}>
            {transportPaths.map(path => renderPath(path, workstations, buffers, onSelectElement))}
        </g>
          {/* 对齐参考线 */}
          {alignmentGuides.horizontal !== null && (
            <line
              x1="0"
              y1={alignmentGuides.horizontal}
              x2={contentSize.width}
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
              y2={contentSize.height}
              stroke="#52c41a"
              strokeWidth="1"
              strokeDasharray="4 4"
              style={{ pointerEvents: 'none' }}
            />
          )}
      </svg>

      {/* 工作站和缓冲区 */}
      {workstations.map(ws => (
          <DraggableElement
            key={ws.id}
            element={ws}
            elementType="workstation"
            isSelected={selectedElement?.id === ws.id}
            isConnectSource={connectFrom?.id === ws.id}
            onSelectElement={handleElementClick}
            onUpdatePosition={onUpdatePosition}
            canvasRef={canvasRef}
            setDraggingElement={setDraggingElement}
            setAlignmentGuides={setAlignmentGuides}
            workstations={workstations}
            buffers={buffers}
          />
      ))}
      {buffers.map(buf => (
          <DraggableElement
            key={buf.id}
            element={buf}
            elementType="buffer"
            isSelected={selectedElement?.id === buf.id}
            isConnectSource={connectFrom?.id === buf.id}
            onSelectElement={handleElementClick}
            onUpdatePosition={onUpdatePosition}
            canvasRef={canvasRef}
            setDraggingElement={setDraggingElement}
            setAlignmentGuides={setAlignmentGuides}
            workstations={workstations}
            buffers={buffers}
          />
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
          <p style={{ fontSize: '12px', marginTop: 8 }}>选中元素后，拖拽连接点创建连接</p>
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
