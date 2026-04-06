import React, { useState } from 'react';
import { Plus, Code, ExternalLink } from 'lucide-react';
import { Card, Btn, Badge, FormField, Input, Textarea } from '../components/UI';
import { cn } from '../lib/utils';
import type { Experiment, Task } from '../types';

interface Props {
  experiments: Experiment[];
  setExperiments: React.Dispatch<React.SetStateAction<Experiment[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const STATUS_VARIANTS: Record<Experiment['status'], 'default' | 'info' | 'warning' | 'success'> = {
  planned: 'default',
  running: 'info',
  completed: 'success',
};

export const ExperimentsView = ({ experiments, setExperiments, setTasks }: Props) => {
  const addExperiment = () => {
    setExperiments((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: 'New Experiment',
        date: new Date().toISOString().split('T')[0],
        summary: '',
        status: 'planned',
      },
    ]);
  };

  const update = (id: string, patch: Partial<Experiment>) =>
    setExperiments((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const generateTask = (exp: Experiment) => {
    if (exp.taskId) return;
    const taskId = Date.now().toString();
    setTasks((prev) => [
      ...prev,
      {
        id: taskId,
        title: `Experiment: ${exp.title}`,
        status: 'todo',
        parentType: 'experiment',
        parentId: exp.id,
        parentTitle: exp.title,
      },
    ]);
    update(exp.id, { taskId });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Experiments &amp; Methods</h1>
          <p className="text-zinc-500">Digital humanities experiments and methodological notes</p>
        </div>
        <Btn onClick={addExperiment}>
          <Plus size={15} /> Add Experiment
        </Btn>
      </header>

      <div className="space-y-5">
        {experiments.map((exp) => (
          <Card key={exp.id} className="space-y-4">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="text"
                    value={exp.title}
                    onChange={(e) => update(exp.id, { title: e.target.value })}
                    className="text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0"
                  />
                  <Badge variant={STATUS_VARIANTS[exp.status]}>{exp.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold shrink-0">
                    Date
                  </label>
                  <input
                    type="date"
                    value={exp.date}
                    onChange={(e) => update(exp.id, { date: e.target.value })}
                    className="bg-transparent border-b border-zinc-100 focus:border-zinc-400 focus:outline-none py-0.5 font-mono text-sm text-zinc-600"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => generateTask(exp)}
                  disabled={!!exp.taskId}
                  className={cn(
                    'text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors',
                    exp.taskId
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600',
                  )}
                >
                  {exp.taskId ? '✓ Task Linked' : 'Generate Task'}
                </button>
              </div>
            </div>

            {/* Status selector */}
            <div className="flex gap-2">
              {(['planned', 'running', 'completed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update(exp.id, { status: s })}
                  className={cn(
                    'text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border transition-all',
                    exp.status === s
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'text-zinc-400 border-zinc-100 hover:border-zinc-300',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Summary */}
            <FormField label="Summary &amp; Results (Markdown)">
              <Textarea
                value={exp.summary}
                onChange={(e) => update(exp.id, { summary: e.target.value })}
                rows={6}
                placeholder="Methodology, results, and observations..."
              />
            </FormField>

            {/* Code link */}
            <FormField label="Code Repository URL">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Code
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={13}
                  />
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={exp.codeLink || ''}
                    onChange={(e) => update(exp.id, { codeLink: e.target.value })}
                    className="w-full bg-zinc-50 rounded-lg pl-9 pr-3 py-2 text-xs border border-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-200"
                  />
                </div>
                {exp.codeLink && (
                  <a
                    href={exp.codeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    <ExternalLink size={12} /> Open
                  </a>
                )}
              </div>
            </FormField>

            <div className="flex justify-end pt-1 border-t border-zinc-50">
              <button
                onClick={() =>
                  setExperiments((prev) => prev.filter((e) => e.id !== exp.id))
                }
                className="text-[10px] text-zinc-200 hover:text-red-500 transition-colors uppercase font-bold tracking-widest"
              >
                Delete Experiment
              </button>
            </div>
          </Card>
        ))}

        {experiments.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 italic">
            No experiments logged yet.
          </div>
        )}
      </div>
    </div>
  );
};
