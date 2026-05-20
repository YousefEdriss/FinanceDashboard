import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, X, Check,
  Dumbbell, Utensils, Droplets, BookOpen, Briefcase, Laptop, Target,
} from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import type { DailyData, FreelancingTask } from '../types';

const today = new Date().toLocaleDateString('en-GB');

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const DEFAULT_TASKS: FreelancingTask[] = [
  { id: '1', text: 'Send proposal / follow up on leads', completed: false },
  { id: '2', text: 'Work on current project deliverable', completed: false },
];

const DEFAULT_DAILY: DailyData = {
  date: today, training: false, breakfast: false, lunch: false,
  dinner: false, hydrated: false, studiedNew: false, completedWorkTasks: false,
  freelancingTasks: DEFAULT_TASKS,
};

const HABITS = [
  { key: 'training' as const, label: 'Daily Training', icon: Dumbbell, color: '#a855f7', glow: 'rgba(168,85,247,0.75)', desc: 'Workout session' },
  { key: 'breakfast' as const, label: 'Breakfast', icon: Utensils, color: '#f59e0b', glow: 'rgba(245,158,11,0.5)', desc: 'Start the day right' },
  { key: 'lunch' as const, label: 'Lunch', icon: Utensils, color: '#22d3ee', glow: 'rgba(34,211,238,0.5)', desc: 'Midday fuel' },
  { key: 'dinner' as const, label: 'Dinner', icon: Utensils, color: '#34d399', glow: 'rgba(52,211,153,0.5)', desc: 'End of day meal' },
  { key: 'hydrated' as const, label: 'Stay Hydrated', icon: Droplets, color: '#38bdf8', glow: 'rgba(56,189,248,0.5)', desc: 'Drink enough water' },
  { key: 'studiedNew' as const, label: 'Study Something New', icon: BookOpen, color: '#818cf8', glow: 'rgba(129,140,248,0.5)', desc: 'Learn & grow daily' },
  { key: 'completedWorkTasks' as const, label: 'Complete Work Tasks', icon: Briefcase, color: '#fb7185', glow: 'rgba(251,113,133,0.5)', desc: "All tasks done" },
];

type HabitKey = typeof HABITS[number]['key'];

