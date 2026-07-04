import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, X, Check,
  Dumbbell, Utensils, Droplets, BookOpen, Briefcase, Laptop, Target,
  Settings,
} from 'lucide-react';
import { useCloudStorage } from '../hooks/useCloudStorage';
import type { DailyData, FreelancingTask, HabitDef } from '../types';

const today = new Date().toLocaleDateString('en-GB');

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/* ── Default habit definitions ── */
const DEFAULT_HABIT_DEFS: HabitDef[] = [
  { id: 'training',            label: 'Daily Training',       desc: 'Workout session',       color: '#a855f7' },
  { id: 'breakfast',           label: 'Breakfast',            desc: 'Start the day right',   color: '#f59e0b' },
  { id: 'lunch',               label: 'Lunch',                desc: 'Midday fuel',           color: '#22d3ee' },
  { id: 'dinner',              label: 'Dinner',               desc: 'End of day meal',       color: '#34d399' },
  { id: 'hydrated',            label: 'Stay Hydrated',        desc: 'Drink enough water',    color: '#38bdf8' },
  { id: 'studiedNew',          label: 'Study Something New',  desc: 'Learn & grow daily',    color: '#818cf8' },
  { id: 'completedWorkTasks',  label: 'Complete Work Tasks',  desc: 'All tasks done',        color: '#fb7185' },
];

const DEFAULT_TASKS: FreelancingTask[] = [
  { id: '1', text: 'Send proposal / follow up on leads', completed: false },
  { id: '2', text: 'Work on current project deliverable', completed: false },
];

const DEFAULT_DAILY: DailyData = {
  date: today,
  habits: DEFAULT_HABIT_DEFS,
  habitsDone: {},
  workTasks: DEFAULT_TASKS,
};


function getHabitIcon(id: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    training:           <Dumbbell size={17} />,
    breakfast:          <Utensils size={17} />,
    lunch:              <Utensils size={17} />,
    dinner:             <Utensils size={17} />,
    hydrated:           <Droplets size={17} />,
    studiedNew:         <BookOpen size={17} />,
    completedWorkTasks: <Briefcase size={17} />,
  };
  return map[id] ?? <Target size={17} />;
}

