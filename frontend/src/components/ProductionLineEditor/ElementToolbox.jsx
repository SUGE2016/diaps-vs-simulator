/**
 * 元素工具箱 - 可拖拽的工作站和缓冲区类型
 */
import { useDrag } from 'react-dnd';
import { 
  ToolOutlined, 
  BuildOutlined, 
  SafetyOutlined, 
  InboxOutlined,
  DatabaseOutlined 
} from '@ant-design/icons';

const DraggableItem = ({ type, icon, label, elementType }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: elementType,
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        padding: '8px',
        margin: '4px 0',
        background: isDragging ? '#e6f7ff' : '#f5f5f5',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        cursor: 'move',
        display: 'flex',
        alignItems: 'center',
        opacity: isDragging ? 0.5 : 1,
        fontSize: '12px',
      }}
    >
      {icon}
      <span style={{ marginLeft: 6 }}>{label}</span>
    </div>
  );
};

function ElementToolbox() {
  const workstationTypes = [
    { type: 'processing', label: '加工站', icon: <ToolOutlined /> },
    { type: 'assembly', label: '装配站', icon: <BuildOutlined /> },
    { type: 'inspection', label: '质检站', icon: <SafetyOutlined /> },
    { type: 'packaging', label: '包装站', icon: <InboxOutlined /> },
    { type: 'storage', label: '存储站', icon: <DatabaseOutlined /> },
  ];

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>工作站</h4>
        {workstationTypes.map(({ type, label, icon }) => (
          <DraggableItem
            key={type}
            type={type}
            icon={icon}
            label={label}
            elementType="WORKSTATION"
          />
        ))}
      </div>

      <div>
        <h4 style={{ margin: '0 0 6px 0', fontSize: '13px' }}>缓冲区</h4>
        <DraggableItem
          type="buffer"
          icon={<DatabaseOutlined />}
          label="缓冲区"
          elementType="BUFFER"
        />
      </div>

      <div style={{ marginTop: 12, padding: '8px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px', fontSize: '11px' }}>
        <strong>使用说明：</strong>
        <ul style={{ marginTop: 4, paddingLeft: 18, marginBottom: 0 }}>
          <li>拖拽组件到画布中</li>
          <li>点击元素查看/编辑属性</li>
          <li>按住Ctrl点击两个元素创建连接</li>
        </ul>
      </div>
    </>
  );
}

export default ElementToolbox;

