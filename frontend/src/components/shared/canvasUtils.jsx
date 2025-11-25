/**
 * 共享的画布工具函数和常量
 */
import React from 'react';

// 连线样式常量
export const LINE_STYLES = {
  COLOR: '#1890ff',
  WIDTH: 2,
  CLICK_AREA_WIDTH: 20,
  DASHED_PATTERN: '5,5',
};

// 箭头标记配置
export const ARROW_MARKER = {
  id: 'arrowhead',
  width: 10,
  height: 10,
  refX: 8,
  refY: 4,
};

// 箭头偏移量（连线终点与元素边缘的距离，为箭头留出空间）
export const ARROW_OFFSET = 6;

// 连接点样式
export const CONNECTION_HANDLE_STYLES = {
  SIZE: 12,
  COLOR: '#1890ff',
  COLOR_DRAGGING: '#52c41a',
  BORDER: '2px solid #fff',
};

// 元素节点样式
export const ELEMENT_STYLES = {
  SELECTED_BG: '#e6f7ff',
  SELECTED_BORDER: '#1890ff',
  DEFAULT_BG: '#fff',
  DEFAULT_BORDER: '#d9d9d9',
  CONNECT_SOURCE_BG: '#52c41a',
  CONNECT_SOURCE_BORDER: '#52c41a',
  BORDER_WIDTH: 2,
  BORDER_RADIUS: '4px',
  SHADOW_SELECTED: '0 0 8px rgba(24,144,255,0.5)',
  SHADOW_DEFAULT: '0 2px 8px rgba(0,0,0,0.1)',
};

// 步骤节点尺寸（与工作站一致）
export const STEP_SIZE = { width: 100, height: 60 };

/**
 * 创建箭头标记定义
 */
export const createArrowMarker = () => (
  <defs>
    <marker
      id={ARROW_MARKER.id}
      markerWidth={ARROW_MARKER.width}
      markerHeight={ARROW_MARKER.height}
      refX={ARROW_MARKER.refX}
      refY={ARROW_MARKER.refY}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d="M 0 0 L 8 4 L 0 8 z" fill={LINE_STYLES.COLOR} />
    </marker>
  </defs>
);

/**
 * 计算两点之间的连线路径（简单直线，从右边中点到左边中点）
 */
export const calculateSimpleLine = (fromPos, toPos, fromSize, toSize) => {
  const fromX = fromPos.x + fromSize.width;
  const fromY = fromPos.y + fromSize.height / 2;
  const toX = toPos.x;
  const toY = toPos.y + toSize.height / 2;
  
  return { fromX, fromY, toX, toY };
};

/**
 * 计算自适应路径（从元素边缘到元素边缘，留出箭头空间）
 * 与产线布局中的 calculatePathPoints 逻辑一致
 */
export const calculateAdaptivePath = (fromElement, toElement, fromSize, toSize) => {
  if (!fromElement.position || !toElement.position) return null;

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
 * 渲染连线（带点击区域）
 */
export const renderLine = (fromX, fromY, toX, toY, onClick, key) => {
  return (
    <g key={key} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      {/* 可见的连线 */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={LINE_STYLES.COLOR}
        strokeWidth={LINE_STYLES.WIDTH}
        markerEnd={`url(#${ARROW_MARKER.id})`}
        style={{ pointerEvents: 'none' }}
      />
      {/* 不可见的宽点击区域 */}
      {onClick && (
        <line
          x1={fromX}
          y1={fromY}
          x2={toX}
          y2={toY}
          stroke="transparent"
          strokeWidth={LINE_STYLES.CLICK_AREA_WIDTH}
          style={{ cursor: 'pointer' }}
          onClick={onClick}
        />
      )}
    </g>
  );
};

/**
 * 渲染虚线连线（用于正在创建的连接）
 */
export const renderDashedLine = (fromX, fromY, toX, toY) => {
  return (
    <line
      x1={fromX}
      y1={fromY}
      x2={toX}
      y2={toY}
      stroke={LINE_STYLES.COLOR}
      strokeWidth={LINE_STYLES.WIDTH}
      strokeDasharray={LINE_STYLES.DASHED_PATTERN}
      style={{ pointerEvents: 'none' }}
    />
  );
};

