/**
 * 对齐和间距检测工具函数
 */
import { ELEMENT_SIZES, ALIGNMENT_CONFIG } from './constants';
import { STEP_SIZE } from '../shared/canvasUtils';

/**
 * 获取元素尺寸
 */
export const getElementSize = (elementType) => {
  if (elementType === 'workstation') return ELEMENT_SIZES.WORKSTATION;
  if (elementType === 'buffer') return ELEMENT_SIZES.BUFFER;
  if (elementType === 'step') return STEP_SIZE;
  return ELEMENT_SIZES.WORKSTATION;
};

/**
 * 获取元素边界信息
 */
export const getElementBounds = (element, elementType) => {
  const { width, height } = getElementSize(elementType);
  
  return {
    x: element.position?.x || 0,
    y: element.position?.y || 0,
    width,
    height,
    centerX: (element.position?.x || 0) + width / 2,
    centerY: (element.position?.y || 0) + height / 2,
    right: (element.position?.x || 0) + width,
    bottom: (element.position?.y || 0) + height,
  };
};

/**
 * 检测对齐和间距
 */
export const detectAlignmentAndSpacing = (draggingId, draggingType, newX, newY, allElements) => {
  const { width: draggingWidth, height: draggingHeight } = getElementSize(draggingType);
  
  const draggingCenterX = newX + draggingWidth / 2;
  const draggingCenterY = newY + draggingHeight / 2;
  const draggingRight = newX + draggingWidth;
  const draggingBottom = newY + draggingHeight;

  let snapX = newX;
  let snapY = newY;
  let alignmentGuide = { horizontal: null, vertical: null };

  const { SNAP_THRESHOLD, ALIGNMENT_GUIDE_THRESHOLD } = ALIGNMENT_CONFIG;

  // 记录最近的对齐距离
  let minDistX = SNAP_THRESHOLD;
  let minDistY = SNAP_THRESHOLD;
  let guideDistX = ALIGNMENT_GUIDE_THRESHOLD;
  let guideDistY = ALIGNMENT_GUIDE_THRESHOLD;

  // 检测对齐 - 选择最近的对齐点
  for (const el of allElements) {
    if (!el.position) continue;
    const bounds = getElementBounds(el, el.elementType);

    // === 垂直对齐检测（影响 X 坐标）===
    
    // 左边对齐左边
    const distLeftLeft = Math.abs(newX - bounds.x);
    if (distLeftLeft < minDistX) {
      minDistX = distLeftLeft;
      snapX = bounds.x;
      alignmentGuide.vertical = bounds.x;
    } else if (distLeftLeft < guideDistX) {
      guideDistX = distLeftLeft;
      if (!alignmentGuide.vertical) alignmentGuide.vertical = bounds.x;
    }
    
    // 中心对齐中心
    const distCenterCenter = Math.abs(draggingCenterX - bounds.centerX);
    if (distCenterCenter < minDistX) {
      minDistX = distCenterCenter;
      snapX = bounds.centerX - draggingWidth / 2;
      alignmentGuide.vertical = bounds.centerX;
    } else if (distCenterCenter < guideDistX) {
      guideDistX = distCenterCenter;
      if (!alignmentGuide.vertical) alignmentGuide.vertical = bounds.centerX;
    }
    
    // 右边对齐右边
    const distRightRight = Math.abs(draggingRight - bounds.right);
    if (distRightRight < minDistX) {
      minDistX = distRightRight;
      snapX = bounds.right - draggingWidth;
      alignmentGuide.vertical = bounds.right;
    } else if (distRightRight < guideDistX) {
      guideDistX = distRightRight;
      if (!alignmentGuide.vertical) alignmentGuide.vertical = bounds.right;
    }
    
    // 左边对齐右边
    const distLeftRight = Math.abs(newX - bounds.right);
    if (distLeftRight < minDistX) {
      minDistX = distLeftRight;
      snapX = bounds.right;
      alignmentGuide.vertical = bounds.right;
    } else if (distLeftRight < guideDistX) {
      guideDistX = distLeftRight;
      if (!alignmentGuide.vertical) alignmentGuide.vertical = bounds.right;
    }
    
    // 右边对齐左边
    const distRightLeft = Math.abs(draggingRight - bounds.x);
    if (distRightLeft < minDistX) {
      minDistX = distRightLeft;
      snapX = bounds.x - draggingWidth;
      alignmentGuide.vertical = bounds.x;
    } else if (distRightLeft < guideDistX) {
      guideDistX = distRightLeft;
      if (!alignmentGuide.vertical) alignmentGuide.vertical = bounds.x;
    }

    // === 水平对齐检测（影响 Y 坐标）===
    
    // 上边对齐上边
    const distTopTop = Math.abs(newY - bounds.y);
    if (distTopTop < minDistY) {
      minDistY = distTopTop;
      snapY = bounds.y;
      alignmentGuide.horizontal = bounds.y;
    } else if (distTopTop < guideDistY) {
      guideDistY = distTopTop;
      if (!alignmentGuide.horizontal) alignmentGuide.horizontal = bounds.y;
    }
    
    // 中心对齐中心
    const distCenterCenterY = Math.abs(draggingCenterY - bounds.centerY);
    if (distCenterCenterY < minDistY) {
      minDistY = distCenterCenterY;
      snapY = bounds.centerY - draggingHeight / 2;
      alignmentGuide.horizontal = bounds.centerY;
    } else if (distCenterCenterY < guideDistY) {
      guideDistY = distCenterCenterY;
      if (!alignmentGuide.horizontal) alignmentGuide.horizontal = bounds.centerY;
    }
    
    // 下边对齐下边
    const distBottomBottom = Math.abs(draggingBottom - bounds.bottom);
    if (distBottomBottom < minDistY) {
      minDistY = distBottomBottom;
      snapY = bounds.bottom - draggingHeight;
      alignmentGuide.horizontal = bounds.bottom;
    } else if (distBottomBottom < guideDistY) {
      guideDistY = distBottomBottom;
      if (!alignmentGuide.horizontal) alignmentGuide.horizontal = bounds.bottom;
    }
    
    // 上边对齐下边
    const distTopBottom = Math.abs(newY - bounds.bottom);
    if (distTopBottom < minDistY) {
      minDistY = distTopBottom;
      snapY = bounds.bottom;
      alignmentGuide.horizontal = bounds.bottom;
    } else if (distTopBottom < guideDistY) {
      guideDistY = distTopBottom;
      if (!alignmentGuide.horizontal) alignmentGuide.horizontal = bounds.bottom;
    }
    
    // 下边对齐上边
    const distBottomTop = Math.abs(draggingBottom - bounds.y);
    if (distBottomTop < minDistY) {
      minDistY = distBottomTop;
      snapY = bounds.y - draggingHeight;
      alignmentGuide.horizontal = bounds.y;
    } else if (distBottomTop < guideDistY) {
      guideDistY = distBottomTop;
      if (!alignmentGuide.horizontal) alignmentGuide.horizontal = bounds.y;
    }
  }

  return { snapX, snapY, alignmentGuide };
};
