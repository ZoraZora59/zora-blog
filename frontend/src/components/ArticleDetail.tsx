import { ArrowLeft, Calendar, Eye, Tag, Share2, Heart } from 'lucide-react';

interface ArticleDetailProps {
  id?: number;
  onBack: () => void;
}

export default function ArticleDetail({ id: _id, onBack }: ArticleDetailProps) {
  return (
    <div className="max-w-3xl mx-auto p-8 md:p-12 lg:p-16 bg-white min-h-full shadow-sm border-x border-gray-50">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between mb-10">
        <button 
          onClick={onBack} 
          className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          <span className="font-medium">返回</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
            <Heart size={20} />
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
            <Share2 size={20} />
          </button>
        </div>
      </nav>
      
      {/* Article Header */}
      <header className="mb-12">
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          <span className="flex items-center space-x-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
            <Tag size={14} />
            <span>设计趋势</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Calendar size={14} />
            <span>2024-03-15</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <Eye size={14} />
            <span>1,250 阅读</span>
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
          2024年现代前端设计趋势指南与实践
        </h1>
        
        <div className="flex items-center space-x-4 mb-8">
          <img 
            src="https://picsum.photos/seed/avatar/100/100" 
            alt="Author" 
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-50 shadow-sm"
          />
          <div>
            <div className="font-medium text-gray-900">左拉左拉</div>
            <div className="text-sm text-gray-500">研发工程师 / 设计爱好者</div>
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
          <img 
            src="https://picsum.photos/seed/design/1200/600" 
            alt="Cover" 
            className="w-full h-auto md:h-[400px] object-cover hover:scale-105 transition-transform duration-700" 
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      {/* Article Content */}
      <article className="space-y-6 text-gray-600 leading-relaxed text-lg">
        <p className="text-xl text-gray-500 leading-relaxed mb-8">
          随着技术的不断演进，前端设计也在经历着深刻的变革。在2024年，我们看到了几个明显的趋势，这些趋势不仅改变了产品的外观，更重塑了用户与数字世界的交互方式。
        </p>
        
        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">1. 极简主义与大留白 (Bento Grid)</h2>
        <p>
          极简主义不仅仅是减少元素，更是关于如何通过留白来引导用户的注意力。现代界面越来越倾向于使用大量的负空间，结合最近流行的 Bento Grid（便当盒网格）布局，让信息呈现更加模块化和清晰。
        </p>
        <p>
          这种布局方式源于苹果的 UI 设计语言，通过不同大小的圆角矩形卡片，将复杂的信息层级扁平化，即便是密集的数据也能显得井然有序。
        </p>

        <div className="my-10 p-8 bg-gray-50 rounded-3xl border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 实践建议</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>增加卡片之间的间距（Gap），通常使用 16px 或 24px。</li>
            <li>统一圆角大小，推荐使用 16px 到 24px 的大圆角。</li>
            <li>去除多余的边框，使用极浅的背景色或微弱的阴影来区分层级。</li>
          </ul>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">2. 微交互与空间感</h2>
        <p>
          微交互是提升用户体验的关键。从按钮的悬停效果到页面切换的平滑过渡，这些细节决定了产品的质感。2024年，我们看到更多的物理直觉动画被应用到 Web 中。
        </p>
        
        <blockquote className="border-l-4 border-blue-500 pl-6 my-8 italic text-gray-500 text-xl">
          "设计不仅仅是外观和感觉。设计是它是如何工作的。" <br/>
          <span className="text-base text-gray-400 mt-2 block">— 史蒂夫·乔布斯</span>
        </blockquote>

        <p>
          结合 CSS 的 <code>backdrop-filter</code> 和柔和的渐变，设计师们正在创造出具有玻璃质感（Glassmorphism）和深度空间感的界面，让网页不再是扁平的纸张，而是具有层次的立体空间。
        </p>
      </article>
      
      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-gray-500 text-sm">
          最后更新于 2024-03-16
        </div>
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors"># UI设计</span>
          <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors"># 前端开发</span>
          <span className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-sm border border-gray-100 hover:bg-gray-100 cursor-pointer transition-colors"># 趋势</span>
        </div>
      </footer>
    </div>
  );
}
