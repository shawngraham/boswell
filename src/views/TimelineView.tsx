import React, { useMemo, useState } from 'react';
import { format, parseISO, isAfter, isBefore, isToday, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { CheckSquare, FlaskConical, DollarSign, FileText, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Task, Experiment, Funding, WritingProject } from '../types';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  type: 'task' | 'experiment' | 'deadline' | 'writing-milestone';
  status: string;
  overdue?: boolean;
  done?: boolean;
}

interface Props {
  tasks: Task[];
  experiments: Experiment[];
  funding: Funding[];
  writing: WritingProject[];
}

const TYPE_CONFIG = {
  task: { icon: CheckSquare, color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', label: 'Task' },
  experiment: { icon: FlaskConical, color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-400', label: 'Experiment' },
  deadline: { icon: DollarSign, color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', label: 'Funding Deadline' },
  'writing-milestone': { icon: FileText, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', label: 'Writing' },
} as const;

export const TimelineView = ({ tasks, experiments, funding, writing }: Props) => {
  const [filter, setFilter] = useState<'all' | 'task' | 'experiment' | 'deadline' | 'writing-milestone'>('all');
  const [showPast, setShowPast] = useState(false);

  const today = new Date();

  const events: TimelineEvent[] = useMemo(() => {
    const all: TimelineEvent[] = [];

    tasks
      .filter((t) => t.dueDate)
      .forEach((t) => {
        all.push({
          id: t.id,
          date: t.dueDate!,
          title: t.title,
          type: 'task',
          status: t.status,
          done: t.status === 'done',
          overdue: t.status !== 'done' && isBefore(parseISO(t.dueDate!), today),
        });
      });

    experiments.forEach((e) => {
      all.push({
        id: e.id,
        date: e.date,
        title: e.title,
        type: 'experiment',
        status: e.status,
        done: e.status === 'completed',
      });
    });

    funding
      .filter((f) => f.deadline)
      .forEach((f) => {
        const spent = f.expenses.reduce((s, e) => s + e.amount, 0);
        all.push({
          id: f.id,
          date: f.deadline!,
          title: `${f.source} deadline`,
          type: 'deadline',
          status: `${Math.round((spent / f.amount) * 100)}% spent`,
          overdue: isBefore(parseISO(f.deadline!), today),
        });
      });

    return all.sort((a, b) => a.date.localeCompare(b.date));
  }, [tasks, experiments, funding]);

  const filtered = events.filter((e) => {
    if (filter !== 'all' && e.type !== filter) return false;
    if (!showPast && isBefore(parseISO(e.date), today) && !isToday(parseISO(e.date))) return false;
    return true;
  });

  // Group by month
  const grouped = filtered.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const key = format(parseISO(event.date), 'MMMM yyyy');
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const monthKeys = Object.keys(grouped);

  const pastCount = events.filter(
    (e) => isBefore(parseISO(e.date), today) && !isToday(parseISO(e.date)),
  ).length;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-serif italic">Timeline</h1>
          <p className="text-zinc-500">
            {events.length} dated events across tasks, experiments, and grants
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {/* Type filter */}
          <div className="flex text-xs border border-zinc-200 rounded-lg overflow-hidden">
            {(['all', 'task', 'experiment', 'deadline'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 transition-colors capitalize',
                  filter === f ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50',
                )}
              >
                {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label}
              </button>
            ))}
          </div>
          {pastCount > 0 && (
            <button
              onClick={() => setShowPast((p) => !p)}
              className="text-xs text-zinc-400 hover:text-zinc-700 border border-zinc-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              {showPast ? 'Hide past' : `Show ${pastCount} past event${pastCount > 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </header>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* Today marker context */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-2.5">
        <Calendar size={13} className="text-zinc-400" />
        Today: <strong className="text-zinc-800">{format(today, 'EEEE, MMMM d, yyyy')}</strong>
        {filtered.filter((e) => isToday(parseISO(e.date))).length > 0 && (
          <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {filtered.filter((e) => isToday(parseISO(e.date))).length} event{filtered.filter((e) => isToday(parseISO(e.date))).length > 1 ? 's' : ''} today
          </span>
        )}
      </div>

      {/* Timeline */}
      {monthKeys.length > 0 ? (
        <div className="space-y-10">
          {monthKeys.map((monthKey) => {
            const monthEvents = grouped[monthKey];
            const monthDate = parseISO(monthEvents[0].date);
            const isPastMonth = isBefore(endOfMonth(monthDate), today);

            return (
              <div key={monthKey} className={cn('relative', isPastMonth && 'opacity-60')}>
                {/* Month header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="shrink-0 text-right w-32">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                      {format(monthDate, 'MMMM')}
                    </span>
                    <br />
                    <span className="text-2xl font-serif italic text-zinc-300">
                      {format(monthDate, 'yyyy')}
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-zinc-100" />
                </div>

                {/* Events for this month */}
                <div className="ml-40 space-y-2.5">
                  {monthEvents.map((event) => {
                    const cfg = TYPE_CONFIG[event.type];
                    const Icon = cfg.icon;
                    const daysAway = differenceInDays(parseISO(event.date), today);
                    const eventIsToday = isToday(parseISO(event.date));

                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        {/* Date column */}
                        <div className="w-20 shrink-0 text-right pt-0.5">
                          <span
                            className={cn(
                              'text-[10px] font-mono',
                              eventIsToday ? 'text-amber-600 font-bold' : 'text-zinc-400',
                            )}
                          >
                            {format(parseISO(event.date), 'MMM d')}
                          </span>
                          {eventIsToday && (
                            <span className="block text-[8px] font-bold uppercase tracking-wider text-amber-500">
                              today
                            </span>
                          )}
                          {!eventIsToday && !event.done && daysAway > 0 && (
                            <span className="block text-[8px] text-zinc-300">
                              {daysAway}d
                            </span>
                          )}
                        </div>

                        {/* Dot + line */}
                        <div className="flex flex-col items-center mt-1.5 shrink-0">
                          <div
                            className={cn(
                              'w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm',
                              event.done ? 'bg-zinc-300' : cfg.dot,
                              event.overdue && 'bg-red-500',
                              eventIsToday && 'ring-2 ring-offset-1 ring-amber-400',
                            )}
                          />
                        </div>

                        {/* Event card */}
                        <div
                          className={cn(
                            'flex-1 flex items-start gap-3 px-3 py-2 rounded-lg border text-sm transition-colors',
                            event.done ? 'bg-zinc-50 border-zinc-100 opacity-60' : cfg.color,
                            event.overdue && !event.done && 'bg-red-50 border-red-200 text-red-800',
                          )}
                        >
                          <Icon size={13} className="mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'font-medium leading-snug truncate',
                                event.done && 'line-through',
                              )}
                            >
                              {event.title}
                            </p>
                            <p className="text-[10px] mt-0.5 opacity-70 capitalize">{event.status}</p>
                          </div>
                          {event.overdue && !event.done && (
                            <span className="text-[10px] font-bold uppercase tracking-wider shrink-0 text-red-600">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-400 italic">
          {events.length === 0
            ? 'No dated events yet. Add due dates to tasks, dates to experiments, or deadlines to funding sources.'
            : 'No upcoming events. Toggle "Show past" to see history.'}
        </div>
      )}
    </div>
  );
};
