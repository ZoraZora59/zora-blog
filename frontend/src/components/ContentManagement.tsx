import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye, FileText } from 'lucide-react';

const mockArticles = [
  {
    id: 1,
    title: '2024年现代前端设计趋势指南',
    status: 'published',
    date: '2024-03-15',
    views: 1250,
    category: '设计'
  },
  {
    id: 2,
    title: 'React 19 新特性深度解析',
    status: 'published',
    date: '2024-03-10',
    views: 3420,
    category: '技术'
  },
  {
    id: 3,
    title: '如何构建一个高可用的 Node.js 服务',
    status: 'draft',
    date: '2024-03-08',
    views: 0,
    category: '后端'
  },
  {
    id: 4,
    title: '极简主义在数字产品中的应用',
    status: 'published',
    date: '2024-03-01',
    views: 890,
    category: '设计'
  },
  {
    id: 5,
    title: '我的年度阅读总结与思考',
    status: 'draft',
    date: '2024-02-28',
    views: 0,
    category: '随笔'
  }
];

interface ContentManagementProps {
  onEdit: (id?: number) => void;
  onView: (id: number) => void;
}

export default function ContentManagement({ onEdit, onView }: ContentManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-6xl mx-auto p-10 lg:p-16">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">内容管理</h1>
          <p className="text-gray-500">管理您的博客文章、草稿和分类。</p>
        </div>
        <button 
          onClick={() => onEdit()}
          className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-600/20"
        >
          <Plus size={18} />
          <span>新建文章</span>
        </button>
      </header>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="搜索文章标题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto justify-center">
          <Filter size={18} className="text-gray-500" />
          <span>筛选</span>
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-medium text-gray-500">文章标题</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">状态</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">分类</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">阅读量</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500">发布日期</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => onView(article.id)}
                    >
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
                        <FileText size={18} />
                      </div>
                      <span className="font-medium text-gray-900 hover:text-blue-600 transition-colors">{article.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      article.status === 'published' 
                        ? 'bg-green-50 text-green-700 border border-green-200/50' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200/50'
                    }`}>
                      {article.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-2.5 py-1 bg-gray-50 rounded-md border border-gray-100">{article.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 flex items-center space-x-1.5">
                    <Eye size={14} className="text-gray-400" />
                    <span>{article.views.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {article.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(article.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="更多">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Static for demo) */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <span className="text-sm text-gray-500">显示 1 至 5 条，共 5 条结果</span>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-white disabled:opacity-50" disabled>上一页</button>
            <button className="px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-white disabled:opacity-50" disabled>下一页</button>
          </div>
        </div>
      </div>
    </div>
  );
}
