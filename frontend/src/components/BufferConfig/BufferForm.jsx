/**
 * 缓冲区配置表单
 */
import { Form, Input, InputNumber, Button } from 'antd';

function BufferForm({ form, initialValues, onSubmit }) {
  return (
    <Form
      form={form}
      layout="vertical"
      size="small"
      initialValues={initialValues}
      onFinish={onSubmit}
    >
      <Form.Item
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入缓冲区名称' }]}
        style={{ marginBottom: '8px' }}
      >
        <Input placeholder="缓冲区名称" />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="容量"
        rules={[{ required: true, message: '请输入容量' }]}
        style={{ marginBottom: '8px' }}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item 
        name="location" 
        label="位置描述"
        style={{ marginBottom: '8px' }}
      >
        <Input placeholder="如：原料区、成品区等" />
      </Form.Item>
    </Form>
  );
}

export default BufferForm;

