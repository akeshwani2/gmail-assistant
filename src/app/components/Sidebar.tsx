'use client';

import { HomeIcon, SettingsIcon, WorkflowIcon, BrainCog, MessageCirclePlus } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
      { icon: HomeIcon, label: 'Home', path: '/' },
      { icon: BrainCog, label: 'Automations', path: '/automations' },
      { icon: MessageCirclePlus, label: 'Chat', path: '/chat' },
      { icon: WorkflowIcon, label: 'Integrations', path: '/integrations' },
      { icon: MessageCirclePlus, label: 'Logs', path: '/logs' },
      { icon: SettingsIcon, label: 'Settings', path: '/settings' },

    ];

    return (
      <nav className="fixed left-0 top-0 h-screen w-64 bg-[#0a0a0a] border-r border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-6 px-2">
          <img src="/gmail-icon.svg" alt="Gmail" className="w-6 h-6" />
          <span className="text-gray-200">Gmail Assistant</span>
        </div>
        
        <div className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.path}
              icon={item.icon} 
              label={item.label} 
              active={pathname === item.path}
              onClick={() => router.push(item.path)}
            />
          ))}
        </div>
      </nav>
    );
  }
  
  function SidebarItem({ 
    icon: Icon, 
    label, 
    active, 
    onClick 
  }: { 
    icon: any, 
    label: string, 
    active?: boolean,
    onClick: () => void 
  }) {
    return (
      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm
          ${active 
            ? 'bg-gray-800 text-white' 
            : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
          }`}
      >
        <Icon className="w-5 h-5" />
        {label}
      </button>
    );
  }
  
  // Icons components...