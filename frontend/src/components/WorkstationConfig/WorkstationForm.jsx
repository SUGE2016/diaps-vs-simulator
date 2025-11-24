/**
 * 工作站配置表单
 */
import { Form, Input, InputNumber, Button, Radio } from 'antd';

function WorkstationForm({ form, initialValues, onSubmit }) {
  const timeType = Form.useWatch('processing_time', form)?.type || initialValues?.processing_time?.type || 'fixed';
  const workstationType = Form.useWatch('type', form) || initialValues?.type;

  // 类型映射
  const typeMap = {
    processing: '加工',
    assembly: '装配',
    inspection: '质检',
    packaging: '包装',
    storage: '存储',
  };

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
        rules={[{ required: true, message: '请输入工作站名称' }]}
        style={{ marginBottom: '8px' }}
      >
        <Input placeholder="工作站名称" />
      </Form.Item>

      <Form.Item
        label="类型"
        style={{ marginBottom: '8px' }}
      >
        <Input 
          value={typeMap[workstationType] || workstationType || ''}
          disabled
        />
      </Form.Item>

      <Form.Item
        name="capacity"
        label="处理能力"
        rules={[{ required: true, message: '请输入处理能力' }]}
        style={{ marginBottom: '8px' }}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item label="处理时间配置" style={{ marginBottom: '8px' }}>
        <Form.Item
          name={['processing_time', 'type']}
          label="时间类型"
          rules={[{ required: true }]}
          style={{ marginBottom: '8px' }}
        >
          <Radio.Group>
            <Radio.Button value="fixed">固定值</Radio.Button>
            <Radio.Button value="uniform">均匀分布</Radio.Button>
            <Radio.Button value="normal">正态分布</Radio.Button>
          </Radio.Group>
        </Form.Item>

        {timeType === 'fixed' && (
          <Form.Item
            name={['processing_time', 'value']}
            label="处理时间（秒）"
            rules={[{ required: true, message: '请输入处理时间' }]}
            style={{ marginBottom: '8px' }}
          >
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        )}

        {timeType === 'uniform' && (
          <>
            <Form.Item
              name={['processing_time', 'min']}
              label="最小值（秒）"
              rules={[{ required: true, message: '请输入最小值' }]}
              style={{ marginBottom: '8px' }}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name={['processing_time', 'max']}
              label="最大值（秒）"
              rules={[{ required: true, message: '请输入最大值' }]}
              style={{ marginBottom: '8px' }}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        {timeType === 'normal' && (
          <>
            <Form.Item
              name={['processing_time', 'mean']}
              label="平均值（秒）"
              rules={[{ required: true, message: '请输入平均值' }]}
              style={{ marginBottom: '8px' }}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name={['processing_time', 'std']}
              label="标准差"
              rules={[{ required: true, message: '请输入标准差' }]}
              style={{ marginBottom: '8px' }}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}
      </Form.Item>
    </Form>
  );
}

export default WorkstationForm;

