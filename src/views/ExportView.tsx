import React, { useState } from 'react';
import { Download, FileText, Copy, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, Btn, FormField, Input } from '../components/UI';
import { cn } from '../lib/utils';
import type {
  ProjectMetadata,
  Researcher,
  Task,
  Funding,
  WritingProject,
  Experiment,
  LogEntry,
} from '../types';

interface Props {
  projectMeta: ProjectMetadata;
  researchers: Researcher[];
  tasks: Task[];
  funding: Funding[];
  writing: WritingProject[];
  experiments: Experiment[];
  logEntries: LogEntry[];
}

type ReportSection =
  | 'overview'
  | 'team'
  | 'tasks'
  | 'funding'
  | 'writing'
  | 'experiments'
  | 'log';

const SECTIONS: { id: ReportSection; label: string; description: string }[] = [
  { id: 'overview', label: 'Project Overview', description: 'Title, PI, institution, description, dates' },
  { id: 'team', label: 'Team Members', description: 'Researchers, roles, and task assignments' },
  { id: 'tasks', label: 'Task Summary', description: 'Kanban status breakdown and overdue items' },
  { id: 'funding', label: 'Funding & Expenses', description: 'Grant balances and expense log' },
  { id: 'writing', label: 'Writing Progress', description: 'Word counts and status per project' },
  { id: 'experiments', label: 'Experiments', description: 'All experiments with dates and status' },
  { id: 'log', label: 'Recent Log Entries', description: 'Last N days of research log' },
];

