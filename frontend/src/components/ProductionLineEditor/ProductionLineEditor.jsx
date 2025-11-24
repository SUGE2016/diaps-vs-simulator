/**
 * 产线布局编辑器 - 主组件
 */
import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, message, Button, Empty } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, DeleteOutlined, DoubleLeftOutlined, DoubleRightOutlined, SaveOutlined } from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CanvasArea from './CanvasArea';
import ElementToolbox from './ElementToolbox';
import PropertiesPanel from './PropertiesPanel';
import { workstationAPI, bufferAPI, transportPathAPI } from '../../services/api';

function ProductionLineEditor({ lineId }) {
  const [workstations, setWorkstations] = useState([]);
  const [buffers, setBuffers] = useState([]);
  const [transportPaths, setTransportPaths] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const workstationsRef = useRef([]);
  const buffersRef = useRef([]);
  const formRef = useRef(null);

  // 加载产线数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [wsData, bufData, pathData] = await Promise.all([
        workstationAPI.list(lineId),
        bufferAPI.list(lineId),
        transportPathAPI.list(lineId),
      ]);
      setWorkstations(wsData);
      setBuffers(bufData);
      setTransportPaths(pathData);
      // 更新ref以保持同步
      workstationsRef.current = wsData;
      buffersRef.current = bufData;
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lineId) {
      loadData();
    }
  }, [lineId]);

  // 添加工作站
  const handleAddWorkstation = async (type, position) => {
    try {
      // 根据类型生成对应的名称
      const typeLabels = {
        processing: '加工站',
        assembly: '装配站',
        inspection: '质检站',
        packaging: '包装站',
        storage: '存储站',
      };
      
      // 统计同类型工作站的数量
      const sameTypeCount = workstationsRef.current.filter(ws => ws.type === type).length;
      const typeLabel = typeLabels[type] || '工作站';
      const newName = `${typeLabel}${sameTypeCount + 1}`;
      
      const newWs = await workstationAPI.create({
        production_line_id: lineId,
        name: newName,
        type: type,
        capacity: 1,
        processing_time: { type: 'fixed', value: 10 },
        position: position,
      });
      
      // 使用函数式更新确保基于最新状态添加新元素
      setWorkstations(prev => {
        const updated = [...prev, newWs];
        workstationsRef.current = updated; // 同步更新ref
        return updated;
      });
      message.success('工作站添加成功');
    } catch (error) {
      message.error('添加失败');
    }
  };

  // 添加缓冲区
  const handleAddBuffer = async (position) => {
    try {
      // 使用ref获取最新的数量，避免闭包问题
      const currentCount = buffersRef.current.length;
      const newName = `缓冲区${currentCount + 1}`;
      
      const newBuf = await bufferAPI.create({
        production_line_id: lineId,
        name: newName,
        capacity: 50,
        position: position,
      });
      
      // 使用函数式更新确保基于最新状态添加新元素
      setBuffers(prev => {
        const updated = [...prev, newBuf];
        buffersRef.current = updated; // 同步更新ref
        return updated;
      });
      message.success('缓冲区添加成功');
    } catch (error) {
      message.error('添加失败');
    }
  };

  // 更新元素位置
  const handleUpdatePosition = async (id, type, newPosition) => {
    try {
      if (type === 'workstation') {
        await workstationAPI.update(id, { position: newPosition });
        setWorkstations(workstations.map(ws => 
          ws.id === id ? { ...ws, position: newPosition } : ws
        ));
      } else if (type === 'buffer') {
        await bufferAPI.update(id, { position: newPosition });
        setBuffers(buffers.map(buf => 
          buf.id === id ? { ...buf, position: newPosition } : buf
        ));
      }
    } catch (error) {
      message.error('更新位置失败');
    }
  };

  // 删除元素
  const handleDeleteElement = async () => {
    if (!selectedElement) return;
    
    try {
      const elementType = selectedElement.elementType || selectedElement.type;
      if (elementType === 'workstation') {
        await workstationAPI.delete(selectedElement.id);
        setWorkstations(workstations.filter(ws => ws.id !== selectedElement.id));
      } else if (elementType === 'buffer') {
        await bufferAPI.delete(selectedElement.id);
        setBuffers(buffers.filter(buf => buf.id !== selectedElement.id));
      } else if (elementType === 'path') {
        await transportPathAPI.delete(selectedElement.id);
        setTransportPaths(transportPaths.filter(p => p.id !== selectedElement.id));
      }
      setSelectedElement(null);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 更新元素属性
  const handleUpdateElement = async (values) => {
    if (!selectedElement) return;
    
    try {
      // 排除type字段，不允许修改
      const { type, ...updateValues } = values;
      
      const elementType = selectedElement.elementType || selectedElement.type;
      if (elementType === 'workstation') {
        await workstationAPI.update(selectedElement.id, updateValues);
        setWorkstations(workstations.map(ws => 
          ws.id === selectedElement.id ? { ...ws, ...updateValues } : ws
        ));
        setSelectedElement({ ...selectedElement, ...updateValues });
      } else if (elementType === 'buffer') {
        await bufferAPI.update(selectedElement.id, updateValues);
        setBuffers(buffers.map(buf => 
          buf.id === selectedElement.id ? { ...buf, ...updateValues } : buf
        ));
        setSelectedElement({ ...selectedElement, ...updateValues });
      }
      message.success('更新成功');
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 创建运输路径
  const handleCreatePath = async (fromId, toId) => {
    try {
      const newPath = await transportPathAPI.create({
        production_line_id: lineId,
        from_location: fromId,
        to_location: toId,
        transport_time: 1,
      });
      setTransportPaths([...transportPaths, newPath]);
      message.success('运输路径创建成功');
    } catch (error) {
      message.error('创建运输路径失败');
    }
  };

  // 计算中间画布的span
  const getCanvasSpan = () => {
    let span = 24;
    if (!leftCollapsed) span -= 6;
    if (!rightCollapsed) span -= 6;
    return span;
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Row gutter={12}>
        {/* 左侧：工具箱 */}
        {!leftCollapsed && (
          <Col span={6}>
            <Card 
              title="组件工具箱" 
              size="small"
              bodyStyle={{ padding: '12px' }}
              extra={
                <Button
                  type="default"
                  size="small"
                  icon={<DoubleLeftOutlined />}
                  onClick={() => setLeftCollapsed(true)}
                  title="收起工具箱"
                >
                </Button>
              }
            >
              <ElementToolbox />
            </Card>
          </Col>
        )}

        {/* 中间：画布 */}
        <Col span={getCanvasSpan()}>
          <div style={{ position: 'relative' }}>
            {/* 左侧展开按钮 - 当左侧边栏收起时显示 */}
            {leftCollapsed && (
              <Button
                type="primary"
                size="small"
                icon={<DoubleRightOutlined />}
                onClick={() => setLeftCollapsed(false)}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                }}
                title="展开工具箱"
              >
              </Button>
            )}
            
            {/* 右侧展开按钮 - 当右侧边栏收起时显示 */}
            {rightCollapsed && (
              <Button
                type="primary"
                size="small"
                icon={<DoubleLeftOutlined />}
                onClick={() => setRightCollapsed(false)}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1000,
                  borderRadius: '4px 0 0 4px',
                  boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
                }}
                title="展开属性面板"
              >
              </Button>
            )}
            
            <Card 
              title="产线布局" 
              size="small" 
              loading={loading} 
              bodyStyle={{ padding: '12px' }}
            >
              <CanvasArea
                workstations={workstations}
                buffers={buffers}
                transportPaths={transportPaths}
                selectedElement={selectedElement}
                onSelectElement={setSelectedElement}
                onAddWorkstation={handleAddWorkstation}
                onAddBuffer={handleAddBuffer}
                onUpdatePosition={handleUpdatePosition}
                onCreatePath={handleCreatePath}
              />
            </Card>
          </div>
        </Col>

        {/* 右侧：属性面板 */}
        {!rightCollapsed && (
          <Col span={6}>
            <Card 
              title={selectedElement ? `${(selectedElement.elementType || selectedElement.type) === 'workstation' ? '工作站' : (selectedElement.elementType || selectedElement.type) === 'buffer' ? '缓冲区' : '运输路径'}属性` : '属性面板'}
              size="small"
              bodyStyle={{ padding: '12px' }}
              extra={
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {selectedElement && (
                    <>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={() => {
                          if (formRef.current) {
                            formRef.current.submit();
                          }
                        }}
                        title="保存"
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteElement}
                        title="删除"
                      />
                    </>
                  )}
                  <Button
                    type="default"
                    size="small"
                    icon={<DoubleRightOutlined />}
                    onClick={() => setRightCollapsed(true)}
                    title="收起属性面板"
                  >
                  </Button>
                </div>
              }
            >
              {selectedElement ? (
                <PropertiesPanel
                  element={selectedElement}
                  onUpdate={handleUpdateElement}
                  formRef={formRef}
                />
              ) : (
                <Empty description="请选择一个元素" />
              )}
            </Card>
          </Col>
        )}
      </Row>
    </DndProvider>
  );
}

export default ProductionLineEditor;

