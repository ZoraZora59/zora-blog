import React, { useState } from 'react';
import { Save, Image as ImageIcon, Type, Layout } from 'lucide-react';

export default function Configuration() {
  const [profile, setProfile] = useState({
    name: '左拉左拉',
    role: '研发工程师',
    avatar: 'https://picsum.photos/seed/avatar/100/100'
  });

  return (
    <div className="max-w-4xl mx-auto p-10 lg:p-16">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">自定义界面</h1>
          <p className="text-gray-500">管理您的个人资料和博客外观设置。</p>
        </div>
        <button className="flex items-center space-x-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors font-medium">
          <Save size={18} />
          <span>保存更改</span>
        </button>
      </header>

      <div className="space-y-10">
        {/* Profile Settings */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Type size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">个人资料</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-shrink-0 flex flex-col items-center space-y-4">
              <img 
                src={profile.avatar} 
                alt="Avatar Preview" 
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm"
              />
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                <ImageIcon size={16} />
                <span>更换头像</span>
              </button>
            </div>
            
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">昵称</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">头衔 / 职业</label>
                <input 
                  type="text" 
                  value={profile.role}
                  onChange={(e) => setProfile({...profile, role: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">个人简介</label>
                <textarea 
                  rows={3}
                  placeholder="写点什么来介绍自己..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Layout size={20} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">外观设置</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-gray-900 transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="h-24 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-1/2 h-2/3 bg-white rounded shadow-sm flex flex-col p-2 space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded-sm"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded-sm"></div>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">极简网格</h3>
              <p className="text-sm text-gray-500 mt-1">干净、现代的卡片式布局</p>
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full"></div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-gray-900 transition-colors relative overflow-hidden group">
              <div className="absolute inset-0 bg-gray-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="h-24 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <div className="w-1/2 h-2/3 bg-white rounded shadow-sm flex flex-col p-2 space-y-2">
                  <div className="w-full h-8 bg-gray-200 rounded-sm"></div>
                  <div className="w-full h-2 bg-gray-200 rounded-sm"></div>
                </div>
              </div>
              <h3 className="font-medium text-gray-900">大图沉浸</h3>
              <p className="text-sm text-gray-500 mt-1">突出视觉影像的杂志风格</p>
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-gray-300"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
