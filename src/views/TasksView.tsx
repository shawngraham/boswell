import React, { useState, useEffect, useRef } from 'react';
import { Plus, Clock, Trash2, Paperclip, ExternalLink, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, Badge, Modal, Btn, FormField, Input, Select, Textarea } from '../components/UI';
import { cn } from '../lib/utils';
import type { Task, Researcher } from '../types';

interface Props {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  researchers: Researcher[];
  setResearchers: React.Dispatch<React.SetStateAction<Researcher[]>>;
}

const COLUMNS: { id: Task['status']; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'done', label: 'Done' },
];

const statusColor: Record<Task['status'], string> = {
  todo: 'bg-zinc-200',
  'in-progress': 'bg-blue-400',
  blocked: 'bg-rose-400',
  done: 'bg-emerald-400',
};

const isOverdue = (dueDate?: string) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

const isDueSoon = (dueDate?: string) => {
  if (!dueDate) return false;
  const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff < 3;
};

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

interface EditModalProps {
  task: Task | null;
  researchers: Researcher[];
  onSave: (updated: Task) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const EditTaskModal = ({ task, researchers, onSave, onDelete, onClose }: EditModalProps) => {
  const [draft, setDraft] = useState<Task | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Sync draft when task changes
  useEffect(() => {
    if (task) {
      setDraft({ ...task });
      setFilePreview(null);
      // Focus title on open
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [task?.id]);

  if (!task || !draft) return null;

  const patch = (p: Partial<Task>) => setDraft((d) => d ? { ...d, ...p } : d);

  const handleSave = () => {
    if (!draft.title.trim()) return;
    onSave(draft);
    onClose();
  };

  const pickFile = async () => {
    if (!('showOpenFilePicker' in window)) {
      alert('File picker not supported in this browser.');
      return;
    }
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
      });
      patch({ linkedFileHandle: handle, linkedFileName: handle.name });
      setFilePreview(null);
    } catch {
      // User cancelled — do nothing
    }
  };

  const clearFile = () => {
    patch({ linkedFileHandle: undefined, linkedFileName: undefined });
    setFilePreview(null);
  };

