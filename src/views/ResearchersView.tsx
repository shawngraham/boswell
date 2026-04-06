import React, { useState } from 'react';
import { Plus, Mail, Phone, IdCard, Briefcase } from 'lucide-react';
import { Card, Badge, Modal, Btn, FormField, Input } from '../components/UI';
import { cn } from '../lib/utils';
import type { Researcher, Task } from '../types';

interface Props {
  researchers: Researcher[];
  setResearchers: React.Dispatch<React.SetStateAction<Researcher[]>>;
  tasks: Task[];
}

export const ResearchersView = ({ researchers, setResearchers, tasks }: Props) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', email: '', phone: '', studentID: '' });

  const handleAdd = () => {
    if (!form.name.trim() || !form.role.trim()) return;
    setResearchers((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        studentID: form.studentID.trim() || undefined,
        tasks: [],
      },
    ]);
    setForm({ name: '', role: '', email: '', phone: '', studentID: '' });
    setAdding(false);
  };

  const update = (id: string, patch: Partial<Researcher>) =>
    setResearchers((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Researchers</h1>
          <p className="text-zinc-500">Team members, students, and collaborators</p>
        </div>
        <Btn onClick={() => setAdding(true)}>
          <Plus size={15} /> Add Researcher
        </Btn>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {researchers.map((r) => {
          const assignedTasks = tasks.filter((t) => t.assigneeId === r.id);
          const doneTasks = assignedTasks.filter((t) => t.status === 'done');
          return (
            <Card key={r.id} className="space-y-4 group relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => update(r.id, { name: e.target.value })}
                    className="text-xl font-medium text-zinc-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full truncate"
                  />
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Briefcase size={11} className="text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={r.role}
                      onChange={(e) => update(r.id, { role: e.target.value })}
                      className="text-xs text-zinc-500 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                      placeholder="Role"
                    />
                  </div>
                </div>
                <Badge variant="info">{doneTasks.length}/{assignedTasks.length} tasks</Badge>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { Icon: Mail, key: 'email', type: 'email', placeholder: 'Email' },
                  { Icon: Phone, key: 'phone', type: 'tel', placeholder: 'Phone' },
                  { Icon: IdCard, key: 'studentID', type: 'text', placeholder: 'Student ID' },
                ].map(({ Icon, key, type, placeholder }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Icon size={12} className="text-zinc-300 shrink-0" />
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={(r as any)[key] || ''}
                      onChange={(e) => update(r.id, { [key]: e.target.value })}
                      className="text-xs text-zinc-600 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-zinc-300"
                    />
                  </div>
                ))}
              </div>

              {assignedTasks.length > 0 && (
                <div className="pt-3 border-t border-zinc-50 space-y-2">
                  <h4 className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-300">
                    Assigned Tasks
                  </h4>
                  <div className="space-y-1.5">
                    {assignedTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full shrink-0',
                            t.status === 'done'
                              ? 'bg-emerald-400'
                              : t.status === 'blocked'
                              ? 'bg-rose-400'
                              : t.status === 'in-progress'
                              ? 'bg-blue-400'
                              : 'bg-zinc-300',
                          )}
                        />
                        <span className="text-xs text-zinc-600 truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                <button
                  onClick={() => setResearchers((prev) => prev.filter((x) => x.id !== r.id))}
                  className="text-[10px] uppercase font-bold tracking-widest text-zinc-300 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              </div>
            </Card>
          );
        })}

        {researchers.length === 0 && (
          <div className="md:col-span-2 text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 italic">
            No researchers added yet.
          </div>
        )}
      </div>

      <Modal isOpen={adding} onClose={() => setAdding(false)} title="Add Researcher">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name *">
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full name"
                autoFocus
              />
            </FormField>
            <FormField label="Role *">
              <Input
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                placeholder="e.g. Graduate Researcher"
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@university.edu"
              />
            </FormField>
            <FormField label="Phone">
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="555-0100"
              />
            </FormField>
            <FormField label="Student ID">
              <Input
                value={form.studentID}
                onChange={(e) => setForm((p) => ({ ...p, studentID: e.target.value }))}
                placeholder="S12345"
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Btn>
            <Btn onClick={handleAdd} disabled={!form.name.trim() || !form.role.trim()}>
              Add Researcher
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};
