import React from 'react';
import { Compass, Settings, BookOpen, LogIn, Info } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'discover', label: '发现', icon: Compass },
    { id: 'management', label: '内容管理', icon: BookOpen },
    { id: 'config', label: '自定义界面', icon: Settings },
  ];

  const bottomItems = [
    { id: 'login', label: '登录', icon: LogIn },
    { id: 'about', label: '关于', icon: Info },
  ];

  return (
    <aside className="w-64 bg-[#fcfcfc] border-r border-gray-100 flex flex-col h-full">
      {/* Profile */}
      <div className="p-8 flex flex-col items-center border-b border-gray-100/50">
        <img
          src="https://picsum.photos/seed/avatar/100/100"
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover mb-4 shadow-sm"
        />
        <h2 className="text-lg font-semibold text-gray-900">左拉左拉</h2>
        <p className="text-sm text-gray-500">研发工程师</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-500'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100/50 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            >
              <Icon size={18} className="text-gray-500" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
