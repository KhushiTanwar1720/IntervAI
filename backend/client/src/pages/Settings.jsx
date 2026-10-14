import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Reveal from '../components/Reveal';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.get().then(setSettings).catch(err => setLoadError(err.message));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ai_provider: settings.ai_provider,
        voice_enabled: settings.voice_enabled,
        speech_rate: settings.speech_rate
      };
      if (geminiKey) payload.gemini_api_key = geminiKey;
      if (openaiKey) payload.openai_api_key = openaiKey;
      const result = await api.settings.update(payload);
      setSettings(result);
      setGeminiKey('');
      setOpenaiKey('');
      toast.success('Settings updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  }

  if (loadError && !settings) return <div className="empty-state"><p>{loadError}</p></div>;
  if (!settings) {
    return (
      <div style={{ maxWidth: 640 }}>
        <SkeletonLine size="sm" style={{ height: '1.8rem', marginBottom: '0.6rem', width: '35%' }} />
        <SkeletonLine size="md" style={{ marginBottom: '2rem' }} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Reveal as="div" className="section-header">
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Configure your AI provider and voice preferences. Questions and evaluations fall back to a built-in local engine if no key is set.</p>
      </Reveal>

      <Reveal as="form" className="glass-card" onSubmit={handleSave}>
        <div className="input-group">
          <label className="input-label">AI Provider</label>
          <select className="input-field" value={settings.ai_provider} onChange={e => setSettings({ ...settings, ai_provider: e.target.value })}>
            <option value="local">Local Intelligence Engine (no API key required)</option>
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Gemini API Key {settings.has_gemini_key && <span className="badge badge-emerald" style={{ marginLeft: 6 }}>Configured</span>}</label>
          <input type="password" className="input-field" value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
            placeholder={settings.has_gemini_key ? 'Leave blank to keep existing key' : 'Enter your Gemini API key'} />
        </div>

        <div className="input-group">
          <label className="input-label">OpenAI API Key {settings.has_openai_key && <span className="badge badge-emerald" style={{ marginLeft: 6 }}>Configured</span>}</label>
          <input type="password" className="input-field" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)}
            placeholder={settings.has_openai_key ? 'Leave blank to keep existing key' : 'Enter your OpenAI API key'} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.voice_enabled} onChange={e => setSettings({ ...settings, voice_enabled: e.target.checked })} />
          Enable voice input during mock interviews
        </label>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </Reveal>
    </div>
  );
}
