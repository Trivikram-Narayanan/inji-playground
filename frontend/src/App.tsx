import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { MainFlow } from './components/MainFlow';
import { Dashboard } from './components/Dashboard';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flow' | 'archive'>('flow');

  return (
    <Layout activeTab={activeTab} onSelectTab={setActiveTab}>
      {activeTab === 'flow' ? <MainFlow /> : <Dashboard />}
    </Layout>
  );
};

export default App;
