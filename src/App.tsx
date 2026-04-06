import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  DollarSign,
  BookOpen,
  FileText,
  FlaskConical,
  FolderOpen,
  Plus,
  CalendarDays,
  BookMarked,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as bibtex from 'bibtex-parse-js';
import yaml from 'js-yaml';

import { cn } from './lib/utils';
import { SidebarItem, SidebarGroup } from './components/UI';
import { Dashboard } from './views/Dashboard';
import { ResearchersView } from './views/ResearchersView';
import { TasksView } from './views/TasksView';
import { FundingView } from './views/FundingView';
import { BibliographyView } from './views/BibliographyView';
import { NotesView } from './views/NotesView';
import { WritingView } from './views/WritingView';
import { ExperimentsView } from './views/ExperimentsView';
import { LogView } from './views/LogView';
import { TimelineView } from './views/TimelineView';
import { ExportView } from './views/ExportView';

import type {
  ProjectMetadata,
  Researcher,
  Task,
  Funding,
  WritingProject,
  Experiment,
  LogEntry,
} from './types';
import { DEFAULT_META } from './types';

type View =
  | 'dashboard'
  | 'researchers'
  | 'tasks'
  | 'funding'
  | 'bibliography'
  | 'notes'
  | 'writing'
  | 'experiments'
  | 'log'
  | 'timeline'
  | 'export';

// ---------------------------------------------------------------------------
// File system helpers (kept at module level so they don't recreate on render)
// ---------------------------------------------------------------------------

const readFile = async (
  handle: FileSystemDirectoryHandle,
  fileName: string,
): Promise<string | null> => {
  try {
    const fh = await handle.getFileHandle(fileName);
    const file = await fh.getFile();
    return await file.text();
  } catch {
    return null;
  }
};

const writeFile = async (
  handle: FileSystemDirectoryHandle,
  fileName: string,
  content: string,
): Promise<void> => {
  try {
    const fh = await handle.getFileHandle(fileName, { create: true });
    const writable = await (fh as any).createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err) {
    console.error(`Failed to write ${fileName}`, err);
  }
};

const parseYamlBlock = (text: string, key: string): any[] => {
  try {
    const m = text.match(/^---\n([\s\S]*?)\n---/);
    if (m) {
      const data = yaml.load(m[1]) as any;
      return data?.[key] ?? [];
    }
  } catch {}
  return [];
};

