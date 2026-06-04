"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BrainCircuit, Radio, AlertCircle, Loader2,
  ShieldAlert, Clock, Fingerprint, Activity, Zap
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface RadioMessage {
  id: number; time: string; lap: number; src: string; team: string; text: string;
  flagged: boolean; deceptionType: string | null; bluffProbability: number | null;
  graniteReasoning: string | null; analyzing: boolean;
}
interface TelemetryState {
  lap: number; gripLevel: number; tyreDeg: number;
  lapDelta: number; gapToLeader: number; safetyCar: boolean;
}
interface GraniteResult {
  recommendedAction: string; reasoning: string; confidenceScore: number;
  bluffProbability: number; signalMismatchDetected: boolean; deceptionType: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const RADIO_SCRIPT: Omit<RadioMessage, 'id' | 'analyzing'>[] = [
  { time: "14:28:44", lap: 38, src: "SAI", team: "Ferrari", text: "Engine clipping slightly at turn 8.", flagged: false, deceptionType: null, bluffProbability: 0.08, graniteReasoning: null },
  { time: "14:30:12", lap: 39, src: "NOR", team: "McLaren", text: "Struggling a bit on the front left.", flagged: false, deceptionType: null, bluffProbability: 0.11, graniteReasoning: null },
  { time: "14:31:55", lap: 40, src: "XAVI", team: "Ferrari", text: "Box not planned. Focus on the gap ahead.", flagged: true, deceptionType: "STAY_OUT_DECEPTION", bluffProbability: 0.61, graniteReasoning: "Historical: Ferrari pits within 2 laps of undercut window in 78% of identical scenarios." },
  { time: "14:32:01", lap: 40, src: "VER", team: "Red Bull", text: "I have no grip! We need to box!", flagged: true, deceptionType: "TYRE_CONDITION_BLUFF", bluffProbability: 0.94, graniteReasoning: "Grip sensors read 92% optimal. Radio classified as deliberate disinformation to force undercut response." },
  { time: "14:32:05", lap: 40, src: "LAMBIASE", team: "Red Bull", text: "Understood Max. Box this lap.", flagged: true, deceptionType: "STAY_OUT_DECEPTION", bluffProbability: 0.87, graniteReasoning: "Confirms box after bluff. Consistent with 4/4 historical SC-window pit pattern." },
  { time: "14:34:20", lap: 41, src: "BONNINGTON", team: "Mercedes", text: "Push now Lewis, push push push.", flagged: false, deceptionType: null, bluffProbability: 0.12, graniteReasoning: null },
  { time: "14:36:44", lap: 42, src: "LAMBIASE", team: "Red Bull", text: "We're staying out, no pit this lap.", flagged: true, deceptionType: "STAY_OUT_DECEPTION", bluffProbability: 0.89, graniteReasoning: "CRITICAL: Same gap (2.1s) + SC — Lambiase broadcast 'staying out' 4 times in this scenario. Pitted all 4 within 2 laps." },
];
const TELEMETRY: TelemetryState[] = [
  { lap: 38, gripLevel: 94, tyreDeg: 41, lapDelta: 0.08, gapToLeader: 4.8, safetyCar: false },
  { lap: 39, gripLevel: 91, tyreDeg: 48, lapDelta: 0.14, gapToLeader: 4.1, safetyCar: false },
  { lap: 40, gripLevel: 88, tyreDeg: 57, lapDelta: 0.22, gapToLeader: 3.2, safetyCar: false },
  { lap: 41, gripLevel: 92, tyreDeg: 52, lapDelta: 0.18, gapToLeader: 2.6, safetyCar: true },
  { lap: 42, gripLevel: 87, tyreDeg: 63, lapDelta: 0.29, gapToLeader: 2.1, safetyCar: true },
  { lap: 43, gripLevel: 83, tyreDeg: 71, lapDelta: 0.41, gapToLeader: 1.8, safetyCar: false },
];

// ── F1 Car SVG ────────────────────────────────────────────────────────────────
function F1Car({ alert }: { alert: boolean }) {
  const glowColor = alert ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.2)';
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
      <div style={{
        position: 'absolute', width: '55%', height: 30, bottom: 4,
        background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
        left: '50%', transform: 'translateX(-50%)', filter: 'blur(6px)',
        transition: 'background 0.6s ease',
      }} />
      <svg viewBox="0 0 420 90" style={{ width: '100%', maxWidth: 480, filter: alert ? 'drop-shadow(0 0 10px rgba(239,68,68,0.55))' : 'drop-shadow(0 0 4px rgba(239,68,68,0.2))', transition: 'filter 0.5s' }}>
        {/* Rear wing */}
        <rect x="10" y="16" width="38" height="5" rx="1.5" fill="#ef4444" />
        <rect x="13" y="11" width="32" height="4" rx="1.5" fill="#b91c1c" />
        <rect x="20" y="21" width="4" height="14" rx="1" fill="#666" />
        <rect x="32" y="21" width="4" height="14" rx="1" fill="#666" />
        {/* Rear tyres */}
        <ellipse cx="56" cy="60" rx="17" ry="17" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
        <ellipse cx="56" cy="60" rx="11" ry="11" fill="#0a0a0a" />
        <ellipse cx="56" cy="60" rx="6" ry="6" fill="#1a1a1a" stroke="#ef4444" strokeWidth="1.2" />
        <ellipse cx="78" cy="60" rx="17" ry="17" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
        <ellipse cx="78" cy="60" rx="11" ry="11" fill="#0a0a0a" />
        <ellipse cx="78" cy="60" rx="6" ry="6" fill="#1a1a1a" stroke="#ef4444" strokeWidth="1.2" />
        {/* Sidepod left */}
        <path d="M90 28 Q98 20 140 19 L195 19 L195 50 Q160 54 128 54 Q100 54 90 50 Z" fill="#13131f" stroke="#ef4444" strokeWidth="0.8" />
        {/* Main body */}
        <path d="M130 18 L310 16 Q345 16 360 30 L360 52 Q345 60 310 60 L130 60 Z" fill="#0d0d1a" stroke="#ef4444" strokeWidth="1" />
        {/* Cockpit */}
        <path d="M200 19 Q220 6 260 6 Q285 6 292 19 Z" fill="#ef4444" />
        <path d="M206 19 Q224 9 260 9 Q282 9 288 19 Z" fill="#b91c1c" />
        <path d="M213 16 Q228 8 260 8 Q280 8 285 16 Z" fill="rgba(147,210,255,0.25)" stroke="rgba(147,210,255,0.4)" strokeWidth="0.6" />
        {/* Halo */}
        <path d="M208 18 Q243 3 278 18" fill="none" stroke="#555" strokeWidth="3" strokeLinecap="round" />
        <rect x="239" y="5" width="5" height="13" rx="1.5" fill="#555" />
        {/* Sidepod right */}
        <path d="M360 30 Q376 22 398 24 L398 50 Q376 56 360 52 Z" fill="#13131f" stroke="#ef4444" strokeWidth="0.8" />
        {/* Nose */}
        <path d="M360 30 L360 52 Q390 50 408 42 Z" fill="#ef4444" />
        <path d="M388 38 L408 42 L388 44 Z" fill="#b91c1c" />
        {/* Front wing */}
        <path d="M398 36 L418 34 L418 38 L408 42 Z" fill="#ef4444" />
        <path d="M406 31 L420 30 L420 33 L406 33 Z" fill="#b91c1c" />
        <path d="M406 40 L420 40 L420 43 L406 42 Z" fill="#b91c1c" />
        {/* Front tyres */}
        <ellipse cx="346" cy="60" rx="17" ry="17" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
        <ellipse cx="346" cy="60" rx="11" ry="11" fill="#0a0a0a" />
        <ellipse cx="346" cy="60" rx="6" ry="6" fill="#1a1a1a" stroke="#ef4444" strokeWidth="1.2" />
        <ellipse cx="368" cy="60" rx="17" ry="17" fill="#111" stroke="#2a2a2a" strokeWidth="2" />
        <ellipse cx="368" cy="60" rx="11" ry="11" fill="#0a0a0a" />
        <ellipse cx="368" cy="60" rx="6" ry="6" fill="#1a1a1a" stroke="#ef4444" strokeWidth="1.2" />
        {/* Floor */}
        <rect x="56" y="76" width="315" height="3" rx="1.5" fill="#222" />
        {/* Number */}
        <text x="240" y="45" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="monospace">1</text>
        {/* Exhaust */}
        <ellipse cx="28" cy="43" rx="8" ry="4" fill="rgba(239,68,68,0.12)">
          <animate attributeName="rx" values="5;10;5" dur="0.7s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.08;0.25;0.08" dur="0.7s" repeatCount="indefinite" />
        </ellipse>
        {/* Alert speed lines */}
        {alert && <>
          <line x1="15" y1="28" x2="0" y2="28" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" opacity="0.5">
            <animate attributeName="x1" values="20;0;20" dur="0.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.7;0" dur="0.5s" repeatCount="indefinite" />
          </line>
          <line x1="20" y1="38" x2="0" y2="38" stroke="#ef4444" strokeWidth="0.8" strokeLinecap="round" opacity="0.4">
            <animate attributeName="x1" values="25;0;25" dur="0.65s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.5;0" dur="0.65s" repeatCount="indefinite" />
          </line>
          <line x1="12" y1="50" x2="0" y2="50" stroke="#ef4444" strokeWidth="0.6" strokeLinecap="round" opacity="0.3">
            <animate attributeName="x1" values="15;0;15" dur="0.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.4;0" dur="0.4s" repeatCount="indefinite" />
          </line>
          {/* DRS flash */}
          <rect x="10" y="14" width="38" height="2" rx="1" fill="#ef4444">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
          </rect>
        </>}
      </svg>
    </div>
  );
}

