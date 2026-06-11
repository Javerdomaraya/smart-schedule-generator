import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Teacher, Room, Subject, ScheduleEntry, TimeSlot } from '../types';
import { calculateTeacherLoad } from '../utils/scheduler';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

interface DashboardChartsProps {
  teachers: Teacher[];
  rooms: Room[];
  subjects: Subject[];
  schedule: ScheduleEntry[];
  timeSlots: TimeSlot[];
  isDarkMode: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  teachers,
  rooms,
  subjects,
  schedule,
  timeSlots,
  isDarkMode,
}) => {
  const activeTimeSlotsCount = timeSlots.filter((ts) => !ts.isBreak).length;
  const maxWeeklyPeriods = activeTimeSlotsCount * 5; // 5 days a week

  // 1. Calculate Classroom Utilization Rates Across All Three Terms
  const classroomData = rooms.map((room) => {
    // Collect usage count for Term 1, Term 2, Term 3
    const t1Usage = schedule.filter((e) => e.roomId === room.id && e.term === 1).length;
    const t2Usage = schedule.filter((e) => e.roomId === room.id && e.term === 2).length;
    const t3Usage = schedule.filter((e) => e.roomId === room.id && e.term === 3).length;

    // Convert to percentage
    const t1Percent = maxWeeklyPeriods > 0 ? Math.round((t1Usage / maxWeeklyPeriods) * 100) : 0;
    const t2Percent = maxWeeklyPeriods > 0 ? Math.round((t2Usage / maxWeeklyPeriods) * 100) : 0;
    const t3Percent = maxWeeklyPeriods > 0 ? Math.round((t3Usage / maxWeeklyPeriods) * 100) : 0;

    return {
      name: room.name,
      'Term 1 %': Math.min(100, t1Percent),
      'Term 2 %': Math.min(100, t2Percent),
      'Term 3 %': Math.min(100, t3Percent),
    };
  });

  // 2. Calculate Teacher Workload Distribution Across All Three Terms
  const teacherData = teachers.map((teacher) => {
    const t1Load = calculateTeacherLoad(schedule, teacher.id, 1);
    const t2Load = calculateTeacherLoad(schedule, teacher.id, 2);
    const t3Load = calculateTeacherLoad(schedule, teacher.id, 3);
    const target = teacher.targetMinutes || 300;

    return {
      name: teacher.name.split(' ').pop() || teacher.name, // Last name to fit on axes
      'Term 1 min': t1Load,
      'Term 2 min': t2Load,
      'Term 3 min': t3Load,
      'Balanced Target': target,
    };
  });

  // Chart configuration parameters for lighting schemes
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const labelColor = isDarkMode ? '#94a3b8' : '#64748b';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#f8fafc' : '#0f172a';

  return (
    <div className={`rounded-2xl border p-6 space-y-8 print:hidden ${
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      
      {/* SECTION BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 border-slate-100 dark:border-slate-800">
        <div>
          <h3 className={`font-display font-black text-base flex items-center gap-2 ${
            isDarkMode ? 'text-slate-100' : 'text-slate-800'
          }`}>
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            School Capacity &amp; Resource Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics showcasing resource utilization indices and teaching staff loads compared across year semesters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider block">
            Recharts Engine Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* CHART 1: ROOMS INDEX BAR CHART */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDarkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50/50 border-slate-150'
        }`}>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-500 font-extrabold block">
              Facility Efficiency
            </span>
            <h4 className={`text-sm font-bold mt-0.5 ${
              isDarkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Classroom Utilization Rates (%)
            </h4>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Available periods utilised compared to Room default capacity limits. Useful for detecting class sizing issues.
            </p>
          </div>

          <div className="h-80 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classroomData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
                <YAxis stroke={labelColor} fontSize={10} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Term 1 %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Term 2 %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Term 3 %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: TEACHER WORKLOAD INDEX */}
        <div className={`p-5 rounded-2xl border space-y-4 ${
          isDarkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50/50 border-slate-150'
        }`}>
          <div>
            <span className="text-[9px] uppercase font-mono tracking-widest text-indigo-500 font-extrabold block">
              Balanced Deployment
            </span>
            <h4 className={`text-sm font-bold mt-0.5 ${
              isDarkMode ? 'text-slate-100' : 'text-slate-800'
            }`}>
              Teacher Workload Metrics (Minutes / Week)
            </h4>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Comparison of scheduled hours to target loading (balanced at 300 minutes per term). Ideal for reassigning stress loads.
            </p>
          </div>

          <div className="h-80 w-full text-xs font-semibold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={teacherData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorT1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
                <YAxis stroke={labelColor} fontSize={10} tickLine={false} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="Term 1 min" stroke="#4f46e5" fillOpacity={1} fill="url(#colorT1)" strokeWidth={2} />
                <Area type="monotone" dataKey="Term 2 min" stroke="#06b6d4" fillOpacity={0} strokeWidth={2} />
                <Area type="monotone" dataKey="Term 3 min" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                <Line type="monotone" dataKey="Balanced Target" stroke="#ef4444" strokeDasharray="4 4" dot={false} strokeWidth={1.5} name="Target Threshold" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className={`p-4 rounded-xl flex items-start gap-3 border ${
        isDarkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-indigo-50/30 border-indigo-100/50'
      }`}>
        <Info className={`h-4 w-4 shrink-0 mt-0.5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          <strong>Aesthetic Multi-term Assessment</strong>: Facility utilization levels exceeding 85% indicate potential congestion periods. Target staffing index balanced loading reduces educator burnout during critical year evaluations.
        </p>
      </div>

    </div>
  );
};
