import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  CheckSquare, 
  DollarSign, 
  BookOpen, 
  FileText, 
  Code, 
  FlaskConical, 
  LayoutDashboard, 
  FolderOpen,
  ChevronRight,
  Plus,
  Save,
  Search,
  Clock,
  Mail,
  Phone,
  IdCard,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import * as bibtex from 'bibtex-parse-js';
import yaml from 'js-yaml';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from './lib/utils';
import { Researcher, Task, Funding, WritingProject, Experiment } from './types';

// --- Types & Constants ---

type View = 'dashboard' | 'researchers' | 'tasks' | 'funding' | 'bibliography' | 'notes' | 'writing' | 'experiments';

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg group",
      active 
        ? "bg-zinc-900 text-white shadow-lg" 
        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
    )}
  >
    <Icon size={18} className={cn(active ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")} />
    {label}
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white border border-zinc-200 rounded-xl p-6 shadow-sm", className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'info' }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-600",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border border-amber-100",
    info: "bg-blue-50 text-blue-700 border border-blue-100",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", variants[variant])}>
      {children}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100">
          <h3 className="text-lg font-serif italic text-zinc-900">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- View Components ---

interface DashboardProps {
  researchers: Researcher[];
  tasks: Task[];
  funding: Funding[];
  notes: { name: string; content: string }[];
  writing: WritingProject[];
  experiments: Experiment[];
}

const Dashboard = ({ researchers, tasks, funding, notes, writing, experiments }: DashboardProps) => {
  const totalFunding = funding.reduce((acc, f) => acc + f.amount, 0);
  const totalSpent = funding.reduce((acc, f) => acc + f.expenses.reduce((sum, e) => sum + e.amount, 0), 0);
  
  const totalWords = writing.reduce((acc, w) => acc + w.wordCount, 0);
  const totalTargetWords = writing.reduce((acc, w) => acc + w.targetWordCount, 0);
  const writingProgress = totalTargetWords > 0 ? Math.round((totalWords / totalTargetWords) * 100) : 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-serif italic text-zinc-900">Project Overview</h1>
        <p className="text-zinc-500 mt-2">Academic Humanities Management</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex justify-between items-start mb-4">
            <Users className="text-zinc-400" size={20} />
            <Badge variant="info">{researchers.length} Active</Badge>
          </div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Researchers</h3>
          <p className="text-3xl font-light mt-1">{researchers.length}</p>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <CheckSquare className="text-zinc-400" size={20} />
            <Badge variant="warning">{tasks.filter(t => t.status !== 'done').length} Pending</Badge>
          </div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Active Tasks</h3>
          <p className="text-3xl font-light mt-1">{tasks.filter(t => t.status !== 'done').length}</p>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <DollarSign className="text-zinc-400" size={20} />
            <Badge variant="success">
              {totalFunding > 0 ? `${Math.round((totalSpent / totalFunding) * 100)}% Spent` : "No Funding"}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Remaining Funds</h3>
          <p className="text-3xl font-light mt-1">${(totalFunding - totalSpent).toLocaleString()}</p>
        </Card>
        <Card>
          <div className="flex justify-between items-start mb-4">
            <FileText className="text-zinc-400" size={20} />
            <Badge variant="info">{writingProgress}% Progress</Badge>
          </div>
          <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Writing Progress</h3>
          <p className="text-3xl font-light mt-1">{totalWords.toLocaleString()} <span className="text-sm text-zinc-400">words</span></p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif italic">Recent Notes</h2>
            <FileText size={16} className="text-zinc-300" />
          </div>
          <div className="space-y-3">
            {notes.slice(0, 5).map((note, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 cursor-pointer border border-transparent hover:border-zinc-100 transition-all">
                <FileText size={16} className="text-zinc-400" />
                <span className="text-sm text-zinc-700">{note.name.replace('.md', '')}</span>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-zinc-400 italic">No notes found.</p>}
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif italic">Upcoming Deadlines</h2>
            <Clock size={16} className="text-zinc-300" />
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.dueDate && t.status !== 'done')
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .slice(0, 5).map((task, i) => (
              <div key={i} className="flex justify-between items-center p-3 border-b border-zinc-100 last:border-0">
                <span className="text-sm font-medium text-zinc-800">{task.title}</span>
                <span className="text-xs text-zinc-400">{task.dueDate}</span>
              </div>
            ))}
            {tasks.filter(t => t.dueDate && t.status !== 'done').length === 0 && (
              <p className="text-sm text-zinc-400 italic">No upcoming deadlines.</p>
            )}
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif italic">Recent Experiments</h2>
            <FlaskConical size={16} className="text-zinc-300" />
          </div>
          <div className="space-y-3">
            {experiments.slice(-3).reverse().map((exp, i) => (
              <div key={i} className="p-3 border-b border-zinc-100 last:border-0">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-zinc-800">{exp.title}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{exp.date}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{exp.summary}</p>
              </div>
            ))}
            {experiments.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No experiments logged.</p>
            )}
          </div>
        </Card>
        <Card className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif italic">Writing Status</h2>
            <Code size={16} className="text-zinc-300" />
          </div>
          <div className="space-y-4">
            {writing.slice(0, 3).map((w, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-zinc-700">{w.title}</span>
                  <span className="text-zinc-400">{Math.round((w.wordCount / w.targetWordCount) * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-zinc-900 h-full" 
                    style={{ width: `${Math.min(100, (w.wordCount / w.targetWordCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {writing.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No writing projects.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

interface FundingViewProps {
  funding: Funding[];
  setFunding: React.Dispatch<React.SetStateAction<Funding[]>>;
}

const FundingView = ({ funding, setFunding }: FundingViewProps) => (
  <div className="space-y-6">
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-serif italic">Funding & Grants</h1>
        <p className="text-zinc-500">Track allocations and expenses</p>
      </div>
      <button 
        onClick={() => {
          const source = prompt("Source:");
          const amount = Number(prompt("Amount:"));
          if (source && !isNaN(amount)) {
            setFunding(prev => [...prev, { id: Date.now().toString(), source, amount, expenses: [] }]);
          }
        }}
        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
      >
        <Plus size={16} /> Add Funding Source
      </button>
    </header>
    
    <div className="grid grid-cols-1 gap-8">
      {funding.map(f => {
        const spent = f.expenses.reduce((acc, e) => acc + e.amount, 0);
        return (
          <Card key={f.id} className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium text-zinc-900">{f.source}</h3>
                <p className="text-sm text-zinc-500 mt-1">Total Grant: ${f.amount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-light text-zinc-900">${(f.amount - spent).toLocaleString()}</p>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Remaining Funds</p>
              </div>
            </div>

            <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-zinc-900 h-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (spent / f.amount) * 100)}%` }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Expenses</h4>
                <button 
                  onClick={() => {
                    const desc = prompt("Expense Description:");
                    const amt = Number(prompt("Amount:"));
                    if (desc && !isNaN(amt)) {
                      const newExpense = {
                        id: Date.now().toString(),
                        description: desc,
                        amount: amt,
                        date: new Date().toISOString().split('T')[0],
                        reportFiled: false
                      };
                      setFunding(prev => prev.map(fund => fund.id === f.id ? { ...fund, expenses: [...fund.expenses, newExpense] } : fund));
                    }
                  }}
                  className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add Expense
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-400 border-b border-zinc-100">
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Amount</th>
                      <th className="pb-2 font-medium">Report Filed</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {f.expenses.map(exp => (
                      <tr key={exp.id} className="group">
                        <td className="py-3 text-zinc-900">{exp.description}</td>
                        <td className="py-3 text-zinc-500 font-mono text-xs">{exp.date}</td>
                        <td className="py-3 font-mono">${exp.amount.toLocaleString()}</td>
                        <td className="py-3">
                          <input 
                            type="checkbox" 
                            checked={exp.reportFiled}
                            onChange={(e) => {
                              setFunding(prev => prev.map(fund => fund.id === f.id ? { 
                                ...fund, 
                                expenses: fund.expenses.map(e2 => e2.id === exp.id ? { ...e2, reportFiled: e.target.checked } : e2) 
                              } : fund));
                            }}
                            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                        </td>
                        <td className="py-3 text-right">
                          <button 
                            onClick={() => {
                              setFunding(prev => prev.map(fund => fund.id === f.id ? { ...fund, expenses: fund.expenses.filter(e2 => e2.id !== exp.id) } : fund));
                            }}
                            className="text-zinc-300 hover:text-red-500 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {f.expenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400 italic">No expenses recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </div>
);

interface ExperimentsViewProps {
  experiments: Experiment[];
  setExperiments: React.Dispatch<React.SetStateAction<Experiment[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const ExperimentsView = ({ experiments, setExperiments, setTasks }: ExperimentsViewProps) => (
  <div className="space-y-6">
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-serif italic">Experiments & Code</h1>
        <p className="text-zinc-500">Log methodology and results</p>
      </div>
      <button 
        onClick={() => {
          const title = prompt("Experiment Title:");
          if (title) {
            setExperiments(prev => [...prev, { 
              id: Date.now().toString(), 
              title, 
              date: new Date().toISOString().split('T')[0], 
              summary: "Description here...",
              codeLink: "",
              status: 'planned'
            }]);
          }
        }}
        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
      >
        <Plus size={16} /> Log New Experiment
      </button>
    </header>
    <div className="grid grid-cols-1 gap-6">
      {experiments.map(e => (
        <Card key={e.id} className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 shrink-0">
              <FlaskConical size={24} />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Title</label>
                    <input 
                      type="text" 
                      value={e.title}
                      onChange={(ev) => setExperiments(prev => prev.map(exp => exp.id === e.id ? { ...exp, title: ev.target.value } : exp))}
                      className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 focus:outline-none py-1 text-lg font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Date</label>
                    <input 
                      type="date" 
                      value={e.date}
                      onChange={(ev) => setExperiments(prev => prev.map(exp => exp.id === e.id ? { ...exp, date: ev.target.value } : exp))}
                      className="w-full bg-transparent border-b border-zinc-100 focus:border-zinc-900 focus:outline-none py-1 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => {
                      if (e.taskId) return;
                      const taskId = Date.now().toString();
                      setTasks(prev => [...prev, {
                        id: taskId,
                        title: `Experiment: ${e.title}`,
                        status: 'todo',
                        parentType: 'experiment',
                        parentId: e.id,
                        parentTitle: e.title
                      }]);
                      setExperiments(prev => prev.map(exp => exp.id === e.id ? { ...exp, taskId } : exp));
                    }}
                    disabled={!!e.taskId}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors",
                      e.taskId 
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                    )}
                  >
                    {e.taskId ? "Task Linked" : "Generate Task"}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                {(['planned', 'running', 'completed'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setExperiments(prev => prev.map(exp => exp.id === e.id ? { ...exp, status } : exp))}
                    className={cn(
                      "text-[10px] uppercase tracking-widest px-2 py-1 rounded border transition-all",
                      e.status === status 
                        ? "bg-zinc-900 text-white border-zinc-900" 
                        : "text-zinc-400 border-zinc-100 hover:border-zinc-200"
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Summary & Results (Markdown Body)</label>
                <textarea 
                  value={e.summary}
                  onChange={(ev) => setExperiments(prev => prev.map(exp => exp.id === e.id ? { ...exp, summary: ev.target.value } : exp))}
                  rows={8}
                  placeholder="Methodology, results, and observations..."
                  className="w-full bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-200 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Code Repository URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Code className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <input 
                      type="url" 
                      placeholder="https://github.com/..."
                      value={e.codeLink || ""}
                      onChange={(ev) => setExperiments(prev => prev.map(exp => exp.id === e.id ? { ...exp, codeLink: ev.target.value } : exp))}
                      className="w-full bg-zinc-50 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-200"
                    />
                  </div>
                  {e.codeLink && (
                    <a 
                      href={e.codeLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-semibold hover:bg-zinc-200 transition-colors"
                    >
                      Visit
                    </a>
                  )}
                </div>
              </div>
              
              <div className="pt-2 flex justify-end">
                <button 
                  onClick={() => setExperiments(prev => prev.filter(exp => exp.id !== e.id))}
                  className="text-xs text-zinc-300 hover:text-red-500 transition-colors"
                >
                  Delete Experiment
                </button>
              </div>
            </div>
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

interface BibliographyViewProps {
  bibData: any[];
}

const BibliographyView = ({ bibData }: BibliographyViewProps) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (key: string) => {
    const citeCode = `@${key}`;
    navigator.clipboard.writeText(citeCode);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openInZotero = (key: string) => {
    // Better BibTeX usually includes the citekey which can be used with zotero://select/items/
    // Note: This requires the Zotero desktop app to be installed and configured.
    window.location.href = `zotero://select/items/bbt:${key}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif italic">Bibliography</h1>
          <p className="text-zinc-500">Parsed from bibliography.bib (Better BibTeX)</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input 
            type="text" 
            placeholder="Search references..." 
            className="pl-10 pr-4 py-2 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5"
          />
        </div>
      </header>
      <div className="space-y-4">
        {bibData.map((entry, i) => {
          const citeKey = entry.citationKey;
          return (
            <Card key={i} className="group hover:border-zinc-400 transition-colors">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded bg-zinc-50 flex items-center justify-center text-zinc-400 font-mono text-xs uppercase shrink-0">
                  {entry.entryType.slice(0, 3)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-zinc-900">{entry.entryTags.title || "Untitled"}</h4>
                  <p className="text-sm text-zinc-500 mt-1 italic">{entry.entryTags.author}</p>
                  <div className="flex gap-4 mt-3 text-[10px] uppercase tracking-widest text-zinc-400 font-semibold items-center">
                    <span>{entry.entryTags.year}</span>
                    <span>{entry.entryTags.journal || entry.entryTags.publisher}</span>
                    <div className="flex gap-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => copyToClipboard(citeKey)}
                        className="flex items-center gap-1 text-zinc-900 hover:text-zinc-600"
                        title="Copy Cite Key"
                      >
                        {copiedKey === citeKey ? <Check size={12} /> : <Copy size={12} />}
                        {copiedKey === citeKey ? "Copied" : "Cite"}
                      </button>
                      <button 
                        onClick={() => openInZotero(citeKey)}
                        className="flex items-center gap-1 text-zinc-900 hover:text-zinc-600"
                        title="Open in Zotero"
                      >
                        <ExternalLink size={12} />
                        Zotero
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {bibData.length === 0 && (
          <p className="text-center py-12 text-zinc-400 italic">No bibliography entries found.</p>
        )}
      </div>
    </div>
  );
};

interface ResearchersViewProps {
  researchers: Researcher[];
  setResearchers: React.Dispatch<React.SetStateAction<Researcher[]>>;
  tasks: Task[];
}

const ResearchersView = ({ researchers, setResearchers, tasks }: ResearchersViewProps) => (
  <div className="space-y-6">
    <header className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-serif italic">Researchers</h1>
        <p className="text-zinc-500">Student tracking and assignments</p>
      </div>
      <button 
        onClick={() => {
          const name = prompt("Name:");
          const role = prompt("Role:");
          if (name && role) {
            setResearchers(prev => [...prev, { id: Date.now().toString(), name, role, tasks: [] }]);
          }
        }}
        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
      >
        <Plus size={16} /> Add Researcher
      </button>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {researchers.map(r => (
        <Card key={r.id} className="relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4">
            <Badge variant="info">{r.role}</Badge>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              value={r.name}
              onChange={(e) => setResearchers(prev => prev.map(res => res.id === r.id ? { ...res, name: e.target.value } : res))}
              className="text-xl font-medium text-zinc-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
            />
            
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Mail size={12} className="text-zinc-400" />
                <input 
                  type="email" 
                  placeholder="Email"
                  value={r.email || ""}
                  onChange={(e) => setResearchers(prev => prev.map(res => res.id === r.id ? { ...res, email: e.target.value } : res))}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Phone size={12} className="text-zinc-400" />
                <input 
                  type="tel" 
                  placeholder="Phone"
                  value={r.phone || ""}
                  onChange={(e) => setResearchers(prev => prev.map(res => res.id === r.id ? { ...res, phone: e.target.value } : res))}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <IdCard size={12} className="text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Student ID"
                  value={r.studentID || ""}
                  onChange={(e) => setResearchers(prev => prev.map(res => res.id === r.id ? { ...res, studentID: e.target.value } : res))}
                  className="bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-50 space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">Assigned Tasks</h4>
              <div className="space-y-2">
                {tasks.filter(t => t.assigneeId === r.id).map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm text-zinc-600">
                    <div className={cn("w-2 h-2 rounded-full", t.status === 'done' ? "bg-emerald-400" : "bg-amber-400")} />
                    {t.title}
                  </div>
                ))}
                {tasks.filter(t => t.assigneeId === r.id).length === 0 && (
                  <p className="text-xs text-zinc-400 italic">No tasks assigned.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setResearchers(prev => prev.filter(res => res.id !== r.id))}
                className="text-[10px] text-zinc-300 hover:text-red-500 transition-colors uppercase font-bold tracking-widest"
              >
                Remove
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

interface TasksViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  researchers: Researcher[];
  setWriting: React.Dispatch<React.SetStateAction<WritingProject[]>>;
  setExperiments: React.Dispatch<React.SetStateAction<Experiment[]>>;
}

const TasksView = ({ tasks, setTasks, researchers, setWriting, setExperiments }: TasksViewProps) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: new Date().toISOString().split('T')[0], assigneeId: '' });

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days > 0 && days < 3; // Within 3 days
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    return due < now;
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as Task['status'];
    const task = tasks.find(t => t.id === draggableId);
    
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));

    // Sync status back to parent if linked
    if (task?.parentId && task?.parentType) {
      if (task.parentType === 'writing') {
        const writingStatusMap: Record<Task['status'], WritingProject['status']> = {
          'todo': 'drafting',
          'in-progress': 'review',
          'done': 'final'
        };
        setWriting(prev => prev.map(w => w.id === task.parentId ? { ...w, status: writingStatusMap[newStatus] } : w));
      } else if (task.parentType === 'experiment') {
        const experimentStatusMap: Record<Task['status'], Experiment['status']> = {
          'todo': 'planned',
          'in-progress': 'running',
          'done': 'completed'
        };
        setExperiments(prev => prev.map(e => e.id === task.parentId ? { ...e, status: experimentStatusMap[newStatus] } : e));
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Tasks</h1>
          <p className="text-zinc-500">Project milestones and to-dos</p>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} /> New Task
        </button>
      </header>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(['todo', 'in-progress', 'done'] as const).map(status => (
            <Droppable droppableId={status} key={status}>
              {(provided) => (
                <div 
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl min-h-[500px]"
                >
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 px-2">{status.replace('-', ' ')}</h3>
                  <div className="space-y-3">
                    {tasks.filter(t => t.status === status).map((task, index) => (
                      <Draggable draggableId={task.id} index={index} key={task.id}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Card className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative">
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                {task.parentTitle && (
                                  <Badge variant="info">{task.parentTitle}</Badge>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete(task.id);
                                  }}
                                  className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <h4 className="text-sm font-medium text-zinc-900 pr-24">{task.title}</h4>
                              <div className="flex justify-between items-center mt-4">
                                <div className="flex items-center gap-1">
                                  <Clock size={10} className={cn(
                                    "text-zinc-400",
                                    isOverdue(task.dueDate) && task.status !== 'done' && "text-red-500",
                                    isDueSoon(task.dueDate) && task.status !== 'done' && "text-amber-500"
                                  )} />
                                  <span className={cn(
                                    "text-[10px] font-mono",
                                    isOverdue(task.dueDate) && task.status !== 'done' ? "text-red-500 font-bold" : 
                                    isDueSoon(task.dueDate) && task.status !== 'done' ? "text-amber-500 font-bold" : "text-zinc-400"
                                  )}>
                                    {task.dueDate || "No date"}
                                    {isOverdue(task.dueDate) && task.status !== 'done' && " (Overdue)"}
                                    {isDueSoon(task.dueDate) && task.status !== 'done' && " (Soon)"}
                                  </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <select 
                                    value={task.assigneeId || ""}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, assigneeId: e.target.value || undefined } : t));
                                    }}
                                    className="text-[10px] bg-zinc-50 border-none rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <option value="">Unassigned</option>
                                    {researchers.map(r => (
                                      <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <Modal 
        isOpen={isAddingTask} 
        onClose={() => setIsAddingTask(false)} 
        title="Add New Task"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Task Title</label>
            <input 
              type="text" 
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              className="w-full bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Due Date</label>
              <input 
                type="date" 
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Assignee</label>
              <select 
                value={newTask.assigneeId}
                onChange={(e) => setNewTask(prev => ({ ...prev, assigneeId: e.target.value }))}
                className="w-full bg-zinc-50 rounded-lg p-3 text-sm text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-200"
              >
                <option value="">Unassigned</option>
                {researchers.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={() => setIsAddingTask(false)}
              className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                if (newTask.title) {
                  setTasks(prev => [...prev, { 
                    id: Date.now().toString(), 
                    title: newTask.title, 
                    status: 'todo', 
                    dueDate: newTask.dueDate,
                    assigneeId: newTask.assigneeId || undefined
                  }]);
                  setNewTask({ title: '', dueDate: new Date().toISOString().split('T')[0], assigneeId: '' });
                  setIsAddingTask(false);
                }
              }}
              className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              Add Task
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        title="Confirm Deletion"
      >
        <div className="space-y-6">
          <p className="text-zinc-600">Are you sure you want to delete this task? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                setTasks(prev => prev.filter(t => t.id !== confirmDelete));
                setConfirmDelete(null);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Delete Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface NotesViewProps {
  notes: { name: string; content: string }[];
  setNotes: React.Dispatch<React.SetStateAction<{ name: string; content: string }[]>>;
  notesFolderHandle: FileSystemDirectoryHandle | null;
  setNotesFolderHandle: React.Dispatch<React.SetStateAction<FileSystemDirectoryHandle | null>>;
}

const NotesView = ({ notes, setNotes, notesFolderHandle, setNotesFolderHandle }: NotesViewProps) => {
  const [selectedNote, setSelectedNote] = useState<{ name: string; content: string } | null>(null);

  const pickNotesFolder = async () => {
    if (!('showDirectoryPicker' in window)) return;
    try {
      const handle = await (window as any).showDirectoryPicker();
      setNotesFolderHandle(handle);
      // Reload notes from new folder
      const noteFiles = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          const content = await file.text();
          noteFiles.push({ name: entry.name, content });
        }
      }
      setNotes(noteFiles);
    } catch (err) {
      console.error("Failed to pick notes folder", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Research Notes</h1>
          <p className="text-zinc-500">
            {notesFolderHandle ? `Reading from: ${notesFolderHandle.name}` : "Obsidian Vault / Markdown Notes"}
          </p>
        </div>
        <button 
          onClick={pickNotesFolder}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-semibold transition-colors"
        >
          <FolderOpen size={14} />
          Pick Folder
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
        <div className="lg:col-span-1 border-r border-zinc-100 pr-4 overflow-y-auto space-y-2">
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 mb-4">Files</h3>
          {notes.map((note, i) => (
            <button
              key={i}
              onClick={() => setSelectedNote(note)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors",
                selectedNote?.name === note.name ? "bg-zinc-100 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              {note.name.replace('.md', '')}
            </button>
          ))}
          {notes.length === 0 && (
            <p className="text-xs text-zinc-400 italic px-3">No markdown files found.</p>
          )}
        </div>
        <div className="lg:col-span-3 overflow-y-auto prose prose-zinc max-w-none pr-4">
          {selectedNote ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h1 className="text-3xl font-serif italic mb-8">{selectedNote.name.replace('.md', '')}</h1>
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-300 font-serif italic text-2xl">
              Select a note to read
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface WritingViewProps {
  writing: WritingProject[];
  setWriting: React.Dispatch<React.SetStateAction<WritingProject[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const WritingView = ({ writing, setWriting, setTasks }: WritingViewProps) => {
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Record<string, string[]>>({});
  const [previewFile, setPreviewFile] = useState<{ name: string, content: string } | null>(null);

  const pickFolder = async (id: string) => {
    if (!('showDirectoryPicker' in window)) return;
    try {
      const handle = await (window as any).showDirectoryPicker();
      setWriting(prev => prev.map(p => p.id === id ? { ...p, folderHandle: handle } : p));
      
      const files: string[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }
      setFolderFiles(prev => ({ ...prev, [id]: files }));
    } catch (err) {
      console.error("Failed to pick folder", err);
    }
  };

  const refreshFiles = async (id: string, handle: FileSystemDirectoryHandle) => {
    try {
      const files: string[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') {
          files.push(entry.name);
        }
      }
      setFolderFiles(prev => ({ ...prev, [id]: files }));
    } catch (err) {
      console.error("Failed to refresh files", err);
    }
  };

  const handleFileClick = async (handle: FileSystemDirectoryHandle, fileName: string) => {
    try {
      const fileHandle = await handle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      
      if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        const content = await file.text();
        setPreviewFile({ name: fileName, content });
      } else {
        setPreviewFile({ name: fileName, content: "_Preview not available for this file type in-browser. This file is linked in your project folder._" });
      }
    } catch (err) {
      console.error("Failed to read file", err);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Writing in Progress</h1>
          <p className="text-zinc-500">Drafts, chapters, and publications</p>
        </div>
        <button 
          onClick={() => {
            const title = prompt("Project Title:");
            const target = Number(prompt("Target Word Count:"));
            if (title && !isNaN(target)) {
              setWriting(prev => [...prev, { id: Date.now().toString(), title, wordCount: 0, targetWordCount: target, status: 'drafting' }]);
            }
          }}
          className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          <Plus size={16} /> New Writing Project
        </button>
      </header>
      <div className="grid grid-cols-1 gap-6">
        {writing.map(w => (
          <Card key={w.id} className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <input 
                    type="text" 
                    value={w.title}
                    onChange={(e) => setWriting(prev => prev.map(p => p.id === w.id ? { ...p, title: e.target.value } : p))}
                    className="text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (w.taskId) return;
                        const taskId = Date.now().toString();
                        setTasks(prev => [...prev, {
                          id: taskId,
                          title: `Writing: ${w.title}`,
                          status: 'todo',
                          parentType: 'writing',
                          parentId: w.id,
                          parentTitle: w.title
                        }]);
                        setWriting(prev => prev.map(p => p.id === w.id ? { ...p, taskId } : p));
                      }}
                      disabled={!!w.taskId}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors",
                        w.taskId 
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                          : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                      )}
                    >
                      {w.taskId ? "Task Linked" : "Generate Task"}
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(['drafting', 'review', 'final'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setWriting(prev => prev.map(p => p.id === w.id ? { ...p, status } : p))}
                      className={cn(
                        "text-[10px] uppercase tracking-widest px-2 py-1 rounded border transition-all",
                        w.status === status 
                          ? "bg-zinc-900 text-white border-zinc-900" 
                          : "text-zinc-400 border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-baseline justify-end gap-2">
                  <input 
                    type="number" 
                    value={w.wordCount}
                    onChange={(e) => setWriting(prev => prev.map(p => p.id === w.id ? { ...p, wordCount: Number(e.target.value) } : p))}
                    className="text-2xl font-light bg-transparent border-none focus:outline-none focus:ring-0 w-24 text-right"
                  />
                  <span className="text-zinc-300">/</span>
                  <input 
                    type="number" 
                    value={w.targetWordCount}
                    onChange={(e) => setWriting(prev => prev.map(p => p.id === w.id ? { ...p, targetWordCount: Number(e.target.value) } : p))}
                    className="text-sm text-zinc-400 bg-transparent border-none focus:outline-none focus:ring-0 w-20"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Words / Target</p>
              </div>
            </div>
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-zinc-900 h-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (w.wordCount / w.targetWordCount) * 100)}%` }}
              />
            </div>
            
            <div className="pt-2 border-t border-zinc-50 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FolderOpen size={14} className="text-zinc-400" />
                  <span className="text-xs font-medium text-zinc-600">
                    {w.folderHandle ? `Linked: ${w.folderHandle.name}` : "No folder linked"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {w.folderHandle && (
                    <button 
                      onClick={() => {
                        setOpenFolderId(openFolderId === w.id ? null : w.id);
                        if (openFolderId !== w.id) refreshFiles(w.id, w.folderHandle);
                      }}
                      className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      {openFolderId === w.id ? "Hide Files" : "View Files"}
                    </button>
                  )}
                  <button 
                    onClick={() => pickFolder(w.id)}
                    className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    {w.folderHandle ? "Change Folder" : "Link Folder"}
                  </button>
                </div>
              </div>

              {openFolderId === w.id && folderFiles[w.id] && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {folderFiles[w.id].map((file, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleFileClick(w.folderHandle!, file)}
                      className="flex items-center gap-2 p-2 rounded bg-zinc-50 border border-zinc-100 text-[10px] text-zinc-600 truncate hover:bg-zinc-100 transition-colors w-full text-left"
                    >
                      <FileText size={12} className="text-zinc-400 shrink-0" />
                      <span className="truncate">{file}</span>
                    </button>
                  ))}
                  {folderFiles[w.id].length === 0 && (
                    <p className="text-[10px] text-zinc-400 italic col-span-full">No files found in this folder.</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setWriting(prev => prev.filter(p => p.id !== w.id))}
                className="text-[10px] text-zinc-300 hover:text-red-500 transition-colors uppercase font-bold tracking-widest"
              >
                Delete Project
              </button>
            </div>
          </Card>
        ))}
        {writing.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 italic">
            No writing projects started yet.
          </div>
        )}
      </div>

      <Modal 
        isOpen={!!previewFile} 
        onClose={() => setPreviewFile(null)} 
        title={`Preview: ${previewFile?.name}`}
      >
        <div className="prose prose-zinc max-w-none">
          <ReactMarkdown>{previewFile?.content || ""}</ReactMarkdown>
        </div>
      </Modal>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [notesFolderHandle, setNotesFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data State
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [funding, setFunding] = useState<Funding[]>([]);
  const [bibData, setBibData] = useState<any[]>([]);
  const [notes, setNotes] = useState<{ name: string, content: string }[]>([]);
  const [writing, setWriting] = useState<WritingProject[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- File System Logic ---

  const checkApiSupport = () => {
    if (!('showDirectoryPicker' in window)) {
      let message = "The File System Access API is not supported in this browser. ";
      
      if (!window.isSecureContext) {
        message += "This API requires a Secure Context. If you are running locally, please use http://localhost:8000 instead of an IP address (like 127.0.0.1 or 192.x.x.x).";
      } else {
        message += "Please use a modern version of Chrome, Edge, or Opera. (Firefox and Safari do not support this API yet).";
      }
      
      setApiError(message);
      return false;
    }
    return true;
  };

  const openFolder = async () => {
    if (!checkApiSupport()) return;
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      loadAllData(handle);
    } catch (err) {
      console.error("Failed to open folder", err);
    }
  };

  const startNewProject = async () => {
    if (!checkApiSupport()) return;
    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      
      setIsLoading(true);
      setIsDemoMode(false);
      
      // Initialize files as Markdown with YAML
      await writeFile(handle, 'researchers.md', `---\nresearchers: []\n---`);
      await writeFile(handle, 'tasks.md', `---\ntasks: []\n---`);
      await writeFile(handle, 'funding.md', `---\nfunding: []\n---`);
      await writeFile(handle, 'writing.md', `---\nwriting: []\n---`);
      await writeFile(handle, 'experiments.md', `---\nexperiments: []\n---`);
      await writeFile(handle, 'bibliography.bib', '% Add your BibTeX entries here\n');
      
      // Initialize notes directory
      await handle.getDirectoryHandle('notes', { create: true });
      
      setDirectoryHandle(handle);
      setResearchers([]);
      setTasks([]);
      setFunding([]);
      setBibData([]);
      setNotes([]);
      setWriting([]);
      setExperiments([]);
      
      setIsLoading(false);
      setActiveView('dashboard');
    } catch (err) {
      console.error("Failed to start new project", err);
      setIsLoading(false);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setDirectoryHandle({ name: 'Demo Project' } as any);
    
    // Load some sample data
    setResearchers([
      { id: '1', name: 'Alice Smith', role: 'Graduate Researcher', email: 'alice@example.edu', phone: '555-0101', studentID: 'S12345', tasks: ['101'] },
      { id: '2', name: 'Bob Jones', role: 'Undergraduate Assistant', email: 'bob@example.edu', phone: '555-0102', studentID: 'S67890', tasks: ['102'] }
    ]);
    setTasks([
      { id: '101', title: 'Archive Analysis: 18th Century Letters', status: 'in-progress', assigneeId: '1', dueDate: '2026-04-15' },
      { id: '102', title: 'Digitize Microfilm Reels', status: 'todo', assigneeId: '2', dueDate: '2026-04-20' },
      { id: '103', title: 'Draft Literature Review', status: 'done', assigneeId: '1', dueDate: '2026-03-25' }
    ]);
    setFunding([
      { id: 'f1', source: 'NEH Grant #442', amount: 25000, expenses: [
        { id: 'e1', description: 'Archive Travel', amount: 1200, date: '2026-02-10', reportFiled: true },
        { id: 'e2', description: 'Digitization Services', amount: 5000, date: '2026-03-01', reportFiled: false }
      ] },
      { id: 'f2', source: 'University Research Fund', amount: 5000, expenses: [] }
    ]);
    setBibData([
      { citationKey: 'McLuhan1962', entryType: 'book', entryTags: { title: 'The Gutenberg Galaxy', author: 'Marshall McLuhan', year: '1962', publisher: 'University of Toronto Press' } },
      { citationKey: 'Busa1980', entryType: 'article', entryTags: { title: 'Computing and the Humanities', author: 'Roberto Busa', year: '1980', journal: 'Computers and the Humanities' } }
    ]);
    setNotes([
      { name: 'Research_Methodology.md', content: '# Methodology\n\nOur approach focuses on the intersection of digital tools and traditional archival research.' },
      { name: 'Archive_Findings.md', content: '# Archive Findings\n\nDiscovered several previously uncatalogued letters in the basement of the library.' }
    ]);
    setWriting([
      { id: 'w1', title: 'Dissertation Chapter 1', wordCount: 4500, targetWordCount: 8000, status: 'drafting' }
    ]);
    setExperiments([
      { id: 'e1', title: 'Topic Modeling on Letters', date: '2026-03-10', summary: 'Ran LDA on the corpus of 18th century letters to identify recurring themes.', codeLink: 'https://github.com/example/topic-modeling', status: 'completed' }
    ]);
    
    setActiveView('dashboard');
  };

  const readFile = async (handle: FileSystemDirectoryHandle, fileName: string) => {
    try {
      const fileHandle = await handle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (err) {
      console.warn(`File ${fileName} not found or inaccessible.`);
      return null;
    }
  };

  const writeFile = async (handle: FileSystemDirectoryHandle, fileName: string, content: string) => {
    try {
      const fileHandle = await handle.getFileHandle(fileName, { create: true });
      const writable = await (fileHandle as any).createWritable();
      await writable.write(content);
      await writable.close();
    } catch (err) {
      console.error(`Failed to write to ${fileName}`, err);
    }
  };

  const parseYamlMarkdown = (content: string, key: string) => {
    try {
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (match) {
        const data = yaml.load(match[1]) as any;
        return data[key] || [];
      }
    } catch (e) {
      console.error("YAML Parse Error", e);
    }
    return [];
  };

  const stringifyYamlMarkdown = (data: any, key: string) => {
    const yamlStr = yaml.dump({ [key]: data });
    return `---\n${yamlStr}---`;
  };

  const loadAllData = async (handle: FileSystemDirectoryHandle) => {
    setIsLoading(true);
    
    // Load Researchers
    const researchersText = await readFile(handle, 'researchers.md') || await readFile(handle, 'researchers.json');
    if (researchersText) {
      if (researchersText.startsWith('---')) {
        setResearchers(parseYamlMarkdown(researchersText, 'researchers'));
      } else {
        setResearchers(JSON.parse(researchersText));
      }
    }

    // Load Tasks
    const tasksText = await readFile(handle, 'tasks.md') || await readFile(handle, 'tasks.json');
    if (tasksText) {
      if (tasksText.startsWith('---')) {
        setTasks(parseYamlMarkdown(tasksText, 'tasks'));
      } else {
        setTasks(JSON.parse(tasksText));
      }
    }

    // Load Funding
    const fundingText = await readFile(handle, 'funding.md') || await readFile(handle, 'funding.json');
    if (fundingText) {
      if (fundingText.startsWith('---')) {
        setFunding(parseYamlMarkdown(fundingText, 'funding'));
      } else {
        setFunding(JSON.parse(fundingText));
      }
    }

    // Load Bibliography
    const bibText = await readFile(handle, 'bibliography.bib');
    if (bibText) {
      try {
        const parsed = bibtex.toJSON(bibText);
        setBibData(parsed);
      } catch (e) {
        console.error("Failed to parse BibTeX", e);
      }
    }

    // Load Notes (Obsidian Vault)
    try {
      const notesFolder = notesFolderHandle || await handle.getDirectoryHandle('notes', { create: true });
      const noteFiles = [];
      for await (const entry of (notesFolder as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          const content = await file.text();
          noteFiles.push({ name: entry.name, content });
        }
      }
      setNotes(noteFiles);
    } catch (e) {
      console.warn("Notes folder not found.");
    }

    // Load Writing
    const writingText = await readFile(handle, 'writing.md') || await readFile(handle, 'writing.json');
    if (writingText) {
      if (writingText.startsWith('---')) {
        setWriting(parseYamlMarkdown(writingText, 'writing'));
      } else {
        setWriting(JSON.parse(writingText));
      }
    }

    // Load Experiments
    try {
      const experimentsFolder = await handle.getDirectoryHandle('experiments', { create: true });
      const experimentFiles = [];
      for await (const entry of (experimentsFolder as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          const content = await file.text();
          const match = content.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
          if (match) {
            const metadata = yaml.load(match[1]) as any;
            const body = match[2].trim();
            experimentFiles.push({
              ...metadata,
              id: entry.name.replace('.md', ''),
              summary: body
            });
          }
        }
      }
      if (experimentFiles.length > 0) {
        setExperiments(experimentFiles);
      } else {
        // Fallback to legacy experiments.md
        const experimentsText = await readFile(handle, 'experiments.md') || await readFile(handle, 'experiments.json');
        if (experimentsText) {
          if (experimentsText.startsWith('---')) {
            setExperiments(parseYamlMarkdown(experimentsText, 'experiments'));
          } else {
            setExperiments(JSON.parse(experimentsText));
          }
        }
      }
    } catch (e) {
      console.warn("Experiments folder not found, falling back to experiments.md");
      const experimentsText = await readFile(handle, 'experiments.md') || await readFile(handle, 'experiments.json');
      if (experimentsText) {
        if (experimentsText.startsWith('---')) {
          setExperiments(parseYamlMarkdown(experimentsText, 'experiments'));
        } else {
          setExperiments(JSON.parse(experimentsText));
        }
      }
    }

    setIsLoading(false);
  };

  const saveData = useCallback(async () => {
    if (!directoryHandle || isDemoMode) return;
    setIsLoading(true);
    try {
      await writeFile(directoryHandle, 'researchers.md', stringifyYamlMarkdown(researchers, 'researchers'));
      await writeFile(directoryHandle, 'tasks.md', stringifyYamlMarkdown(tasks, 'tasks'));
      await writeFile(directoryHandle, 'funding.md', stringifyYamlMarkdown(funding, 'funding'));
      await writeFile(directoryHandle, 'writing.md', stringifyYamlMarkdown(writing, 'writing'));
      
      // Save experiments individually
      const experimentsFolder = await directoryHandle.getDirectoryHandle('experiments', { create: true });
      for (const exp of experiments) {
        const { summary, ...metadata } = exp;
        const yamlStr = yaml.dump(metadata);
        const content = `---\n${yamlStr}---\n\n${summary}`;
        await writeFile(experimentsFolder, `${exp.id}.md`, content);
      }
    } catch (err) {
      console.error("Failed to save data", err);
    }
    setIsLoading(false);
  }, [directoryHandle, isDemoMode, researchers, tasks, funding, writing, experiments]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      saveData();
    }, 2000); // Debounce save
    return () => clearTimeout(timer);
  }, [researchers, tasks, funding, writing, experiments, saveData]);

  // --- Views ---



  // --- Render Logic ---

  if (!directoryHandle) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-3">
            <LayoutDashboard className="text-white" size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-serif italic text-zinc-900">Boswell</h1>
            <p className="text-zinc-500 mt-4 leading-relaxed">
              Your research project metadata companion. 
              Open a local project folder to begin. Everything is saved on your machine.</p> 
              <p><small>Alas, you'll have to use Chrome, Edge, or Opera.</small>
            </p>
          </div>

          {apiError && (
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-sm text-amber-800 text-left space-y-3 shadow-sm">
              <p className="font-bold text-base">Compatibility Note:</p>
              <p>{apiError}</p>
              <div className="pt-2 border-t border-amber-200/50 space-y-1 font-mono text-[10px] opacity-70">
                <p>Browser: {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                <p>Secure Context: {window.isSecureContext ? "Yes" : "No"}</p>
                <p>API Available: {'showDirectoryPicker' in window ? "Yes" : "No"}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={openFolder}
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98]"
            >
              <FolderOpen size={20} />
              Open Existing Project
            </button>
            <button
              onClick={startNewProject}
              className="w-full bg-white border border-zinc-200 text-zinc-900 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Plus size={20} />
              Start New Project
            </button>
            {apiError && (
              <button
                onClick={startDemoMode}
                className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98]"
              >
                <LayoutDashboard size={20} />
                Try Demo Mode (No Local Files)
              </button>
            )}
          </div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
            Requires File System Access API
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex font-sans text-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 bg-white/50 backdrop-blur-xl flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="text-white" size={16} />
          </div>
          <span className="font-serif italic text-lg">Boswell</span>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <SidebarItem icon={Users} label="Researchers" active={activeView === 'researchers'} onClick={() => setActiveView('researchers')} />
          <SidebarItem icon={CheckSquare} label="Tasks" active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} />
          <SidebarItem icon={DollarSign} label="Funding" active={activeView === 'funding'} onClick={() => setActiveView('funding')} />
          <SidebarItem icon={BookOpen} label="Bibliography" active={activeView === 'bibliography'} onClick={() => setActiveView('bibliography')} />
          <SidebarItem icon={FileText} label="Research Notes" active={activeView === 'notes'} onClick={() => setActiveView('notes')} />
          <SidebarItem icon={FileText} label="Writing" active={activeView === 'writing'} onClick={() => setActiveView('writing')} />
          <SidebarItem icon={FlaskConical} label="Experiments" active={activeView === 'experiments'} onClick={() => setActiveView('experiments')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-100 space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className={cn("w-2 h-2 rounded-full", isLoading ? "bg-amber-500 animate-pulse" : "bg-emerald-500")} />
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider truncate">
              {isLoading ? "Saving..." : (isDemoMode ? "Demo Mode" : directoryHandle.name)}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 max-w-6xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'dashboard' && <Dashboard researchers={researchers} tasks={tasks} funding={funding} notes={notes} writing={writing} experiments={experiments} />}
            {activeView === 'bibliography' && <BibliographyView bibData={bibData} />}
            {activeView === 'researchers' && <ResearchersView researchers={researchers} setResearchers={setResearchers} tasks={tasks} />}
            {activeView === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} researchers={researchers} setWriting={setWriting} setExperiments={setExperiments} />}
            {activeView === 'notes' && <NotesView notes={notes} setNotes={setNotes} notesFolderHandle={notesFolderHandle} setNotesFolderHandle={setNotesFolderHandle} />}
            {activeView === 'funding' && <FundingView funding={funding} setFunding={setFunding} />}
            {activeView === 'experiments' && <ExperimentsView experiments={experiments} setExperiments={setExperiments} setTasks={setTasks} />}
            {activeView === 'writing' && <WritingView writing={writing} setWriting={setWriting} setTasks={setTasks} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
