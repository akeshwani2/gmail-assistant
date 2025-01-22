'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function AutomationsPage() {
  const [isEnabled, setIsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('autoLabel_enabled') === 'true';
    }
    return true;
  });
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    localStorage.setItem('autoLabel_enabled', isEnabled.toString());
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) {
      console.log('Monitoring is disabled');
      return;
    }

    console.log('Starting email monitoring...');
    const checkNewEmails = async () => {
      try {
        setLastCheck(new Date());
        
        const accessToken = localStorage.getItem('gmail_access_token');
        if (!accessToken) {
          console.log('No access token found');
          return;
        }

        const response = await fetch('/api/emails/check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            lastHistoryId,
            testMode: false
          })
        });

        const data = await response.json();
        
        if (data.newHistoryId) {
          setLastHistoryId(data.newHistoryId);
        }

        if (data.processedEmails && data.processedEmails.length > 0) {
          setProcessedCount(prev => prev + data.processedEmails.length);
        }
      } catch (error) {
        console.error('Error checking new emails:', error);
      }
    };

    checkNewEmails();
    const interval = setInterval(checkNewEmails, 30000);
    
    return () => {
      console.log('Cleaning up monitoring...');
      clearInterval(interval);
    };
  }, [isEnabled, lastHistoryId]);

  return (
    <main className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Auto-Label Emails</h1>
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => setIsEnabled(!isEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isEnabled ? 'bg-blue-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {lastCheck && (
                <span className="text-xs text-gray-500">
                  Last check: {lastCheck.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <p className="text-gray-300">
            Emails are automatically categorized and labeled using AI based on their content.
          </p>
          {processedCount > 0 && (
            <p className="text-gray-400 mt-2">
              Total emails processed: {processedCount}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}