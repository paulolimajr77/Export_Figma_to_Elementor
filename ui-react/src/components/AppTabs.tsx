import React from 'react';

type Tab = 'layout' | 'ai' | 'wp' | 'help';

export function AppTabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'layout', label: 'Layout → Elementor' },
    { id: 'ai', label: 'Configuração da IA' },
    { id: 'wp', label: 'WordPress' },
    { id: 'help', label: 'Ajuda' },
  ];
  return (
    <div className="tab-bar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={`tab-btn ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