const toYamlBlock = (data: any, key: string): string =>
  `---\n${yaml.dump({ [key]: data })}---`;

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function App() {
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [notesFolderHandle, setNotesFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- Data state ---
  const [projectMeta, setProjectMeta] = useState<ProjectMetadata>(DEFAULT_META);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [funding, setFunding] = useState<Funding[]>([]);
  const [bibData, setBibData] = useState<any[]>([]);
  const [notes, setNotes] = useState<{ name: string; content: string }[]>([]);
  const [writing, setWriting] = useState<WritingProject[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  // ---------------------------------------------------------------------------
  // File system API check
  // ---------------------------------------------------------------------------

  const checkApiSupport = (): boolean => {
    if (!('showDirectoryPicker' in window)) {
      let msg =
        'The File System Access API is not supported in this browser. ';
      if (!window.isSecureContext) {
        msg +=
          'A secure context is required. Use http://localhost:8000 rather than an IP address.';
      } else {
        msg +=
          'Please use Chrome, Edge, or Opera. Firefox and Safari do not support this API.';
      }
      setApiError(msg);
      return false;
    }
    return true;
  };

  // ---------------------------------------------------------------------------
  // Load all data from a folder handle
  // ---------------------------------------------------------------------------

  const loadAllData = useCallback(async (handle: FileSystemDirectoryHandle) => {
    setIsLoading(true);

    // Project metadata
    const metaText = await readFile(handle, 'project.md');
    if (metaText) {
      const parsed = parseYamlBlock(metaText, 'project');
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProjectMeta({ ...DEFAULT_META, ...parsed[0] });
      } else {
        // Try object-form YAML
        try {
          const m = metaText.match(/^---\n([\s\S]*?)\n---/);
          if (m) {
            const data = yaml.load(m[1]) as any;
            if (data?.project && typeof data.project === 'object') {
              setProjectMeta({ ...DEFAULT_META, ...data.project });
            }
          }
        } catch {}
      }
    }

    // Researchers
    const rText = await readFile(handle, 'researchers.md') ?? await readFile(handle, 'researchers.json');
    if (rText) {
      setResearchers(
        rText.startsWith('---') ? parseYamlBlock(rText, 'researchers') : JSON.parse(rText),
      );
    }

    // Tasks
    const tText = await readFile(handle, 'tasks.md') ?? await readFile(handle, 'tasks.json');
    if (tText) {
      setTasks(
        tText.startsWith('---') ? parseYamlBlock(tText, 'tasks') : JSON.parse(tText),
      );
    }

    // Funding
    const fText = await readFile(handle, 'funding.md') ?? await readFile(handle, 'funding.json');
    if (fText) {
      setFunding(
        fText.startsWith('---') ? parseYamlBlock(fText, 'funding') : JSON.parse(fText),
      );
    }

    // Bibliography
    const bibText = await readFile(handle, 'bibliography.bib');
    if (bibText) {
      try {
        setBibData(bibtex.toJSON(bibText));
      } catch (e) {
        console.error('BibTeX parse error', e);
      }
    }

    // Notes (subfolder)
    try {
      const notesFolder = await handle.getDirectoryHandle('notes', { create: true });
      const noteFiles: { name: string; content: string }[] = [];
      for await (const entry of (notesFolder as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          noteFiles.push({ name: entry.name, content: await file.text() });
        }
      }
      setNotes(noteFiles);
    } catch {}

    // Writing
    const wText = await readFile(handle, 'writing.md') ?? await readFile(handle, 'writing.json');
    if (wText) {
      setWriting(
        wText.startsWith('---') ? parseYamlBlock(wText, 'writing') : JSON.parse(wText),
      );
    }

    // Experiments (individual files in experiments/)
    try {
      const expFolder = await handle.getDirectoryHandle('experiments', { create: true });
      const expFiles: Experiment[] = [];
      for await (const entry of (expFolder as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          const content = await file.text();
          const match = content.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
          if (match) {
            const metadata = yaml.load(match[1]) as any;
            expFiles.push({
              ...metadata,
              id: entry.name.replace('.md', ''),
              summary: match[2].trim(),
            });
          }
        }
      }
      if (expFiles.length > 0) {
        setExperiments(expFiles);
      } else {
        // Legacy fallback
        const legacyText = await readFile(handle, 'experiments.md') ?? await readFile(handle, 'experiments.json');
        if (legacyText) {
          setExperiments(
            legacyText.startsWith('---')
              ? parseYamlBlock(legacyText, 'experiments')
              : JSON.parse(legacyText),
          );
        }
      }
    } catch {
      const legacyText = await readFile(handle, 'experiments.md');
      if (legacyText) {
        setExperiments(
          legacyText.startsWith('---')
            ? parseYamlBlock(legacyText, 'experiments')
            : JSON.parse(legacyText),
        );
      }
    }

    // Log entries (log/ subfolder, one file per date)
    try {
      const logFolder = await handle.getDirectoryHandle('log', { create: true });
      const entries: LogEntry[] = [];
      for await (const entry of (logFolder as any).values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.md')) {
          const file = await entry.getFile();
          const content = await file.text();
          const date = entry.name.replace('.md', '');
          entries.push({ id: date, date, content });
        }
      }
      entries.sort((a, b) => b.date.localeCompare(a.date));
      setLogEntries(entries);
    } catch {}

    setIsLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Save all data (auto-save, debounced)
  // ---------------------------------------------------------------------------

  const saveData = useCallback(async () => {
    if (!directoryHandle || isDemoMode) return;

    await writeFile(
      directoryHandle,
      'project.md',
      `---\nproject:\n${yaml.dump(projectMeta)
        .split('\n')
        .map((l: string) => `  ${l}`)
        .join('\n')}\n---`,
    );
    await writeFile(directoryHandle, 'researchers.md', toYamlBlock(researchers, 'researchers'));
    await writeFile(directoryHandle, 'tasks.md', toYamlBlock(tasks, 'tasks'));
    await writeFile(directoryHandle, 'funding.md', toYamlBlock(funding, 'funding'));
    await writeFile(directoryHandle, 'writing.md', toYamlBlock(writing, 'writing'));

    // Experiments: one file each
    const expFolder = await directoryHandle.getDirectoryHandle('experiments', { create: true });
    for (const exp of experiments) {
      const { summary, ...meta } = exp;
      await writeFile(expFolder, `${exp.id}.md`, `---\n${yaml.dump(meta)}---\n\n${summary}`);
    }
    // Note: log files are written immediately on save in LogView
  }, [directoryHandle, isDemoMode, projectMeta, researchers, tasks, funding, writing, experiments]);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(saveData, 2000);
    return () => clearTimeout(timer);
  }, [projectMeta, researchers, tasks, funding, writing, experiments, saveData]);

  // ---------------------------------------------------------------------------
  // Log I/O helpers (called directly from LogView, not via auto-save)
  // ---------------------------------------------------------------------------

  const saveLogEntry = useCallback(
    async (entry: LogEntry) => {
      if (!directoryHandle || isDemoMode) return;
      const logFolder = await directoryHandle.getDirectoryHandle('log', { create: true });
      await writeFile(logFolder, `${entry.date}.md`, entry.content);
    },
    [directoryHandle, isDemoMode],
  );

  const deleteLogEntry = useCallback(
    async (date: string) => {
      if (!directoryHandle || isDemoMode) return;
      setLogEntries((prev) => prev.filter((e) => e.date !== date));
      try {
        const logFolder = await directoryHandle.getDirectoryHandle('log');
        await (logFolder as any).removeEntry(`${date}.md`);
      } catch {}
    },
    [directoryHandle, isDemoMode],
  );

  // ---------------------------------------------------------------------------
  // Open / create project
  // ---------------------------------------------------------------------------

  const openFolder = async () => {
    if (!checkApiSupport()) return;
    try {
      const handle = await (window as any).showDirectoryPicker();
      setDirectoryHandle(handle);
      await loadAllData(handle);
    } catch {}
  };

  const startNewProject = async () => {
    if (!checkApiSupport()) return;
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setIsLoading(true);
      setIsDemoMode(false);
      await writeFile(handle, 'project.md', toYamlBlock([DEFAULT_META], 'project'));
      await writeFile(handle, 'researchers.md', toYamlBlock([], 'researchers'));
      await writeFile(handle, 'tasks.md', toYamlBlock([], 'tasks'));
      await writeFile(handle, 'funding.md', toYamlBlock([], 'funding'));
      await writeFile(handle, 'writing.md', toYamlBlock([], 'writing'));
      await writeFile(handle, 'bibliography.bib', '% Add your BibTeX entries here\n');
      await handle.getDirectoryHandle('notes', { create: true });
      await handle.getDirectoryHandle('experiments', { create: true });
      await handle.getDirectoryHandle('log', { create: true });
      setDirectoryHandle(handle);
      setProjectMeta(DEFAULT_META);
      setResearchers([]);
      setTasks([]);
      setFunding([]);
      setBibData([]);
      setNotes([]);
      setWriting([]);
      setExperiments([]);
      setLogEntries([]);
      setIsLoading(false);
      setActiveView('dashboard');
    } catch (err) {
      console.error('Failed to start new project', err);
      setIsLoading(false);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setDirectoryHandle({ name: 'Demo Project' } as any);

    setProjectMeta({
      title: 'Eighteenth-Century Letters Project',
      pi: 'Dr. Jane Historian',
      institution: 'Carleton University',
      description: 'A digital humanities study of correspondence networks in the 1770s.',
      currency: '$',
      startDate: '2025-09-01',
      endDate: '2027-08-31',
    });
    setResearchers([
      { id: '1', name: 'Alice Smith', role: 'Graduate Researcher', email: 'alice@example.edu', phone: '555-0101', studentID: 'S12345', tasks: ['101'] },
      { id: '2', name: 'Bob Jones', role: 'Undergraduate Assistant', email: 'bob@example.edu', phone: '555-0102', studentID: 'S67890', tasks: ['102'] },
    ]);
    setTasks([
      { id: '101', title: 'Archive Analysis: 18th Century Letters', status: 'in-progress', assigneeId: '1', dueDate: '2026-04-15' },
      { id: '102', title: 'Digitize Microfilm Reels', status: 'todo', assigneeId: '2', dueDate: '2026-04-20' },
      { id: '103', title: 'Draft Literature Review', status: 'done', assigneeId: '1', dueDate: '2026-03-25' },
      { id: '104', title: 'Ethics Board Approval', status: 'blocked', dueDate: '2026-04-10' },
    ]);
    setFunding([
      {
        id: 'f1',
        source: 'NEH Grant #442',
        amount: 25000,
        deadline: '2026-09-01',
        expenses: [
          { id: 'e1', description: 'Archive Travel', amount: 1200, date: '2026-02-10', reportFiled: true },
          { id: 'e2', description: 'Digitization Services', amount: 5000, date: '2026-03-01', reportFiled: false },
        ],
      },
      { id: 'f2', source: 'University Research Fund', amount: 5000, expenses: [] },
    ]);
    setBibData([
      { citationKey: 'McLuhan1962', entryType: 'book', entryTags: { title: 'The Gutenberg Galaxy', author: 'Marshall McLuhan', year: '1962', publisher: 'University of Toronto Press' } },
      { citationKey: 'Busa1980', entryType: 'article', entryTags: { title: 'Computing and the Humanities', author: 'Roberto Busa', year: '1980', journal: 'Computers and the Humanities' } },
    ]);
    setNotes([
      { name: 'Research_Methodology.md', content: '# Methodology\n\nOur approach focuses on the intersection of digital tools and traditional archival research.\n\n## Phase 1\n\nBegin with catalogue work at the National Archives.' },
      { name: 'Archive_Findings.md', content: '# Archive Findings\n\nDiscovered several previously uncatalogued letters in the basement collection.' },
    ]);
    setWriting([
      { id: 'w1', title: 'Dissertation Chapter 1: Introduction', wordCount: 4500, targetWordCount: 8000, status: 'drafting' },
      { id: 'w2', title: 'Article: Network Analysis of Correspondence', wordCount: 2100, targetWordCount: 6000, status: 'drafting' },
    ]);
    setExperiments([
      { id: 'e1', title: 'Topic Modeling on Letters', date: '2026-03-10', summary: 'Ran LDA on the corpus of 18th century letters to identify recurring themes.\n\n## Results\n\nIdentified 12 coherent topics. Travel and commerce dominate ~40% of corpus.', codeLink: 'https://github.com/example/topic-modeling', status: 'completed' },
    ]);
    setLogEntries([
      { id: '2026-04-01', date: '2026-04-01', content: '## Tuesday, April 1 2026\n\nFinished first pass through the microfilm reels from 1773. Approximately 340 letters identified for transcription. Emailed Bob to confirm handoff schedule.' },
      { id: '2026-04-03', date: '2026-04-03', content: '## Thursday, April 3 2026\n\nMeeting with Alice about chapter 1 draft. Good progress on the lit review section. Need to add more on network theory approaches.' },
    ]);
    setActiveView('dashboard');
  };

  // ---------------------------------------------------------------------------
  // Landing screen
  // ---------------------------------------------------------------------------

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
              Your research project companion. Open a local folder to begin. Everything is saved on your machine.
            </p>
            {!apiError && (
              <p className="text-xs text-zinc-400 mt-2">Requires Chrome, Edge, or Opera.</p>
            )}
          </div>

          {apiError && (
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl text-sm text-amber-800 text-left space-y-2 shadow-sm">
              <p className="font-bold">Compatibility Note</p>
              <p>{apiError}</p>
              <div className="pt-2 border-t border-amber-200/50 font-mono text-[10px] opacity-70 space-y-0.5">
                <p>Browser: {navigator.userAgent.split(' ').slice(-2).join(' ')}</p>
                <p>Secure context: {window.isSecureContext ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
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
            <button
              onClick={startDemoMode}
              className="w-full bg-zinc-100 text-zinc-600 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              <LayoutDashboard size={20} />
              Try Demo Mode
            </button>
          </div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
            Local-first · Markdown · No account required
          </p>
        </motion.div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main app shell
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex font-sans text-zinc-900">
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-200 bg-white/60 backdrop-blur-xl flex flex-col p-4 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2 pt-2">
          <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center shrink-0">
            <LayoutDashboard className="text-white" size={14} />
          </div>
          <div className="min-w-0">
            <span className="font-serif italic text-base block truncate">
              {projectMeta.title || 'Boswell'}
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
          />

          <SidebarGroup label="Project" />
          <SidebarItem
            icon={CalendarDays}
            label="Timeline"
            active={activeView === 'timeline'}
            onClick={() => setActiveView('timeline')}
          />
          <SidebarItem
            icon={CheckSquare}
            label="Tasks"
            active={activeView === 'tasks'}
            onClick={() => setActiveView('tasks')}
          />
          <SidebarItem
            icon={Users}
            label="Researchers"
            active={activeView === 'researchers'}
            onClick={() => setActiveView('researchers')}
          />
          <SidebarItem
            icon={DollarSign}
            label="Funding"
            active={activeView === 'funding'}
            onClick={() => setActiveView('funding')}
          />

          <SidebarGroup label="Research" />
          <SidebarItem
            icon={BookMarked}
            label="Log"
            active={activeView === 'log'}
            onClick={() => setActiveView('log')}
          />
          <SidebarItem
            icon={FileText}
            label="Notes"
            active={activeView === 'notes'}
            onClick={() => setActiveView('notes')}
          />
          <SidebarItem
            icon={BookOpen}
            label="Bibliography"
            active={activeView === 'bibliography'}
            onClick={() => setActiveView('bibliography')}
          />
          <SidebarItem
            icon={FileText}
            label="Writing"
            active={activeView === 'writing'}
            onClick={() => setActiveView('writing')}
          />
          <SidebarItem
            icon={FlaskConical}
            label="Experiments"
            active={activeView === 'experiments'}
            onClick={() => setActiveView('experiments')}
          />

          <SidebarGroup label="Output" />
          <SidebarItem
            icon={Download}
            label="Export Report"
            active={activeView === 'export'}
            onClick={() => setActiveView('export')}
          />
        </nav>

        <div className="mt-auto pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 px-2">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500',
              )}
            />
            <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider truncate">
              {isLoading ? 'Saving…' : isDemoMode ? 'Demo Mode' : (directoryHandle as any).name}
            </span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-10 max-w-5xl mx-auto w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeView === 'dashboard' && (
              <Dashboard
                researchers={researchers}
                tasks={tasks}
                funding={funding}
                notes={notes}
                writing={writing}
                experiments={experiments}
                projectMeta={projectMeta}
                setProjectMeta={setProjectMeta}
                logEntries={logEntries}
              />
            )}
            {activeView === 'researchers' && (
              <ResearchersView
                researchers={researchers}
                setResearchers={setResearchers}
                tasks={tasks}
              />
            )}
            {activeView === 'tasks' && (
              <TasksView
                tasks={tasks}
                setTasks={setTasks}
                researchers={researchers}
                setResearchers={setResearchers}
              />
            )}
            {activeView === 'funding' && (
              <FundingView
                funding={funding}
                setFunding={setFunding}
                currency={projectMeta.currency}
              />
            )}
            {activeView === 'bibliography' && <BibliographyView bibData={bibData} />}
            {activeView === 'notes' && (
              <NotesView
                notes={notes}
                setNotes={setNotes}
                notesFolderHandle={notesFolderHandle}
                setNotesFolderHandle={setNotesFolderHandle}
              />
            )}
            {activeView === 'writing' && (
              <WritingView
                writing={writing}
                setWriting={setWriting}
                setTasks={setTasks}
              />
            )}
            {activeView === 'experiments' && (
              <ExperimentsView
                experiments={experiments}
                setExperiments={setExperiments}
                setTasks={setTasks}
              />
            )}
            {activeView === 'log' && (
              <LogView
                logEntries={logEntries}
                setLogEntries={setLogEntries}
                onSave={saveLogEntry}
                onDelete={deleteLogEntry}
                isDemoMode={isDemoMode}
              />
            )}
            {activeView === 'timeline' && (
              <TimelineView
                tasks={tasks}
                experiments={experiments}
                funding={funding}
                writing={writing}
              />
            )}
            {activeView === 'export' && (
              <ExportView
                projectMeta={projectMeta}
                researchers={researchers}
                tasks={tasks}
                funding={funding}
                writing={writing}
                experiments={experiments}
                logEntries={logEntries}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
