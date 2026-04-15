/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

// Components
import Sidebar from './components/Sidebar';
import Discover from './components/Discover';
import Configuration from './components/Configuration';
import ContentManagement from './components/ContentManagement';
import ArticleDetail from './components/ArticleDetail';
import ArticleEditor from './components/ArticleEditor';

export default function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [subView, setSubView] = useState<{ type: 'none' | 'edit' | 'detail', id?: number }>({ type: 'none' });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSubView({ type: 'none' });
  };

  let content;

  if (subView.type === 'edit') {
    content = <ArticleEditor id={subView.id} onBack={() => setSubView({ type: 'none' })} />;
  } else if (subView.type === 'detail') {
    content = <ArticleDetail id={subView.id} onBack={() => setSubView({ type: 'none' })} />;
  } else {
    if (activeTab === 'discover') {
      content = <Discover onNavigate={(id) => setSubView({ type: 'detail', id })} />;
    } else if (activeTab === 'management') {
      content = (
        <ContentManagement 
          onEdit={(id) => setSubView({ type: 'edit', id })} 
          onView={(id) => setSubView({ type: 'detail', id })} 
        />
      );
    } else if (activeTab === 'config') {
      content = <Configuration />;
    }
  }

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      <main className="flex-1 overflow-y-auto bg-gray-50/50 relative">
        {content}
      </main>
    </div>
  );
}
