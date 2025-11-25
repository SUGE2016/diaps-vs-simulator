/**
 * 路径渲染工具函数
 */
import { ELEMENT_SIZES, ARROW_OFFSET, LINE_CLICK_AREA_WIDTH } from './constants';
import { LINE_STYLES, ARROW_MARKER } from '../shared/canvasUtils';

/**
 * 计算路径的起点和终点坐标
 */
export const calculatePathPoints = (fromElement, toElement, workstations) => {
  const isFromWorkstation = workstations.some(ws => ws.id === fromElement.id);
  const isToWorkstation = workstations.some(ws => ws.id === toElement.id);
  
  const fromSize = isFromWorkstation ? ELEMENT_SIZES.WORKSTATION : ELEMENT_SIZES.BUFFER;
  const toSize = isToWorkstation ? ELEMENT_SIZES.WORKSTATION : ELEMENT_SIZES.BUFFER;

  // 计算中心点
  const fromCenterX = fromElement.position.x + fromSize.width / 2;
  const fromCenterY = fromElement.position.y + fromSize.height / 2;
  const toCenterX = toElement.position.x + toSize.width / 2;
  const toCenterY = toElement.position.y + toSize.height / 2;

  // 计算方向向量
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return null;

  // 归一化方向向量
  const nx = dx / distance;
  const ny = dy / distance;

  // 计算起点（源元素边缘）
  const fromHalfW = fromSize.width / 2;
  const fromHalfH = fromSize.height / 2;
  const fromScale = Math.min(
    Math.abs(fromHalfW / (nx || 0.001)),
    Math.abs(fromHalfH / (ny || 0.001))
  );
  const fromX = fromCenterX + fromScale * nx;
  const fromY = fromCenterY + fromScale * ny;

  // 计算终点（目标元素边缘，留出箭头空间）
  const toHalfW = toSize.width / 2;
  const toHalfH = toSize.height / 2;
  const toScale = Math.min(
    Math.abs(toHalfW / (nx || 0.001)),
    Math.abs(toHalfH / (ny || 0.001))
  );
  const toX = toCenterX - toScale * nx - ARROW_OFFSET * nx;
  const toY = toCenterY - toScale * ny - ARROW_OFFSET * ny;

  return { fromX, fromY, toX, toY };
};

/**
 * 渲染路径组件
 */
export const renderPath = (path, workstations, buffers, onSelectElement) => {
  const fromElement = [...workstations, ...buffers].find(e => e.id === path.from_location);
  const toElement = [...workstations, ...buffers].find(e => e.id === path.to_location);
  
  if (!fromElement || !toElement || !fromElement.position || !toElement.position) {
    return null;
  }

  const points = calculatePathPoints(fromElement, toElement, workstations);
  if (!points) return null;

  const { fromX, fromY, toX, toY } = points;

  return (
    <g key={path.id}>
      {/* 可见的连线 */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={LINE_STYLES.COLOR}
        strokeWidth={LINE_STYLES.WIDTH}
        markerEnd={`url(#${ARROW_MARKER.id})`}
        style={{ cursor: 'pointer', pointerEvents: 'none' }}
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
        onClick={() => onSelectElement({ ...path, elementType: 'path' })}
      />
    </g>
  );
};

