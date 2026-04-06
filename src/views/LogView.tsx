import React, { useState, useEffect } from 'react';
import { Plus, Eye, Edit, Save, Trash2, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval, isToday, isThisWeek } from 'date-fns';
import { Btn } from '../components/UI';
import { cn } from '../lib/utils';
import type { LogEntry } from '../types';

interface Props {
  logEntries: LogEntry[];
  setLogEntries: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  onSave: (entry: LogEntry) => Promise<void>;
  onDelete: (date: string) => Promise<void>;
  isDemoMode: boolean;
}

export const LogView = ({ logEntries, setLogEntries, onSave, onDelete, isDemoMode }: Props) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week'>('all');

  const today = new Date().toISOString().split('T')[0];

  // Auto-select today's entry if it exists, or set up a blank one
  useEffect(() => {
    if (logEntries.length > 0 && !selectedDate) {
      const todayEntry = logEntries.find((e) => e.date === today);
      if (todayEntry) {
        setSelectedDate(todayEntry.date);
        setEditContent(todayEntry.content);
      } else {
        setSelectedDate(logEntries[0].date);
        setEditContent(logEntries[0].content);
      }
    }
  }, [logEntries]);

  const createTodayEntry = () => {
    const existing = logEntries.find((e) => e.date === today);
    if (existing) {
      setSelectedDate(today);
      setEditContent(existing.content);
      setPreviewing(false);
      return;
    }
    const newEntry: LogEntry = {
      id: today,
      date: today,
      content: `## ${format(new Date(), 'EEEE, MMMM d yyyy')}\n\n`,
    };
    setLogEntries((prev) => [newEntry, ...prev]);
    setSelectedDate(today);
    setEditContent(newEntry.content);
    setPreviewing(false);
  };

  const selectEntry = (entry: LogEntry) => {
    setSelectedDate(entry.date);
    setEditContent(entry.content);
    setPreviewing(false);
  };

  const handleSave = async () => {
    if (!selectedDate) return;
    setSaving(true);
    const entry: LogEntry = { id: selectedDate, date: selectedDate, content: editContent };
    setLogEntries((prev) =>
      prev.some((e) => e.date === selectedDate)
        ? prev.map((e) => (e.date === selectedDate ? entry : e))
        : [entry, ...prev],
    );
    await onSave(entry);
    setSaving(false);
  };

  const handleDelete = async (date: string) => {
    if (!confirm('Delete this log entry?')) return;
    await onDelete(date);
    if (selectedDate === date) {
      const remaining = logEntries.filter((e) => e.date !== date);
      if (remaining.length > 0) {
        setSelectedDate(remaining[0].date);
        setEditContent(remaining[0].content);
      } else {
        setSelectedDate(null);
        setEditContent('');
      }
    }
  };

  const displayedEntries =
    filter === 'week'
      ? logEntries.filter((e) => isThisWeek(parseISO(e.date), { weekStartsOn: 1 }))
      : logEntries;

  const selectedEntry = logEntries.find((e) => e.date === selectedDate);
  const hasUnsavedChanges = selectedEntry && editContent !== selectedEntry.content;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-serif italic">Research Log</h1>
          <p className="text-zinc-500">Daily notes and observations — saved as markdown files</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex text-xs border border-zinc-200 rounded-lg overflow-hidden">
            {(['all', 'week'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 transition-colors capitalize',
                  filter === f ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50',
                )}
              >
                {f === 'week' ? 'This Week' : 'All'}
              </button>
            ))}
          </div>
          <Btn onClick={createTodayEntry}>
            <Plus size={14} /> Today's Entry
          </Btn>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-5 flex-1 min-h-0">
        {/* Entry list */}
        <div className="col-span-1 border-r border-zinc-100 pr-3 overflow-y-auto">
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-300 mb-3 px-1">
            {displayedEntries.length} entr{displayedEntries.length !== 1 ? 'ies' : 'y'}
          </p>
          <div className="space-y-1">
            {displayedEntries.map((entry) => {
              const isSelected = selectedDate === entry.date;
              const entryIsToday = entry.date === today;
              const firstLine =
                entry.content
                  .split('\n')
                  .find((l) => l.trim() && !l.startsWith('#'))
                  ?.slice(0, 60) || '(no content)';

              return (
                <div key={entry.date} className="group relative">
                  <button
                    onClick={() => selectEntry(entry)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                      isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      {entryIsToday && (
                        <span
                          className={cn(
                            'text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
                            isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700',
                          )}
                        >
                          Today
                        </span>
                      )}
                      <span
                        className={cn(
                          'text-[10px] font-mono',
                          isSelected ? 'text-white/70' : 'text-zinc-400',
                        )}
                      >
                        {entry.date}
                      </span>
                    </div>
                    <p
                      className={cn(
                        'text-xs truncate',
                        isSelected ? 'text-white/80' : 'text-zinc-500',
                      )}
                    >
                      {firstLine}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDelete(entry.date)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
            {displayedEntries.length === 0 && (
              <p className="text-xs text-zinc-400 italic px-2">
                {filter === 'week' ? 'No entries this week.' : 'No log entries yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="col-span-3 flex flex-col min-h-0">
          {selectedDate ? (
            <>
              <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Calendar size={15} className="text-zinc-300" />
                  <span className="text-sm font-mono text-zinc-500">{selectedDate}</span>
                  {hasUnsavedChanges && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                      Unsaved
                    </span>
                  )}
                  {isDemoMode && (
                    <span className="text-[10px] text-zinc-400 italic">(demo — save disabled)</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewing((p) => !p)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    {previewing ? <><Edit size={12} /> Edit</> : <><Eye size={12} /> Preview</>}
                  </button>
                  <Btn onClick={handleSave} disabled={saving || isDemoMode}>
                    <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                  </Btn>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {previewing ? (
                  <div className="prose prose-zinc max-w-none">
                    <ReactMarkdown>{editContent || '_Nothing yet._'}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full min-h-[400px] bg-zinc-50 rounded-xl p-5 text-sm font-mono text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-200 border border-zinc-100 resize-none leading-relaxed"
                    placeholder={`## ${format(new Date(), 'EEEE, MMMM d yyyy')}\n\nWhat did you work on today?`}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 gap-4">
              <p className="font-serif italic text-2xl">No entry selected</p>
              <Btn variant="secondary" onClick={createTodayEntry}>
                <Plus size={14} /> Start today's entry
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
