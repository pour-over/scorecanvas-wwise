import { useState, useEffect } from 'react';
import { useCanvasStore } from '../stores/canvas';

interface Props {
  onClose: () => void;
}

interface SettingsData {
  anthropicApiKey: string;
  kieApiKey: string;
  waapiUrl: string;
  autoConnectOnLaunch: boolean;
  autoSaveInterval: number;
  defaultViewMode: 'detailed' | 'simple';
  showGuidedTourOnNewProject: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  anthropicApiKey: '',
  kieApiKey: '',
  waapiUrl: 'ws://127.0.0.1:8080/waapi',
  autoConnectOnLaunch: false,
  autoSaveInterval: 2,
  defaultViewMode: 'detailed',
  showGuidedTourOnNewProject: true,
};

const STORAGE_KEY = 'scorecanvas-settings';

function loadSettings(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(data: SettingsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const INTERVAL_OPTIONS = [
  { value: 1, label: '1 min' },
  { value: 2, label: '2 min' },
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
];

export default function SettingsModal({ onClose }: Props) {
  const { autoSaveEnabled, setAutoSave } = useCanvasStore();
  const [settings, setSettings] = useState<SettingsData>(loadSettings);
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showKieKey, setShowKieKey] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalAutoSave(autoSaveEnabled);
  }, [autoSaveEnabled]);

  const toggleSection = (section: string) => {
    setCollapsed((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveSettings(settings);
    setAutoSave(localAutoSave);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="rounded-lg w-[480px] max-h-[85vh] flex flex-col shadow-2xl"
        style={{ background: '#0d0d1a', border: '1px solid #0f3460' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid #0f3460' }}
        >
          <span
            className="uppercase tracking-widest font-mono"
            style={{ fontSize: '11px', color: '#eaeaea' }}
          >
            Settings
          </span>
          <button
            onClick={onClose}
            className="hover:opacity-80"
            style={{ color: '#8892a4', fontSize: '14px' }}
          >
            x
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ fontSize: '11px' }}>
          {/* ── API Keys ── */}
          <Section
            title="API Keys"
            collapsed={!!collapsed['api']}
            onToggle={() => toggleSection('api')}
          >
            <label className="block mb-2" style={{ color: '#eaeaea' }}>
              <span className="block mb-1">Anthropic API Key</span>
              <div className="flex gap-1">
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={settings.anthropicApiKey}
                  onChange={(e) => update('anthropicApiKey', e.target.value)}
                  placeholder="sk-ant-..."
                  className="flex-1 rounded px-2 py-1 font-mono outline-none"
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid #0f3460',
                    color: '#eaeaea',
                    fontSize: '10px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                  className="rounded px-2 py-1"
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid #0f3460',
                    color: '#8892a4',
                    fontSize: '9px',
                  }}
                >
                  {showAnthropicKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </label>

            <label className="block mb-2" style={{ color: '#eaeaea' }}>
              <span className="block mb-1">kie.ai API Key</span>
              <div className="flex gap-1">
                <input
                  type={showKieKey ? 'text' : 'password'}
                  value={settings.kieApiKey}
                  onChange={(e) => update('kieApiKey', e.target.value)}
                  placeholder="kie-..."
                  className="flex-1 rounded px-2 py-1 font-mono outline-none"
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid #0f3460',
                    color: '#eaeaea',
                    fontSize: '10px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKieKey(!showKieKey)}
                  className="rounded px-2 py-1"
                  style={{
                    background: '#0d0d1a',
                    border: '1px solid #0f3460',
                    color: '#8892a4',
                    fontSize: '9px',
                  }}
                >
                  {showKieKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </label>

            <p style={{ color: '#8892a4', fontSize: '9px', lineHeight: '1.4' }}>
              API keys are stored locally and never sent to third parties.
            </p>
          </Section>

          {/* ── Wwise Connection ── */}
          <Section
            title="Wwise Connection"
            collapsed={!!collapsed['wwise']}
            onToggle={() => toggleSection('wwise')}
          >
            <label className="block mb-2" style={{ color: '#eaeaea' }}>
              <span className="block mb-1">WAAPI URL</span>
              <input
                type="text"
                value={settings.waapiUrl}
                onChange={(e) => update('waapiUrl', e.target.value)}
                className="w-full rounded px-2 py-1 font-mono outline-none"
                style={{
                  background: '#0d0d1a',
                  border: '1px solid #0f3460',
                  color: '#eaeaea',
                  fontSize: '10px',
                }}
              />
            </label>

            <Toggle
              label="Auto-connect on launch"
              checked={settings.autoConnectOnLaunch}
              onChange={(v) => update('autoConnectOnLaunch', v)}
            />
          </Section>

          {/* ── Auto-save ── */}
          <Section
            title="Auto-save"
            collapsed={!!collapsed['autosave']}
            onToggle={() => toggleSection('autosave')}
          >
            <Toggle
              label="Enable auto-save"
              checked={localAutoSave}
              onChange={setLocalAutoSave}
            />

            <label className="block mt-2" style={{ color: '#eaeaea' }}>
              <span className="block mb-1">Save interval</span>
              <select
                value={settings.autoSaveInterval}
                onChange={(e) => update('autoSaveInterval', Number(e.target.value))}
                className="w-full rounded px-2 py-1 outline-none"
                style={{
                  background: '#0d0d1a',
                  border: '1px solid #0f3460',
                  color: '#eaeaea',
                  fontSize: '10px',
                }}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </Section>

          {/* ── General ── */}
          <Section
            title="General"
            collapsed={!!collapsed['general']}
            onToggle={() => toggleSection('general')}
          >
            <label className="block mb-2" style={{ color: '#eaeaea' }}>
              <span className="block mb-1">Default view mode</span>
              <div className="flex gap-1">
                {(['detailed', 'simple'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => update('defaultViewMode', mode)}
                    className="flex-1 rounded px-2 py-1 uppercase tracking-wider font-mono"
                    style={{
                      fontSize: '9px',
                      background:
                        settings.defaultViewMode === mode ? '#e94560' : '#0d0d1a',
                      border: `1px solid ${settings.defaultViewMode === mode ? '#e94560' : '#0f3460'}`,
                      color: settings.defaultViewMode === mode ? '#eaeaea' : '#8892a4',
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </label>

            <Toggle
              label="Show guided tour on new project"
              checked={settings.showGuidedTourOnNewProject}
              onChange={(v) => update('showGuidedTourOnNewProject', v)}
            />
          </Section>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid #0f3460' }}
        >
          <button
            onClick={onClose}
            className="rounded px-4 py-1.5 uppercase tracking-wider font-mono"
            style={{
              fontSize: '10px',
              background: 'transparent',
              border: '1px solid #0f3460',
              color: '#8892a4',
            }}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            className="rounded px-4 py-1.5 uppercase tracking-wider font-mono"
            style={{
              fontSize: '10px',
              background: '#e94560',
              border: '1px solid #e94560',
              color: '#eaeaea',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function Section({
  title,
  collapsed,
  onToggle,
  children,
}: {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded" style={{ background: '#16213e', border: '1px solid #0f3460' }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2"
        style={{ color: '#eaeaea' }}
      >
        <span className="uppercase tracking-widest font-mono" style={{ fontSize: '10px' }}>
          {title}
        </span>
        <span style={{ color: '#8892a4', fontSize: '10px' }}>{collapsed ? '+' : '-'}</span>
      </button>
      {!collapsed && (
        <div className="px-3 pb-3" style={{ borderTop: '1px solid #0f3460' }}>
          <div className="pt-2">{children}</div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer" style={{ color: '#eaeaea' }}>
      <span style={{ fontSize: '11px' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className="relative w-8 h-4 rounded-full transition-colors"
        style={{ background: checked ? '#e94560' : '#0f3460' }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform"
          style={{
            background: '#eaeaea',
            left: checked ? '17px' : '2px',
          }}
        />
      </div>
    </label>
  );
}
