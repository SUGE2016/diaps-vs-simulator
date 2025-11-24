/**
 * 配置导入/导出页面
 */
import { Layout, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ConfigImportExport from '../components/ConfigImportExport/ConfigImportExport';

const { Header, Content } = Layout;

function ImportExportPage() {
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <h2 style={{ margin: 0 }}>配置导入/导出</h2>
      </Header>
      
      <Content style={{ padding: '12px', background: '#f0f2f5' }}>
        <ConfigImportExport />
      </Content>
    </Layout>
  );
}

export default ImportExportPage;

