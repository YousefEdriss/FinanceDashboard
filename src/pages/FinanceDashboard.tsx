import { useState, useRef, useEffect } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Area, AreaChart,
} from 'recharts';
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  DollarSign, RefreshCw, Zap, Edit2, Download, Upload, Bell, CheckCircle2,
} from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import { useCountUp } from '../hooks/useCountUp';
import type { FinanceData, FreelancingEntry, SpendingEntry, Subscription, SpendingCategories } from '../types';

const DEFAULT_FINANCE: FinanceData = {
  savings: 0, incomingMonthly: 0,
  freelancingEntries: [], spendingEntries: [], netWorthHistory: [],
  cashEGP: 0, goldGrams: 0, usdAmount: 0,
  goldPricePerGram: 7800, usdToEGP: 50, subscriptions: [],
};

const CATEGORY_LABELS: Record<keyof SpendingCategories, string> = {
  outings: 'Outings', carMaintenance: 'Car Maintenance', gas: 'Gas',
  personalStuff: 'Personal Stuff', debts: 'Debts', supermarket: 'Supermarket',
};
const CATEGORY_COLORS: Record<keyof SpendingCategories, string> = {
  outings: '#818cf8', carMaintenance: '#f59e0b', gas: '#22d3ee',
  personalStuff: '#a78bfa', debts: '#f87171', supermarket: '#34d399',
};
const CATEGORIES = Object.keys(CATEGORY_LABELS) as (keyof SpendingCategories)[];

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }
function fmt(n: number) { return n.toLocaleString('en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
function todayISO() { return new Date().toISOString().split('T')[0]; }
function currentMonth() { return new Date().toISOString().slice(0, 7); } // 'YYYY-MM'

function getWeekKey() {
  const d = new Date();
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

function isThisWeek(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const start = new Date(today);
  const day = today.getDay();
  start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  return date >= start;
}

function isThisMonth(dateStr: string) {
  const date = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

/* ── Inline edit ── */
function InlineEdit({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  if (editing) return (
    <span className="inline-flex items-center gap-1.5">
      <input autoFocus type="text" inputMode="decimal" value={draft}
        onChange={e => setDraft(e.target.value)} className="w-28 text-sm outline-none rounded-lg px-2 py-0.5 font-mono"
        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.5)', color: '#fff' }}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(parseFloat(draft) || 0); setEditing(false); }
          if (e.key === 'Escape') setEditing(false);
        }} />
      <button onClick={() => { onSave(parseFloat(draft) || 0); setEditing(false); }} style={{ color: '#22c55e' }}><Check size={14} /></button>
      <button onClick={() => setEditing(false)} style={{ color: '#f87171' }}><X size={14} /></button>
    </span>
  );
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="group hover:opacity-75 transition-opacity" title="Click to edit">
      {fmt(value)}<Pencil size={11} className="inline ml-1 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}

/* ── Modal ── */
function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md flex flex-col"
        style={{ background: 'rgba(14,14,14,0.99)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '20px', boxShadow: '0 0 60px rgba(168,85,247,0.2)', maxHeight: '85vh' }}>
        <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
          <div className="neon-hr mb-3" style={{ boxShadow: '0 0 8px rgba(168,85,247,0.4)' }} />
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white text-sm">{title}</h2>
            <button onClick={onClose} className="p-1 hover:opacity-60 transition-opacity" style={{ color: '#64748b' }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' as never, overscrollBehavior: 'contain', padding: '0 20px 6px', flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: '10px 20px 18px', flexShrink: 0, borderTop: '1px solid rgba(168,85,247,0.1)' }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, icon, color, delay = 0, children, action }: {
  label: string; icon: React.ReactNode; color: string; delay?: number; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="card card-corners p-4 md:p-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono font-medium tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.7)' }}>{label}</span>
        <div className="flex items-center gap-2">
          {action}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}>{icon}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Rate badge ── */
function RateBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-mono"
      style={{ background: `${color}10`, border: `1px solid ${color}30`, color, boxShadow: `0 0 10px ${color}18` }}>
      <span style={{ color: `${color}90` }}>{label}:</span><strong>{value}</strong>
    </span>
  );
}

/* ── Category bar ── */
function CatBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-32 flex-shrink-0">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-xs truncate" style={{ color: '#94a3b8' }}>{label}</span>
      </div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
      <span className="text-xs font-mono w-20 text-right flex-shrink-0" style={{ color: '#e2e8f0' }}>{fmt(value)}</span>
    </div>
  );
}

export default function FinanceDashboard() {
  const [rawData, setData, cloudLoaded] = useCloudStorage<FinanceData>('finance', DEFAULT_FINANCE);
  const data: FinanceData = { ...DEFAULT_FINANCE, ...rawData, spendingEntries: rawData.spendingEntries ?? [], subscriptions: rawData.subscriptions ?? [] };

  const importRef = useRef<HTMLInputElement>(null);
  const weekSnapDone = useRef(false);

  /* ── Modal states ── */
  const [showFL, setShowFL] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [showNW, setShowNW] = useState(false);
  const [showAssets, setShowAssets] = useState(false);
  const [showSpending, setShowSpending] = useState(false);
  const [showSpendingHistory, setShowSpendingHistory] = useState(false);
  const [editSubId, setEditSubId] = useState<string | null>(null);
  const [showWeekDetails, setShowWeekDetails] = useState(false);
  const [showMonthDetails, setShowMonthDetails] = useState(false);

  /* ── Form state ── */
  const [flAmount, setFlAmount] = useState('');
  const [flNote, setFlNote] = useState('');
  const [subName, setSubName] = useState('');
  const [subCost, setSubCost] = useState('');
  const [subCurrency, setSubCurrency] = useState<'EGP' | 'USD'>('EGP');
  const [draftGold, setDraftGold] = useState('');
  const [draftUsd, setDraftUsd] = useState('');
  const [nwLabel, setNwLabel] = useState('');
  const [draftCash, setDraftCash] = useState('');
  const [draftGoldGrams, setDraftGoldGrams] = useState('');
  const [draftUsdAmt, setDraftUsdAmt] = useState('');
  const [spAmt, setSpAmt] = useState('');
  const [spCat, setSpCat] = useState<keyof SpendingCategories>('outings');
  const [spNote, setSpNote] = useState('');
  const [spDate, setSpDate] = useState(todayISO());
  const [spError, setSpError] = useState('');
  const [showAddAsset, setShowAddAsset] = useState<'cash' | 'gold' | 'usd' | null>(null);
  const [addAssetAmt, setAddAssetAmt] = useState('');

  /* ── Computed ── */
  const totalFreelancing = data.freelancingEntries.reduce((s, e) => s + e.amount, 0);
  const goldValueEGP = data.goldGrams * data.goldPricePerGram;
  const usdValueEGP = data.usdAmount * data.usdToEGP;
  const netWorth = data.cashEGP + goldValueEGP + usdValueEGP;
  const weekEntries = data.spendingEntries.filter(e => isThisWeek(e.date));
  const monthEntries = data.spendingEntries.filter(e => isThisMonth(e.date));
  const weekTotal = weekEntries.reduce((s, e) => s + e.amount, 0);
  const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
  const totalMonthlySubsEGP = data.subscriptions.reduce(
    (s, sub) => s + (sub.currency === 'USD' ? sub.cost * data.usdToEGP : sub.cost), 0
  );

  const animatedNetWorth = useCountUp(netWorth);
  const animatedFreelancing = useCountUp(totalFreelancing);

  const chartData = data.netWorthHistory.length > 0
    ? data.netWorthHistory
    : [{ date: 'Now', value: netWorth }];

  /* ── Subscription reminder ── */
  const thisMonth = currentMonth();
  const unpaidSubs = data.subscriptions.filter(s => s.paidMonth !== thisMonth);
  const allPaid = unpaidSubs.length === 0 && data.subscriptions.length > 0;
  const reminderDismissed = data.reminderDismissedMonth === thisMonth;
  const showReminder = data.subscriptions.length > 0 && !allPaid && !reminderDismissed;

  /* ── Export financial context for AI chatbot ── */
  useEffect(() => {
    if (!cloudLoaded) return;
    sessionStorage.setItem('finance_context', JSON.stringify({
      netWorth, cashEGP: data.cashEGP, goldGrams: data.goldGrams,
      goldValueEGP, usdAmount: data.usdAmount, usdValueEGP,
      incomingMonthly: data.incomingMonthly, totalFreelancing,
      monthTotal, totalMonthlySubsEGP,
    }));
  }, [cloudLoaded, netWorth, data.cashEGP, data.goldGrams, data.usdAmount,
      data.incomingMonthly, totalFreelancing, monthTotal, totalMonthlySubsEGP]); // eslint-disable-line

  /* ── Auto weekly NW snapshot ── */
  useEffect(() => {
    if (!cloudLoaded || weekSnapDone.current) return;
    weekSnapDone.current = true;
    const thisWeek = getWeekKey();
    const last = data.netWorthHistory[data.netWorthHistory.length - 1];
    if (last?.weekKey === thisWeek) return;
    const d = new Date();
    const weekNum = thisWeek.split('-W')[1];
    const label = `W${weekNum} ${d.toLocaleString('en-US', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
    setData(prev => ({
      ...prev,
      netWorthHistory: [...prev.netWorthHistory, {
        date: label,
        value: prev.cashEGP + prev.goldGrams * prev.goldPricePerGram + prev.usdAmount * prev.usdToEGP,
        weekKey: thisWeek,
      }],
    }));
  }, [cloudLoaded]); // eslint-disable-line

  function update<K extends keyof FinanceData>(k: K, v: FinanceData[K]) {
    setData(d => ({ ...d, [k]: v }));
  }

  function catTotals(entries: SpendingEntry[]) {
    return CATEGORIES.map(k => ({
      key: k, label: CATEGORY_LABELS[k], color: CATEGORY_COLORS[k],
      value: entries.filter(e => e.category === k).reduce((s, e) => s + e.amount, 0),
    })).filter(c => c.value > 0);
  }
  const weekCats = catTotals(weekEntries);
  const monthCats = catTotals(monthEntries);
  const allMonthCats = CATEGORIES.map(k => ({
    key: k, name: CATEGORY_LABELS[k], color: CATEGORY_COLORS[k],
    value: monthEntries.filter(e => e.category === k).reduce((s, e) => s + e.amount, 0),
  }));

  /* ── Actions ── */
  function addFreelancing() {
    const amount = parseFloat(flAmount);
    if (!amount || amount <= 0) return;
    const entry: FreelancingEntry = { id: genId(), amount, date: new Date().toLocaleDateString('en-GB'), note: flNote || '' };
    setData(d => ({ ...d, freelancingEntries: [...(d.freelancingEntries ?? []), entry] }));
    setFlAmount(''); setFlNote(''); setShowFL(false);
  }

  function addSpending() {
    const amount = parseFloat(spAmt);
    if (!spAmt.trim() || isNaN(amount) || amount <= 0) { setSpError('Please enter a valid amount.'); return; }
    setSpError('');
    const entry: SpendingEntry = { id: genId(), amount, category: spCat, date: spDate, note: spNote || undefined };
    setData(d => ({ ...d, spendingEntries: [...(d.spendingEntries ?? []), entry], cashEGP: d.cashEGP - amount }));
    setSpAmt(''); setSpNote(''); setSpDate(todayISO()); setShowSpending(false);
  }

  function deleteSpending(id: string) {
    setData(d => ({ ...d, spendingEntries: d.spendingEntries.filter(e => e.id !== id) }));
  }

  function addOrUpdateSub() {
    const cost = parseFloat(subCost);
    if (!subName || !cost) return;
    if (editSubId) {
      setData(d => ({ ...d, subscriptions: d.subscriptions.map(s => s.id === editSubId ? { ...s, name: subName, cost, currency: subCurrency } : s) }));
      setEditSubId(null);
    } else {
      setData(d => ({ ...d, subscriptions: [...d.subscriptions, { id: genId(), name: subName, cost, currency: subCurrency }] }));
    }
    setSubName(''); setSubCost(''); setSubCurrency('EGP'); setShowAddSub(false);
  }

  function deleteSub(id: string) {
    setData(d => ({ ...d, subscriptions: d.subscriptions.filter(s => s.id !== id) }));
  }

  function startEditSub(sub: Subscription) {
    setSubName(sub.name); setSubCost(String(sub.cost)); setSubCurrency(sub.currency);
    setEditSubId(sub.id); setShowAddSub(true);
  }

  function markSubPaid(subId: string) {
    const sub = data.subscriptions.find(s => s.id === subId);
    if (!sub) return;
    const egpCost = sub.currency === 'USD' ? sub.cost * data.usdToEGP : sub.cost;
    setData(d => ({
      ...d,
      subscriptions: d.subscriptions.map(s => s.id === subId ? { ...s, paidMonth: thisMonth } : s),
      cashEGP: d.cashEGP - egpCost,
    }));
  }

  function markSubUnpaid(subId: string) {
    const sub = data.subscriptions.find(s => s.id === subId);
    if (!sub) return;
    const egpCost = sub.currency === 'USD' ? sub.cost * data.usdToEGP : sub.cost;
    setData(d => ({
      ...d,
      subscriptions: d.subscriptions.map(s => s.id === subId ? { ...s, paidMonth: undefined } : s),
      cashEGP: d.cashEGP + egpCost,
    }));
  }

  function saveRates() {
    const gold = parseFloat(draftGold);
    const usd = parseFloat(draftUsd);
    setData(d => ({ ...d, goldPricePerGram: gold || d.goldPricePerGram, usdToEGP: usd || d.usdToEGP }));
    setShowRates(false);
  }

  function saveAssets() {
    const cash = parseFloat(draftCash);
    const grams = parseFloat(draftGoldGrams);
    const usdAmt = parseFloat(draftUsdAmt);
    setData(d => ({
      ...d,
      cashEGP: isNaN(cash) ? d.cashEGP : cash,
      goldGrams: isNaN(grams) ? d.goldGrams : grams,
      usdAmount: isNaN(usdAmt) ? d.usdAmount : usdAmt,
    }));
    setShowAssets(false);
  }

  function addToAsset() {
    const amount = parseFloat(addAssetAmt);
    if (!addAssetAmt.trim() || isNaN(amount)) return;
    setData(d => {
      if (showAddAsset === 'cash') return { ...d, cashEGP: d.cashEGP + amount };
      if (showAddAsset === 'gold') return { ...d, goldGrams: d.goldGrams + amount };
      if (showAddAsset === 'usd') return { ...d, usdAmount: d.usdAmount + amount };
      return d;
    });
    setAddAssetAmt(''); setShowAddAsset(null);
  }

  function addNetWorthSnapshot() {
    const snapshot = { date: nwLabel || new Date().toLocaleDateString('en-GB'), value: netWorth };
    setData(d => ({ ...d, netWorthHistory: [...d.netWorthHistory, snapshot] }));
    setNwLabel(''); setShowNW(false);
  }

  function exportData() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `myfinance-${todayISO()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        setData({ ...DEFAULT_FINANCE, ...parsed, spendingEntries: parsed.spendingEntries ?? [] });
      } catch { alert('Invalid data file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  if (!cloudLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(168,85,247,0.5)', borderTopColor: 'transparent' }} />
        <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(168,85,247,0.6)' }}>LOADING DATA...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 min-h-full">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6"
        style={{ animation: 'fade-in-up 0.4s ease forwards' }}>
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="live-dot" />
            <span className="text-xs font-mono tracking-widest" style={{ color: 'rgba(168,85,247,0.7)' }}>LIVE DATA</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Finance Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Track your wealth &amp; spending</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => importRef.current?.click()} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
            <Upload size={13} /> <span>Import</span>
          </button>
          <button onClick={exportData} className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
            <Download size={13} /> <span>Export</span>
          </button>
          <button onClick={() => { setDraftGold(String(data.goldPricePerGram)); setDraftUsd(String(data.usdToEGP)); setShowRates(true); }}
            className="btn-ghost flex items-center gap-2 text-sm px-3 py-2">
            <RefreshCw size={13} /> <span className="hidden sm:inline">Update Rates</span><span className="sm:hidden">Rates</span>
          </button>
          <button onClick={() => setShowNW(true)} className="btn-primary flex items-center gap-2 text-sm px-3 py-2">
            <Plus size={13} /> <span className="hidden sm:inline">Save Snapshot</span><span className="sm:hidden">Snapshot</span>
          </button>
        </div>
      </div>

      {/* Rates */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <RateBadge label="Gold 24K" value={`${fmt(data.goldPricePerGram)} EGP/g`} color="#f59e0b" />
        <RateBadge label="USD → EGP" value={fmt(data.usdToEGP)} color="#22d3ee" />
      </div>

      {/* ── Subscription Reminder Banner ── */}
      {showReminder && (
        <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: '#f59e0b' }} />
              <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>
                {unpaidSubs.length} subscription{unpaidSubs.length > 1 ? 's' : ''} unpaid this month
              </p>
            </div>
            <button onClick={() => setData(d => ({ ...d, reminderDismissedMonth: thisMonth }))}
              className="text-xs font-mono px-2 py-1 rounded-lg transition-all duration-200"
              style={{ color: '#64748b', border: '1px solid rgba(100,116,139,0.2)' }}>
              Dismiss
            </button>
          </div>
          <div className="space-y-2">
            {data.subscriptions.map(sub => {
              const paid = sub.paidMonth === thisMonth;
              const egpCost = sub.currency === 'USD' ? sub.cost * data.usdToEGP : sub.cost;
              return (
                <div key={sub.id} className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: paid ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${paid ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div className="flex items-center gap-2">
                    {paid
                      ? <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                      : <div className="w-3.5 h-3.5 rounded-full" style={{ border: '1px solid rgba(245,158,11,0.5)' }} />}
                    <span className="text-sm" style={{ color: paid ? '#6b7280' : '#e2e8f0', textDecoration: paid ? 'line-through' : 'none' }}>
                      {sub.name}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#64748b' }}>
                      {sub.currency === 'USD' ? `$${sub.cost} ≈ ${fmt(egpCost)}` : fmt(sub.cost)} EGP
                    </span>
                  </div>
                  <button
                    onClick={() => paid ? markSubUnpaid(sub.id) : markSubPaid(sub.id)}
                    className="text-xs font-mono px-2.5 py-1 rounded-lg transition-all duration-200"
                    style={paid
                      ? { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }
                      : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                    {paid ? '✓ Paid' : 'Mark Paid'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 1: Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        <div className="card-hero card-corners col-span-2 lg:col-span-1 p-4 md:p-5" style={{ animationDelay: '0ms' }}>
          <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'rgba(168,85,247,0.7)' }}>Net Worth</p>
          <div className="text-3xl md:text-4xl font-mono font-bold mb-1 neon-num leading-none">{fmt(animatedNetWorth)}</div>
          <p className="text-xs font-mono" style={{ color: 'rgba(168,85,247,0.5)' }}>Egyptian Pound</p>
        </div>
        <StatCard label="Monthly Income" icon={<DollarSign size={15} />} color="#22d3ee" delay={80}>
          <div className="text-2xl font-mono font-bold text-white leading-none mb-1">
            <InlineEdit value={data.incomingMonthly} onSave={v => update('incomingMonthly', v)} />
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>EGP / month</p>
        </StatCard>
        <StatCard label="Freelancing" icon={<Zap size={15} />} color="#f59e0b" delay={140}
          action={
            <button onClick={() => { setFlAmount(''); setFlNote(''); setShowFL(true); }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all duration-300"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
              <Plus size={11} /> Add
            </button>
          }>
          <div className="text-2xl font-mono font-bold text-white leading-none mb-1">{fmt(animatedFreelancing)}</div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{data.freelancingEntries.length} entries · EGP</p>
        </StatCard>
      </div>

      {/* Row 2: Chart + Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
        <div className="card lg:col-span-2 p-4 md:p-5" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-mono tracking-widest uppercase mb-0.5" style={{ color: 'rgba(168,85,247,0.7)' }}>Net Worth History</p>
              <p className="text-sm text-white font-semibold">Weekly wealth tracking</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-xs font-mono" style={{ color: 'rgba(168,85,247,0.6)' }}>AUTO-WEEKLY</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(168,85,247,0.4)', borderRadius: 12, color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 12 }}
                formatter={v => [`${fmt(Number(v))} EGP`, 'Net Worth']} />
              <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2.5} fill="url(#nwGrad)"
                style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.6))' }}
                dot={{ fill: '#a855f7', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#c084fc', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assets */}
        <div className="card p-4 md:p-5" style={{ animationDelay: '260ms' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.7)' }}>Assets</p>
            <button onClick={() => { setDraftCash(String(data.cashEGP)); setDraftGoldGrams(String(data.goldGrams)); setDraftUsdAmt(String(data.usdAmount)); setShowAssets(true); }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-300"
              style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', color: '#c084fc' }}>
              <Edit2 size={11} /> Edit
            </button>
          </div>
          <div className="space-y-4">
            {([
              { label: 'Cash', sub: '', color: '#818cf8', display: data.cashEGP, assetKey: 'cash' as const },
              { label: 'Gold', sub: `${data.goldGrams}g × ${fmt(data.goldPricePerGram)}`, color: '#f59e0b', display: goldValueEGP, assetKey: 'gold' as const },
              { label: 'USD', sub: `$${fmt(data.usdAmount)} × ${fmt(data.usdToEGP)}`, color: '#22d3ee', display: usdValueEGP, assetKey: 'usd' as const },
            ]).map(a => (
              <div key={a.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white leading-none">{a.label}</p>
                    {a.sub && <p className="text-xs font-mono mt-0.5 truncate" style={{ color: '#64748b' }}>{a.sub}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-mono text-white">{fmt(a.display)} EGP</p>
                  <button onClick={() => { setAddAssetAmt(''); setShowAddAsset(a.assetKey); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200"
                    style={{ background: `${a.color}18`, border: `1px solid ${a.color}40`, color: a.color }}>
                    <Plus size={11} />
                  </button>
                </div>
              </div>
            ))}
            <div className="neon-hr" style={{ boxShadow: '0 0 6px rgba(168,85,247,0.2)' }} />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{ color: '#9ca3af' }}>Total</span>
              <span className="neon-num text-lg font-bold font-mono">{fmt(netWorth)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Spending */}
      <div className="card p-4 md:p-5 mb-4" style={{ animationDelay: '320ms' }}>
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-mono tracking-widest uppercase mb-0.5" style={{ color: 'rgba(168,85,247,0.7)' }}>Spending</p>
          <div className="flex gap-2">
            <button onClick={() => setShowSpendingHistory(true)} className="btn-ghost flex items-center gap-1.5 text-xs px-3 py-2">
              History ({data.spendingEntries.length})
            </button>
            <button onClick={() => { setSpAmt(''); setSpNote(''); setSpDate(todayISO()); setSpError(''); setShowSpending(true); }}
              className="btn-primary flex items-center gap-1.5 text-sm px-3 py-2">
              <Plus size={13} /> Add Spending
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.14)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.7)' }}>This Week</p>
              <button onClick={() => setShowWeekDetails(!showWeekDetails)} className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                {weekEntries.length} entries {showWeekDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            <p className="text-3xl font-mono font-bold text-white mb-3">{fmt(weekTotal)} <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.45)' }}>EGP</span></p>
            {weekCats.length > 0 ? (
              <div className="space-y-2.5">{weekCats.map(c => <CatBar key={c.key} label={c.label} value={c.value} total={weekTotal} color={c.color} />)}</div>
            ) : <p className="text-xs font-mono" style={{ color: '#4b5563' }}>// no entries this week</p>}
            {showWeekDetails && weekEntries.length > 0 && (
              <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}>
                {[...weekEntries].reverse().map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[e.category] }} />
                      <span style={{ color: '#94a3b8' }}>{CATEGORY_LABELS[e.category]}</span>
                      {e.note && <span style={{ color: '#4b5563' }}>— {e.note}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{fmt(e.amount)}</span>
                      <button onClick={() => deleteSpending(e.id)} className="opacity-30 hover:opacity-100 transition-opacity" style={{ color: '#f87171' }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Monthly */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.14)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.7)' }}>This Month</p>
              <button onClick={() => setShowMonthDetails(!showMonthDetails)} className="text-xs flex items-center gap-1" style={{ color: '#64748b' }}>
                {monthEntries.length} entries {showMonthDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            <p className="text-3xl font-mono font-bold text-white mb-3">{fmt(monthTotal)} <span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.45)' }}>EGP</span></p>
            {monthCats.length > 0 ? (
              <div className="space-y-2.5 mb-3">{monthCats.map(c => <CatBar key={c.key} label={c.label} value={c.value} total={monthTotal} color={c.color} />)}</div>
            ) : <p className="text-xs font-mono mb-3" style={{ color: '#4b5563' }}>// no entries this month</p>}
            {monthCats.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={allMonthCats.filter(c => c.value > 0)} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0e0e0e', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 10, color: '#fff', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                    formatter={v => [`${fmt(Number(v))} EGP`]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {allMonthCats.filter(c => c.value > 0).map(c => (
                      <Cell key={c.key} fill={c.color} style={{ filter: `drop-shadow(0 0 4px ${c.color}88)` }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {showMonthDetails && monthEntries.length > 0 && (
              <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}>
                {[...monthEntries].reverse().map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[e.category] }} />
                      <span style={{ color: '#94a3b8' }}>{CATEGORY_LABELS[e.category]}</span>
                      {e.note && <span style={{ color: '#4b5563' }}>— {e.note}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white">{fmt(e.amount)}</span>
                      <button onClick={() => deleteSpending(e.id)} className="opacity-30 hover:opacity-100 transition-opacity" style={{ color: '#f87171' }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Subscriptions */}
      <div className="card p-4 md:p-5" style={{ animationDelay: '380ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-mono tracking-widest uppercase mb-0.5" style={{ color: 'rgba(168,85,247,0.7)' }}>Monthly Subscriptions</p>
            <p className="text-sm font-mono" style={{ color: '#64748b' }}>
              <span className="neon-num-sm">{fmt(totalMonthlySubsEGP)}</span>
              <span className="ml-1" style={{ color: '#4b5563' }}>EGP / month</span>
              {data.subscriptions.length > 0 && (
                <span className="ml-2 text-xs" style={{ color: allPaid ? '#22c55e' : '#f59e0b' }}>
                  · {data.subscriptions.filter(s => s.paidMonth === thisMonth).length}/{data.subscriptions.length} paid
                </span>
              )}
            </p>
          </div>
          <button onClick={() => { setEditSubId(null); setSubName(''); setSubCost(''); setSubCurrency('EGP'); setShowAddSub(true); }}
            className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={13} /> Add
          </button>
        </div>
        {data.subscriptions.length === 0 ? (
          <p className="text-center py-8 text-sm font-mono" style={{ color: '#374151' }}>// no subscriptions yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {data.subscriptions.map(sub => {
              const egpCost = sub.currency === 'USD' ? sub.cost * data.usdToEGP : sub.cost;
              const paid = sub.paidMonth === thisMonth;
              return (
                <div key={sub.id} className="flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300"
                  style={{ background: paid ? 'rgba(34,197,94,0.04)' : 'rgba(168,85,247,0.06)',
                    border: `1px solid ${paid ? 'rgba(34,197,94,0.2)' : 'rgba(168,85,247,0.14)'}` }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{sub.name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#64748b' }}>
                      {sub.currency === 'USD' ? `$${fmt(sub.cost)} ≈ ${fmt(egpCost)}` : fmt(sub.cost)} EGP
                    </p>
                    {paid && <p className="text-xs font-mono mt-0.5" style={{ color: '#22c55e' }}>✓ Paid</p>}
                  </div>
                  <div className="flex gap-2 ml-2 flex-shrink-0 items-center">
                    <button onClick={() => paid ? markSubUnpaid(sub.id) : markSubPaid(sub.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200"
                      style={paid
                        ? { background: '#22c55e', border: '1px solid #22c55e' }
                        : { border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)' }}
                      title={paid ? 'Mark unpaid' : 'Mark paid'}>
                      {paid && <Check size={11} className="text-black" strokeWidth={3} />}
                    </button>
                    <button onClick={() => startEditSub(sub)} className="opacity-30 hover:opacity-100 transition-opacity" style={{ color: '#a855f7' }}><Pencil size={13} /></button>
                    <button onClick={() => deleteSub(sub.id)} className="opacity-30 hover:opacity-100 transition-opacity" style={{ color: '#f87171' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Modals ══ */}

      {showAssets && (
        <Modal title="Edit Assets" onClose={() => setShowAssets(false)}
          footer={<div className="flex gap-2"><button onClick={saveAssets} className="btn-primary flex-1">Save Assets</button><button onClick={() => setShowAssets(false)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="space-y-2.5">
            <input autoFocus type="text" inputMode="decimal" value={draftCash} onChange={e => setDraftCash(e.target.value)}
              placeholder={`Cash EGP (now: ${fmt(data.cashEGP)})`} className="input-field" style={{ padding: '8px 12px' }} />
            <div>
              <input type="text" inputMode="decimal" value={draftGoldGrams} onChange={e => setDraftGoldGrams(e.target.value)}
                placeholder={`Gold grams 24K (now: ${data.goldGrams}g)`} className="input-field" style={{ padding: '8px 12px' }} />
              <p className="text-xs font-mono mt-1" style={{ color: '#64748b' }}>= {fmt((parseFloat(draftGoldGrams) || data.goldGrams) * data.goldPricePerGram)} EGP</p>
            </div>
            <div>
              <input type="text" inputMode="decimal" value={draftUsdAmt} onChange={e => setDraftUsdAmt(e.target.value)}
                placeholder={`USD amount (now: $${fmt(data.usdAmount)})`} className="input-field" style={{ padding: '8px 12px' }} />
              <p className="text-xs font-mono mt-1" style={{ color: '#64748b' }}>= {fmt((parseFloat(draftUsdAmt) || data.usdAmount) * data.usdToEGP)} EGP</p>
            </div>
          </div>
        </Modal>
      )}

      {showFL && (
        <Modal title="Add Freelancing Income" onClose={() => setShowFL(false)}
          footer={<div className="flex gap-2"><button onClick={addFreelancing} disabled={!flAmount || parseFloat(flAmount) <= 0} className="btn-primary flex-1">Add Income</button><button onClick={() => setShowFL(false)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="space-y-2.5">
            <input autoFocus type="text" inputMode="decimal" value={flAmount} onChange={e => setFlAmount(e.target.value)}
              placeholder="Amount (EGP)" className="input-field" style={{ padding: '8px 12px' }}
              onKeyDown={e => { if (e.key === 'Enter') addFreelancing(); }} />
            <input type="text" value={flNote} onChange={e => setFlNote(e.target.value)}
              placeholder="Note (optional)" className="input-field" style={{ padding: '8px 12px' }} />
          </div>
          {data.freelancingEntries.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(168,85,247,0.12)' }}>
              <p className="text-xs font-mono mb-2" style={{ color: 'rgba(168,85,247,0.5)' }}>// HISTORY</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {[...data.freelancingEntries].reverse().map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
                    <div>
                      <p className="text-sm font-mono text-white">+{fmt(e.amount)} EGP</p>
                      <p className="text-xs font-mono" style={{ color: '#64748b' }}>{e.date}{e.note ? ` — ${e.note}` : ''}</p>
                    </div>
                    <button onClick={() => setData(d => ({ ...d, freelancingEntries: d.freelancingEntries.filter(x => x.id !== e.id) }))}
                      className="opacity-30 hover:opacity-100 transition-opacity" style={{ color: '#f87171' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {showSpending && (
        <Modal title="Add Spending Entry" onClose={() => setShowSpending(false)}
          footer={<div className="flex gap-2"><button onClick={addSpending} className="btn-primary flex-1">Add Entry</button><button onClick={() => setShowSpending(false)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="space-y-2.5">
            <div>
              <input autoFocus type="text" inputMode="decimal" value={spAmt}
                onChange={e => { setSpAmt(e.target.value); setSpError(''); }}
                placeholder="Amount (EGP)" className="input-field" style={{ padding: '8px 12px' }}
                onKeyDown={e => { if (e.key === 'Enter') addSpending(); }} />
              {spError && <p className="text-xs font-mono mt-1" style={{ color: '#f87171' }}>{spError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={spCat} onChange={e => setSpCat(e.target.value as keyof SpendingCategories)}
                className="input-field" style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '12px' }}>
                {CATEGORIES.map(k => <option key={k} value={k}>{CATEGORY_LABELS[k]}</option>)}
              </select>
              <input type="date" value={spDate} onChange={e => setSpDate(e.target.value)}
                className="input-field" style={{ padding: '8px 12px', colorScheme: 'dark' }} />
            </div>
            <input type="text" value={spNote} onChange={e => setSpNote(e.target.value)}
              placeholder="Note (optional)" className="input-field" style={{ padding: '8px 12px' }} />
          </div>
        </Modal>
      )}

      {showSpendingHistory && (
        <Modal title="All Spending Entries" onClose={() => setShowSpendingHistory(false)}
          footer={<button onClick={() => setShowSpendingHistory(false)} className="btn-ghost w-full">Close</button>}>
          {data.spendingEntries.length === 0 ? (
            <p className="text-center py-8 text-sm font-mono" style={{ color: '#4b5563' }}>// no entries yet</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {[...data.spendingEntries].reverse().map(e => (
                <div key={e.id} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[e.category] }} />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-mono">{fmt(e.amount)} EGP</p>
                      <p className="text-xs font-mono truncate" style={{ color: '#64748b' }}>
                        {CATEGORY_LABELS[e.category]} · {e.date}{e.note ? ` — ${e.note}` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => deleteSpending(e.id)} className="ml-3 opacity-30 hover:opacity-100 transition-opacity flex-shrink-0" style={{ color: '#f87171' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {showAddSub && (
        <Modal title={editSubId ? 'Edit Subscription' : 'Add Subscription'} onClose={() => setShowAddSub(false)}
          footer={<div className="flex gap-2"><button onClick={addOrUpdateSub} className="btn-primary flex-1">{editSubId ? 'Save' : 'Add'}</button><button onClick={() => setShowAddSub(false)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="space-y-2.5">
            <input autoFocus type="text" value={subName} onChange={e => setSubName(e.target.value)}
              placeholder="Service name (e.g. Netflix)" className="input-field" style={{ padding: '8px 12px' }} />
            <div className="grid grid-cols-2 gap-3">
              <input type="text" inputMode="decimal" value={subCost} onChange={e => setSubCost(e.target.value)}
                placeholder="Cost" className="input-field" style={{ padding: '8px 12px' }} />
              <select value={subCurrency} onChange={e => setSubCurrency(e.target.value as 'EGP' | 'USD')} className="input-field"
                style={{ paddingTop: '8px', paddingBottom: '8px', paddingLeft: '12px' }}>
                <option value="EGP">EGP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
        </Modal>
      )}

      {showRates && (
        <Modal title="Update Exchange Rates" onClose={() => setShowRates(false)}
          footer={<div className="flex gap-2"><button onClick={saveRates} className="btn-primary flex-1">Save Rates</button><button onClick={() => setShowRates(false)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="space-y-2.5">
            <input autoFocus type="text" inputMode="decimal" value={draftGold} onChange={e => setDraftGold(e.target.value)}
              placeholder="Gold 24K — EGP per gram" className="input-field" style={{ padding: '8px 12px' }} />
            <input type="text" inputMode="decimal" value={draftUsd} onChange={e => setDraftUsd(e.target.value)}
              placeholder="1 USD = ? EGP" className="input-field" style={{ padding: '8px 12px' }} />
          </div>
        </Modal>
      )}

      {showNW && (
        <Modal title="Save Net Worth Snapshot" onClose={() => setShowNW(false)}
          footer={<div className="flex gap-2"><button onClick={addNetWorthSnapshot} className="btn-primary flex-1">Save Snapshot</button><button onClick={() => setShowNW(false)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="rounded-xl p-3 mb-3 text-center"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
            <p className="text-xs font-mono mb-0.5" style={{ color: 'rgba(168,85,247,0.7)' }}>CURRENT NET WORTH</p>
            <p className="neon-num text-2xl font-mono font-bold">{fmt(netWorth)} EGP</p>
          </div>
          <input autoFocus type="text" value={nwLabel} onChange={e => setNwLabel(e.target.value)}
            placeholder={`Label (default: ${new Date().toLocaleDateString('en-GB')})`} className="input-field" style={{ padding: '8px 12px' }} />
        </Modal>
      )}

      {showAddAsset && (
        <Modal title={showAddAsset === 'cash' ? 'Add Cash' : showAddAsset === 'gold' ? 'Add Gold' : 'Add USD'}
          onClose={() => setShowAddAsset(null)}
          footer={<div className="flex gap-2"><button onClick={addToAsset} className="btn-primary flex-1">Add</button><button onClick={() => setShowAddAsset(null)} className="btn-ghost flex-1">Cancel</button></div>}>
          <div className="space-y-2.5">
            <div className="rounded-xl p-2.5 flex justify-between items-center"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.14)' }}>
              <span className="text-xs font-mono" style={{ color: '#64748b' }}>Current</span>
              <span className="font-mono text-sm text-white">
                {showAddAsset === 'cash' && `${fmt(data.cashEGP)} EGP`}
                {showAddAsset === 'gold' && `${data.goldGrams}g`}
                {showAddAsset === 'usd' && `$${fmt(data.usdAmount)}`}
              </span>
            </div>
            <input autoFocus type="text" inputMode="decimal" value={addAssetAmt}
              onChange={e => setAddAssetAmt(e.target.value)}
              placeholder={`Amount to add (${showAddAsset === 'cash' ? 'EGP' : showAddAsset === 'gold' ? 'grams' : 'USD'})`}
              className="input-field" style={{ padding: '8px 12px' }}
              onKeyDown={e => { if (e.key === 'Enter') addToAsset(); }} />
            {addAssetAmt && !isNaN(parseFloat(addAssetAmt)) && (
              <p className="text-xs font-mono" style={{ color: '#a855f7' }}>
                New:{' '}
                {showAddAsset === 'cash' && `${fmt(data.cashEGP + parseFloat(addAssetAmt))} EGP`}
                {showAddAsset === 'gold' && `${(data.goldGrams + parseFloat(addAssetAmt)).toFixed(3)}g`}
                {showAddAsset === 'usd' && `$${fmt(data.usdAmount + parseFloat(addAssetAmt))}`}
              </p>
            )}
          </div>
        </Modal>
      )}

      <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importData} />
    </div>
  );
}
