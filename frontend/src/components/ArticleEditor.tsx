import { useState } from 'react';
import { ArrowLeft, Save, Image as ImageIcon, Settings, Send, Bold, Italic, Underline, Link as LinkIcon, List, Quote } from 'lucide-react';

interface ArticleEditorProps {
  id?: number;
  onBack: () => void;
}

export default function ArticleEditor({ id, onBack }: ArticleEditorProps) {
  const [title, setTitle] = useState(id ? '2024年现代前端设计趋势指南' : '');
  const [content, setContent] = useState(id ? '随着技术的不断演进，前端设计也在经历着深刻的变革...\n\n## 1. 极简主义与大留白\n\n极简主义不仅仅是减少元素，更是关于如何通过留白来引导用户的注意力。' : '');

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 lg:p-12 flex flex-col min-h-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack} 
            className="flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{id ? '编辑文章' : '新建文章'}</h1>
            <p className="text-sm text-gray-500">{id ? '自动保存于 10:42' : '草稿未保存'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium">
            <Save size={18} className="text-gray-500" />
            <span>保存草稿</span>
          </button>
          <button className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 font-medium">
            <Send size={18} />
            <span>发布文章</span>
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col space-y-6">
          <input 
            type="text" 
            placeholder="输入文章标题..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-3xl md:text-4xl font-bold text-gray-900 placeholder-gray-300 border-none focus:outline-none focus:ring-0 bg-transparent px-0"
          />
          
          <div className="flex-1 bg-white border border-gray-200 rounded-3xl shadow-sm flex flex-col overflow-hidden min-h-[500px]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-100 bg-gray-50/50">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><Bold size={18}/></button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><Italic size={18}/></button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><Underline size={18}/></button>
              <div className="w-px h-5 bg-gray-300 mx-2"></div>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><List size={18}/></button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><Quote size={18}/></button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"><LinkIcon size={18}/></button>
              <div className="w-px h-5 bg-gray-300 mx-2"></div>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors flex items-center space-x-1">
                <ImageIcon size={18}/>
                <span className="text-sm font-medium pr-1">插入图片</span>
              </button>
            </div>
            
            {/* Textarea */}
            <textarea 
              className="flex-1 w-full p-6 resize-none border-none focus:outline-none focus:ring-0 text-gray-700 text-lg leading-relaxed bg-white"
              placeholder="开始编写正文... 支持 Markdown 语法"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Right: Settings Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-6 flex items-center space-x-2">
              <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600">
                <Settings size={18} />
              </div>
              <span>文章设置</span>
            </h3>
            
            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700">
                  <option>设计</option>
                  <option>技术</option>
                  <option>随笔</option>
                  <option>生活</option>
                </select>
              </div>
              
              {/* Cover Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">封面图</label>
                <div className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-100 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer group">
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <span className="text-sm font-medium">点击或拖拽上传封面</span>
                  <span className="text-xs text-gray-400 mt-1">建议尺寸 1200x600</span>
                </div>
              </div>
              
              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">摘要</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-gray-700 text-sm leading-relaxed"
                  placeholder="简短描述文章内容，将显示在文章列表中..."
                ></textarea>
              </div>
              
              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                <input 
                  type="text" 
                  placeholder="输入标签，按回车添加" 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 text-sm"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100 flex items-center cursor-pointer hover:bg-blue-100">
                    前端设计 <span className="ml-1 text-blue-400 hover:text-blue-600">×</span>
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium border border-blue-100 flex items-center cursor-pointer hover:bg-blue-100">
                    UI/UX <span className="ml-1 text-blue-400 hover:text-blue-600">×</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
