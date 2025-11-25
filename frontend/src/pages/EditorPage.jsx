/**
 * 编辑器页面 - 产线建模主界面
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Tabs, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ProductionLineEditor from '../components/ProductionLineEditor/ProductionLineEditor';
import RoutineEditor from '../components/RoutineEditor/RoutineEditor';

const { Header, Content } = Layout;

function EditorPage() {
  const { lineId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('layout');

  const tabItems = [
    {
      key: 'layout',
      label: '产线布局',
      children: <ProductionLineEditor lineId={lineId} />,
    },
    {
      key: 'routine',
      label: '工艺路线',
      children: <RoutineEditor lineId={lineId} />,
    },
  ];

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
        <h2 style={{ margin: 0 }}>产线建模编辑器</h2>
      </Header>
      
      <Content style={{ padding: '12px', background: '#f0f2f5' }}>
        <div style={{ background: '#fff', padding: '12px', minHeight: 'calc(100vh - 88px)' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={tabItems}
          />
        </div>
      </Content>
    </Layout>
  );
}

export default EditorPage;

