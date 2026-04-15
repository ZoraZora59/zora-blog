
const newsData = [
  {
    id: 1,
    title: '新闻 1',
    desc: '新闻 1 简介：探索未知的领域，发现新的可能。',
    image: 'https://picsum.photos/seed/rain/800/500',
  },
  {
    id: 2,
    title: '新闻 2',
    desc: '新闻 2 简介：城市建筑的魅力与历史的沉淀。',
    image: 'https://picsum.photos/seed/city/800/500',
  },
];

const articlesData = [
  {
    id: 1,
    title: '文章 1',
    desc: '冬日雪景的宁静与美好。',
    image: 'https://picsum.photos/seed/snow/800/500',
  },
  {
    id: 2,
    title: '文章 2',
    desc: '繁华车站的人流与故事。',
    image: 'https://picsum.photos/seed/station/800/500',
  },
];

interface DiscoverProps {
  onNavigate: (id: number) => void;
}

export default function Discover({ onNavigate }: DiscoverProps) {
  return (
    <div className="max-w-5xl mx-auto p-10 lg:p-16">
      {/* Header */}
      <header className="mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">探索页面头部</h1>
        <p className="text-lg text-gray-500">欢迎来到探索页，这里汇聚了最新的动态与文章。</p>
      </header>

      {/* News Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          News
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {newsData.map((item) => (
            <div key={item.id} className="group cursor-pointer" onClick={() => onNavigate(item.id)}>
              <div className="overflow-hidden rounded-2xl mb-4 border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-500 line-clamp-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Articles Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
          Articles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articlesData.map((item) => (
            <div key={item.id} className="group cursor-pointer" onClick={() => onNavigate(item.id)}>
              <div className="overflow-hidden rounded-2xl mb-4 border border-gray-100 shadow-sm transition-all duration-300 group-hover:shadow-md">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-500 line-clamp-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
