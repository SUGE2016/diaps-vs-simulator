/**
 * Routine步骤编辑器
 */
import { useState, useEffect } from 'react';
import { 
  Modal, 
  Table, 
  Button, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Switch, 
  message,
  Space,
  Popconfirm 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { routineAPI } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

function RoutineStepEditor({ visible, routine, workstations, onClose }) {
  const [steps, setSteps] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (routine) {
      setSteps(routine.steps || []);
    }
  }, [routine]);

  // 保存所有步骤
  const handleSave = async () => {
    try {
      // 重新排序step_id
      const reorderedSteps = steps.map((step, index) => ({
        ...step,
        step_id: index + 1,
      }));

      await routineAPI.update(routine.id, { steps: reorderedSteps });
      message.success('步骤保存成功');
      onClose();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 添加/更新步骤
  const handleStepSubmit = (values) => {
    if (editingStep !== null) {
      // 更新步骤
      const newSteps = [...steps];
      newSteps[editingStep] = {
        ...newSteps[editingStep],
        ...values,
      };
      setSteps(newSteps);
      message.success('步骤更新成功');
    } else {
      // 添加新步骤
      setSteps([
        ...steps,
        {
          ...values,
          step_id: steps.length + 1,
        },
      ]);
      message.success('步骤添加成功');
    }
    setEditModalVisible(false);
    setEditingStep(null);
    form.resetFields();
  };

  // 删除步骤
  const handleDeleteStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
    message.success('步骤删除成功');
  };

  // 移动步骤
  const handleMoveStep = (index, direction) => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  // 打开编辑对话框
  const handleEdit = (step, index) => {
    setEditingStep(index);
    form.setFieldsValue(step);
    setEditModalVisible(true);
  };

  // 打开新建对话框
  const handleCreate = () => {
    setEditingStep(null);
    form.resetFields();
    form.setFieldsValue({
      operation: 'processing',
      value_added: false,
      parallel: false,
    });
    setEditModalVisible(true);
  };

  const columns = [
    {
      title: '顺序',
      dataIndex: 'step_id',
      key: 'step_id',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '工作站',
      dataIndex: 'workstation_id',
      key: 'workstation_id',
      render: (id) => {
        const ws = workstations.find(w => w.id === id);
        return ws ? ws.name : id;
      },
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
    },
    {
      title: '处理时间',
      dataIndex: 'processing_time',
      key: 'processing_time',
      render: (time) => time ? `${time}秒` : '-',
    },
    {
      title: '价值增加',
      dataIndex: 'value_added',
      key: 'value_added',
      render: (added, record) => added ? `+${record.value_amount}` : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record, index) => (
        <Space>
          <Button
            size="small"
            icon={<ArrowUpOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveStep(index, 'up')}
          />
          <Button
            size="small"
            icon={<ArrowDownOutlined />}
            disabled={index === steps.length - 1}
            onClick={() => handleMoveStep(index, 'down')}
          />
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record, index)}
          />
          <Popconfirm
            title="确认删除该步骤吗？"
            onConfirm={() => handleDeleteStep(index)}
            okText="确认"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`编辑步骤 - ${routine.name}`}
        open={visible}
        onCancel={onClose}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={900}
      >
        <div style={{ marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加步骤
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={steps}
          rowKey={(_, index) => index}
          pagination={false}
          size="small"
        />
      </Modal>

      {/* 步骤编辑对话框 */}
      <Modal
        title={editingStep !== null ? '编辑步骤' : '添加步骤'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingStep(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" size="small" onFinish={handleStepSubmit}>
          <Form.Item
            name="workstation_id"
            label="工作站"
            rules={[{ required: true, message: '请选择工作站' }]}
          >
            <Select placeholder="选择工作站">
              {workstations.map(ws => (
                <Option key={ws.id} value={ws.id}>
                  {ws.name} ({ws.type})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="operation"
            label="操作类型"
            rules={[{ required: true, message: '请选择操作类型' }]}
          >
            <Select placeholder="选择操作类型">
              <Option value="processing">加工</Option>
              <Option value="assembly">装配</Option>
              <Option value="inspection">质检</Option>
              <Option value="packaging">包装</Option>
              <Option value="storage">存储</Option>
            </Select>
          </Form.Item>

          <Form.Item name="processing_time" label="处理时间（秒）">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="value_added" label="是否价值增加点" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.value_added !== curr.value_added}>
            {({ getFieldValue }) =>
              getFieldValue('value_added') ? (
                <Form.Item
                  name="value_amount"
                  label="价值增加量"
                  rules={[{ required: true, message: '请输入价值增加量' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default RoutineStepEditor;

