import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { ReferenceSettings } from '../types';
import { API_CONFIG, getHeaders } from '../lib/config';

export function SettingsPanel() {
  const [referenceFreq, setReferenceFreq] = useState<ReferenceSettings>({
    level: 'sometimes',
    weight: 0.5
  });
  const [maxContext, setMaxContext] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(API_CONFIG.settings, {
        headers: getHeaders(),
      });
      const data = await response.json();
      setReferenceFreq(data.reference_frequency);
      setMaxContext(data.max_context_conversations);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      await fetch(`${API_CONFIG.settings}/reference-frequency`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(referenceFreq),
      });

      await fetch(`${API_CONFIG.settings}/max-context`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ count: maxContext }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const levelOptions: Array<'never' | 'rarely' | 'sometimes' | 'often' | 'always'> = [
    'never',
    'rarely',
    'sometimes',
    'often',
    'always'
  ];

  const levelDescriptions = {
    never: 'Never reference past conversations',
    rarely: 'Rarely reference (20% chance)',
    sometimes: 'Sometimes reference (50% chance)',
    often: 'Often reference (80% chance)',
    always: 'Always reference past conversations'
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Reference Settings
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Reference Frequency Level
          </label>
          <select
            value={referenceFreq.level}
            onChange={(e) => setReferenceFreq({
              ...referenceFreq,
              level: e.target.value as ReferenceSettings['level']
            })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {levelOptions.map((level) => (
              <option key={level} value={level}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </option>
            ))}
          </select>
          <p className="text-sm text-slate-500 mt-1">
            {levelDescriptions[referenceFreq.level]}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Weight Factor: {referenceFreq.weight.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={referenceFreq.weight}
            onChange={(e) => setReferenceFreq({
              ...referenceFreq,
              weight: parseFloat(e.target.value)
            })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-sm text-slate-500 mt-1">
            Fine-tune the probability of referencing past conversations
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Max Context Conversations: {maxContext}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={maxContext}
            onChange={(e) => setMaxContext(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-sm text-slate-500 mt-1">
            Maximum number of past conversations to include in context
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
