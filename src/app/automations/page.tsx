'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Loader2 } from 'lucide-react';

interface LabeledEmail {
  subject: string;
  label: string;
  timestamp: string;
}

export default function AutomationsPage() {
  const [recentLabels, setRecentLabels] = useState<LabeledEmail[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const testAutoLabel = async () => {
    setIsProcessing(true);
    try {
      const accessToken = localStorage.getItem('gmail_access_token');
      const response = await fetch('/api/emails/watch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      const data = await response.json();
      if (data.appliedLabel) {
        setRecentLabels(prev => [{
          subject: data.emailSubject,
          label: data.appliedLabel,
          timestamp: new Date().toLocaleString()
        }, ...prev]);
      }
    } catch (error) {
      console.error('Error testing auto-label:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Auto-Label Emails</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={testAutoLabel}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Test with Latest Email'
              )}
            </button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isEnabled}
                onChange={() => setIsEnabled(!isEnabled)}
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-300">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-300">
            Emails are automatically categorized and labeled using AI based on their content.
            Labels include: Personal, Work, Finance, Shopping, Travel, Social, Newsletter, 
            Promotion, Important, and Other.
          </p>
        </div>

        <div className="space-y-4">
          {recentLabels.map((item, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
              <div>
                <h3 className="text-white font-medium">{item.subject}</h3>
                <p className="text-sm text-gray-400">{item.timestamp}</p>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                {item.label}
              </span>
            </div>
          ))}
          
          {recentLabels.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No emails have been auto-labeled yet. Click "Test with Latest Email" to try it out!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}