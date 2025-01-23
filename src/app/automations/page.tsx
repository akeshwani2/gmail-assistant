"use client"
import React from 'react'
// import Sidebar from '../components/Sidebar'

interface AutomationAction {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  config?: Record<string, any>; // For action-specific settings
}

interface LabelAutomation {
  labelName: string;
  actions: AutomationAction[];
}

const defaultActions: Omit<AutomationAction, 'enabled'>[] = [
  {
    id: 'mark-important',
    name: 'Mark Important',
    description: 'Mark as important automatically',
  },
  {
    id: 'auto-draft',
    name: 'Auto Draft',
    description: 'Create AI draft responses',
  },
  {
    id: 'auto-reply',
    name: 'Auto Reply',
    description: 'Send automatic email replies',
  },
  {
    id: 'auto-forward',
    name: 'Auto Forward',
    description: 'Forward emails automatically',
  },
  {
    id: 'text-me',
    name: 'Text Me',
    description: 'Get a text message',
  },
];

function AutomationsPage() {
  const [labelAutomations, setLabelAutomations] = React.useState<LabelAutomation[]>([]);
  const [newLabelName, setNewLabelName] = React.useState('');
  const [isAddingLabel, setIsAddingLabel] = React.useState(false);

  const addNewLabelAutomation = () => {
    if (!newLabelName.trim()) return;
    
    const newAutomation: LabelAutomation = {
      labelName: newLabelName.trim(),
      actions: defaultActions.map(action => ({ ...action, enabled: false })),
    };

    setLabelAutomations(prev => [...prev, newAutomation]);
    setNewLabelName('');
    setIsAddingLabel(false);
  };

  const handleActionToggle = (labelName: string, actionId: string) => {
    setLabelAutomations(prev => prev.map(label => {
      if (label.labelName === labelName) {
        return {
          ...label,
          actions: label.actions.map(action => {
            if (action.id === actionId) {
              return { ...action, enabled: !action.enabled };
            }
            return action;
          }),
        };
      }
      return label;
    }));
  };

  const deleteLabelAutomation = (labelName: string) => {
    setLabelAutomations(prev => prev.filter(label => label.labelName !== labelName));
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* <Sidebar /> */}
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Email Automations</h1>
          <button
            onClick={() => setIsAddingLabel(true)}
            className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
          >
            Add Label Automation
          </button>
        </div>

        {labelAutomations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No label automations yet. Click "Add Label Automation" to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {labelAutomations.map((label) => (
              <div key={label.labelName} className="bg-[#1a1a1a] rounded-lg">
                <div className="flex justify-between items-center p-4 border-b border-[#2a2a2a]">
                  <h2 className="text-lg font-semibold">Actions for {label.labelName}</h2>
                  <button
                    onClick={() => deleteLabelAutomation(label.labelName)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="p-4 space-y-3">
                  {label.actions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                      <div>
                        <h3 className="font-medium">{action.name}</h3>
                        <p className="text-sm text-gray-400">{action.description}</p>
                      </div>
                      <button
                        onClick={() => handleActionToggle(label.labelName, action.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          action.enabled ? 'bg-blue-500' : 'bg-[#3a3a3a]'
                        }`}
                      >
                        <span className="sr-only">Toggle {action.name}</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            action.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {isAddingLabel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-4">Add New Label Automation</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  placeholder="Enter label name"
                  className="w-full px-4 py-2 bg-[#2a2a2a] rounded-lg"
                />
                <div className="flex gap-4 justify-end">
                  <button
                    onClick={addNewLabelAutomation}
                    className="px-4 py-2 bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setIsAddingLabel(false)}
                    className="px-4 py-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AutomationsPage