const generateMarkdown = (
  meta: ProjectMetadata,
  researchers: Researcher[],
  tasks: Task[],
  funding: Funding[],
  writing: WritingProject[],
  experiments: Experiment[],
  logEntries: LogEntry[],
  selectedSections: Set<ReportSection>,
  reportDate: string,
  logDays: number,
): string => {
  const lines: string[] = [];
  const c = meta.currency;
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  lines.push(`# Status Report`);
  lines.push(`*Generated: ${format(now, 'MMMM d, yyyy')}*`);
  lines.push(`*Report period ending: ${reportDate}*`);
  lines.push('');

  // --- Overview ---
  if (selectedSections.has('overview')) {
    lines.push('## Project Overview');
    lines.push('');
    lines.push(`**Project:** ${meta.title}`);
    if (meta.pi) lines.push(`**Principal Investigator:** ${meta.pi}`);
    if (meta.institution) lines.push(`**Institution:** ${meta.institution}`);
    if (meta.startDate || meta.endDate) {
      const start = meta.startDate ? format(parseISO(meta.startDate), 'MMMM d, yyyy') : 'TBD';
      const end = meta.endDate ? format(parseISO(meta.endDate), 'MMMM d, yyyy') : 'ongoing';
      lines.push(`**Project Period:** ${start} — ${end}`);
    }
    if (meta.description) {
      lines.push('');
      lines.push(meta.description);
    }
    lines.push('');
  }

  // --- Team ---
  if (selectedSections.has('team') && researchers.length > 0) {
    lines.push('## Team Members');
    lines.push('');
    researchers.forEach((r) => {
      const assignedTasks = tasks.filter((t) => t.assigneeId === r.id);
      const done = assignedTasks.filter((t) => t.status === 'done').length;
      lines.push(`### ${r.name}`);
      lines.push(`*${r.role}*`);
      if (r.email) lines.push(`- Email: ${r.email}`);
      if (r.studentID) lines.push(`- Student ID: ${r.studentID}`);
      if (assignedTasks.length > 0) {
        lines.push(`- Tasks: ${done}/${assignedTasks.length} completed`);
      }
      lines.push('');
    });
  }

  // --- Tasks ---
  if (selectedSections.has('tasks')) {
    lines.push('## Task Summary');
    lines.push('');
    const todo = tasks.filter((t) => t.status === 'todo');
    const inProgress = tasks.filter((t) => t.status === 'in-progress');
    const blocked = tasks.filter((t) => t.status === 'blocked');
    const done = tasks.filter((t) => t.status === 'done');
    const overdue = tasks.filter(
      (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now,
    );

    lines.push(`| Status | Count |`);
    lines.push(`|---|---|`);
    lines.push(`| To Do | ${todo.length} |`);
    lines.push(`| In Progress | ${inProgress.length} |`);
    lines.push(`| Blocked | ${blocked.length} |`);
    lines.push(`| Done | ${done.length} |`);
    lines.push(`| **Total** | **${tasks.length}** |`);
    lines.push('');

    if (inProgress.length > 0) {
      lines.push('### In Progress');
      inProgress.forEach((t) => {
        const assignee = researchers.find((r) => r.id === t.assigneeId);
        const due = t.dueDate ? ` *(due ${t.dueDate})*` : '';
        const who = assignee ? ` — ${assignee.name}` : '';
        lines.push(`- ${t.title}${who}${due}`);
      });
      lines.push('');
    }

    if (blocked.length > 0) {
      lines.push('### Blocked');
      blocked.forEach((t) => {
        const assignee = researchers.find((r) => r.id === t.assigneeId);
        lines.push(`- ⚠ ${t.title}${assignee ? ` — ${assignee.name}` : ''}`);
      });
      lines.push('');
    }

    if (overdue.length > 0) {
      lines.push('### Overdue');
      overdue.forEach((t) => {
        const assignee = researchers.find((r) => r.id === t.assigneeId);
        lines.push(`- **${t.title}** *(due ${t.dueDate})*${assignee ? ` — ${assignee.name}` : ''}`);
      });
      lines.push('');
    }
  }

  // --- Funding ---
  if (selectedSections.has('funding') && funding.length > 0) {
    lines.push('## Funding & Expenses');
    lines.push('');
    const totalFunding = funding.reduce((s, f) => s + f.amount, 0);
    const totalSpent = funding.reduce(
      (s, f) => s + f.expenses.reduce((es, e) => es + e.amount, 0),
      0,
    );
    lines.push(
      `**Total Funding:** ${c}${totalFunding.toLocaleString()} | **Spent:** ${c}${totalSpent.toLocaleString()} | **Remaining:** ${c}${(totalFunding - totalSpent).toLocaleString()}`,
    );
    lines.push('');

    funding.forEach((f) => {
      const spent = f.expenses.reduce((s, e) => s + e.amount, 0);
      const remaining = f.amount - spent;
      const pct = f.amount > 0 ? Math.round((spent / f.amount) * 100) : 0;
      lines.push(`### ${f.source}`);
      lines.push(
        `Total: ${c}${f.amount.toLocaleString()} | Spent: ${c}${spent.toLocaleString()} | Remaining: ${c}${remaining.toLocaleString()} (${pct}% spent)`,
      );
      if (f.deadline) lines.push(`Deadline: ${f.deadline}`);
      const unfiled = f.expenses.filter((e) => !e.reportFiled);
      if (unfiled.length > 0) {
        lines.push(`⚠ ${unfiled.length} expense report${unfiled.length > 1 ? 's' : ''} not yet filed`);
      }
      if (f.expenses.length > 0) {
        lines.push('');
        lines.push('| Description | Date | Amount | Filed |');
        lines.push('|---|---|---|---|');
        f.expenses.forEach((e) => {
          lines.push(
            `| ${e.description} | ${e.date} | ${c}${e.amount.toLocaleString()} | ${e.reportFiled ? '✓' : '✗'} |`,
          );
        });
      }
      lines.push('');
    });
  }

  // --- Writing ---
  if (selectedSections.has('writing') && writing.length > 0) {
    lines.push('## Writing Progress');
    lines.push('');
    lines.push('| Project | Words | Target | Progress | Status |');
    lines.push('|---|---|---|---|---|');
    writing.forEach((w) => {
      const pct =
        w.targetWordCount > 0
          ? Math.round((w.wordCount / w.targetWordCount) * 100)
          : 0;
      const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
      lines.push(
        `| ${w.title} | ${w.wordCount.toLocaleString()} | ${w.targetWordCount.toLocaleString()} | ${bar} ${pct}% | ${w.status} |`,
      );
    });
    const totalWords = writing.reduce((s, w) => s + w.wordCount, 0);
    const totalTarget = writing.reduce((s, w) => s + w.targetWordCount, 0);
    lines.push(
      `| **Total** | **${totalWords.toLocaleString()}** | **${totalTarget.toLocaleString()}** | | |`,
    );
    lines.push('');
  }

  // --- Experiments ---
  if (selectedSections.has('experiments') && experiments.length > 0) {
    lines.push('## Experiments & Methods');
    lines.push('');
    experiments.forEach((e) => {
      lines.push(`### ${e.title}`);
      lines.push(`*${e.date} — ${e.status}*`);
      if (e.summary) {
        lines.push('');
        lines.push(e.summary.split('\n').slice(0, 4).join('\n'));
      }
      if (e.codeLink) lines.push(`Code: ${e.codeLink}`);
      lines.push('');
    });
  }

  // --- Log ---
  if (selectedSections.has('log') && logEntries.length > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - logDays);
    const recent = logEntries.filter((e) => new Date(e.date) >= cutoff);
    if (recent.length > 0) {
      lines.push(`## Research Log (last ${logDays} days)`);
      lines.push('');
      recent.forEach((entry) => {
        lines.push(`### ${entry.date}`);
        lines.push('');
        lines.push(entry.content);
        lines.push('');
      });
    }
  }

  return lines.join('\n');
};

