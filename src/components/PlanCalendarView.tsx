import { useState, useMemo } from 'react';
import { addDays, startOfWeek, format, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Target, CheckCircle2 } from 'lucide-react';
import type { Plan } from '@/lib/types';

interface Props {
  plan: Plan;
}

export default function PlanCalendarView({ plan }: Props) {
  const planStart = useMemo(() => new Date(plan.createdAt), [plan.createdAt]);
  const [currentMonth, setCurrentMonth] = useState(planStart);

  // Map each plan week to a date range (7 days per week starting from plan creation)
  const weekRanges = useMemo(() => {
    return plan.weeks.map((week) => {
      const start = addDays(planStart, (week.weekNumber - 1) * 7);
      const end = addDays(start, 6);
      return { week, start, end };
    });
  }, [plan.weeks, planStart]);

  // Build calendar grid for the current month
  const calendarDays = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const gridStart = startOfWeek(monthStart);
    const days: Date[] = [];
    let day = gridStart;
    while (day <= monthEnd || days.length % 7 !== 0) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const getWeekForDay = (day: Date) => {
    return weekRanges.find(
      (wr) => day >= wr.start && day <= wr.end
    );
  };

  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const selectedWeekData = selectedDay ? getWeekForDay(selectedDay) : null;

  // Color palette for weeks
  const weekColors = [
    'bg-primary/10 border-primary/30',
    'bg-accent border-accent-foreground/10',
    'bg-secondary border-secondary-foreground/10',
    'bg-muted border-muted-foreground/10',
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold text-card-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const weekData = getWeekForDay(day);
            const isToday = isSameDay(day, today);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const colorIdx = weekData ? (weekData.week.weekNumber - 1) % weekColors.length : -1;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`
                  relative h-16 border-b border-r border-border p-1 text-left transition-colors
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                  ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}
                  ${weekData ? weekColors[colorIdx] : 'hover:bg-secondary/50'}
                `}
              >
                <span className={`
                  text-xs font-medium
                  ${isToday ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : 'text-card-foreground'}
                `}>
                  {format(day, 'd')}
                </span>
                {weekData && isSameDay(day, weekData.start) && (
                  <span className="absolute bottom-1 left-1 text-[9px] font-medium text-primary truncate max-w-[calc(100%-8px)]">
                    W{weekData.week.weekNumber}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected week detail panel */}
      {selectedWeekData ? (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">
              Week {selectedWeekData.week.weekNumber}: {selectedWeekData.week.focus}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(selectedWeekData.start, 'MMM d')} – {format(selectedWeekData.end, 'MMM d, yyyy')}
          </p>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</h4>
            <ul className="space-y-1.5">
              {selectedWeekData.week.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
          {selectedWeekData.week.milestones.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">🎯 {selectedWeekData.week.milestones[0]}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5 text-center text-sm text-muted-foreground">
          Click a day to see that week's plan details.
        </div>
      )}
    </div>
  );
}
