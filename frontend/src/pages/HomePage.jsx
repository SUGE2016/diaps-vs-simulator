/**
 * 主页 - 产线列表
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Button, 
  List, 
  Modal, 
  Form, 
  Input, 
  message,
  Space,
  Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ToolOutlined } from '@ant-design/icons';
import { productionLineAPI } from '../services/api';

const { Header, Content } = Layout;
const { TextArea } = Input;

function HomePage() {
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLine, setEditingLine] = useState(null);
  const [form] = Form.useForm();

  // 加载产线列表
  const loadLines = async () => {
    setLoading(true);
    try {
      const data = await productionLineAPI.list();
      setLines(data);
    } catch (error) {
      message.error('加载产线列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLines();
  }, []);

  // 创建/更新产线
  const handleSubmit = async (values) => {
    try {
      if (editingLine) {
        await productionLineAPI.update(editingLine.id, values);
        message.success('产线更新成功');
      } else {
        await productionLineAPI.create(values);
        message.success('产线创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingLine(null);
      loadLines();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 删除产线
  const handleDelete = async (id) => {
    try {
      await productionLineAPI.delete(id);
      message.success('产线删除成功');
      loadLines();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 打开编辑对话框
  const handleEdit = (line) => {
    setEditingLine(line);
    form.setFieldsValue(line);
    setModalVisible(true);
  };

  // 打开新建对话框
  const handleCreate = () => {
    setEditingLine(null);
    form.resetFields();
    setModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>价值流模拟器 - 建模工具</h2>
        <Space>
          <Link to="/import-export">
            <Button icon={<ToolOutlined />}>配置导入/导出</Button>
          </Link>
        </Space>
      </Header>
      
      <Content style={{ padding: '12px' }}>
        <Card
          title="产线列表"
          bodyStyle={{ padding: '12px' }}
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建产线
            </Button>
          }
        >
          <List
            loading={loading}
            dataSource={lines}
            renderItem={(line) => (
              <List.Item
                actions={[
                  <Link key="edit-link" to={`/editor/${line.id}`}>
                    <Button type="link">编辑建模</Button>
                  </Link>,
                  <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => handleEdit(line)}>
                    编辑信息
                  </Button>,
                  <Popconfirm
                    key="delete"
                    title="确认删除该产线吗？"
                    onConfirm={() => handleDelete(line.id)}
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
                  title={line.name}
                  description={line.description || '暂无描述'}
                />
              </List.Item>
            )}
          />
        </Card>
      </Content>

      {/* 创建/编辑产线对话框 */}
      <Modal
        title={editingLine ? '编辑产线' : '新建产线'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingLine(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" size="small" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="产线名称"
            rules={[{ required: true, message: '请输入产线名称' }]}
          >
            <Input placeholder="请输入产线名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入产线描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default HomePage;