const COLOR_PALETTE = [
  '#a855f7', '#f59e0b', '#22d3ee', '#34d399',
  '#38bdf8', '#818cf8', '#fb7185', '#f97316',
  '#84cc16', '#ec4899',
];

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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md flex flex-col"
        style={{ background: 'rgba(14,14,14,0.99)', border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '20px', boxShadow: '0 0 60px rgba(168,85,247,0.2)', maxHeight: '85vh' }}>
        <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
          <div className="neon-hr mb-3" style={{ boxShadow: '0 0 8px rgba(168,85,247,0.4)' }} />
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white text-sm">{title}</h2>
            <button onClick={onClose} className="p-1 hover:opacity-60 transition-opacity" style={{ color: '#64748b' }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' as never, overscrollBehavior: 'contain', padding: '0 20px 6px', flex: 1 }}>
          {children}
        </div>
        {footer && (
          <div style={{ padding: '10px 20px 18px', flexShrink: 0, borderTop: '1px solid rgba(168,85,247,0.1)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyDashboard() {
  const [data, setData, cloudLoaded] = useCloudStorage<DailyData>('daily', DEFAULT_DAILY);
  const initDone = useRef(false);

  /* ── Init: migrate old format + daily reset ── */
  useEffect(() => {
    if (!cloudLoaded || initDone.current) return;
    initDone.current = true;

    const d = data as DailyData & Record<string, unknown>;
    const hasNewFormat = Array.isArray(d.habits);

    if (!hasNewFormat) {
      // Migrate from old boolean-habit format
      const oldKeys = ['training', 'breakfast', 'lunch', 'dinner', 'hydrated', 'studiedNew', 'completedWorkTasks'];
      const habitsDone: Record<string, boolean> = {};
      oldKeys.forEach(k => { habitsDone[k] = !!(d[k]); });

      const isNewDay = d.date !== today;
      setData({
        date: today,
        habits: DEFAULT_HABIT_DEFS,
        habitsDone: isNewDay ? {} : habitsDone,
        workTasks: ((d.freelancingTasks ?? d.workTasks ?? DEFAULT_TASKS) as FreelancingTask[])
          .map(t => isNewDay ? { ...t, completed: false } : t),
      });
    } else if (d.date !== today) {
      // New format, new day — reset completions
      setData(prev => ({
        ...prev,
        date: today,
        habitsDone: {},
        workTasks: (prev.workTasks ?? []).map(t => ({ ...t, completed: false })),
      }));
    }
  }, [cloudLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Work Tasks state ── */
  const [newTaskText, setNewTaskText] = useState('');
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');

  /* ── Manage Habits modal ── */
  const [showManageHabits, setShowManageHabits] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | null>(null);
  const [habitForm, setHabitForm] = useState({ label: '', desc: '', color: COLOR_PALETTE[0] });

  const habits: HabitDef[] = data.habits ?? DEFAULT_HABIT_DEFS;
  const habitsDone: Record<string, boolean> = data.habitsDone ?? {};
  const workTasks: FreelancingTask[] = data.workTasks ?? DEFAULT_TASKS;

  /* ── Habit actions ── */
  function toggleHabit(id: string) {
    setData(d => ({ ...d, habitsDone: { ...(d.habitsDone ?? {}), [id]: !(d.habitsDone ?? {})[id] } }));
  }

  function saveHabit() {
    if (!habitForm.label.trim()) return;
    if (editHabitId) {
      setData(d => ({
        ...d,
        habits: (d.habits ?? DEFAULT_HABIT_DEFS).map(h =>
          h.id === editHabitId ? { ...h, label: habitForm.label, desc: habitForm.desc, color: habitForm.color } : h
        ),
      }));
      setEditHabitId(null);
    } else {
      const newHabit: HabitDef = { id: genId(), label: habitForm.label, desc: habitForm.desc, color: habitForm.color };
      setData(d => ({ ...d, habits: [...(d.habits ?? DEFAULT_HABIT_DEFS), newHabit] }));
    }
    setHabitForm({ label: '', desc: '', color: COLOR_PALETTE[0] });
  }

  function startEditHabit(h: HabitDef) {
    setEditHabitId(h.id);
    setHabitForm({ label: h.label, desc: h.desc, color: h.color });
  }

  function deleteHabit(id: string) {
    setData(d => ({
      ...d,
      habits: (d.habits ?? DEFAULT_HABIT_DEFS).filter(h => h.id !== id),
      habitsDone: Object.fromEntries(Object.entries(d.habitsDone ?? {}).filter(([k]) => k !== id)),
    }));
  }

  /* ── Work Task actions ── */
  function addTask() {
    if (!newTaskText.trim()) return;
    setData(d => ({ ...d, workTasks: [...(d.workTasks ?? []), { id: genId(), text: newTaskText.trim(), completed: false }] }));
    setNewTaskText('');
  }

  function toggleTask(id: string) {
    setData(d => ({ ...d, workTasks: (d.workTasks ?? []).map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  }

  function saveEditTask() {
    if (!editTaskText.trim()) return;
    setData(d => ({ ...d, workTasks: (d.workTasks ?? []).map(t => t.id === editTaskId ? { ...t, text: editTaskText } : t) }));
    setEditTaskId(null);
  }

  function deleteTask(id: string) {
    setData(d => ({ ...d, workTasks: (d.workTasks ?? []).filter(t => t.id !== id) }));
  }

  /* ── Progress ── */
  const completedHabits = habits.filter(h => habitsDone[h.id]).length;
  const completedTasks = workTasks.filter(t => t.completed).length;
  const totalItems = habits.length + Math.max(workTasks.length, 1);
  const progress = Math.round(((completedHabits + completedTasks) / totalItems) * 100);

  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!cloudLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(168,85,247,0.5)', borderTopColor: 'transparent' }} />
        <p className="text-xs font-mono tracking-widest" style={{ color: 'rgba(168,85,247,0.6)' }}>LOADING DATA...</p>
      </div>
    );
  }

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
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono" style={{ color: '#94a3b8' }}>Daily Progress</span>
            <span className="text-sm font-mono font-bold"
              style={{ color: '#a855f7', textShadow: '0 0 10px rgba(168,85,247,0.7)' }}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(168,85,247,0.14)' }}>
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`,
                background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
                boxShadow: '0 0 10px rgba(168,85,247,0.7), 0 0 20px rgba(168,85,247,0.3)' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">

        {/* ── Habits ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Target size={14} style={{ color: '#a855f7' }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.75)' }}>Habits</span>
            <span className="ml-auto text-xs font-mono" style={{ color: '#94a3b8' }}>{completedHabits}/{habits.length}</span>
            <button onClick={() => setShowManageHabits(true)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all duration-200"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7' }}
              title="Manage habits">
              <Settings size={11} /> Manage
            </button>
          </div>

          <div className="space-y-2.5">
            {habits.map((h, i) => {
              const done = habitsDone[h.id] ?? false;
              return (
                <button key={h.id} onClick={() => toggleHabit(h.id)}
                  className="w-full text-left transition-all duration-300 active:scale-[0.98]"
                  style={{ animation: `fade-in-up 0.5s ease ${i * 50}ms both` }}>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={done ? {
                      background: `${h.color}0a`, border: `1px solid ${h.color}35`,
                      boxShadow: `0 0 20px ${h.color}10, inset 0 0 20px ${h.color}05`,
                    } : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={done ? { background: `${h.color}20`, border: `1px solid ${h.color}50`,
                        boxShadow: `0 0 12px ${h.color}40`, color: h.color }
                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: '#94a3b8' }}>
                      {done ? <Check size={17} /> : getHabitIcon(h.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none transition-all duration-300"
                        style={{ color: done ? h.color : '#e2e8f0', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.65 : 1 }}>
                        {h.label}
                      </p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{h.desc}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={done ? { background: h.color, border: `1px solid ${h.color}`, boxShadow: `0 0 10px ${h.color}88` }
                        : { border: '1px solid rgba(255,255,255,0.1)' }}>
                      {done && <Check size={11} className="text-black" strokeWidth={3} />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Work Tasks ── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Laptop size={14} style={{ color: '#a855f7' }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: 'rgba(168,85,247,0.75)' }}>Work Tasks</span>
            <span className="ml-auto text-xs font-mono" style={{ color: '#94a3b8' }}>{completedTasks}/{workTasks.length}</span>
          </div>

          <div className="card p-4" style={{ animationDelay: '100ms' }}>
            <p className="text-xs font-mono mb-4" style={{ color: '#94a3b8' }}>// aim for at least 2 tasks today</p>

            {workTasks.length > 0 && (
              <div className="mb-4">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(245,158,11,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(completedTasks / workTasks.length) * 100}%`,
                      background: 'linear-gradient(90deg, #b45309, #f59e0b)',
                      boxShadow: '0 0 8px rgba(245,158,11,0.7)' }} />
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {workTasks.map((task, i) => (
                <div key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300"
                  style={{ animation: `fade-in-up 0.4s ease ${i * 50}ms both`,
                    ...(task.completed
                      ? { background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }
                      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)' }) }}>

                  <button onClick={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                    style={task.completed ? { background: '#22c55e', border: '1px solid #22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.6)' }
                      : { border: '1px solid rgba(168,85,247,0.3)' }}>
                    {task.completed && <Check size={11} className="text-black" strokeWidth={3} />}
                  </button>

                  {editTaskId === task.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input autoFocus value={editTaskText} onChange={e => setEditTaskText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEditTask(); if (e.key === 'Escape') setEditTaskId(null); }}
                        className="flex-1 text-sm outline-none rounded-lg px-2 py-1 font-mono text-white"
                        style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.4)' }} />
                      <button onClick={saveEditTask} style={{ color: '#22c55e' }}><Check size={14} /></button>
                      <button onClick={() => setEditTaskId(null)} style={{ color: '#f87171' }}><X size={14} /></button>
                    </div>
                  ) : (
                    <span className="flex-1 text-sm transition-all duration-300"
                      style={{ color: task.completed ? '#6b7280' : '#cbd5e1', textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.text}
                    </span>
                  )}

                  {editTaskId !== task.id && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => { setEditTaskId(task.id); setEditTaskText(task.text); }}
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
              {workTasks.length === 0 && (
                <p className="text-center py-4 text-xs font-mono" style={{ color: '#94a3b8' }}>// no tasks yet — add one below</p>
              )}
            </div>

            <div className="flex gap-2">
              <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
                placeholder="Add a work task..."
                className="flex-1 text-sm outline-none rounded-xl px-3 py-2.5 text-white placeholder-slate-700 transition-all duration-300"
                style={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.12)', fontFamily: 'Space Grotesk' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(168,85,247,0.1)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.12)'; e.currentTarget.style.boxShadow = 'none'; }} />
              <button onClick={addTask} disabled={!newTaskText.trim()}
                className="px-3.5 py-2.5 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 disabled:opacity-30"
                style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="card mt-4 p-4" style={{ animationDelay: '200ms' }}>
            <p className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color: 'rgba(168,85,247,0.7)' }}>Today's Summary</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Habits', value: completedHabits, total: habits.length, color: '#a855f7' },
                { label: 'Tasks', value: completedTasks, total: workTasks.length, color: '#f59e0b' },
                { label: 'Progress', value: progress, total: 100, color: '#22d3ee', suffix: '%' },
              ].map(s => (
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

      {/* ── Manage Habits Modal ── */}
      {showManageHabits && (
        <Modal title="Manage Habits" onClose={() => { setShowManageHabits(false); setEditHabitId(null); setHabitForm({ label: '', desc: '', color: COLOR_PALETTE[0] }); }}>
          {/* Existing habits list */}
          <div className="space-y-2 mb-4">
            {habits.map(h => (
              <div key={h.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)' }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: h.color, boxShadow: `0 0 6px ${h.color}` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{h.label}</p>
                  <p className="text-xs font-mono truncate" style={{ color: '#64748b' }}>{h.desc}</p>
                </div>
                <button onClick={() => startEditHabit(h)} style={{ color: '#a855f7' }}
                  className="opacity-40 hover:opacity-100 transition-opacity"><Pencil size={13} /></button>
                <button onClick={() => deleteHabit(h.id)} style={{ color: '#f87171' }}
                  className="opacity-40 hover:opacity-100 transition-opacity"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>

          {/* Add / Edit form */}
          <div className="pt-3" style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }}>
            <p className="text-xs font-mono mb-3" style={{ color: 'rgba(168,85,247,0.6)' }}>
              {editHabitId ? '// EDIT HABIT' : '// ADD HABIT'}
            </p>
            <div className="space-y-2.5">
              <input type="text" value={habitForm.label} onChange={e => setHabitForm(f => ({ ...f, label: e.target.value }))}
                placeholder="Habit name (e.g. Meditate)" className="input-field" style={{ padding: '8px 12px' }} />
              <input type="text" value={habitForm.desc} onChange={e => setHabitForm(f => ({ ...f, desc: e.target.value }))}
                placeholder="Short description (optional)" className="input-field" style={{ padding: '8px 12px' }} />
              <div>
                <p className="text-xs font-mono mb-2" style={{ color: '#64748b' }}>Color</p>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_PALETTE.map(c => (
                    <button key={c} onClick={() => setHabitForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-all duration-200"
                      style={{ background: c, boxShadow: habitForm.color === c ? `0 0 10px ${c}, 0 0 0 2px #000, 0 0 0 3px ${c}` : 'none' }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveHabit} disabled={!habitForm.label.trim()} className="btn-primary flex-1 disabled:opacity-40">
                  {editHabitId ? 'Save Changes' : 'Add Habit'}
                </button>
                {editHabitId && (
                  <button onClick={() => { setEditHabitId(null); setHabitForm({ label: '', desc: '', color: COLOR_PALETTE[0] }); }}
                    className="btn-ghost flex-1">Cancel</button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
