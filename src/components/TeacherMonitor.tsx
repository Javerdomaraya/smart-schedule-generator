import React from 'react';
import { Teacher, ScheduleEntry, Subject } from '../types';
import { calculateTeacherLoad } from '../utils/scheduler';
import { Activity, Clock, AlertCircle } from 'lucide-react';

interface TeacherMonitorProps {
  teachers: Teacher[];
  schedule: ScheduleEntry[];
  subjects: Subject[];
  term: 1 | 2 | 3;
}

export const TeacherMonitor: React.FC<TeacherMonitorProps> = ({
  teachers,
  schedule,
  subjects,
  term,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 print:hidden transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-500" />
          Teacher Loading Monitor
        </h3>
        <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/60 px-2 py-1 rounded">
          Term {term} Status
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teachers.map((teacher) => {
          const loadMinutes = calculateTeacherLoad(schedule, teacher.id, term);
          const target = teacher.targetMinutes || 300;
          const percent = Math.min(100, Math.round((loadMinutes / target) * 100));

          // Determine load status and colors
          let statusText = 'Balanced';
          let statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/20 dark:border-emerald-900/60';
          let barBg = 'bg-emerald-500';

          if (loadMinutes < 180) {
            statusText = 'Underload';
            statusColor = 'text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-950/20 dark:border-blue-900/60';
            barBg = 'bg-blue-400';
          } else if (loadMinutes > 360) {
            statusText = 'Overload';
            statusColor = 'text-red-600 bg-red-50 border-red-100 dark:text-red-400 dark:bg-red-950/20 dark:border-red-900/60';
            barBg = 'bg-red-500';
          }

          const teacherSubjects = subjects.filter((s) => teacher.subjects.includes(s.id));

          return (
            <div
              key={teacher.id}
              className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-850 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-200">{teacher.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {teacherSubjects.map((sub) => (
                      <span
                        key={sub.id}
                        className="text-[9px] font-mono px-1 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-800"
                      >
                        {sub.code}
                      </span>
                    ))}
                  </div>
                </div>

                <span
                  className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusColor}`}
                >
                  {statusText}
                </span>
              </div>

              {/* Progress Bar & Calculated Load */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mb-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {loadMinutes} min / week
                  </span>
                  <span>{percent}% of target</span>
                </div>

                {/* Progress bar background */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${barBg} transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
          Blue: Underload (&lt; 180m)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
          Green: Balanced (180m - 360m)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
          Red: Overload (&gt; 360m)
        </span>
      </div>
    </div>
  );
};
