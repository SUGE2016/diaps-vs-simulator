/**
 * 可拖动的元素组件（工作站和缓冲区）
 */
import { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { ConnectionHandle } from './ConnectionHandle';
import { ELEMENT_SIZES } from './constants';
// import { detectAlignmentAndSpacing } from './alignmentUtils'; // 暂时禁用对齐功能

export const DraggableElement = ({ 
  element, 
  elementType, 
  isSelected, 
  isConnectSource, 
  onSelectElement, 
  onUpdatePosition,
  canvasRef,
  setDraggingElement,
  setAlignmentGuides,
  workstations,
  buffers,
}) => {
  const { width, height } = elementType === 'workstation' 
    ? ELEMENT_SIZES.WORKSTATION 
    : ELEMENT_SIZES.BUFFER;
  
  // 使用 ref 存储最新的位置和回调，避免闭包问题
  const elementRef = useRef(element);
  const onUpdatePositionRef = useRef(onUpdatePosition);
  
  // 同步更新 refs
  useEffect(() => {
    elementRef.current = element;
    onUpdatePositionRef.current = onUpdatePosition;
  }, [element, onUpdatePosition]);
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CANVAS_ELEMENT',
    item: { 
      id: element.id, 
      elementType,
    },
    end: (item, monitor) => {
      setDraggingElement(null);
      setAlignmentGuides({ horizontal: null, vertical: null });
      
      // 检查是否成功放下
      if (!monitor.didDrop()) {
        return;
      }
      
      // 从 drop 回调获取计算好的新位置
      const dropResult = monitor.getDropResult();
      
      if (!dropResult || !dropResult.newPosition) {
        return;
      }
      
      const currentElement = elementRef.current;
      onUpdatePositionRef.current(currentElement.id, elementType, dropResult.newPosition);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [element.id, elementType, setDraggingElement, setAlignmentGuides]);

  // 监听拖动状态
  useEffect(() => {
    if (isDragging) {
      setDraggingElement({ id: element.id, type: elementType });
    }
  }, [isDragging, element.id, elementType, setDraggingElement]);

  const handleClick = (e) => {
    if (!isDragging) {
      onSelectElement({ ...element, elementType }, e);
    }
  };

  return (
    <div
      ref={drag}
      key={element.id}
      style={{
        position: 'absolute',
        left: element.position?.x || (elementType === 'workstation' ? 100 : 100),
        top: element.position?.y || (elementType === 'workstation' ? 100 : 200),
        width,
        height,
        background: isConnectSource ? '#52c41a' : isSelected ? '#1890ff' : (elementType === 'workstation' ? '#fff' : '#fafafa'),
        border: `2px solid ${isConnectSource ? '#52c41a' : isSelected ? '#1890ff' : '#d9d9d9'}`,
        borderStyle: elementType === 'buffer' ? 'dashed' : 'solid',
        borderRadius: '4px',
        padding: '8px',
        cursor: 'move',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: elementType === 'workstation' ? '12px' : '11px',
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : isSelected ? 100 : 1,
      }}
      onClick={handleClick}
    >
      <div style={{ fontWeight: 'bold', marginBottom: elementType === 'workstation' ? 4 : 0 }}>
        {element.name}
      </div>
      <div style={{ fontSize: '10px', color: '#666' }}>
        {elementType === 'workstation' ? element.type : element.capacity}
      </div>
      
      {/* 选中时显示连接点 */}
      {isSelected && (
        <>
          <ConnectionHandle element={element} position="left" />
          <ConnectionHandle element={element} position="right" />
        </>
      )}
    </div>
  );
};

