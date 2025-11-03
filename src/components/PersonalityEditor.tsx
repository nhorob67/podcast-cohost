import { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { API_CONFIG, getHeaders } from '../lib/config';

interface Personality {
  id: string;
  name: string;
  instructions: string;
  speaking_style: {
    tone: string;
    pace: string;
    formality: string;
  };
  knowledge_domains: string[];
  is_active: boolean;
}

export function PersonalityEditor() {
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPersonality();
  }, []);

  const loadPersonality = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_CONFIG.personality, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load personality');
      const data = await response.json();
      if (data.active) {
        setPersonality(data.active);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePersonality = async () => {
    if (!personality) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_CONFIG.personality}/${personality.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: personality.name,
          instructions: personality.instructions,
          speaking_style: personality.speaking_style,
          knowledge_domains: personality.knowledge_domains,
        }),
      });

      if (!response.ok) throw new Error('Failed to save personality');

      setSuccess('Personality saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Personality, value: any) => {
    if (!personality) return;
    setPersonality({ ...personality, [field]: value });
  };

  const updateSpeakingStyle = (field: string, value: string) => {
    if (!personality) return;
    setPersonality({
      ...personality,
      speaking_style: { ...personality.speaking_style, [field]: value },
    });
  };

  const addKnowledgeDomain = () => {
    if (!personality) return;
    setPersonality({
      ...personality,
      knowledge_domains: [...personality.knowledge_domains, ''],
    });
  };

  const updateKnowledgeDomain = (index: number, value: string) => {
    if (!personality) return;
    const domains = [...personality.knowledge_domains];
    domains[index] = value;
    setPersonality({ ...personality, knowledge_domains: domains });
  };

  const removeKnowledgeDomain = (index: number) => {
    if (!personality) return;
    const domains = personality.knowledge_domains.filter((_, i) => i !== index);
    setPersonality({ ...personality, knowledge_domains: domains });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!personality) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
        <p className="text-yellow-800">No personality configuration found. Please initialize the system first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Personality Name</label>
            <input
              type="text"
              value={personality.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              System Instructions
              <span className="text-slate-500 text-xs ml-2">(Core personality prompt)</span>
            </label>
            <textarea
              value={personality.instructions}
              onChange={(e) => updateField('instructions', e.target.value)}
              rows={12}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Speaking Style</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tone</label>
            <input
              type="text"
              value={personality.speaking_style.tone}
              onChange={(e) => updateSpeakingStyle('tone', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pace</label>
            <input
              type="text"
              value={personality.speaking_style.pace}
              onChange={(e) => updateSpeakingStyle('pace', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Formality</label>
            <input
              type="text"
              value={personality.speaking_style.formality}
              onChange={(e) => updateSpeakingStyle('formality', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Knowledge Domains</h3>
          <button
            onClick={addKnowledgeDomain}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Domain
          </button>
        </div>

        <div className="space-y-2">
          {personality.knowledge_domains.map((domain, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={domain}
                onChange={(e) => updateKnowledgeDomain(index, e.target.value)}
                placeholder="e.g., Business Strategy"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeKnowledgeDomain(index)}
                className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={loadPersonality}
          disabled={saving}
          className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
        >
          Reset Changes
        </button>
        <button
          onClick={savePersonality}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Personality
            </>
          )}
        </button>
      </div>
    </div>
  );
}
