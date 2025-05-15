import React from 'react';
import { Save, Trash, Play, Plus, Download, Upload } from 'lucide-react';

interface ToolbarProps {
  onSave: () => void;
  onClear: () => void;
  onRun: () => void;
  onNew: () => void;
  onExport: () => void;
  onImport: () => void;
  isRunning: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onClear,
  onRun,
  onNew,
  onExport,
  onImport,
  isRunning
}) => {
  return (
    <div className="bg-white border-b border-gray-200 py-2 px-4 flex items-center gap-2">
      <button
        className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        onClick={onNew}
        title="New Workflow"
      >
        <Plus size={18} />
      </button>
      
      <button
        className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        onClick={onSave}
        title="Save Workflow"
      >
        <Save size={18} />
      </button>
      
      <div className="h-5 border-r border-gray-300 mx-1"></div>
      
      <button
        className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        onClick={onImport}
        title="Import Workflow"
      >
        <Upload size={18} />
      </button>
      
      <button
        className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        onClick={onExport}
        title="Export Workflow"
      >
        <Download size={18} />
      </button>
      
      <div className="h-5 border-r border-gray-300 mx-1"></div>
      
      <button
        className={`p-2 rounded-md transition-colors ${
          isRunning 
            ? 'text-green-600 bg-green-50' 
            : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
        }`}
        onClick={onRun}
        title="Run Workflow"
      >
        <Play size={18} />
      </button>
      
      <div className="flex-grow"></div>
      
      <button
        className="p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
        onClick={onClear}
        title="Clear Workflow"
      >
        <Trash size={18} />
      </button>
    </div>
  );
};

export default Toolbar;