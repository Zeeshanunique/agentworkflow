import React from 'react';
import { Check, XCircle, Clock } from 'lucide-react';

export type NodeStatusType = 'success' | 'error' | 'running' | 'idle';

interface NodeStatusProps {
  status: NodeStatusType;
  message?: string;
}

const NodeStatus: React.FC<NodeStatusProps> = ({ status, message }) => {
  const renderIcon = () => {
    switch (status) {
      case 'success':
        return <Check size={14} className="text-green-500" />;
      case 'error':
        return <XCircle size={14} className="text-red-500" />;
      case 'running':
        return <Clock size={14} className="text-blue-500 animate-pulse" />;
      case 'idle':
      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute right-2 top-2 flex items-center rounded-md"
      title={message || status}
    >
      {renderIcon()}
    </div>
  );
};

export default NodeStatus;
