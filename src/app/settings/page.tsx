'use client';

import React from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'

function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear Gmail access token
    localStorage.removeItem('gmail_access_token');
    // Clear any other stored data if needed
    localStorage.removeItem('autoLabel_enabled');
    localStorage.removeItem('processedEmailCount');
    
    // Redirect to home page
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-black">
      <Sidebar />
      <div className="ml-64 p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
          
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </main>
  )
}

export default SettingsPage