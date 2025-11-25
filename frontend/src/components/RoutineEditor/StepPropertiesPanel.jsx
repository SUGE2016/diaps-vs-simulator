/**
 * 步骤属性面板 - 显示和编辑选中步骤的属性
 */
import { useEffect } from 'react';
import { Form, Select, InputNumber, Switch, Empty } from 'antd';

const { Option } = Select;

function StepPropertiesPanel({ step, workstations, operationTypes, onUpdate, formRef }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (step) {
      form.setFieldsValue({
        workstation_id: step.workstation_id,
        operation: step.operation,
        processing_time: step.processing_time,
        value_added: step.value_added,
        value_amount: step.value_amount,
      });
    } else {
      form.resetFields();
    }
  }, [step, form]);

  // 将form实例暴露给父组件
  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [form, formRef]);

  const handleSubmit = (values) => {
    if (onUpdate && step) {
      onUpdate(step.id, values);
    }
  };

  if (!step) {
    return <Empty description="请选择一个步骤" />;
  }

  return (
    <Form form={form} layout="vertical" size="small" onFinish={handleSubmit}>
      <Form.Item name="workstation_id" label="工作站">
        <Select placeholder="选择工作站" allowClear>
          {workstations.map(ws => (
            <Option key={ws.id} value={ws.id}>
              {ws.name} ({ws.type})
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="operation" label="操作类型">
        <Select placeholder="选择操作类型">
          {operationTypes.map(op => (
            <Option key={op.id} value={op.name}>{op.name}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="processing_time" label="处理时间（秒）">
        <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="value_added" label="是否增值" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item
        noStyle
        shouldUpdate={(prev, curr) => prev.value_added !== curr.value_added}
      >
        {({ getFieldValue }) =>
          getFieldValue('value_added') ? (
            <Form.Item name="value_amount" label="增值金额">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          ) : null
        }
      </Form.Item>
    </Form>
  );
}

export default StepPropertiesPanel;