// ── Ring ──────────────────────────────────────────────────────────────────────
function Ring({ pct, size, thick, color, label }: { pct: number; size: number; thick: number; color: string; label: string }) {
  const r = (size - thick * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={thick} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick}
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 70 ? 18 : 13, fontWeight: 800, color: 'white', fontFamily: 'monospace', lineHeight: 1 }}>{pct}</span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 1 }}>{label}</span>
      </div>
    </div>
  );
}

// ── Bar ───────────────────────────────────────────────────────────────────────
function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 1.2s ease', boxShadow: `0 0 6px ${color}66` }} />
      </div>
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginBottom: 5, fontFamily: 'monospace' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: valueColor || 'white', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, text, right }: { icon: any; text: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.25)' }} />
        <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{text}</span>
      </div>
      {right}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', padding: '2px 7px', borderRadius: 3, background: `${color}14`, border: `1px solid ${color}33`, color }}>
      {text}
    </span>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [tab, setTab] = useState("dashboard");
  const [radioFeed, setRadioFeed] = useState<RadioMessage[]>([]);
  const [tel, setTel] = useState<TelemetryState>(TELEMETRY[0]);
  const [granite, setGranite] = useState<GraniteResult | null>(null);
  const [graniteLoading, setGraniteLoading] = useState(false);
  const [strategist, setStrategist] = useState<any>(null);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [live, setLive] = useState(true);
  const [trust, setTrust] = useState(85);
  const feedRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/docling?target=lambiase').then(r => r.json()).then(d => setStrategist(d.profile)).catch(() => {});
  }, []);

  const analyze = useCallback(async (msg: RadioMessage, t: TelemetryState) => {
    if (!msg.flagged) return;
    setGraniteLoading(true);
    try {
      const res = await fetch('/api/granite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry: { gripLevel: t.gripLevel, tyreDeg: t.tyreDeg, lapDelta: t.lapDelta, temp: 'Optimal' }, radioIntercept: msg.text, team: msg.team, strategist: msg.src, lap: t.lap, gapToLeader: t.gapToLeader, safetyCar: t.safetyCar }),
      });
      const d = await res.json();
      setGranite(d.analysis);
    } catch { /* keep */ } finally { setGraniteLoading(false); }
  }, []);

  useEffect(() => {
    if (!live || scriptIdx >= RADIO_SCRIPT.length) return;
    const delay = scriptIdx === 0 ? 1200 : 3500 + Math.random() * 2000;
    timer.current = setTimeout(() => {
      const raw = RADIO_SCRIPT[scriptIdx];
      const msg: RadioMessage = { ...raw, id: scriptIdx, analyzing: raw.flagged };
      setRadioFeed(prev => [msg, ...prev]);
      const t = TELEMETRY.find(x => x.lap === raw.lap) || tel;
      setTel(t);
      setTrust(raw.flagged ? Math.max(28, 100 - Math.round((raw.bluffProbability || 0) * 72)) : Math.min(95, trust + 4));
      analyze(msg, t);
      setTimeout(() => setRadioFeed(prev => prev.map(m => m.id === scriptIdx ? { ...m, analyzing: false } : m)), 1800);
      setScriptIdx(i => i + 1);
    }, delay);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [live, scriptIdx, analyze]);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = 0; }, [radioFeed.length]);

  const flagCount = radioFeed.filter(m => m.flagged).length;
  const alert = granite?.signalMismatchDetected && !graniteLoading;
  const deceptPct = Math.round((granite?.bluffProbability || 0) * 100);
  const deceptColor = deceptPct > 70 ? '#ef4444' : deceptPct > 40 ? '#f59e0b' : '#22c55e';
  const trustColor = trust > 70 ? '#22c55e' : trust > 45 ? '#f59e0b' : '#ef4444';
  const tyreDegColor = tel.tyreDeg > 70 ? '#ef4444' : tel.tyreDeg > 50 ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ minHeight: '100vh', background: '#06060e', color: 'white', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <nav style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid rgba(239,68,68,0.15)', background: 'linear-gradient(90deg,#0c0008,#06060e,#06060e,#08000c)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg,#ef4444,#7f1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(239,68,68,0.45)' }}>
            <BrainCircuit style={{ width: 17, height: 17, color: 'white' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'white', letterSpacing: '0.06em' }}>PITWALL CORE</div>
            <div style={{ fontSize: 8, color: 'rgba(239,68,68,0.65)', letterSpacing: '0.22em' }}>HUMAN THREAT INTELLIGENCE</div>
          </div>
          <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.07)', margin: '0 10px' }} />
          {['DASHBOARD', 'INTEL', 'CONFIG'].map((t, i) => {
            const k = ['dashboard', 'intel', 'settings'][i];
            const active = tab === k;
            return <button key={t} onClick={() => setTab(k)} style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.12em', background: 'none', border: 'none', cursor: 'pointer', color: active ? '#ef4444' : 'rgba(255,255,255,0.28)', borderBottom: `2px solid ${active ? '#ef4444' : 'transparent'}`, paddingBottom: 2, transition: 'all 0.2s' }}>{t}</button>;
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 9, color: '#22c55e', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />GRANITE
          </span>
          <span style={{ fontSize: 9, color: '#22c55e', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />DOCLING
          </span>
          <button onClick={() => setLive(v => !v)} style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.1em', padding: '5px 12px', borderRadius: 4, border: `1px solid ${live ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}`, background: live ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: live ? '#ef4444' : '#22c55e', cursor: 'pointer' }}>
            {live ? '⏸ PAUSE' : '▶ RESUME'}
          </button>
        </div>
      </nav>

      {/* ALERT BANNER */}
      {alert && (
        <div style={{ background: 'linear-gradient(90deg,rgba(239,68,68,0.18),rgba(239,68,68,0.06))', borderBottom: '1px solid rgba(239,68,68,0.28)', padding: '9px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'slideDown 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle style={{ width: 13, height: 13, color: '#ef4444' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', letterSpacing: '0.16em' }}>⚠ DECEPTION DETECTED</span>
            <span style={{ width: 1, height: 14, background: 'rgba(239,68,68,0.25)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{granite?.recommendedAction}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace' }}>{deceptPct}% PROB</span>
        </div>
      )}

      {/* SESSION TICKER */}
      <div style={{ padding: '7px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(239,68,68,0.02)', display: 'flex', alignItems: 'center', gap: 28, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#ef4444', letterSpacing: '0.22em' }}>LIVE</span>
        </div>
        {[['MONACO GP', 'RACE'], ['LAP', `${tel.lap} / 78`], ['GAP', `+${tel.gapToLeader.toFixed(1)}s`], ['SC', tel.safetyCar ? 'ACTIVE' : 'CLEAR'], ['TARGET', 'LAMBIASE · RBR'], ['FLAGS', `${flagCount}`]].map(([l, v]) => (
          <div key={l} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: l === 'SC' && tel.safetyCar ? '#f59e0b' : l === 'FLAGS' && flagCount > 0 ? '#ef4444' : 'white', fontFamily: 'monospace' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      {tab === 'dashboard' && (
        <div style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>

          {/* ROW 1: Car hero + Granite */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Car hero */}
            <div style={{ background: 'linear-gradient(135deg,#0f0f1e,#080810)', border: `1px solid ${alert ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.1)'}`, borderRadius: 14, padding: '18px 22px', transition: 'border-color 0.5s', boxShadow: alert ? '0 0 30px rgba(239,68,68,0.08)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'white', letterSpacing: '0.1em' }}>VERSTAPPEN · RED BULL RB20</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: 2 }}>C3 HARD · LAP {tel.lap - 22} AGE · MONACO</div>
                </div>
                <Badge text={alert ? '⚠ THREAT ACTIVE' : '● MONITORING'} color={alert ? '#ef4444' : '#22c55e'} />
              </div>

              <F1Car alert={alert} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
                <Chip label="LAP TIME" value="1:14.832" />
                <Chip label="TYRE AGE" value={`L${tel.lap - 22}`} />
                <Chip label="COMPOUND" value="C3 HARD" />
                <Chip label="LAP Δ" value={`+${tel.lapDelta.toFixed(2)}s`} valueColor={tel.lapDelta > 0.3 ? '#ef4444' : 'white'} />
              </div>
            </div>

            {/* Granite */}
            <div style={{ background: 'linear-gradient(135deg,#0a0a18,#060610)', border: `1px solid ${alert ? 'rgba(239,68,68,0.35)' : 'rgba(96,165,250,0.12)'}`, borderRadius: 14, padding: '18px 22px', transition: 'all 0.5s', boxShadow: alert ? '0 0 40px rgba(239,68,68,0.1)' : 'none' }}>
              <SectionLabel icon={BrainCircuit} text="IBM GRANITE · DECEPTION ENGINE" right={
                graniteLoading
                  ? <span style={{ fontSize: 8, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4 }}><Loader2 style={{ width: 9, height: 9, animation: 'spin 1s linear infinite' }} />PROCESSING</span>
                  : granite ? <Badge text="✓ READY" color="#22c55e" /> : null
              } />

              {!granite && !graniteLoading && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, color: 'rgba(255,255,255,0.1)', fontSize: 10, letterSpacing: '0.12em', gap: 10 }}>
                  <BrainCircuit style={{ width: 28, height: 28, opacity: 0.15 }} />
                  AWAITING INTERCEPT FEED…
                </div>
              )}
              {graniteLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180, gap: 12 }}>
                  <Loader2 style={{ width: 28, height: 28, color: '#60a5fa', opacity: 0.6, animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 9, color: 'rgba(96,165,250,0.5)', letterSpacing: '0.14em', animation: 'pulse 1.2s ease-in-out infinite' }}>GRANITE 13B · ANALYZING SIGNAL MISMATCH…</span>
                  <div style={{ width: 200, height: 2, background: 'rgba(96,165,250,0.1)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#60a5fa', borderRadius: 1, animation: 'loadbar 1.5s ease-in-out infinite', width: '45%' }} />
                  </div>
                </div>
              )}
              {granite && !graniteLoading && (
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <Ring pct={deceptPct} size={110} thick={12} color={deceptColor} label="DECEP%" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 4, marginBottom: 10, background: granite.signalMismatchDetected ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)', border: `1px solid ${granite.signalMismatchDetected ? 'rgba(239,68,68,0.28)' : 'rgba(34,197,94,0.2)'}`, fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', color: granite.signalMismatchDetected ? '#ef4444' : '#22c55e' }}>
                      <ShieldAlert style={{ width: 10, height: 10 }} />
                      {granite.signalMismatchDetected ? 'DECEPTION CONFIRMED' : 'SIGNAL VERIFIED'}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: 'white', lineHeight: 1.35, marginBottom: 10, letterSpacing: '0.02em' }}>{granite.recommendedAction}</div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, margin: 0 }}>{granite.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ROW 2: Tyre + Trust + Radio + Pit + Strategist */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 200px 1fr 220px 220px', gap: 12 }}>

            {/* Tyre */}
            <div style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel icon={Activity} text="TYRE TELEMETRY" right={<Badge text={`${tel.tyreDeg}% DEG`} color={tyreDegColor} />} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[['FL', 0.88], ['FR', 0.91], ['RL', 1.0], ['RR', 0.97]].map(([pos, mult]) => {
                  const deg = Math.round(tel.tyreDeg * (mult as number));
                  const c = deg > 70 ? '#ef4444' : deg > 50 ? '#f59e0b' : '#22c55e';
                  return (
                    <div key={pos as string} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '8px 6px', border: `1px solid ${c}1a`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>{pos as string}</span>
                      <Ring pct={deg} size={52} thick={6} color={c} label="%" />
                    </div>
                  );
                })}
              </div>
              <Bar label="GRIP LEVEL" pct={tel.gripLevel} color={tel.gripLevel > 70 ? '#22c55e' : '#f59e0b'} />
            </div>

            {/* Trust */}
            <div style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel icon={Activity} text="DRIVER TRUST" right={<Badge text={trust > 70 ? 'RELIABLE' : trust > 45 ? 'MONITOR' : 'COMPROMISED'} color={trustColor} />} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <Ring pct={trust} size={90} thick={10} color={trustColor} label="TRUST" />
                <div style={{ width: '100%' }}>
                  <Bar label="REPORT ACCURACY" pct={trust} color={trustColor} />
                  <Bar label="RADIO CREDIBILITY" pct={Math.round(trust * 0.9)} color={trust > 60 ? '#22c55e' : '#f59e0b'} />
                </div>
              </div>
            </div>

            {/* Radio feed */}
            <div style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
              <SectionLabel icon={Radio} text="RADIO INTERCEPTS" right={flagCount > 0 ? <Badge text={`${flagCount} FLAGGED`} color="#ef4444" /> : undefined} />
              <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 300 }}>
                {radioFeed.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: 9, letterSpacing: '0.12em' }}>SCANNING CHANNELS…</div>
                )}
                {radioFeed.map(msg => {
                  const p = msg.bluffProbability || 0;
                  return (
                    <div key={msg.id} style={{ border: `1px solid ${msg.flagged ? (p > 0.75 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)') : 'rgba(255,255,255,0.05)'}`, background: msg.flagged ? (p > 0.75 ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.04)') : 'rgba(255,255,255,0.01)', borderRadius: 7, padding: '9px 11px', transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {msg.flagged && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 5px #ef4444', display: 'inline-block' }} />}
                          <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>{msg.src}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>{msg.team}</span>
                        </div>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', fontFamily: 'monospace' }}>L{msg.lap}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>"{msg.text}"</p>
                      {msg.flagged && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: p > 0.75 ? '#ef4444' : '#f59e0b', letterSpacing: '0.06em' }}>{msg.deceptionType === 'TYRE_CONDITION_BLUFF' ? 'TYRE BLUFF' : 'STAY-OUT DECEP.'}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: 'monospace' }}>{Math.round(p * 100)}%</span>
                        </div>
                      )}
                      {msg.analyzing && <div style={{ fontSize: 8, color: '#60a5fa', marginTop: 4, letterSpacing: '0.08em' }}>⟳ GRANITE ANALYZING…</div>}
                      {msg.graniteReasoning && !msg.analyzing && <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', margin: '5px 0 0', lineHeight: 1.5 }}>↳ {msg.graniteReasoning}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pit prediction */}
            <div style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel icon={Clock} text="PIT PREDICTION" right={<Badge text="HIGH ALERT" color="#ef4444" />} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[{ team: 'RED BULL', prob: 91, window: '1–2 LAPS', ctx: 'SC window + Lambiase radio flagged. 4/4 historical.', high: true }, { team: 'FERRARI', prob: 67, window: '3–4 LAPS', ctx: 'Xavi "no pit" matches deception pattern.', high: false }, { team: 'MERCEDES', prob: 34, window: '5–6 LAPS', ctx: 'Bonnington — no signal detected.', high: false }].map(({ team, prob, window, ctx, high }) => {
                  const c = prob > 75 ? '#ef4444' : prob > 50 ? '#f59e0b' : '#475569';
                  return (
                    <div key={team}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: 'white' }}>{team}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>{window}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${prob}%`, background: c, borderRadius: 4, transition: 'width 1.2s ease', boxShadow: high ? `0 0 10px ${c}88` : 'none' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 900, color: c, fontFamily: 'monospace', minWidth: 38, textAlign: 'right' }}>{prob}%</span>
                      </div>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: '4px 0 0', lineHeight: 1.5 }}>{ctx}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategist */}
            <div style={{ background: '#0a0a16', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 14, padding: '14px 16px' }}>
              <SectionLabel icon={Fingerprint} text="STRATEGIST" right={<Badge text="DOCLING RAG" color="#f59e0b" />} />
              {!strategist ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120, color: 'rgba(255,255,255,0.12)', fontSize: 9 }}>LOADING…</div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Ring pct={strategist.aggressionIndex} size={56} thick={7} color="#f59e0b" label="AGGR" />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'white', marginBottom: 2 }}>{strategist.name}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.07em' }}>{strategist.role}</div>
                      <div style={{ fontSize: 8, color: '#f59e0b', marginTop: 3 }}>RAG {Math.round((strategist.ragConfidence || 0.94) * 100)}% CONF.</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(strategist.historicalPatterns || []).slice(0, 4).map((p: any) => (
                      <div key={p.scenario}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', lineHeight: 1.3 }}>{p.scenario}</span>
                          <span style={{ fontSize: 9, fontWeight: 900, color: 'white', fontFamily: 'monospace', flexShrink: 0, marginLeft: 6 }}>{p.probability}%</span>
                        </div>
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${p.probability}%`, background: p.probability > 80 ? '#ef4444' : p.probability > 60 ? '#f59e0b' : '#38bdf8', borderRadius: 2, transition: 'width 1s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {tab === 'intel' && (
        <div style={{ padding: '24px 20px' }}>
          <div style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 18px', maxWidth: 640, margin: '0 auto' }}>
            <SectionLabel icon={ShieldAlert} text={`THREAT INTEL LOG · ${flagCount} FLAGS`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {radioFeed.filter(m => m.flagged).map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 7 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: 'white', minWidth: 60 }}>{m.src}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{m.text}"</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace', flexShrink: 0 }}>{Math.round((m.bluffProbability || 0) * 100)}%</span>
                </div>
              ))}
              {flagCount === 0 && <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.1)', fontSize: 9, letterSpacing: '0.12em' }}>NO FLAGS YET</div>}
            </div>
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ padding: '24px 20px' }}>
          <div style={{ background: '#0a0a16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 18px', maxWidth: 460, margin: '0 auto' }}>
            <SectionLabel icon={BrainCircuit} text="IBM API CONFIGURATION" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['IBM GRANITE API KEY', 'IBM DOCLING ENDPOINT', 'IBM WATSON TTS KEY'].map(l => (
                <div key={l}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', marginBottom: 5 }}>{l}</div>
                  <input type="password" placeholder="••••••••••••••••" style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '9px 12px', color: 'white', fontFamily: 'monospace', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <button style={{ marginTop: 4, padding: '10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontFamily: 'monospace', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', cursor: 'pointer' }}>SAVE CONFIGURATION</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes loadbar { 0%{transform:translateX(-120%)} 100%{transform:translateX(400%)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
