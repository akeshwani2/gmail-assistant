'use client';

import { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

export default function EmailDashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastHistoryId, setLastHistoryId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Poll for new emails every 30 seconds
  useEffect(() => {
    if (!isConnected || !lastHistoryId || !accessToken) return;

    const checkEmails = async () => {
      try {
        const response = await fetch('/api/emails/check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lastHistoryId })
        });

        if (!response.ok) throw new Error('Failed to check emails');

        const data = await response.json();
        setLastHistoryId(data.newHistoryId);
      } catch (error) {
        console.error('Error checking emails:', error);
      }
    };

    const interval = setInterval(checkEmails, 30000);
    return () => clearInterval(interval);
  }, [isConnected, lastHistoryId, accessToken]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        setAccessToken(tokenResponse.access_token);
        const response = await fetch('/api/emails/watch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to connect to Gmail');
        
        const data = await response.json();
        setLastHistoryId(data.historyId);
        setIsConnected(true);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to connect to Gmail monitoring service');
      } finally {
        setLoading(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.settings.basic'
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold">Gmail Assistant</h1>
          <button
            onClick={() => login()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            disabled={loading || isConnected}
          >
            {loading ? (
              <>
                <LoadingSpinner />
                Connecting...
              </>
            ) : isConnected ? (
              <>
                <CheckIcon />
                Connected
              </>
            ) : (
              <>
                <GoogleIcon />
                Connect Gmail
              </>
            )}
          </button>
        </header>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isConnected && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Gmail Assistant is Active</h2>
            <p className="text-gray-400">
              Your Gmail account is now being monitored. The assistant will automatically process new emails and perform actions based on your rules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}