/**
 * 属性面板 - 显示和编辑选中元素的属性
 */
import { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button } from 'antd';
import WorkstationForm from '../WorkstationConfig/WorkstationForm';
import BufferForm from '../BufferConfig/BufferForm';

const { Option } = Select;

function PropertiesPanel({ element, onUpdate, formRef }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (element) {
      form.setFieldsValue(element);
    } else {
      form.resetFields();
    }
  }, [element, form]);

  // 将form实例暴露给父组件
  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [form, formRef]);

  const handleSubmit = (values) => {
    onUpdate(values);
  };

  const elementType = element.elementType || element.type;

  return (
    <>
      {elementType === 'workstation' && (
        <WorkstationForm 
          form={form} 
          initialValues={element} 
          onSubmit={handleSubmit} 
        />
      )}

      {elementType === 'buffer' && (
        <BufferForm 
          form={form} 
          initialValues={element} 
          onSubmit={handleSubmit} 
        />
      )}

      {elementType === 'path' && (
        <Form form={form} layout="vertical" size="small" onFinish={handleSubmit}>
          <Form.Item label="起始位置" style={{ marginBottom: '8px' }}>
            <Input value={element.from_location} disabled />
          </Form.Item>
          <Form.Item label="目标位置" style={{ marginBottom: '8px' }}>
            <Input value={element.to_location} disabled />
          </Form.Item>
          <Form.Item
            name="transport_time"
            label="运输时间（秒）"
            rules={[{ required: true, message: '请输入运输时间' }]}
            style={{ marginBottom: '8px' }}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="capacity" label="运输能力" style={{ marginBottom: '8px' }}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      )}
    </>
  );
}

export default PropertiesPanel;