  const openFile = async () => {
    const handle = draft.linkedFileHandle;
    if (!handle) return;
    try {
      setLoadingFile(true);
      const file = await handle.getFile();
      const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');
      if (isText) {
        const content = await file.text();
        setFilePreview(content.slice(0, 2000) + (content.length > 2000 ? '\n\n…(truncated)' : ''));
      } else {
        // For non-text files, open via object URL
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (err) {
      console.error('Failed to open file', err);
    } finally {
      setLoadingFile(false);
    }
  };

  return (
    <Modal isOpen={!!task} onClose={onClose} title="Edit Task" wide>
      <div className="space-y-5">

        {/* Title */}
        <FormField label="Title *">
          <Input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => patch({ title: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description">
          <Textarea
            value={draft.description || ''}
            onChange={(e) => patch({ description: e.target.value })}
            rows={3}
            placeholder="Notes, context, or acceptance criteria…"
          />
        </FormField>

        {/* Status / Due / Assignee row */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="Status">
            <Select
              value={draft.status}
              onChange={(e) => patch({ status: e.target.value as Task['status'] })}
            >
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </Select>
          </FormField>
          <FormField label="Due Date">
            <Input
              type="date"
              value={draft.dueDate || ''}
              onChange={(e) => patch({ dueDate: e.target.value || undefined })}
            />
          </FormField>
          <FormField label="Assignee">
            <Select
              value={draft.assigneeId || ''}
              onChange={(e) => patch({ assigneeId: e.target.value || undefined })}
            >
              <option value="">Unassigned</option>
              {researchers.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Linked file */}
        <FormField label="Linked File">
          <div className="space-y-2">
            {draft.linkedFileName ? (
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded-lg">
                <Paperclip size={14} className="text-zinc-400 shrink-0" />
                <span className="text-sm text-zinc-700 flex-1 truncate font-mono">
                  {draft.linkedFileName}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {draft.linkedFileHandle && (
                    <button
                      onClick={openFile}
                      disabled={loadingFile}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-900 border border-zinc-200 rounded px-2 py-1 transition-colors"
                    >
                      <ExternalLink size={10} />
                      {loadingFile ? 'Opening…' : 'Open'}
                    </button>
                  )}
                  <button
                    onClick={clearFile}
                    className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                    title="Remove file link"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">No file linked.</p>
            )}

            <Btn variant="secondary" onClick={pickFile} className="text-xs py-1.5">
              <Paperclip size={13} />
              {draft.linkedFileName ? 'Change File' : 'Link a File'}
            </Btn>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Links a file on your computer to this task. The filename is saved; the live handle
              requires re-linking after the app reloads (same behaviour as folder links in Writing).
            </p>
          </div>
        </FormField>

        {/* Inline text preview */}
        {filePreview && (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                File Preview
              </p>
              <button
                onClick={() => setFilePreview(null)}
                className="text-zinc-300 hover:text-zinc-700 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
            <pre className="bg-zinc-50 border border-zinc-100 rounded-lg p-3 text-xs font-mono text-zinc-600 overflow-y-auto max-h-48 whitespace-pre-wrap leading-relaxed">
              {filePreview}
            </pre>
          </div>
        )}

        {/* Parent badge */}
        {draft.parentTitle && (
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              Generated from
            </p>
            <Badge variant="info">{draft.parentTitle}</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
          <button
            onClick={() => { onDelete(draft.id); onClose(); }}
            className="text-xs text-zinc-300 hover:text-red-500 transition-colors font-medium"
          >
            Delete task
          </button>
          <div className="flex gap-3">
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={!draft.title.trim()}>Save</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main TasksView
// ---------------------------------------------------------------------------

export const TasksView = ({ tasks, setTasks, researchers, setResearchers }: Props) => {
  const [adding, setAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    assigneeId: '',
    description: '',
  });

  // Atomically assign a task to a researcher, keeping both in sync
  const assignTask = (taskId: string, newAssigneeId: string | undefined) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assigneeId: newAssigneeId } : t)),
    );
    setResearchers((prev) =>
      prev.map((r) => {
        const without = r.tasks.filter((id) => id !== taskId);
        if (newAssigneeId && r.id === newAssigneeId) {
          return { ...r, tasks: [...without, taskId] };
        }
        return { ...r, tasks: without };
      }),
    );
  };

  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    const id = Date.now().toString();
    setTasks((prev) => [
      ...prev,
      {
        id,
        title: newTask.title.trim(),
        status: 'todo',
        dueDate: newTask.dueDate || undefined,
        description: newTask.description || undefined,
        assigneeId: newTask.assigneeId || undefined,
      },
    ]);
    if (newTask.assigneeId) {
      setResearchers((prev) =>
        prev.map((r) =>
          r.id === newTask.assigneeId ? { ...r, tasks: [...r.tasks, id] } : r,
        ),
      );
    }
    setNewTask({ title: '', dueDate: new Date().toISOString().split('T')[0], assigneeId: '', description: '' });
    setAdding(false);
  };

  const handleSaveEdit = (updated: Task) => {
    // Sync researcher assignment if it changed
    const original = tasks.find((t) => t.id === updated.id);
    if (original?.assigneeId !== updated.assigneeId) {
      assignTask(updated.id, updated.assigneeId);
    }
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDelete = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setResearchers((prev) =>
      prev.map((r) => ({ ...r, tasks: r.tasks.filter((id) => id !== taskId) })),
    );
    setConfirmDelete(null);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as Task['status'];
    const task = tasks.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t)),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Tasks</h1>
          <p className="text-zinc-500">
            Drag to update status · <span className="font-medium">double-click</span> to edit
          </p>
        </div>
        <Btn onClick={() => setAdding(true)}>
          <Plus size={15} /> Add Task
        </Btn>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(({ id: colId, label }) => {
            const colTasks = tasks.filter((t) => t.status === colId);
            return (
              <div key={colId} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className={cn('w-2 h-2 rounded-full', statusColor[colId])} />
                  <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">
                    {label}
                  </h3>
                  <span className="text-xs text-zinc-300 ml-auto">{colTasks.length}</span>
                </div>
                <Droppable droppableId={colId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'min-h-[80px] rounded-xl p-2 space-y-2 transition-colors',
                        snapshot.isDraggingOver ? 'bg-zinc-100' : 'bg-zinc-50/50',
                      )}
                    >
                      {colTasks.map((task, index) => {
                        const assignee = researchers.find((r) => r.id === task.assigneeId);
                        const overdue = isOverdue(task.dueDate) && colId !== 'done';
                        const soon = isDueSoon(task.dueDate) && colId !== 'done';
                        return (
                          <Draggable draggableId={task.id} index={index} key={task.id}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                              >
                                <Card
                                  onDoubleClick={() => setEditingTask(task)}
                                  className={cn(
                                    'p-3 cursor-grab active:cursor-grabbing transition-all group relative !p-3',
                                    'hover:border-zinc-300 hover:shadow-md',
                                    snap.isDragging && 'shadow-xl rotate-1 cursor-grabbing',
                                    overdue && 'border-red-200',
                                  )}
                                >
                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDelete(task.id);
                                    }}
                                    className="absolute top-2 right-2 text-zinc-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>

                                  {/* Title */}
                                  <p className="text-sm font-medium text-zinc-900 pr-5 leading-snug">
                                    {task.title}
                                  </p>

                                  {/* Description snippet */}
                                  {task.description && (
                                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-snug">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Parent badge */}
                                  {task.parentTitle && (
                                    <div className="mt-1.5">
                                      <Badge variant="info">{task.parentTitle}</Badge>
                                    </div>
                                  )}

                                  {/* Linked file chip */}
                                  {task.linkedFileName && (
                                    <div className="flex items-center gap-1 mt-1.5">
                                      <Paperclip size={9} className="text-zinc-300 shrink-0" />
                                      <span className="text-[10px] text-zinc-400 truncate font-mono">
                                        {task.linkedFileName}
                                      </span>
                                    </div>
                                  )}

                                  {/* Due date + assignee row */}
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    {task.dueDate ? (
                                      <span
                                        className={cn(
                                          'text-[10px] font-mono flex items-center gap-1',
                                          overdue
                                            ? 'text-red-500 font-bold'
                                            : soon
                                            ? 'text-amber-600 font-bold'
                                            : 'text-zinc-400',
                                        )}
                                      >
                                        <Clock size={9} />
                                        {task.dueDate}
                                        {overdue && ' ⚠'}
                                      </span>
                                    ) : (
                                      <span />
                                    )}
                                    {/* Quick-assign select (hover only) */}
                                    <select
                                      value={task.assigneeId || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) =>
                                        assignTask(task.id, e.target.value || undefined)
                                      }
                                      className="text-[10px] bg-white border border-zinc-100 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 max-w-[90px] truncate"
                                    >
                                      <option value="">Unassigned</option>
                                      {researchers.map((r) => (
                                        <option key={r.id} value={r.id}>
                                          {r.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Assignee name */}
                                  {assignee && (
                                    <p className="text-[10px] text-zinc-400 mt-1 truncate">
                                      {assignee.name}
                                    </p>
                                  )}

                                  {/* Double-click hint — only shown on hover when card has no description */}
                                  {!task.description && !task.linkedFileName && (
                                    <p className="text-[9px] text-zinc-200 mt-2 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                                      double-click to edit
                                    </p>
                                  )}
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        researchers={researchers}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
        onClose={() => setEditingTask(null)}
      />

      {/* Add Task Modal */}
      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add Task">
        <div className="space-y-4">
          <FormField label="Title *">
            <Input
              value={newTask.title}
              onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
              placeholder="Task title"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due Date">
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </FormField>
            <FormField label="Assignee">
              <Select
                value={newTask.assigneeId}
                onChange={(e) => setNewTask((p) => ({ ...p, assigneeId: e.target.value }))}
              >
                <option value="">Unassigned</option>
                {researchers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField label="Description (optional)">
            <Input
              value={newTask.description}
              onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
              placeholder="Brief description…"
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn onClick={handleAdd} disabled={!newTask.title.trim()}>Add Task</Btn>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Task?">
        <div className="space-y-5">
          <p className="text-zinc-600">This cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Delete
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};