export const ExportView = ({
  projectMeta,
  researchers,
  tasks,
  funding,
  writing,
  experiments,
  logEntries,
}: Props) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedSections, setSelectedSections] = useState<Set<ReportSection>>(
    new Set(['overview', 'team', 'tasks', 'funding', 'writing', 'experiments']),
  );
  const [reportDate, setReportDate] = useState(today);
  const [logDays, setLogDays] = useState(14);
  const [copied, setCopied] = useState(false);

  const toggleSection = (id: ReportSection) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markdown = generateMarkdown(
    projectMeta,
    researchers,
    tasks,
    funding,
    writing,
    experiments,
    logEntries,
    selectedSections,
    reportDate,
    logDays,
  );

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-report-${reportDate}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    // Build a self-contained HTML report
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Status Report — ${projectMeta.title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, 'Times New Roman', serif; max-width: 800px; margin: 48px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.7; }
    h1 { font-size: 2.2em; font-weight: normal; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 8px; }
    h2 { font-size: 1.4em; font-weight: bold; margin-top: 48px; margin-bottom: 16px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
    h3 { font-size: 1.1em; font-weight: bold; margin-top: 24px; margin-bottom: 8px; }
    p { margin-bottom: 12px; }
    ul { padding-left: 24px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }
    em { font-style: italic; color: #555; }
    strong { font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-family: monospace; font-size: 0.85em; }
    th { background: #f5f5f5; text-align: left; padding: 8px 12px; border: 1px solid #ddd; font-family: Georgia, serif; }
    td { padding: 7px 12px; border: 1px solid #e5e5e5; }
    tr:nth-child(even) td { background: #fafafa; }
    .meta { color: #666; font-size: 0.9em; font-style: italic; margin-bottom: 4px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
${markdownToSimpleHTML(markdown)}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-report-${reportDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-serif italic">Export Status Report</h1>
        <p className="text-zinc-500">Generate a formatted report from your project data</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: options */}
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
              Report Options
            </h2>
            <FormField label="Report Date">
              <Input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </FormField>
            {selectedSections.has('log') && (
              <FormField label="Log: days to include">
                <Input
                  type="number"
                  value={logDays}
                  min={1}
                  max={365}
                  onChange={(e) => setLogDays(Math.max(1, Number(e.target.value)))}
                />
              </FormField>
            )}
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
              Sections to Include
            </h2>
            {SECTIONS.map(({ id, label, description }) => {
              const checked = selectedSections.has(id);
              return (
                <label
                  key={id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    checked
                      ? 'bg-zinc-900 border-zinc-900 text-white'
                      : 'bg-white border-zinc-100 hover:border-zinc-200',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSection(id)}
                    className="mt-0.5 shrink-0 accent-white"
                  />
                  <div>
                    <p className={cn('text-sm font-medium', checked ? 'text-white' : 'text-zinc-800')}>
                      {label}
                    </p>
                    <p className={cn('text-xs', checked ? 'text-white/60' : 'text-zinc-400')}>
                      {description}
                    </p>
                  </div>
                </label>
              );
            })}
          </Card>

          <div className="flex flex-wrap gap-3">
            <Btn onClick={downloadMarkdown}>
              <Download size={14} /> Download .md
            </Btn>
            <Btn variant="secondary" onClick={downloadHTML}>
              <FileText size={14} /> Download .html
            </Btn>
            <Btn variant="secondary" onClick={copyToClipboard}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Markdown</>}
            </Btn>
          </div>
        </div>

        {/* Right: preview */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-500">
            Preview
          </h2>
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-5 h-[600px] overflow-y-auto">
            <pre className="text-xs text-zinc-600 whitespace-pre-wrap font-mono leading-relaxed">
              {markdown}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

// Very simple markdown → HTML for the self-contained export
function markdownToSimpleHTML(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${esc(line.slice(2))}</h1>`;
      if (line.startsWith('## ')) return `<h2>${esc(line.slice(3))}</h2>`;
      if (line.startsWith('### ')) return `<h3>${esc(line.slice(4))}</h3>`;
      if (line.startsWith('- ') || line.startsWith('* '))
        return `<li>${inlineFormat(line.slice(2))}</li>`;
      if (line.startsWith('| ') && line.endsWith(' |')) {
        const cells = line.split('|').filter((c) => c.trim() !== '');
        if (cells.every((c) => /^[-: ]+$/.test(c))) return ''; // separator row
        const tag = line.includes('**') ? 'th' : 'td';
        return `<tr>${cells.map((c) => `<${tag}>${inlineFormat(c.trim())}</${tag}>`).join('')}</tr>`;
      }
      if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**'))
        return `<p class="meta">${esc(line.slice(1, -1))}</p>`;
      if (line.trim() === '') return '';
      return `<p>${inlineFormat(line)}</p>`;
    })
    .join('\n');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFormat(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
