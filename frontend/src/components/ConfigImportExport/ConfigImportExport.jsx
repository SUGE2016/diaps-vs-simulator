/**
 * 配置导入导出组件
 */
import { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Upload, 
  Select, 
  message, 
  Alert,
  Descriptions,
  Space,
  Divider,
  List,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  WarningOutlined 
} from '@ant-design/icons';
import { configAPI, productionLineAPI } from '../../services/api';

const { Option } = Select;
const { Dragger } = Upload;

function ConfigImportExport() {
  const [productionLines, setProductionLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [uploading, setUploading] = useState(false);

  // 加载产线列表
  const loadLines = async () => {
    try {
      const data = await productionLineAPI.list();
      setProductionLines(data);
    } catch (error) {
      message.error('加载产线列表失败');
    }
  };

  useEffect(() => {
    loadLines();
  }, []);

  // 文件上传前验证
  const handleBeforeUpload = async (file) => {
    setValidationResult(null);
    setImportResult(null);
    setUploading(true);

    try {
      const result = await configAPI.validateFile(file);
      setValidationResult(result);
      
      if (result.valid) {
        message.success('配置文件验证通过');
      } else {
        message.error('配置文件验证失败');
      }
    } catch (error) {
      message.error('文件验证失败');
      setValidationResult({
        valid: false,
        errors: ['文件格式错误或解析失败'],
        warnings: [],
      });
    } finally {
      setUploading(false);
    }

    return false; // 阻止自动上传
  };

  // 导入配置
  const handleImport = async (file) => {
    if (!validationResult || !validationResult.valid) {
      message.error('请先验证配置文件');
      return;
    }

    setUploading(true);
    try {
      const result = await configAPI.importFile(file);
      setImportResult(result);
      
      if (result.success) {
        message.success('配置导入成功');
        loadLines(); // 刷新产线列表
      } else {
        message.error('配置导入失败');
      }
    } catch (error) {
      message.error('导入失败');
      setImportResult({
        success: false,
        message: '导入失败',
        error: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  // 导出配置
  const handleExport = async (format = 'json') => {
    if (!selectedLine) {
      message.error('请选择要导出的产线');
      return;
    }

    try {
      const blob = await configAPI.export(selectedLine, format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `production_line_${selectedLine}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('配置导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  return (
    <div>
      {/* 导入配置 */}
      <Card title="导入配置" bodyStyle={{ padding: '12px' }} style={{ marginBottom: 12 }}>
        <Dragger
          beforeUpload={handleBeforeUpload}
          accept=".json,.yaml,.yml"
          maxCount={1}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持 JSON 和 YAML 格式的配置文件
          </p>
        </Dragger>

        {/* 验证结果 */}
        {validationResult && (
          <div style={{ marginTop: 12 }}>
            <Alert
              message={validationResult.valid ? '验证通过' : '验证失败'}
              type={validationResult.valid ? 'success' : 'error'}
              icon={validationResult.valid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              showIcon
            />

            {/* 错误信息 */}
            {validationResult.errors && validationResult.errors.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4>错误列表：</h4>
                <List
                  size="small"
                  bordered
                  dataSource={validationResult.errors}
                  renderItem={(error) => (
                    <List.Item>
                      <Tag color="error">错误</Tag> {error}
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 警告信息 */}
            {validationResult.warnings && validationResult.warnings.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4>警告列表：</h4>
                <List
                  size="small"
                  bordered
                  dataSource={validationResult.warnings}
                  renderItem={(warning) => (
                    <List.Item>
                      <Tag color="warning">警告</Tag> {warning}
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* 导入按钮 */}
            {validationResult.valid && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  loading={uploading}
                  onClick={() => handleImport(validationResult.file)}
                >
                  确认导入
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 导入结果 */}
        {importResult && (
          <div style={{ marginTop: 12 }}>
            <Alert
              message={importResult.success ? '导入成功' : '导入失败'}
              description={importResult.message}
              type={importResult.success ? 'success' : 'error'}
              showIcon
            />

            {importResult.success && importResult.statistics && (
              <Descriptions 
                bordered 
                size="small" 
                column={2} 
                style={{ marginTop: 12 }}
                title="导入统计"
              >
                <Descriptions.Item label="产线ID">
                  {importResult.production_line_id}
                </Descriptions.Item>
                <Descriptions.Item label="工作站">
                  {importResult.statistics.workstations}
                </Descriptions.Item>
                <Descriptions.Item label="缓冲区">
                  {importResult.statistics.buffers}
                </Descriptions.Item>
                <Descriptions.Item label="运输路径">
                  {importResult.statistics.transport_paths}
                </Descriptions.Item>
                <Descriptions.Item label="流转路径">
                  {importResult.statistics.routines}
                </Descriptions.Item>
                <Descriptions.Item label="价值流">
                  {importResult.statistics.value_streams}
                </Descriptions.Item>
              </Descriptions>
            )}
          </div>
        )}
      </Card>

      {/* 导出配置 */}
      <Card title="导出配置" bodyStyle={{ padding: '12px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <div style={{ marginBottom: 8 }}>选择产线：</div>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择要导出的产线"
              value={selectedLine}
              onChange={setSelectedLine}
            >
              {productionLines.map(line => (
                <Option key={line.id} value={line.id}>
                  {line.name} (ID: {line.id})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>导出格式：</div>
            <Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                disabled={!selectedLine}
                onClick={() => handleExport('json')}
              >
                导出为 JSON
              </Button>
              <Button
                icon={<DownloadOutlined />}
                disabled={!selectedLine}
                onClick={() => handleExport('yaml')}
              >
                导出为 YAML
              </Button>
            </Space>
          </div>
        </Space>
      </Card>
    </div>
  );
}

export default ConfigImportExport;

