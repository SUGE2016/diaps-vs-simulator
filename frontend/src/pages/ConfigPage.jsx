/**
 * 配置管理页面 - 工艺步骤类型、工作站类型等全局配置
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Tabs, Card, Table, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { operationTypeAPI, workstationTypeAPI, materialTypeAPI } from '../services/api';

const { Header, Content } = Layout;
const { TextArea } = Input;

function ConfigPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('operation-types');

  // 工艺步骤类型
  const [operationTypes, setOperationTypes] = useState([]);
  const [opLoading, setOpLoading] = useState(false);
  const [opModalVisible, setOpModalVisible] = useState(false);
  const [editingOpType, setEditingOpType] = useState(null);
  const [opForm] = Form.useForm();

  // 工作站类型
  const [workstationTypes, setWorkstationTypes] = useState([]);
  const [wsLoading, setWsLoading] = useState(false);
  const [wsModalVisible, setWsModalVisible] = useState(false);
  const [editingWsType, setEditingWsType] = useState(null);
  const [wsForm] = Form.useForm();

  // 物料类型
  const [materialTypes, setMaterialTypes] = useState([]);
  const [matLoading, setMatLoading] = useState(false);
  const [matModalVisible, setMatModalVisible] = useState(false);
  const [editingMatType, setEditingMatType] = useState(null);
  const [matForm] = Form.useForm();

  // 加载工艺步骤类型
  const loadOperationTypes = async () => {
    setOpLoading(true);
    try {
      const data = await operationTypeAPI.list();
      setOperationTypes(data);
    } catch (error) {
      message.error('加载工艺步骤类型失败');
    } finally {
      setOpLoading(false);
    }
  };

  // 加载工作站类型
  const loadWorkstationTypes = async () => {
    setWsLoading(true);
    try {
      const data = await workstationTypeAPI.list();
      setWorkstationTypes(data);
    } catch (error) {
      message.error('加载工作站类型失败');
    } finally {
      setWsLoading(false);
    }
  };

  // 加载物料类型
  const loadMaterialTypes = async () => {
    setMatLoading(true);
    try {
      const data = await materialTypeAPI.list();
      setMaterialTypes(data);
    } catch (error) {
      message.error('加载物料类型失败');
    } finally {
      setMatLoading(false);
    }
  };

  useEffect(() => {
    loadOperationTypes();
    loadWorkstationTypes();
    loadMaterialTypes();
  }, []);

  // ============ 工艺步骤类型操作 ============
  const handleCreateOpType = () => {
    setEditingOpType(null);
    opForm.resetFields();
    setOpModalVisible(true);
  };

  const handleEditOpType = (record) => {
    setEditingOpType(record);
    opForm.setFieldsValue(record);
    setOpModalVisible(true);
  };

  const handleDeleteOpType = async (id) => {
    try {
      await operationTypeAPI.delete(id);
      message.success('删除成功');
      loadOperationTypes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSaveOpType = async (values) => {
    try {
      if (editingOpType) {
        await operationTypeAPI.update(editingOpType.id, values);
        message.success('更新成功');
      } else {
        await operationTypeAPI.create(values);
        message.success('创建成功');
      }
      setOpModalVisible(false);
      loadOperationTypes();
    } catch (error) {
      message.error(error.response?.data?.detail || '操作失败');
    }
  };

  // ============ 工作站类型操作 ============
  const handleCreateWsType = () => {
    setEditingWsType(null);
    wsForm.resetFields();
    setWsModalVisible(true);
  };

  const handleEditWsType = (record) => {
    setEditingWsType(record);
    wsForm.setFieldsValue(record);
    setWsModalVisible(true);
  };

  const handleDeleteWsType = async (id) => {
    try {
      await workstationTypeAPI.delete(id);
      message.success('删除成功');
      loadWorkstationTypes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSaveWsType = async (values) => {
    try {
      if (editingWsType) {
        await workstationTypeAPI.update(editingWsType.id, values);
        message.success('更新成功');
      } else {
        await workstationTypeAPI.create(values);
        message.success('创建成功');
      }
      setWsModalVisible(false);
      loadWorkstationTypes();
    } catch (error) {
      message.error(error.response?.data?.detail || '操作失败');
    }
  };

  // ============ 物料类型操作 ============
  const handleCreateMatType = () => {
    setEditingMatType(null);
    matForm.resetFields();
    setMatModalVisible(true);
  };

  const handleEditMatType = (record) => {
    setEditingMatType(record);
    matForm.setFieldsValue(record);
    setMatModalVisible(true);
  };

  const handleDeleteMatType = async (id) => {
    try {
      await materialTypeAPI.delete(id);
      message.success('删除成功');
      loadMaterialTypes();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSaveMatType = async (values) => {
    try {
      if (editingMatType) {
        await materialTypeAPI.update(editingMatType.id, values);
        message.success('更新成功');
      } else {
        await materialTypeAPI.create(values);
        message.success('创建成功');
      }
      setMatModalVisible(false);
      loadMaterialTypes();
    } catch (error) {
      message.error(error.response?.data?.detail || '操作失败');
    }
  };

  // 工艺步骤类型表格列
  const opColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditOpType(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteOpType(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 工作站类型表格列
  const wsColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditWsType(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteWsType(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 物料类型表格列
  const matColumns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditMatType(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteMatType(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'operation-types',
      label: '工艺步骤类型',
      children: (
        <Card
          title="工艺步骤类型"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateOpType}>
              新建
            </Button>
          }
        >
          <Table
            columns={opColumns}
            dataSource={operationTypes}
            rowKey="id"
            loading={opLoading}
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'workstation-types',
      label: '工作站类型',
      children: (
        <Card
          title="工作站类型"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWsType}>
              新建
            </Button>
          }
        >
          <Table
            columns={wsColumns}
            dataSource={workstationTypes}
            rowKey="id"
            loading={wsLoading}
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
    {
      key: 'material-types',
      label: '物料类型',
      children: (
        <Card
          title="物料类型"
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMatType}>
              新建
            </Button>
          }
        >
          <Table
            columns={matColumns}
            dataSource={materialTypes}
            rowKey="id"
            loading={matLoading}
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} style={{ marginRight: 16 }}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>配置管理</h2>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        <div style={{ background: '#fff', padding: '24px', minHeight: 'calc(100vh - 112px)' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </div>
      </Content>

      {/* 工艺步骤类型编辑弹窗 */}
      <Modal
        title={editingOpType ? '编辑工艺步骤类型' : '新建工艺步骤类型'}
        open={opModalVisible}
        onCancel={() => setOpModalVisible(false)}
        onOk={() => opForm.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={opForm} layout="vertical" onFinish={handleSaveOpType}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：加工、装配、质检" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 工作站类型编辑弹窗 */}
      <Modal
        title={editingWsType ? '编辑工作站类型' : '新建工作站类型'}
        open={wsModalVisible}
        onCancel={() => setWsModalVisible(false)}
        onOk={() => wsForm.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={wsForm} layout="vertical" onFinish={handleSaveWsType}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：加工站、组装站、质检站" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 物料类型编辑弹窗 */}
      <Modal
        title={editingMatType ? '编辑物料类型' : '新建物料类型'}
        open={matModalVisible}
        onCancel={() => setMatModalVisible(false)}
        onOk={() => matForm.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={matForm} layout="vertical" onFinish={handleSaveMatType}>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="如：产品A、产品B、原材料" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default ConfigPage;

