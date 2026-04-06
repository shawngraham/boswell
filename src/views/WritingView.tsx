import React, { useState } from 'react';
import { Plus, FolderOpen, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, Modal, Btn, Badge, FormField, Input } from '../components/UI';
import { cn } from '../lib/utils';
import type { WritingProject, Task } from '../types';

interface Props {
  writing: WritingProject[];
  setWriting: React.Dispatch<React.SetStateAction<WritingProject[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const STATUS_COLORS: Record<WritingProject['status'], string> = {
  drafting: 'info',
  review: 'warning',
  final: 'success',
};

export const WritingView = ({ writing, setWriting, setTasks }: Props) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', targetWordCount: '' });
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<Record<string, string[]>>({});
  const [previewFile, setPreviewFile] = useState<{ name: string; content: string } | null>(null);

  const handleAdd = () => {
    const target = parseInt(form.targetWordCount, 10);
    if (!form.title.trim() || isNaN(target) || target <= 0) return;
    setWriting((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: form.title.trim(),
        wordCount: 0,
        targetWordCount: target,
        status: 'drafting',
      },
    ]);
    setForm({ title: '', targetWordCount: '' });
    setAdding(false);
  };

  const update = (id: string, patch: Partial<WritingProject>) =>
    setWriting((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const pickFolder = async (id: string) => {
    if (!('showDirectoryPicker' in window)) return;
    try {
      const handle = await (window as any).showDirectoryPicker();
      update(id, { folderHandle: handle });
      const files: string[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') files.push(entry.name);
      }
      setFolderFiles((prev) => ({ ...prev, [id]: files }));
    } catch (err) {
      console.error('Failed to pick folder', err);
    }
  };

  const refreshFiles = async (id: string, handle: FileSystemDirectoryHandle) => {
    try {
      const files: string[] = [];
      for await (const entry of (handle as any).values()) {
        if (entry.kind === 'file') files.push(entry.name);
      }
      setFolderFiles((prev) => ({ ...prev, [id]: files }));
    } catch {}
  };

  const previewFileContent = async (handle: FileSystemDirectoryHandle, fileName: string) => {
    try {
      const fileHandle = await handle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        const content = await file.text();
        setPreviewFile({ name: fileName, content });
      } else {
        setPreviewFile({
          name: fileName,
          content: '_Preview not available for this file type._',
        });
      }
    } catch (err) {
      console.error('Failed to read file', err);
    }
  };

  const generateTask = (w: WritingProject) => {
    if (w.taskId) return;
    const taskId = Date.now().toString();
    setTasks((prev) => [
      ...prev,
      {
        id: taskId,
        title: `Writing: ${w.title}`,
        status: 'todo',
        parentType: 'writing',
        parentId: w.id,
        parentTitle: w.title,
      },
    ]);
    update(w.id, { taskId });
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Writing in Progress</h1>
          <p className="text-zinc-500">Drafts, chapters, and publications</p>
        </div>
        <Btn onClick={() => setAdding(true)}>
          <Plus size={15} /> New Project
        </Btn>
      </header>

      <div className="space-y-5">
        {writing.map((w) => {
          const pct =
            w.targetWordCount > 0
              ? Math.min(100, Math.round((w.wordCount / w.targetWordCount) * 100))
              : 0;

          return (
            <Card key={w.id} className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <input
                      type="text"
                      value={w.title}
                      onChange={(e) => update(w.id, { title: e.target.value })}
                      className="text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 flex-1 min-w-0"
                    />
                    <Badge variant={STATUS_COLORS[w.status] as any}>{w.status}</Badge>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {(['drafting', 'review', 'final'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => update(w.id, { status: s })}
                        className={cn(
                          'text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border transition-all',
                          w.status === s
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'text-zinc-400 border-zinc-100 hover:border-zinc-300',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <input
                      type="number"
                      value={w.wordCount}
                      min={0}
                      onChange={(e) =>
                        update(w.id, { wordCount: Math.max(0, Number(e.target.value)) })
                      }
                      className="text-2xl font-light bg-transparent border-none focus:outline-none w-24 text-right"
                    />
                    <span className="text-zinc-300">/</span>
                    <input
                      type="number"
                      value={w.targetWordCount}
                      min={1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        update(w.id, { targetWordCount: val });
                      }}
                      className="text-sm text-zinc-400 bg-transparent border-none focus:outline-none w-20"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Words / Target</p>
                  <p className="text-xs font-mono text-zinc-500">{pct}%</p>
                </div>
              </div>

              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-zinc-900 h-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Task link */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => generateTask(w)}
                  disabled={!!w.taskId}
                  className={cn(
                    'text-[10px] px-2.5 py-1 rounded font-bold uppercase tracking-wider transition-colors',
                    w.taskId
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600',
                  )}
                >
                  {w.taskId ? '✓ Task Linked' : 'Generate Task'}
                </button>

                <div className="flex gap-3 items-center text-xs text-zinc-400">
                  {w.folderHandle && (
                    <button
                      onClick={() => {
                        if (openFolderId === w.id) {
                          setOpenFolderId(null);
                        } else {
                          setOpenFolderId(w.id);
                          refreshFiles(w.id, w.folderHandle!);
                        }
                      }}
                      className="hover:text-zinc-700 transition-colors"
                    >
                      {openFolderId === w.id ? 'Hide files' : `${w.folderHandle.name}/`}
                    </button>
                  )}
                  <button
                    onClick={() => pickFolder(w.id)}
                    className="flex items-center gap-1 hover:text-zinc-700 transition-colors"
                  >
                    <FolderOpen size={12} />
                    {w.folderHandle ? 'Change folder' : 'Link folder'}
                  </button>
                  <button
                    onClick={() => setWriting((prev) => prev.filter((p) => p.id !== w.id))}
                    className="text-zinc-200 hover:text-red-500 transition-colors ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {openFolderId === w.id && folderFiles[w.id] && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 pt-1 border-t border-zinc-50">
                  {folderFiles[w.id].map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => w.folderHandle && previewFileContent(w.folderHandle, file)}
                      className="flex items-center gap-1.5 p-2 rounded bg-zinc-50 border border-zinc-100 text-[10px] text-zinc-600 hover:bg-zinc-100 transition-colors text-left truncate"
                    >
                      <FileText size={10} className="shrink-0 text-zinc-300" />
                      <span className="truncate">{file}</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          );
        })}

        {writing.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 italic">
            No writing projects started yet.
          </div>
        )}
      </div>

      {/* Add Writing Project Modal */}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="New Writing Project">
        <div className="space-y-4">
          <FormField label="Project Title *">
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Dissertation Chapter 3"
              autoFocus
            />
          </FormField>
          <FormField label="Target Word Count *">
            <Input
              type="number"
              value={form.targetWordCount}
              onChange={(e) => setForm((p) => ({ ...p, targetWordCount: e.target.value }))}
              placeholder="8000"
              min={1}
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn
              onClick={handleAdd}
              disabled={!form.title.trim() || !form.targetWordCount}
            >
              Create Project
            </Btn>
          </div>
        </div>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name || ''}
        wide
      >
        <div className="prose prose-zinc max-w-none">
          <ReactMarkdown>{previewFile?.content || ''}</ReactMarkdown>
        </div>
      </Modal>
    </div>
  );
};
