import React, { useState } from 'react';
import {
  Users,
  CheckSquare,
  DollarSign,
  FileText,
  FlaskConical,
  Clock,
  BookOpen,
  Edit2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Card, Badge, Btn, FormField, Input, Textarea } from '../components/UI';
import { cn } from '../lib/utils';
import type {
  Researcher,
  Task,
  Funding,
  WritingProject,
  Experiment,
  ProjectMetadata,
  LogEntry,
} from '../types';

interface DashboardProps {
  researchers: Researcher[];
  tasks: Task[];
  funding: Funding[];
  notes: { name: string; content: string }[];
  writing: WritingProject[];
  experiments: Experiment[];
  projectMeta: ProjectMetadata;
  setProjectMeta: React.Dispatch<React.SetStateAction<ProjectMetadata>>;
  logEntries: LogEntry[];
}

export const Dashboard = ({
  researchers,
  tasks,
  funding,
  notes,
  writing,
  experiments,
  projectMeta,
  setProjectMeta,
  logEntries,
}: DashboardProps) => {
  const [editingMeta, setEditingMeta] = useState(false);
  const [draft, setDraft] = useState(projectMeta);

  const totalFunding = funding.reduce((acc, f) => acc + f.amount, 0);
  const totalSpent = funding.reduce(
    (acc, f) => acc + f.expenses.reduce((s, e) => s + e.amount, 0),
    0,
  );

  const totalWords = writing.reduce((acc, w) => acc + w.wordCount, 0);
  const totalTargetWords = writing.reduce((acc, w) => acc + w.targetWordCount, 0);
  const writingProgress =
    totalTargetWords > 0 ? Math.round((totalWords / totalTargetWords) * 100) : 0;

  const today = new Date();
  const upcomingDeadlines = [
    ...tasks
      .filter((t) => t.dueDate && t.status !== 'done')
      .map((t) => ({ label: t.title, date: t.dueDate!, type: 'task' as const })),
    ...funding
      .filter((f) => f.deadline)
      .map((f) => ({ label: `${f.source} deadline`, date: f.deadline!, type: 'funding' as const })),
  ]
    .map((d) => ({ ...d, daysAway: differenceInDays(parseISO(d.date), today) }))
    .filter((d) => d.daysAway >= -1)
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 6);

  const unfiledExpenses = funding.flatMap((f) =>
    f.expenses.filter((e) => !e.reportFiled),
  ).length;

  const saveMeta = () => {
    setProjectMeta(draft);
    setEditingMeta(false);
  };

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <header className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {editingMeta ? (
            <div className="space-y-3 max-w-xl">
              <FormField label="Project Title">
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  className="text-2xl font-serif italic"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Principal Investigator">
                  <Input
                    value={draft.pi}
                    onChange={(e) => setDraft((p) => ({ ...p, pi: e.target.value }))}
                    placeholder="Your name"
                  />
                </FormField>
                <FormField label="Institution">
                  <Input
                    value={draft.institution}
                    onChange={(e) => setDraft((p) => ({ ...p, institution: e.target.value }))}
                    placeholder="University / Department"
                  />
                </FormField>
                <FormField label="Start Date">
                  <Input
                    type="date"
                    value={draft.startDate || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </FormField>
                <FormField label="End Date">
                  <Input
                    type="date"
                    value={draft.endDate || ''}
                    onChange={(e) => setDraft((p) => ({ ...p, endDate: e.target.value }))}
                  />
                </FormField>
              </div>
              <FormField label="Description">
                <Textarea
                  value={draft.description}
                  onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="One sentence about this project..."
                />
              </FormField>
              <FormField label="Currency Symbol">
                <Input
                  value={draft.currency}
                  onChange={(e) => setDraft((p) => ({ ...p, currency: e.target.value }))}
                  className="w-24"
                  placeholder="$"
                />
              </FormField>
              <div className="flex gap-2 pt-1">
                <Btn onClick={saveMeta}>
                  <Check size={14} /> Save
                </Btn>
                <Btn variant="secondary" onClick={() => { setDraft(projectMeta); setEditingMeta(false); }}>
                  Cancel
                </Btn>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 group">
                <h1 className="text-4xl font-serif italic text-zinc-900 truncate">
                  {projectMeta.title}
                </h1>
                <button
                  onClick={() => { setDraft(projectMeta); setEditingMeta(true); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-700"
                >
                  <Edit2 size={16} />
                </button>
              </div>
              {(projectMeta.pi || projectMeta.institution) && (
                <p className="text-zinc-500 mt-1">
                  {[projectMeta.pi, projectMeta.institution].filter(Boolean).join(' · ')}
                </p>
              )}
              {projectMeta.description && (
                <p className="text-zinc-400 text-sm mt-1 italic">{projectMeta.description}</p>
              )}
              {(projectMeta.startDate || projectMeta.endDate) && (
                <p className="text-zinc-400 text-xs mt-1 font-mono">
                  {projectMeta.startDate ? format(parseISO(projectMeta.startDate), 'MMM d, yyyy') : '?'}
                  {' — '}
                  {projectMeta.endDate ? format(parseISO(projectMeta.endDate), 'MMM d, yyyy') : 'ongoing'}
                </p>
              )}
            </div>
          )}
        </div>
        {unfiledExpenses > 0 && !editingMeta && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg text-xs font-medium shrink-0">
            <AlertTriangle size={14} />
            {unfiledExpenses} expense{unfiledExpenses > 1 ? 's' : ''} not yet reported
          </div>
        )}
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex justify-between items-start mb-3">
            <Users className="text-zinc-400" size={18} />
            <Badge variant="info">{researchers.length} active</Badge>
          </div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Team</p>
          <p className="text-3xl font-light mt-0.5">{researchers.length}</p>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-3">
            <CheckSquare className="text-zinc-400" size={18} />
            <Badge variant={tasks.filter((t) => t.status === 'blocked').length > 0 ? 'blocked' : 'warning'}>
              {tasks.filter((t) => t.status !== 'done').length} open
            </Badge>
          </div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Tasks</p>
          <p className="text-3xl font-light mt-0.5">
            {tasks.filter((t) => t.status === 'done').length}
            <span className="text-sm text-zinc-400 ml-1">/ {tasks.length} done</span>
          </p>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-3">
            <DollarSign className="text-zinc-400" size={18} />
            <Badge variant={totalFunding > 0 ? 'success' : 'default'}>
              {totalFunding > 0 ? `${Math.round((totalSpent / totalFunding) * 100)}% spent` : 'no funding'}
            </Badge>
          </div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Remaining</p>
          <p className="text-3xl font-light mt-0.5">
            {projectMeta.currency}{(totalFunding - totalSpent).toLocaleString()}
          </p>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-3">
            <FileText className="text-zinc-400" size={18} />
            <Badge variant="info">{writingProgress}% done</Badge>
          </div>
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Words Written</p>
          <p className="text-3xl font-light mt-0.5">
            {totalWords.toLocaleString()}
            {totalTargetWords > 0 && (
              <span className="text-sm text-zinc-400 ml-1">/ {totalTargetWords.toLocaleString()}</span>
            )}
          </p>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-serif italic">Upcoming Deadlines</h2>
            <Clock size={15} className="text-zinc-300" />
          </div>
          <div className="space-y-2">
            {upcomingDeadlines.map((d, i) => {
              const overdue = d.daysAway < 0;
              const soon = d.daysAway >= 0 && d.daysAway <= 3;
              return (
                <div
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-zinc-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        d.type === 'funding' ? 'bg-amber-400' : 'bg-zinc-400',
                        overdue && 'bg-red-500',
                        soon && !overdue && 'bg-amber-500',
                      )}
                    />
                    <span className="text-sm text-zinc-700">{d.label}</span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-mono shrink-0 ml-2',
                      overdue ? 'text-red-500 font-bold' : soon ? 'text-amber-600 font-bold' : 'text-zinc-400',
                    )}
                  >
                    {overdue
                      ? `${Math.abs(d.daysAway)}d overdue`
                      : d.daysAway === 0
                      ? 'today'
                      : `in ${d.daysAway}d`}
                  </span>
                </div>
              );
            })}
            {upcomingDeadlines.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No upcoming deadlines.</p>
            )}
          </div>
        </Card>

        {/* Writing Progress */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-serif italic">Writing Progress</h2>
            <FileText size={15} className="text-zinc-300" />
          </div>
          <div className="space-y-4">
            {writing.slice(0, 4).map((w) => {
              const pct =
                w.targetWordCount > 0
                  ? Math.min(100, Math.round((w.wordCount / w.targetWordCount) * 100))
                  : 0;
              return (
                <div key={w.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-700 truncate pr-2">{w.title}</span>
                    <span className="text-zinc-400 shrink-0">{pct}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-900 h-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {w.wordCount.toLocaleString()} / {w.targetWordCount.toLocaleString()} words
                  </p>
                </div>
              );
            })}
            {writing.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No writing projects.</p>
            )}
          </div>
        </Card>

        {/* Recent Notes */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-serif italic">Recent Notes</h2>
            <BookOpen size={15} className="text-zinc-300" />
          </div>
          <div className="space-y-1">
            {notes.slice(0, 5).map((note, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                <FileText size={14} className="text-zinc-300 shrink-0" />
                <span className="text-sm text-zinc-700">{note.name.replace('.md', '')}</span>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No notes found.</p>
            )}
          </div>
        </Card>

        {/* Recent Experiments */}
        <Card className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-serif italic">Recent Experiments</h2>
            <FlaskConical size={15} className="text-zinc-300" />
          </div>
          <div className="space-y-2">
            {experiments
              .slice(-4)
              .reverse()
              .map((exp) => (
                <div key={exp.id} className="py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-zinc-800">{exp.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono ml-2 shrink-0">{exp.date}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{exp.summary}</p>
                </div>
              ))}
            {experiments.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No experiments logged.</p>
            )}
          </div>
        </Card>

        {/* Recent Log */}
        {logEntries.length > 0 && (
          <Card className="space-y-4 lg:col-span-2">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-serif italic">Recent Log</h2>
              <Clock size={15} className="text-zinc-300" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {logEntries.slice(0, 3).map((entry) => {
                const firstLine = entry.content.split('\n').find((l) => l.trim()) || '';
                return (
                  <div key={entry.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-[10px] font-mono text-zinc-400 mb-1">{entry.date}</p>
                    <p className="text-sm text-zinc-700 line-clamp-3">{firstLine}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
