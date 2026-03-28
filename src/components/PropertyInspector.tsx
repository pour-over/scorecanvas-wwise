import React, { useCallback, useMemo } from 'react';
import { useCanvasStore } from '../stores/canvas';
import type {
  CanvasNode,
  CanvasNodeType,
  CanvasNodeData,
  MusicStateData,
  TransitionData,
  ParameterData,
  StingerData,
  EventData,
  NodeStatus,
  WwiseCurveType,
} from '../types/canvas';

// --- Constants ---

const NODE_STATUS_OPTIONS: NodeStatus[] = [
  'temp', 'wip', 'review', 'blocked', 'approved', 'final', 'needs_revision', 'placeholder',
];

const SYNC_POINT_OPTIONS: TransitionData['syncPoint'][] = ['immediate', 'next-bar', 'next-beat', 'custom'];
const FADE_TYPE_OPTIONS: TransitionData['fadeType'][] = ['crossfade', 'sting', 'cut', 'bridge'];
const CURVE_OPTIONS: WwiseCurveType[] = ['Linear', 'SCurve', 'Log1', 'Log2', 'Log3', 'Exp1', 'Exp2', 'Exp3'];
const PRIORITY_OPTIONS: StingerData['priority'][] = ['low', 'medium', 'high', 'critical'];
const EVENT_TYPE_OPTIONS: EventData['eventType'][] = ['cinematic', 'igc', 'button_press', 'checkpoint', 'scripted_sequence', 'qte'];

const NODE_META: Record<CanvasNodeType, { icon: string; color: string; borderColor: string; label: string }> = {
  musicState:  { icon: '\u266B', color: '#16213e', borderColor: '#0f3460', label: 'Music State' },
  transition:  { icon: '\u21C4', color: '#0f3460', borderColor: '#e94560', label: 'Transition' },
  parameter:   { icon: '\u03B1', color: '#1a1a3e', borderColor: '#a855f7', label: 'Parameter (RTPC)' },
  stinger:     { icon: '\u26A1', color: '#2a1a1e', borderColor: '#f97316', label: 'Stinger' },
  event:       { icon: '\u25B6', color: '#1a1520', borderColor: '#06b6d4', label: 'Event' },
};

// --- Shared input components ---

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] uppercase tracking-widest font-mono mt-3 mb-1" style={{ color: '#8892a4' }}>
      {children}
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <label className="text-[10px] w-[72px] shrink-0 text-right font-mono" style={{ color: '#8892a4' }}>
        {label}
      </label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

const inputClass =
  'w-full bg-[#0a0a18] border border-[#0f3460] rounded px-1.5 py-0.5 text-[10px] text-[#eaeaea] font-mono outline-none focus:border-[#e94560] transition-colors';
const selectClass =
  'w-full bg-[#0a0a18] border border-[#0f3460] rounded px-1 py-0.5 text-[10px] text-[#eaeaea] font-mono outline-none focus:border-[#e94560] transition-colors appearance-none cursor-pointer';

// --- Per-type editors ---

