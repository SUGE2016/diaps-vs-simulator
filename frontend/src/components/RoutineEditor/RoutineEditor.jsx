/**
 * 工艺路线编辑器 - 图形化配置工艺流程
 */
import { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Modal, 
  Form, 
  Input, 
  Select,
  message,
  Space,
  Popconfirm,
  Tag,
  Empty
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DoubleRightOutlined, DoubleLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { routineAPI, workstationAPI, bufferAPI, materialTypeAPI } from '../../services/api';
import RoutineCanvas from './RoutineCanvas';
import StepPropertiesPanel from './StepPropertiesPanel';

const { TextArea } = Input;
const { Option } = Select;

function RoutineEditor({ lineId }) {
  const [routines, setRoutines] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [buffers, setBuffers] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedLink, setSelectedLink] = useState(null);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [operationTypes, setOperationTypes] = useState([]);
  const [form] = Form.useForm();
  const stepFormRef = useRef(null);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [routineData, wsData, bufData] = await Promise.all([
        routineAPI.list(lineId),
        workstationAPI.list(lineId),
        bufferAPI.list(lineId),
      ]);
      setRoutines(routineData);
      setWorkstations(wsData);
      setBuffers(bufData);
      
      // 如果有选中的路线，更新它的数据
      if (selectedRoutine) {
        const updated = routineData.find(r => r.id === selectedRoutine.id);
        if (updated) {
          setSelectedRoutine(updated);
        }
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载物料类型
  useEffect(() => {
    const loadMaterialTypes = async () => {
      try {
        const data = await materialTypeAPI.list();
        setMaterialTypes(data);
      } catch (error) {
        console.error('加载物料类型失败', error);
      }
    };
    loadMaterialTypes();
  }, []);

  useEffect(() => {
    if (lineId) {
      loadData();
    }
  }, [lineId]);

  // 创建/更新Routine
  const handleSubmit = async (values) => {
    try {
      if (editingRoutine) {
        await routineAPI.update(editingRoutine.id, values);
        message.success('工艺路线更新成功');
      } else {
        const newRoutine = await routineAPI.create({
          ...values,
          production_line_id: lineId,
          steps: [],
        });
        message.success('工艺路线创建成功');
        setSelectedRoutine(newRoutine);
      }
      setModalVisible(false);
      form.resetFields();
      setEditingRoutine(null);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除Routine
  const handleDelete = async (id) => {
    try {
      await routineAPI.delete(id);
      message.success('工艺路线删除成功');
      if (selectedRoutine?.id === id) {
        setSelectedRoutine(null);
      }
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 打开编辑对话框
  const handleEdit = (routine, e) => {
    e?.stopPropagation();
    setEditingRoutine(routine);
    form.setFieldsValue(routine);
    setModalVisible(true);
  };

  // 打开新建对话框
  const handleCreate = () => {
    setEditingRoutine(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 选择路线
  const handleSelectRoutine = (routine) => {
    setSelectedRoutine(routine);
    setSelectedStep(null); // 切换路线时清除选中的步骤
    setSelectedLink(null); // 切换路线时清除选中的连线
  };

  // 选择步骤
  const handleSelectStep = (step) => {
    setSelectedStep(step);
    if (step) {
      setSelectedLink(null); // 选中步骤时清除连线选中
    }
  };

  // 选择连线
  const handleSelectLink = (link) => {
    setSelectedLink(link);
    if (link) {
      setSelectedStep(null); // 选中连线时清除步骤选中
    }
  };

  // 更新步骤
  const handleUpdateStep = async (stepId, values) => {
    if (!selectedRoutine) return;
    try {
      await routineAPI.updateStep(selectedRoutine.id, stepId, values);
      message.success('步骤更新成功');
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 删除步骤
  const handleDeleteStep = async () => {
    if (!selectedStep || !selectedRoutine) return;
    try {
      await routineAPI.deleteStep(selectedRoutine.id, selectedStep.id);
      setSelectedStep(null);
      message.success('步骤已删除');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 删除连线
  const handleDeleteLink = async () => {
    if (!selectedLink || !selectedRoutine) return;
    try {
      await routineAPI.deleteLink(selectedRoutine.id, selectedLink.id);
      setSelectedLink(null);
      message.success('连线已删除');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', gap: '12px', height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        {/* 左侧：工艺路线列表 */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          <Card
            title="工艺路线列表"
            size="small"
            styles={{ body: { padding: '8px', maxHeight: 'calc(100vh - 280px)', overflow: 'auto' } }}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleCreate}>
                新建
              </Button>
            }
          >
            {routines.length === 0 ? (
              <Empty description="暂无工艺路线" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                loading={loading}
                dataSource={routines}
                size="small"
                renderItem={(routine) => (
                  <List.Item
                    style={{
                      padding: '8px',
                      marginBottom: '4px',
                      background: selectedRoutine?.id === routine.id ? '#e6f7ff' : '#fafafa',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: selectedRoutine?.id === routine.id ? '1px solid #1890ff' : '1px solid transparent',
                      position: 'relative',
                    }}
                    onClick={() => handleSelectRoutine(routine)}
                  >
                    <div style={{ width: '100%', paddingRight: '40px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space size={4}>
                          <span style={{ fontWeight: 500 }}>{routine.name}</span>
                          <Tag color="blue" style={{ fontSize: '10px' }}>{routine.material_type}</Tag>
                        </Space>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                        {routine.steps?.length || 0} 个步骤 · {routine.step_links?.length || 0} 个连接
                      </div>
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      top: '8px', 
                      right: '8px', 
                      display: 'flex', 
                      gap: '4px',
                      zIndex: 10
                    }}>
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<EditOutlined />}
                        style={{ 
                          padding: '2px 4px',
                          height: '20px',
                          width: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={(e) => handleEdit(routine, e)}
                      />
                      <Popconfirm
                        title="确认删除该工艺路线吗？"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          handleDelete(routine.id);
                        }}
                        okText="确认"
                        cancelText="取消"
                      >
                        <Button 
                          type="text" 
                          size="small" 
                          danger
                          icon={<DeleteOutlined />}
                          style={{ 
                            padding: '2px 4px',
                            height: '20px',
                            width: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>

        {/* 中间：图形化画布 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
              />
            )}
            
            <Card
              title={selectedRoutine ? `工艺流程：${selectedRoutine.name}` : '工艺流程画布'}
              size="small"
              loading={loading}
              styles={{ body: { padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' } }}
            >
            <RoutineCanvas
              routine={selectedRoutine}
              workstations={workstations}
              selectedStep={selectedStep}
              onSelectStep={handleSelectStep}
              selectedLink={selectedLink}
              onSelectLink={handleSelectLink}
              onRoutineUpdate={loadData}
              onOperationTypesChange={setOperationTypes}
            />
            </Card>
          </div>
        </div>

        {/* 右侧：属性面板 */}
        {!rightCollapsed && (
          <div style={{ width: '320px', flexShrink: 0 }}>
            <Card 
              title={selectedStep ? '步骤属性' : selectedLink ? '连线属性' : '属性面板'}
              size="small"
              styles={{ body: { padding: '12px' } }}
              extra={
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {selectedStep && (
                    <>
                      <Button
                        type="primary"
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={() => {
                          if (stepFormRef.current) {
                            stepFormRef.current.submit();
                          }
                        }}
                        title="保存"
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={handleDeleteStep}
                        title="删除"
                      />
                    </>
                  )}
                  {selectedLink && (
                    <Popconfirm
                      title="确认删除该连线吗？"
                      onConfirm={handleDeleteLink}
                      okText="确认"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        title="删除连线"
                      />
                    </Popconfirm>
                  )}
                  <Button
                    type="default"
                    size="small"
                    icon={<DoubleRightOutlined />}
                    onClick={() => setRightCollapsed(true)}
                    title="收起属性面板"
                  />
                </div>
              }
            >
              {selectedStep && selectedRoutine ? (
                <StepPropertiesPanel
                  step={selectedStep}
                  workstations={workstations}
                  operationTypes={operationTypes}
                  onUpdate={handleUpdateStep}
                  formRef={stepFormRef}
                />
              ) : selectedLink && selectedRoutine ? (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>起始步骤：</span>
                    <span style={{ fontWeight: 500 }}>
                      {selectedRoutine.steps?.find(s => s.id === selectedLink.from_step_id)?.operation || '未知'}
                    </span>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>目标步骤：</span>
                    <span style={{ fontWeight: 500 }}>
                      {selectedRoutine.steps?.find(s => s.id === selectedLink.to_step_id)?.operation || '未知'}
                    </span>
                  </div>
                  <div style={{ color: '#999', fontSize: '12px', marginTop: 16 }}>
                    点击右上角删除按钮可删除此连线
                  </div>
                </div>
              ) : (
                <Empty description="请选择一个步骤或连线" />
              )}
            </Card>
          </div>
        )}
      </div>

      {/* 创建/编辑工艺路线基本信息对话框 */}
      <Modal
        title={editingRoutine ? '编辑工艺路线' : '新建工艺路线'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRoutine(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" size="small" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="工艺路线名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="如：产品A标准工艺" />
          </Form.Item>

          <Form.Item
            name="material_type"
            label="物料类型"
            rules={[{ required: true, message: '请选择物料类型' }]}
          >
            <Select placeholder="请选择物料类型">
              {materialTypes.map(type => (
                <Option key={type.id} value={type.name}>
                  {type.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </DndProvider>
  );
}

export default RoutineEditor;
