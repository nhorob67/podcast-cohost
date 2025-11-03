import { useState } from 'react';
import { MessageSquare, FileText, Settings as SettingsIcon, User } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { ReportUpload } from './ReportUpload';
import { SettingsPanel } from './SettingsPanel';
import { PersonalityEditor } from './PersonalityEditor';

type Tab = 'conversations' | 'reports' | 'settings' | 'personality';

export function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('conversations');

  const tabs = [
    { id: 'conversations' as Tab, label: 'Conversations', icon: MessageSquare },
    { id: 'reports' as Tab, label: 'Reports', icon: FileText },
    { id: 'personality' as Tab, label: 'Personality', icon: User },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Podcast Management Dashboard
          </h1>
          <p className="text-slate-600">
            Manage your conversations, reports, and AI personality settings
          </p>
        </header>

        <div className="mb-6 border-b border-slate-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'conversations' && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Recent Conversations
                </h2>
                <ConversationList />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <ReportUpload onUploadComplete={() => {
                  console.log('Upload complete');
                }} />
              </div>
            )}

            {activeTab === 'personality' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">
                    AI Personality Configuration
                  </h2>
                  <PersonalityEditor />
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <SettingsPanel />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Quick Tips</h3>
              {activeTab === 'conversations' && (
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Click any conversation to view full transcript</li>
                  <li>• Archive conversations to keep them but hide from view</li>
                  <li>• Delete removes conversations permanently</li>
                </ul>
              )}
              {activeTab === 'reports' && (
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Supported formats: Markdown, PDF, TXT, DOCX</li>
                  <li>• Reports are automatically added to Elias's knowledge</li>
                  <li>• Use tags to organize reports by topic or project</li>
                </ul>
              )}
              {activeTab === 'personality' && (
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Modify the system prompt to change Elias's behavior</li>
                  <li>• Adjust speaking style to match your preferred tone</li>
                  <li>• Add knowledge domains to focus expertise areas</li>
                </ul>
              )}
              {activeTab === 'settings' && (
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Reference frequency controls how often Elias mentions past conversations</li>
                  <li>• Weight factor fine-tunes the probability</li>
                  <li>• Max context limits memory usage</li>
                </ul>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-semibold text-slate-900 mb-3">System Status</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">AI Model</span>
                  <span className="text-slate-900 font-medium">GPT-4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Voice</span>
                  <span className="text-slate-900 font-medium">Onyx</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
