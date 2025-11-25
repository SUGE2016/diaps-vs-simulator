/**
 * 主应用组件 - 路由配置
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import HomePage from './pages/HomePage';
import EditorPage from './pages/EditorPage';
import ImportExportPage from './pages/ImportExportPage';
import ConfigPage from './pages/ConfigPage';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/editor/:lineId" element={<EditorPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
