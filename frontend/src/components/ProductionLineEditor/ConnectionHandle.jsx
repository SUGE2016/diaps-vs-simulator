/**
 * 连接点组件
 */
import { useDrag } from 'react-dnd';
import { CONNECTION_HANDLE_SIZE } from './constants';
import { CONNECTION_HANDLE_STYLES } from '../shared/canvasUtils';

export const ConnectionHandle = ({ element, position }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CONNECTION_HANDLE',
    item: { 
      sourceId: element.id, 
      sourceElement: element,
      handlePosition: position 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

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

