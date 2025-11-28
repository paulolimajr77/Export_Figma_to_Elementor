import React from 'react';
import './app.css';
import { AppTabs } from './components/AppTabs';
import { LayoutPanel } from './components/LayoutPanel';
import { IAPanel } from './components/IAPanel';
import { WPPanel } from './components/WPPanel';
import { HelpPanel } from './components/HelpPanel';

export function App() {
  const [tab, setTab] = React.useState<'layout' | 'ai' | 'wp' | 'help'>('layout');
  return (
    <div className="app">
      <AppTabs active={tab} onChange={setTab} />
      <div className="tab-contents">
        {tab === 'layout' && <LayoutPanel />}
        {tab === 'ai' && <IAPanel />}
        {tab === 'wp' && <WPPanel />}
        {tab === 'help' && <HelpPanel />}
      </div>
    </div>
  );
}