function MusicStateEditor({
  data,
  onChange,
}: {
  data: MusicStateData;
  onChange: (patch: Partial<MusicStateData>) => void;
}) {
  return (
    <>
      <SectionLabel>Core</SectionLabel>
      <FieldRow label="Label">
        <input className={inputClass} value={data.label} onChange={(e) => onChange({ label: e.target.value })} />
      </FieldRow>
      <FieldRow label="Intensity">
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={100}
            value={data.intensity}
            onChange={(e) => onChange({ intensity: Number(e.target.value) })}
            className="flex-1 h-1 accent-[#e94560]"
          />
          <span className="text-[9px] font-mono w-6 text-right" style={{ color: '#eaeaea' }}>
            {data.intensity}
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Looping">
        <input
          type="checkbox"
          checked={data.looping}
          onChange={(e) => onChange({ looping: e.target.checked })}
          className="accent-[#e94560] w-3 h-3"
        />
      </FieldRow>
      <FieldRow label="Stems">
        <input
          className={inputClass}
          value={(data.stems || []).join(', ')}
          placeholder="stem1, stem2, ..."
          onChange={(e) =>
            onChange({
              stems: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </FieldRow>
      <FieldRow label="Asset">
        <input className={inputClass} value={data.asset || ''} onChange={(e) => onChange({ asset: e.target.value })} />
      </FieldRow>

      <SectionLabel>Wwise</SectionLabel>
      <FieldRow label="Path">
        <input
          className={inputClass}
          value={data.wwisePath || ''}
          placeholder="\\Interactive Music\\..."
          onChange={(e) => onChange({ wwisePath: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="ID">
        <input
          className={`${inputClass} opacity-60`}
          value={data.wwiseId || ''}
          readOnly
          title="Wwise GUID (read-only)"
        />
      </FieldRow>

      <SectionLabel>Notes</SectionLabel>
      <FieldRow label="Director">
        <textarea
          className={`${inputClass} resize-none h-10`}
          value={data.directorNote || ''}
          onChange={(e) => onChange({ directorNote: e.target.value })}
        />
      </FieldRow>
      <FieldRow label="Status">
        <select
          className={selectClass}
          value={data.status || ''}
          onChange={(e) => onChange({ status: (e.target.value || undefined) as NodeStatus | undefined })}
        >
          <option value="">None</option>
          {NODE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FieldRow>
    </>
  );
}

function TransitionEditor({
  data,
  onChange,
}: {
  data: TransitionData;
  onChange: (patch: Partial<TransitionData>) => void;
}) {
  return (
    <>
      <SectionLabel>Core</SectionLabel>
      <FieldRow label="Label">
        <input className={inputClass} value={data.label} onChange={(e) => onChange({ label: e.target.value })} />
      </FieldRow>
      <FieldRow label="Duration">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            step={50}
            className={`${inputClass} w-20`}
            value={data.duration}
            onChange={(e) => onChange({ duration: Number(e.target.value) })}
          />
          <span className="text-[9px] font-mono" style={{ color: '#8892a4' }}>ms</span>
        </div>
      </FieldRow>
      <FieldRow label="Sync Point">
        <select className={selectClass} value={data.syncPoint} onChange={(e) => onChange({ syncPoint: e.target.value as TransitionData['syncPoint'] })}>
          {SYNC_POINT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Fade Type">
        <select className={selectClass} value={data.fadeType} onChange={(e) => onChange({ fadeType: e.target.value as TransitionData['fadeType'] })}>
          {FADE_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Fade In">
        <select className={selectClass} value={data.fadeInCurve || ''} onChange={(e) => onChange({ fadeInCurve: (e.target.value || undefined) as WwiseCurveType | undefined })}>
          <option value="">Default</option>
          {CURVE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Fade Out">
        <select className={selectClass} value={data.fadeOutCurve || ''} onChange={(e) => onChange({ fadeOutCurve: (e.target.value || undefined) as WwiseCurveType | undefined })}>
          <option value="">Default</option>
          {CURVE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </FieldRow>

      <SectionLabel>Wwise</SectionLabel>
      <FieldRow label="Synced">
        <input type="checkbox" checked={data.wwiseSynced || false} onChange={(e) => onChange({ wwiseSynced: e.target.checked })} className="accent-[#e94560] w-3 h-3" />
      </FieldRow>
      <FieldRow label="Path">
        <input className={inputClass} value={data.wwisePath || ''} onChange={(e) => onChange({ wwisePath: e.target.value })} />
      </FieldRow>
      <FieldRow label="ID">
        <input className={`${inputClass} opacity-60`} value={data.wwiseId || ''} readOnly />
      </FieldRow>

      <SectionLabel>Notes</SectionLabel>
      <FieldRow label="Director">
        <textarea className={`${inputClass} resize-none h-10`} value={data.directorNote || ''} onChange={(e) => onChange({ directorNote: e.target.value })} />
      </FieldRow>
      <FieldRow label="Status">
        <select className={selectClass} value={data.status || ''} onChange={(e) => onChange({ status: (e.target.value || undefined) as NodeStatus | undefined })}>
          <option value="">None</option>
          {NODE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FieldRow>
    </>
  );
}

function ParameterEditor({
  data,
  onChange,
}: {
  data: ParameterData;
  onChange: (patch: Partial<ParameterData>) => void;
}) {
  return (
    <>
      <SectionLabel>Core</SectionLabel>
      <FieldRow label="Label">
        <input className={inputClass} value={data.label} onChange={(e) => onChange({ label: e.target.value })} />
      </FieldRow>
      <FieldRow label="Param Name">
        <input className={inputClass} value={data.paramName} onChange={(e) => onChange({ paramName: e.target.value })} />
      </FieldRow>
      <FieldRow label="Min">
        <input type="number" className={inputClass} value={data.minValue} onChange={(e) => onChange({ minValue: Number(e.target.value) })} />
      </FieldRow>
      <FieldRow label="Max">
        <input type="number" className={inputClass} value={data.maxValue} onChange={(e) => onChange({ maxValue: Number(e.target.value) })} />
      </FieldRow>
      <FieldRow label="Default">
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={data.minValue}
            max={data.maxValue}
            value={data.defaultValue}
            onChange={(e) => onChange({ defaultValue: Number(e.target.value) })}
            className="flex-1 h-1 accent-[#a855f7]"
          />
          <span className="text-[9px] font-mono w-8 text-right" style={{ color: '#eaeaea' }}>
            {data.defaultValue}
          </span>
        </div>
      </FieldRow>
      <FieldRow label="Description">
        <textarea className={`${inputClass} resize-none h-10`} value={data.description} onChange={(e) => onChange({ description: e.target.value })} />
      </FieldRow>

      <SectionLabel>Wwise</SectionLabel>
      <FieldRow label="Path">
        <input className={inputClass} value={data.wwisePath || ''} onChange={(e) => onChange({ wwisePath: e.target.value })} />
      </FieldRow>
      <FieldRow label="ID">
        <input className={`${inputClass} opacity-60`} value={data.wwiseId || ''} readOnly />
      </FieldRow>

      <SectionLabel>Notes</SectionLabel>
      <FieldRow label="Director">
        <textarea className={`${inputClass} resize-none h-10`} value={data.directorNote || ''} onChange={(e) => onChange({ directorNote: e.target.value })} />
      </FieldRow>
      <FieldRow label="Status">
        <select className={selectClass} value={data.status || ''} onChange={(e) => onChange({ status: (e.target.value || undefined) as NodeStatus | undefined })}>
          <option value="">None</option>
          {NODE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FieldRow>
    </>
  );
}

function StingerEditor({
  data,
  onChange,
}: {
  data: StingerData;
  onChange: (patch: Partial<StingerData>) => void;
}) {
  return (
    <>
      <SectionLabel>Core</SectionLabel>
      <FieldRow label="Label">
        <input className={inputClass} value={data.label} onChange={(e) => onChange({ label: e.target.value })} />
      </FieldRow>
      <FieldRow label="Trigger">
        <input className={inputClass} value={data.trigger} onChange={(e) => onChange({ trigger: e.target.value })} />
      </FieldRow>
      <FieldRow label="Asset">
        <input className={inputClass} value={data.asset} onChange={(e) => onChange({ asset: e.target.value })} />
      </FieldRow>
      <FieldRow label="Priority">
        <select className={selectClass} value={data.priority} onChange={(e) => onChange({ priority: e.target.value as StingerData['priority'] })}>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </FieldRow>

      <SectionLabel>Wwise</SectionLabel>
      <FieldRow label="Path">
        <input className={inputClass} value={data.wwisePath || ''} onChange={(e) => onChange({ wwisePath: e.target.value })} />
      </FieldRow>
      <FieldRow label="ID">
        <input className={`${inputClass} opacity-60`} value={data.wwiseId || ''} readOnly />
      </FieldRow>

      <SectionLabel>Notes</SectionLabel>
      <FieldRow label="Director">
        <textarea className={`${inputClass} resize-none h-10`} value={data.directorNote || ''} onChange={(e) => onChange({ directorNote: e.target.value })} />
      </FieldRow>
      <FieldRow label="Status">
        <select className={selectClass} value={data.status || ''} onChange={(e) => onChange({ status: (e.target.value || undefined) as NodeStatus | undefined })}>
          <option value="">None</option>
          {NODE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FieldRow>
    </>
  );
}

function EventEditor({
  data,
  onChange,
}: {
  data: EventData;
  onChange: (patch: Partial<EventData>) => void;
}) {
  return (
    <>
      <SectionLabel>Core</SectionLabel>
      <FieldRow label="Label">
        <input className={inputClass} value={data.label} onChange={(e) => onChange({ label: e.target.value })} />
      </FieldRow>
      <FieldRow label="Event Type">
        <select className={selectClass} value={data.eventType} onChange={(e) => onChange({ eventType: e.target.value as EventData['eventType'] })}>
          {EVENT_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </FieldRow>
      <FieldRow label="Blueprint">
        <input className={inputClass} value={data.blueprintRef} onChange={(e) => onChange({ blueprintRef: e.target.value })} />
      </FieldRow>
      <FieldRow label="Description">
        <textarea className={`${inputClass} resize-none h-10`} value={data.description} onChange={(e) => onChange({ description: e.target.value })} />
      </FieldRow>

      <SectionLabel>Wwise</SectionLabel>
      <FieldRow label="Path">
        <input className={inputClass} value={data.wwisePath || ''} onChange={(e) => onChange({ wwisePath: e.target.value })} />
      </FieldRow>
      <FieldRow label="ID">
        <input className={`${inputClass} opacity-60`} value={data.wwiseId || ''} readOnly />
      </FieldRow>

      <SectionLabel>Notes</SectionLabel>
      <FieldRow label="Director">
        <textarea className={`${inputClass} resize-none h-10`} value={data.directorNote || ''} onChange={(e) => onChange({ directorNote: e.target.value })} />
      </FieldRow>
      <FieldRow label="Status">
        <select className={selectClass} value={data.status || ''} onChange={(e) => onChange({ status: (e.target.value || undefined) as NodeStatus | undefined })}>
          <option value="">None</option>
          {NODE_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FieldRow>
    </>
  );
}

// --- Main component ---

export default function PropertyInspector() {
  const nodes = useCanvasStore((s) => s.nodes);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNode = useCanvasStore((s) => s.removeNode);

  const selectedNode: CanvasNode | null = useMemo(
    () => nodes.find((n) => n.selected) ?? null,
    [nodes],
  );

  const nodeType = selectedNode?.type as CanvasNodeType | undefined;
  const meta = nodeType ? NODE_META[nodeType] : null;

  const handleChange = useCallback(
    (patch: Partial<CanvasNodeData>) => {
      if (selectedNode) updateNodeData(selectedNode.id, patch);
    },
    [selectedNode, updateNodeData],
  );

  const handleDelete = useCallback(() => {
    if (selectedNode) removeNode(selectedNode.id);
  }, [selectedNode, removeNode]);

  // --- Empty state ---
  if (!selectedNode || !meta || !nodeType) {
    return (
      <div
        className="absolute bottom-4 right-4 w-64 rounded-lg border shadow-xl flex items-center justify-center select-none pointer-events-auto"
        style={{
          background: '#0d0d1a',
          borderColor: '#0f3460',
          height: 48,
        }}
      >
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#8892a4' }}>
          No selection
        </span>
      </div>
    );
  }

  // --- Property editor ---
  const data = selectedNode.data as CanvasNodeData;

  return (
    <div
      className="absolute bottom-4 right-4 w-72 rounded-lg border shadow-2xl flex flex-col pointer-events-auto"
      style={{
        background: '#0d0d1a',
        borderColor: meta.borderColor,
        maxHeight: 'calc(100vh - 160px)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg border-b shrink-0"
        style={{ background: meta.color, borderColor: meta.borderColor }}
      >
        <span className="text-sm" style={{ color: meta.borderColor }}>
          {meta.icon}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#eaeaea' }}>
          {meta.label}
        </span>
        <span className="ml-auto text-[9px] font-mono truncate max-w-[80px]" style={{ color: '#8892a4' }}>
          {selectedNode.id.slice(0, 8)}
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-1.5 custom-scrollbar" style={{ scrollbarWidth: 'thin' }}>
        {nodeType === 'musicState' && (
          <MusicStateEditor data={data as MusicStateData} onChange={handleChange} />
        )}
        {nodeType === 'transition' && (
          <TransitionEditor data={data as TransitionData} onChange={handleChange} />
        )}
        {nodeType === 'parameter' && (
          <ParameterEditor data={data as ParameterData} onChange={handleChange} />
        )}
        {nodeType === 'stinger' && (
          <StingerEditor data={data as StingerData} onChange={handleChange} />
        )}
        {nodeType === 'event' && (
          <EventEditor data={data as EventData} onChange={handleChange} />
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t shrink-0" style={{ borderColor: '#0f3460' }}>
        <button
          onClick={handleDelete}
          className="w-full text-[10px] font-mono uppercase tracking-widest py-1 rounded border transition-colors hover:bg-[#e94560]/20"
          style={{ color: '#e94560', borderColor: '#e94560', background: 'transparent' }}
        >
          Delete Node
        </button>
      </div>
    </div>
  );
}
