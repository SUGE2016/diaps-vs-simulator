/**
 * Routine编辑器 - 流转路径配置
 */
import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Modal, 
  Form, 
  Input, 
  message,
  Space,
  Popconfirm,
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { routineAPI, workstationAPI, bufferAPI } from '../../services/api';
import RoutineStepEditor from './RoutineStepEditor';

const { TextArea } = Input;

function RoutineEditor({ lineId }) {
  const [routines, setRoutines] = useState([]);
  const [workstations, setWorkstations] = useState([]);
  const [buffers, setBuffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [form] = Form.useForm();

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

  // 创建/更新Routine
  const handleSubmit = async (values) => {
    try {
      if (editingRoutine) {
        await routineAPI.update(editingRoutine.id, values);
        message.success('Routine更新成功');
      } else {
        const newRoutine = await routineAPI.create({
          ...values,
          production_line_id: lineId,
          steps: [],
        });
        message.success('Routine创建成功');
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
      message.success('Routine删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 打开编辑对话框
  const handleEdit = (routine) => {
    setEditingRoutine(routine);
    form.setFieldsValue(routine);
    setModalVisible(true);
  };

  // 打开步骤编辑器
  const handleEditSteps = (routine) => {
    setEditingRoutine(routine);
    setStepModalVisible(true);
  };

  // 打开新建对话框
  const handleCreate = () => {
    setEditingRoutine(null);
    form.resetFields();
    setModalVisible(true);
  };

  return (
    <div>
      <Card
        title="流转路径列表"
        bodyStyle={{ padding: '12px' }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建Routine
          </Button>
        }
      >
        <List
          loading={loading}
          dataSource={routines}
          renderItem={(routine) => (
            <List.Item
              actions={[
                <Button key="steps" type="link" onClick={() => handleEditSteps(routine)}>
                  编辑步骤 ({routine.steps?.length || 0})
                </Button>,
                <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => handleEdit(routine)}>
                  编辑信息
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确认删除该Routine吗？"
                  onConfirm={() => handleDelete(routine.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {routine.name}
                    <Tag color="blue">{routine.material_type}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>{routine.description || '暂无描述'}</div>
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                      {routine.start_location} → {routine.end_location}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      {/* 创建/编辑Routine基本信息对话框 */}
      <Modal
        title={editingRoutine ? '编辑Routine' : '新建Routine'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRoutine(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" size="small" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Routine名称"
            rules={[{ required: true, message: '请输入Routine名称' }]}
          >
            <Input placeholder="如：标准产品流程" />
          </Form.Item>

          <Form.Item
            name="material_type"
            label="物料类型"
            rules={[{ required: true, message: '请输入物料类型' }]}
          >
            <Input placeholder="如：raw_material, product_a" />
          </Form.Item>

          <Form.Item
            name="start_location"
            label="起始位置"
            rules={[{ required: true, message: '请输入起始位置' }]}
          >
            <Input placeholder="输入工作站或缓冲区ID" />
          </Form.Item>

          <Form.Item
            name="end_location"
            label="结束位置"
            rules={[{ required: true, message: '请输入结束位置' }]}
          >
            <Input placeholder="输入工作站或缓冲区ID" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 步骤编辑器对话框 */}
      {stepModalVisible && editingRoutine && (
        <RoutineStepEditor
          visible={stepModalVisible}
          routine={editingRoutine}
          workstations={workstations}
          onClose={() => {
            setStepModalVisible(false);
            setEditingRoutine(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

export default RoutineEditor;

