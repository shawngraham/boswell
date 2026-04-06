import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Calendar } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { Card, Modal, Btn, Badge, FormField, Input, Textarea } from '../components/UI';
import { cn } from '../lib/utils';
import type { Funding, Expense } from '../types';

interface Props {
  funding: Funding[];
  setFunding: React.Dispatch<React.SetStateAction<Funding[]>>;
  currency: string;
}

export const FundingView = ({ funding, setFunding, currency }: Props) => {
  const [addingSource, setAddingSource] = useState(false);
  const [addingExpense, setAddingExpense] = useState<string | null>(null); // funding id
  const [confirmDeleteSource, setConfirmDeleteSource] = useState<string | null>(null);
  const [sourceForm, setSourceForm] = useState({ source: '', amount: '', deadline: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: '' });

  const handleAddSource = () => {
    const amt = parseFloat(sourceForm.amount);
    if (!sourceForm.source.trim() || isNaN(amt)) return;
    setFunding((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        source: sourceForm.source.trim(),
        amount: amt,
        expenses: [],
        deadline: sourceForm.deadline || undefined,
        notes: sourceForm.notes || undefined,
      },
    ]);
    setSourceForm({ source: '', amount: '', deadline: '', notes: '' });
    setAddingSource(false);
  };

  const handleAddExpense = (fundingId: string) => {
    const amt = parseFloat(expenseForm.amount);
    if (!expenseForm.description.trim() || isNaN(amt)) return;
    const newExpense: Expense = {
      id: Date.now().toString(),
      description: expenseForm.description.trim(),
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      reportFiled: false,
      category: expenseForm.category || undefined,
    };
    setFunding((prev) =>
      prev.map((f) =>
        f.id === fundingId ? { ...f, expenses: [...f.expenses, newExpense] } : f,
      ),
    );
    setExpenseForm({ description: '', amount: '', category: '' });
    setAddingExpense(null);
  };

  const toggleReportFiled = (fundingId: string, expenseId: string, val: boolean) => {
    setFunding((prev) =>
      prev.map((f) =>
        f.id === fundingId
          ? {
              ...f,
              expenses: f.expenses.map((e) =>
                e.id === expenseId ? { ...e, reportFiled: val } : e,
              ),
            }
          : f,
      ),
    );
  };

  const deleteExpense = (fundingId: string, expenseId: string) => {
    setFunding((prev) =>
      prev.map((f) =>
        f.id === fundingId
          ? { ...f, expenses: f.expenses.filter((e) => e.id !== expenseId) }
          : f,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif italic">Funding &amp; Grants</h1>
          <p className="text-zinc-500">Track allocations, expenses, and report filing</p>
        </div>
        <Btn onClick={() => setAddingSource(true)}>
          <Plus size={15} /> Add Funding Source
        </Btn>
      </header>

      <div className="space-y-8">
        {funding.map((f) => {
          const spent = f.expenses.reduce((s, e) => s + e.amount, 0);
          const remaining = f.amount - spent;
          const pct = f.amount > 0 ? Math.min(100, Math.round((spent / f.amount) * 100)) : 0;
          const unfiledCount = f.expenses.filter((e) => !e.reportFiled).length;
          const daysToDeadline = f.deadline
            ? differenceInDays(parseISO(f.deadline), new Date())
            : null;
          const deadlineUrgent = daysToDeadline !== null && daysToDeadline <= 14;

          return (
            <Card key={f.id} className="space-y-5">
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-medium text-zinc-900">{f.source}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-sm text-zinc-500">
                    <span>Total: <strong className="text-zinc-800">{currency}{f.amount.toLocaleString()}</strong></span>
                    <span>Spent: <strong className="text-zinc-800">{currency}{spent.toLocaleString()}</strong></span>
                    {f.deadline && (
                      <span
                        className={cn(
                          'flex items-center gap-1',
                          deadlineUrgent && 'text-amber-600 font-medium',
                        )}
                      >
                        <Calendar size={12} />
                        Deadline: {f.deadline}
                        {daysToDeadline !== null &&
                          (daysToDeadline < 0
                            ? ' (passed)'
                            : daysToDeadline === 0
                            ? ' (today!)'
                            : ` (${daysToDeadline}d)`)}
                      </span>
                    )}
                  </div>
                  {f.notes && (
                    <p className="text-xs text-zinc-400 italic mt-1">{f.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-light text-zinc-900">
                    {currency}{remaining.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Remaining</p>
                </div>
              </div>

              {/* Alerts */}
              {(deadlineUrgent || unfiledCount > 0) && (
                <div className="flex flex-wrap gap-2">
                  {deadlineUrgent && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                      <AlertTriangle size={12} />
                      Deadline approaching
                    </div>
                  )}
                  {unfiledCount > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-lg">
                      <AlertTriangle size={12} />
                      {unfiledCount} expense report{unfiledCount > 1 ? 's' : ''} not filed
                    </div>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                  <span>{pct}% spent</span>
                  <span>{100 - pct}% remaining</span>
                </div>
                <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-700',
                      pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-zinc-900',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Expenses Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Expenses ({f.expenses.length})
                  </h4>
                  <Btn
                    variant="ghost"
                    className="text-xs px-2 py-1"
                    onClick={() => setAddingExpense(f.id)}
                  >
                    <Plus size={12} /> Add Expense
                  </Btn>
                </div>

                {f.expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-zinc-400 border-b border-zinc-100">
                          <th className="pb-2 font-medium">Description</th>
                          <th className="pb-2 font-medium">Date</th>
                          <th className="pb-2 font-medium">Amount</th>
                          <th className="pb-2 font-medium text-center">Filed</th>
                          <th className="pb-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {f.expenses.map((exp) => (
                          <tr key={exp.id} className="group">
                            <td className="py-2.5 text-zinc-800">
                              {exp.description}
                              {exp.category && (
                                <span className="ml-2 text-[10px] text-zinc-400 italic">
                                  {exp.category}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-zinc-400 font-mono text-xs">{exp.date}</td>
                            <td className="py-2.5 font-mono">
                              {currency}{exp.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={exp.reportFiled}
                                onChange={(e) =>
                                  toggleReportFiled(f.id, exp.id, e.target.checked)
                                }
                                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => deleteExpense(f.id, exp.id)}
                                className="text-zinc-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-zinc-200">
                          <td className="pt-3 text-xs font-bold text-zinc-500 uppercase tracking-wider" colSpan={2}>
                            Total Spent
                          </td>
                          <td className="pt-3 font-mono font-bold text-zinc-900" colSpan={3}>
                            {currency}{spent.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400 italic py-2">No expenses recorded.</p>
                )}
              </div>

              {/* Delete source */}
              <div className="flex justify-end pt-2 border-t border-zinc-50">
                <button
                  onClick={() => setConfirmDeleteSource(f.id)}
                  className="text-[10px] uppercase font-bold tracking-widest text-zinc-200 hover:text-red-500 transition-colors"
                >
                  Remove Funding Source
                </button>
              </div>
            </Card>
          );
        })}

        {funding.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-2xl text-zinc-400 italic">
            No funding sources added yet.
          </div>
        )}
      </div>

      {/* Add Funding Source Modal */}
      <Modal isOpen={addingSource} onClose={() => setAddingSource(false)} title="Add Funding Source">
        <div className="space-y-4">
          <FormField label="Source Name *">
            <Input
              value={sourceForm.source}
              onChange={(e) => setSourceForm((p) => ({ ...p, source: e.target.value }))}
              placeholder="e.g. NEH Grant #442"
              autoFocus
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={`Total Amount (${currency}) *`}>
              <Input
                type="number"
                value={sourceForm.amount}
                onChange={(e) => setSourceForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="25000"
              />
            </FormField>
            <FormField label="Deadline">
              <Input
                type="date"
                value={sourceForm.deadline}
                onChange={(e) => setSourceForm((p) => ({ ...p, deadline: e.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Input
              value={sourceForm.notes}
              onChange={(e) => setSourceForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Any notes about this grant..."
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setAddingSource(false)}>Cancel</Btn>
            <Btn
              onClick={handleAddSource}
              disabled={!sourceForm.source.trim() || !sourceForm.amount}
            >
              Add Source
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        isOpen={!!addingExpense}
        onClose={() => setAddingExpense(null)}
        title="Add Expense"
      >
        <div className="space-y-4">
          <FormField label="Description *">
            <Input
              value={expenseForm.description}
              onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Archive travel — London"
              autoFocus
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={`Amount (${currency}) *`}>
              <Input
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="1200"
              />
            </FormField>
            <FormField label="Category">
              <Input
                value={expenseForm.category}
                onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="Travel, Materials, etc."
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setAddingExpense(null)}>Cancel</Btn>
            <Btn
              onClick={() => addingExpense && handleAddExpense(addingExpense)}
              disabled={!expenseForm.description.trim() || !expenseForm.amount}
            >
              Add Expense
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Source Modal */}
      <Modal
        isOpen={!!confirmDeleteSource}
        onClose={() => setConfirmDeleteSource(null)}
        title="Remove Funding Source?"
      >
        <div className="space-y-5">
          <p className="text-zinc-600">
            This will permanently remove this funding source and all its recorded expenses. This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Btn variant="secondary" onClick={() => setConfirmDeleteSource(null)}>Cancel</Btn>
            <Btn
              variant="danger"
              onClick={() => {
                setFunding((prev) => prev.filter((f) => f.id !== confirmDeleteSource));
                setConfirmDeleteSource(null);
              }}
            >
              Remove Source
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};
