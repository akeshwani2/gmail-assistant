'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type TriggerType = 'new_email' | 'specific_sender' | 'subject_contains' | 'time_received';
type ActionType = 'create_label' | 'mark_important' | 'send_reply' | 'create_draft' | 'move_to_folder';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (automation: AutomationType) => void;
}

export interface AutomationType {
  id?: string;
  name: string;
  triggerType: TriggerType;
  triggerValue: string;
  actionType: ActionType;
  actionValue: string;
  enabled: boolean;
}

export default function AutomationModal({ isOpen, onClose, onSave }: AutomationModalProps) {
  const [automation, setAutomation] = useState<AutomationType>({
    name: '',
    triggerType: 'new_email',
    triggerValue: '',
    actionType: 'create_label',
    actionValue: '',
    enabled: true,
  });

  const triggers = [
    { value: 'new_email', label: 'When a new email arrives' },
    { value: 'specific_sender', label: 'When email is from specific sender' },
    { value: 'subject_contains', label: 'When subject contains' },
    { value: 'time_received', label: 'When received during specific hours' },
  ];

  const actions = [
    { value: 'create_label', label: 'Create Label' },
    { value: 'mark_important', label: 'Mark as Important' },
    { value: 'send_reply', label: 'Send Auto-Reply' },
    { value: 'create_draft', label: 'Create Draft' },
    { value: 'move_to_folder', label: 'Move to Folder' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Create Automation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(automation);
          onClose();
        }}>
          {/* Name Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Automation Name
            </label>
            <input
              type="text"
              value={automation.name}
              onChange={(e) => setAutomation({ ...automation, name: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
              placeholder="Enter automation name"
              required
            />
          </div>

          {/* Trigger Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Trigger
            </label>
            <select
              value={automation.triggerType}
              onChange={(e) => setAutomation({ 
                ...automation, 
                triggerType: e.target.value as TriggerType 
              })}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
            >
              {triggers.map(trigger => (
                <option key={trigger.value} value={trigger.value}>
                  {trigger.label}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Value Input */}
          {automation.triggerType !== 'new_email' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Trigger Value
              </label>
              <input
                type="text"
                value={automation.triggerValue}
                onChange={(e) => setAutomation({ ...automation, triggerValue: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                placeholder={`Enter ${automation.triggerType.replace('_', ' ')}`}
                required
              />
            </div>
          )}

          {/* Action Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Action
            </label>
            <select
              value={automation.actionType}
              onChange={(e) => setAutomation({ 
                ...automation, 
                actionType: e.target.value as ActionType 
              })}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
            >
              {actions.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Value Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Action Value
            </label>
            <input
              type="text"
              value={automation.actionValue}
              onChange={(e) => setAutomation({ ...automation, actionValue: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
              placeholder={`Enter ${automation.actionType.replace('_', ' ')} value`}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Create Automation
          </button>
        </form>
      </div>
    </div>
  );
}