export default function DailyDashboard() {
  const [data, setData, cloudLoaded] = useCloudStorage<DailyData>('daily', DEFAULT_DAILY);
  const dailyResetDone = useRef(false);

  // Apply daily reset once, right after cloud data loads
  useEffect(() => {
    if (!cloudLoaded || dailyResetDone.current) return;
    dailyResetDone.current = true;
    if (data.date !== today) {
      setData({
        ...DEFAULT_DAILY,
        date: today,
        freelancingTasks: (data.freelancingTasks ?? DEFAULT_TASKS).map((t) => ({ ...t, completed: false })),
      });
    }
  }, [cloudLoaded, data, setData]);

  const [newTaskText, setNewTaskText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function toggle(key: HabitKey) {
    setData((d) => ({ ...d, [key]: !d[key] }));
  }

  function addTask() {
    if (!newTaskText.trim()) return;
    const task: FreelancingTask = { id: genId(), text: newTaskText.trim(), completed: false };
    setData((d) => ({ ...d, freelancingTasks: [...(d.freelancingTasks ?? []), task] }));
    setNewTaskText('');
  }

  function deleteTask(id: string) {
    setData((d) => ({ ...d, freelancingTasks: d.freelancingTasks.filter((t) => t.id !== id) }));
  }

  function saveEdit() {
    if (!editText.trim()) return;
    setData((d) => ({
      ...d,
      freelancingTasks: d.freelancingTasks.map((t) => t.id === editId ? { ...t, text: editText } : t),
    }));
    setEditId(null);
  }

  function toggleTask(id: string) {
    setData((d) => ({
      ...d,
      freelancingTasks: d.freelancingTasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t),
    }));
  }

  if (!cloudLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(168,85,247,0.5)', borderTopColor: 'transparent' }} />
        <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(168,85,247,0.6)' }}>LOADING DATA...</p>
      </div>
    );
  }

  const completedHabits = HABITS.filter((h) => data[h.key]).length;
  const completedTasks = (data.freelancingTasks ?? []).filter((t) => t.completed).length;
  const totalItems = HABITS.length + Math.max((data.freelancingTasks ?? []).length, 1);
  const progress = Math.round(((completedHabits + completedTasks) / totalItems) * 100);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="p-4 md:p-6 min-h-full">

      {/* ── Header ── */}
      <div className="mb-6" style={{ animation: 'fade-in-up 0.4s ease forwards' }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="live-dot" />
          <span className="text-xs font-mono tracking-widest" style={{ color: 'rgba(168,85,247,0.75)' }}>TODAY</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Daily Dashboard</h1>
        <p className="text-sm mt-0.5" style={{ color: '#94a3b8' }}>{dateStr}</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>Daily Progress</span>
            <span className="text-sm font-mono font-bold" style={{
              color: '#a855f7',
              textShadow: '0 0 10px rgba(168,85,247,0.7)',
            }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(168,85,247,0.14)' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
                boxShadow: '0 0 10px rgba(168,85,247,0.7), 0 0 20px rgba(168,85,247,0.3)',
              }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">

        {/* ── Habits ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} style={{ color: '#a855f7' }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.75)' }}>Habits</span>
            <span className="ml-auto text-xs font-mono" style={{ color: '#94a3b8' }}>
              {completedHabits}/{HABITS.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {HABITS.map((h, i) => {
              const done = data[h.key];
              const Icon = h.icon;
              return (
                <button key={h.key}
                  onClick={() => toggle(h.key)}
                  className="w-full text-left transition-all duration-300 active:scale-[0.98]"
                  style={{ animation: `fade-in-up 0.5s ease ${i * 60}ms both` }}>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={done ? {
                      background: `${h.color}0a`,
                      border: `1px solid ${h.color}35`,
                      boxShadow: `0 0 20px ${h.color}10, inset 0 0 20px ${h.color}05`,
                    } : {
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={done ? {
                        background: `${h.color}20`,
                        border: `1px solid ${h.color}50`,
                        boxShadow: `0 0 12px ${h.color}40`,
                        color: h.color,
                      } : {
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.14)',
                        color: '#94a3b8',
                      }}>
                      {done ? <Check size={17} /> : <Icon size={17} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none transition-all duration-300"
                        style={{ color: done ? h.color : '#e2e8f0', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.65 : 1 }}>
                        {h.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{h.desc}</p>
                    </div>

                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={done ? {
                        background: h.color,
                        border: `1px solid ${h.color}`,
                        boxShadow: `0 0 10px ${h.glow}`,
                      } : {
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>
                      {done && <Check size={11} className="text-black" strokeWidth={3} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Freelancing Tasks ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Laptop size={14} style={{ color: '#a855f7' }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.75)' }}>
              Freelancing Moves
            </span>
            <span className="ml-auto text-xs font-mono" style={{ color: '#94a3b8' }}>
              {completedTasks}/{(data.freelancingTasks ?? []).length}
            </span>
          </div>

          <div className="card p-4" style={{ animationDelay: '100ms' }}>
            <p className="text-xs font-mono mb-4" style={{ color: '#94a3b8' }}>
              // aim for at least 2 moves today
            </p>

            {(data.freelancingTasks ?? []).length > 0 && (
              <div className="mb-4">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(completedTasks / (data.freelancingTasks ?? []).length) * 100}%`,
                      background: 'linear-gradient(90deg, #b45309, #f59e0b)',
                      boxShadow: '0 0 8px rgba(245,158,11,0.7)',
                    }} />
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {(data.freelancingTasks ?? []).map((task, i) => (
                <div key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300"
                  style={{
                    animation: `fade-in-up 0.4s ease ${i * 50}ms both`,
                    ...(task.completed ? {
                      background: 'rgba(34,197,94,0.04)',
                      border: '1px solid rgba(34,197,94,0.15)',
                    } : {
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }),
                  }}>

                  <button onClick={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={task.completed ? {
                      background: '#22c55e',
                      border: '1px solid #22c55e',
                      boxShadow: '0 0 10px rgba(34,197,94,0.6)',
                    } : {
                      border: '1px solid rgba(168,85,247,0.3)',
                    }}>
                    {task.completed && <Check size={11} className="text-black" strokeWidth={3} />}
                  </button>

                  {editId === task.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }}
                        className="flex-1 text-sm outline-none rounded-lg px-2 py-1 font-mono text-white"
                        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.4)' }} />
                      <button onClick={saveEdit} style={{ color: '#22c55e' }}><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} style={{ color: '#f87171' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <span className="flex-1 text-sm transition-all duration-300"
                      style={{ color: task.completed ? '#6b7280' : '#cbd5e1', textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.text}
                    </span>
                  )}

                  {editId !== task.id && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => { setEditId(task.id); setEditText(task.text); }}
                        className="opacity-20 hover:opacity-100 transition-opacity" style={{ color: '#a855f7' }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteTask(task.id)}
                        className="opacity-20 hover:opacity-100 transition-opacity" style={{ color: '#f87171' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {(data.freelancingTasks ?? []).length === 0 && (
                <p className="text-center py-4 text-xs font-mono" style={{ color: '#94a3b8' }}>
                  // no tasks yet — add one below
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
                placeholder="Add a freelancing task..."
                className="flex-1 text-sm outline-none rounded-xl px-3 py-2.5 text-white placeholder-slate-700 transition-all duration-300"
                style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', fontFamily: 'Space Grotesk' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(168,85,247,0.1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)'; e.currentTarget.style.boxShadow = 'none'; }} />
              <button onClick={addTask} disabled={!newTaskText.trim()}
                className="px-3.5 py-2.5 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 disabled:opacity-30"
                style={{
                  background: 'rgba(168,85,247,0.15)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  color: '#a855f7',
                }}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="card mt-4 p-4" style={{ animationDelay: '200ms' }}>
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'rgba(168,85,247,0.7)' }}>
              Today's Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Habits', value: completedHabits, total: HABITS.length, color: '#a855f7' },
                { label: 'FL Tasks', value: completedTasks, total: (data.freelancingTasks ?? []).length, color: '#f59e0b' },
                { label: 'Progress', value: progress, total: 100, color: '#22d3ee', suffix: '%' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3 text-center"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
                  <div className="text-2xl font-mono font-bold leading-none"
                    style={{ color: s.color, textShadow: `0 0 10px ${s.color}80` }}>
                    {s.value}{s.suffix ?? ''}
                  </div>
                  <div className="text-xs font-mono mt-1.5" style={{ color: '#94a3b8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
