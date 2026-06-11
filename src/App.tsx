import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useUser } from './context/UserContext';
import {
  initialTeachers,
  initialRooms,
  initialSections,
  initialSubjects,
  initialTimeSlots,
  getPrepopulatedSchedule,
} from './data/initialData';
import {
  validateSchedule,
  autoBuildSchedule,
  resolveConflictsInPlace,
  calculateTeacherLoad,
} from './utils/scheduler';
import { Teacher, Room, Section, Subject, ScheduleEntry, Conflict } from './types';

// Component Imports
import { ConflictBanner } from './components/ConflictBanner';
import { TeacherMonitor } from './components/TeacherMonitor';
import { IndividualProgram } from './components/IndividualProgram';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { MasterScheduleMatrix } from './components/MasterScheduleMatrix';
import { DashboardCharts } from './components/DashboardCharts';

// Custom Hooks
import { useTheme } from './hooks/useTheme';

import {
  School,
  Calendar,
  Settings,
  GraduationCap,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ListRestart,
  Play,
  Pause,
  Search,
  Bell,
  HelpCircle,
  LayoutDashboard,
  Timer,
  PieChart,
  Users,
  MapPin,
  ClipboardList,
  ChevronRight,
  Plus,
  ArrowRight,
  CornerDownRight,
  BookOpen,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const { role, setRole, teacherId, setTeacherId } = useUser();
  // Global Dark Mode state via custom useTheme hook
  const { isDarkMode, toggleTheme } = useTheme();

  // Notifications state
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'info' | 'warning';
    title: string;
    description: string;
    time: string;
    read: boolean;
  }>>([
    {
      id: 'n-1',
      type: 'success',
      title: 'Database Initialized',
      description: 'App loaded successfully. All 85 classroom hours and teacher data are loaded in active memory.',
      time: 'Just now',
      read: false,
    },
    {
      id: 'n-2',
      type: 'info',
      title: 'Dynamic Conflict Watcher',
      description: 'The real-time validator is running. Any room/instructor clashes will compile in this list automatically.',
      time: '1 min ago',
      read: false,
    },
    {
      id: 'n-3',
      type: 'success',
      title: 'LocalStorage Sync Enabled',
      description: 'Ctrl+S standard database override caches all operations in real-time.',
      time: '5 mins ago',
      read: true,
    }
  ]);

  const addNotification = (type: 'success' | 'info' | 'warning', title: string, description: string) => {
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}`,
        type,
        title,
        description,
        time: 'Just now',
        read: false,
      },
      ...prev,
    ]);
  };

  const [showNotifications, setShowNotifications] = useState(false);
  const [acknowledgedConflictIds, setAcknowledgedConflictIds] = useState<string[]>([]);
  const [showHelpDocs, setShowHelpDocs] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<'overview' | 'matrix' | 'shortcuts' | 'deped'>('overview');

  // Undo / Redo History Stack
  const [history, setHistory] = useState<ScheduleEntry[][]>([]);

  const pushToHistory = (curr: ScheduleEntry[]) => {
    setHistory((prev) => [...prev.slice(-39), [...curr]]);
  };

  const handleUndo = (): boolean => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((p) => p.slice(0, p.length - 1));
      setSchedule(prev);
      return true;
    }
    return false;
  };

  const [activeTab, setActiveTab] = useState<'matrix' | 'print' | 'config'>('matrix');
  const [activeTerm, setActiveTerm] = useState<1 | 2 | 3>(1);

  // Core schedules and database parameters state
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  // Local loading UI state for smart operations
  const [isSolverLoading, setIsSolverLoading] = useState(false);

  // Hubstaff layout timer state
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(9855); // Starting from 02:44:15 equivalent

  // Global search input query
  const [searchQuery, setSearchQuery] = useState('');

  // Modal selector for top "Add a schedule" button
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [formSectionId, setFormSectionId] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formTeacherId, setFormTeacherId] = useState('');
  const [formRoomId, setFormRoomId] = useState('');
  const [formDay, setFormDay] = useState<ScheduleEntry['day']>('Monday');
  const [formSlotId, setFormSlotId] = useState('');

  // 1. Core data initialisation and localStorage backup
  useEffect(() => {
    const savedSchedule = localStorage.getItem('deped_schedule');
    const savedTeachers = localStorage.getItem('deped_teachers');
    const savedRooms = localStorage.getItem('deped_rooms');
    const savedSections = localStorage.getItem('deped_sections');
    const savedSubjects = localStorage.getItem('deped_subjects');

    if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
    else setSchedule(getPrepopulatedSchedule());

    if (savedTeachers) setTeachers(JSON.parse(savedTeachers));
    else setTeachers(initialTeachers);

    if (savedRooms) setRooms(JSON.parse(savedRooms));
    else setRooms(initialRooms);

    if (savedSections) setSections(JSON.parse(savedSections));
    else setSections(initialSections);

    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    else setSubjects(initialSubjects);
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    if (schedule.length > 0) localStorage.setItem('deped_schedule', JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    if (teachers.length > 0) localStorage.setItem('deped_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    if (rooms.length > 0) localStorage.setItem('deped_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    if (sections.length > 0) localStorage.setItem('deped_sections', JSON.stringify(sections));
  }, [sections]);

  useEffect(() => {
    if (subjects.length > 0) localStorage.setItem('deped_subjects', JSON.stringify(subjects));
  }, [subjects]);

  // Global Keyboard Shortcuts Event Handler
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ignore if focus is in a form inputs
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      )) {
        return;
      }

      // 1. Ctrl + Z / Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const success = handleUndo();
        // Create an on-the-fly feedback toast
        const toast = document.createElement('div');
        if (success) {
          toast.className = "fixed bottom-5 right-5 z-50 bg-indigo-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-2xl border border-indigo-400 font-mono tracking-tight flex items-center gap-2 animate-bounce";
          toast.innerHTML = `↩️ UNDO SUCCESSFUL — ALIGNMENT RESTORED`;
        } else {
          toast.className = "fixed bottom-5 right-5 z-50 bg-amber-600 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-lg border border-amber-500 font-mono flex items-center gap-2";
          toast.innerHTML = `⚠️ NO TRANSACTIONS FOUND TO UNDO`;
        }
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
          setTimeout(() => toast.remove(), 550);
        }, 2200);
        return;
      }

      // 2. Ctrl + S / Cmd + S (Force Save Database)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        localStorage.setItem('deped_schedule', JSON.stringify(schedule));
        localStorage.setItem('deped_teachers', JSON.stringify(teachers));
        localStorage.setItem('deped_rooms', JSON.stringify(rooms));
        localStorage.setItem('deped_sections', JSON.stringify(sections));
        localStorage.setItem('deped_subjects', JSON.stringify(subjects));

        const toast = document.createElement('div');
        toast.className = "fixed bottom-5 right-5 z-50 bg-emerald-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-2xl border border-emerald-400 font-mono tracking-tight flex items-center gap-2 animate-bounce";
        toast.innerHTML = `🌟 DATABASE SAVED BACKED-UP TO STORAGE`;
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
          setTimeout(() => toast.remove(), 550);
        }, 2200);
        return;
      }

      // 3. Forward Arrows and special cell coordinates keys to the matrix
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Backspace', 'Delete'].includes(e.key)) {
        window.dispatchEvent(new CustomEvent('matrix-arrow-navigation', { detail: { key: e.key } }));
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [schedule, teachers, rooms, sections, subjects, history]);

  // Runner clock ticking (Hubstaff status bar equivalent)
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute validation conflicts for active term
  const conflicts = validateSchedule(schedule, activeTerm, teachers, rooms, sections, subjects);

  // Filter sections dynamically based on searchQuery
  const filteredSections = sections.filter(sec => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    
    // 1. Match section name (e.g. "G7-Diamond", "G7-Emerald")
    if (sec.name.toLowerCase().includes(query)) return true;
    
    // 2. Match grade level directly (e.g. "Grade 7", "g7", or just "7")
    const gradeString = `grade ${sec.gradeLevel}`;
    const gGradeString = `g${sec.gradeLevel}`;
    if (gradeString.includes(query) || gGradeString.includes(query) || sec.gradeLevel.toString() === query) return true;
    
    // 3. Match advisor name
    const advisor = teachers.find(t => t.id === sec.advisorId);
    if (advisor && advisor.name.toLowerCase().includes(query)) return true;
    
    // 4. Match scheduled entries (e.g. teacher, room, or subject scheduled under this section)
    const hasMatchingScheduledPeriod = schedule.some(entry => {
      if (entry.sectionId !== sec.id || entry.term !== activeTerm) return false;
      const t = teachers.find(teacher => teacher.id === entry.teacherId);
      const r = rooms.find(room => room.id === entry.roomId);
      const s = subjects.find(subject => subject.id === entry.subjectId);
      return (
        (t && t.name.toLowerCase().includes(query)) ||
        (r && r.name.toLowerCase().includes(query)) ||
        (s && (s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)))
      );
    });
    
    return hasMatchingScheduledPeriod;
  });

  // Total active assigned hours stats
  const activeEntriesCount = schedule.filter((e) => e.term === activeTerm).length;

  // Real-time conflict solver trigger
  const handleResolveConflicts = () => {
    setIsSolverLoading(true);
    pushToHistory(schedule);
    setTimeout(() => {
      const fixed = resolveConflictsInPlace(
        schedule,
        activeTerm,
        teachers,
        rooms,
        sections,
        subjects,
        initialTimeSlots
      );
      setSchedule(fixed);
      setIsSolverLoading(false);
    }, 400);
  };

  // Auto builder trigger (schedule completely generated for active grade sections)
  const handleAutoGenerate = () => {
    setIsSolverLoading(true);
    pushToHistory(schedule);
    setTimeout(() => {
      const generated = autoBuildSchedule(
        schedule,
        activeTerm,
        teachers,
        rooms,
        sections,
        subjects,
        initialTimeSlots
      );
      setSchedule(generated);
      setIsSolverLoading(false);
    }, 600);
  };

  // Reset core database to pristine initial settings
  const handleFullReset = () => {
    if (confirm('Are you certain you wish to reset all timetables and schedule databases back to the school default values?')) {
      localStorage.clear();
      setSchedule(getPrepopulatedSchedule());
      setTeachers(initialTeachers);
      setRooms(initialRooms);
      setSections(initialSections);
      setSubjects(initialSubjects);
    }
  };

  // Matrix cell CRUD overrides
  const handleUpdateEntry = (entry: ScheduleEntry) => {
    pushToHistory(schedule);
    const existingIdx = schedule.findIndex((e) => e.id === entry.id);
    if (existingIdx !== -1) {
      const updated = [...schedule];
      updated[existingIdx] = entry;
      setSchedule(updated);
    } else {
      setSchedule([...schedule, entry]);
    }
  };

  const handleRemoveEntryByCell = (day: string, slotId: string, sectionId: string) => {
    pushToHistory(schedule);
    const filtered = schedule.filter(
      (e) => !(e.term === activeTerm && e.day === day && e.timeSlotId === slotId && e.sectionId === sectionId)
    );
    setSchedule(filtered);
  };

  // Handle direct creation from "+ Add a schedule" hubstaff styled modal
  const handleDirectAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSectionId || !formSubjectId || !formTeacherId || !formRoomId || !formSlotId) {
      alert('Please fill out all schedule parameters.');
      return;
    }

    const newEntry: ScheduleEntry = {
      id: `se-${formSectionId}-${formDay}-${formSlotId}-${activeTerm}-${Date.now()}`,
      term: activeTerm,
      day: formDay,
      timeSlotId: formSlotId,
      sectionId: formSectionId,
      subjectId: formSubjectId,
      teacherId: formTeacherId,
      roomId: formRoomId,
    };

    handleUpdateEntry(newEntry);
    setShowAddScheduleModal(false);
    // Reset fields
    setFormSectionId('');
    setFormSubjectId('');
    setFormTeacherId('');
    setFormRoomId('');
    setFormSlotId('');
  };

  // Watch selected section to default subject and room
  useEffect(() => {
    if (formSectionId) {
      const sec = sections.find(s => s.id === formSectionId);
      if (sec) {
        setFormRoomId(sec.classroomId);
        const matchedSub = subjects.find(sub => sub.gradeLevel === sec.gradeLevel);
        if (matchedSub) {
          setFormSubjectId(matchedSub.id);
        }
      }
    }
  }, [formSectionId]);

  // Watch selected subject to auto find first qualified teacher
  useEffect(() => {
    if (formSubjectId) {
      const qualified = teachers.find(t => t.subjects.includes(formSubjectId));
      if (qualified) {
        setFormTeacherId(qualified.id);
      }
    }
  }, [formSubjectId]);

  const userInitials = 'JD';
  const userName = 'Javer Domaraya';
  const userTitle = 'System Administrator';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">

      {/* HUBSTAFF-STYLE TOP NAVIGATION HEADER (Fidelity Mockup) */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 print:hidden shadow-sm px-6 py-2.5 flex items-center justify-between transition-colors duration-200">
        
        {/* Left Side: Brand Logo and Live tracking clock */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold tracking-tighter text-sm">
              S
            </div>
            <span className="font-display font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">
              Scheduler<span className="text-indigo-650 dark:text-indigo-400 font-normal">Hub</span>
            </span>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

          {/* Running Clock Ticker representing productive session length */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)} 
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-850 focus:outline-none"
              title={isTimerRunning ? "Pause tracking" : "Start tracking"}
            >
              {isTimerRunning ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400"></span>
                </span>
              ) : (
                <Play className="h-3 w-3 fill-indigo-600 dark:fill-indigo-400 text-indigo-600 dark:text-indigo-400" />
              )}
            </button>
            <span className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-300 tracking-tight">
              {formatTimer(timerSeconds)}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest hidden md:inline">
              LIVE SYSTEM TIME
            </span>
          </div>
        </div>

        {/* Center/Right: Quick Search bar, Notifications, Avatar Profile */}
        <div className="flex items-center gap-4">
          <div className="relative hidden md:inline-block">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections, teachers, conflicts..."
              className="pl-9 pr-10 py-1.5 w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Notifications Trigger & Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowHelpDocs(false);
              }}
              className={`p-1.5 rounded-lg transition relative cursor-pointer ${
                showNotifications
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
              }`}
              title="System Alerts & Dynamic Conflicts"
            >
              <Bell className="h-4 w-4" />
              {((conflicts.filter(c => !acknowledgedConflictIds.includes(c.id)).length > 0 || notifications.some(n => !n.read)) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-slate-900 border border-red-300 animate-pulse"></span>
              ))}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  {/* Invisible backdrop to dismiss dropdown */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden text-left"
                  >
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-indigo-650 dark:text-indigo-400" />
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">System Alerts & Logs</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setNotifications(p => p.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Real-time scheduling conflicts (Highest Priority) */}
                      {conflicts.filter(c => !acknowledgedConflictIds.includes(c.id)).map((conflict) => (
                        <div
                          key={`alert-conflict-${conflict.id}`}
                          className="p-3 bg-rose-50/50 dark:bg-rose-950/10 border-l-4 border-l-rose-500 flex justify-between gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                          onClick={() => {
                            setActiveTab('matrix');
                            setShowNotifications(false);
                          }}
                        >
                          <div className="flex gap-2.5">
                            <AlertTriangle className="h-4 w-4 text-rose-550 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 text-left">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono tracking-wider font-extrabold px-1.5 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded uppercase">
                                  Conflict Alert
                                </span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono">Real-time</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono">• Active</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-850 dark:text-slate-150">{conflict.title}</h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{conflict.description}</p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAcknowledgedConflictIds((prev) => [...prev, conflict.id]);
                              addNotification('success', 'Conflict Acknowledged', `Acknowledged conflict: ${conflict.title}`);
                            }}
                            className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 self-center cursor-pointer"
                            title="Dismiss conflict alert"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}

                      {/* Custom notifications */}
                      {notifications.map((item) => (
                        <div
                          key={`alert-note-${item.id}`}
                          className={`p-3 flex gap-2.5 transition relative hover:bg-slate-50 dark:hover:bg-slate-855/20 cursor-pointer ${
                            !item.read ? 'bg-indigo-50/10 dark:bg-indigo-950/10' : ''
                          }`}
                          onClick={() => {
                            setNotifications(p => p.map(n => n.id === item.id ? { ...n, read: true } : n));
                          }}
                        >
                          {!item.read && (
                            <span className="absolute top-4 right-3 h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>
                          )}
                          <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${
                            item.type === 'success' ? 'text-emerald-550' : 'text-blue-500'
                          }`} />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono tracking-wider font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                item.type === 'success'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                              }`}>
                                {item.type}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold font-mono">{item.time}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">{item.description}</p>
                          </div>
                        </div>
                      ))}

                      {conflicts.length === 0 && notifications.length === 0 && (
                        <div className="p-8 text-center space-y-2">
                          <CheckCircle2 className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-500 font-medium">Workspace holds 0 active alerts.</p>
                        </div>
                      )}
                    </div>

                    <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[9px] uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 font-bold">
                        SYSTEM INTEGRITY: {conflicts.length > 0 ? `${100 - conflicts.length * 10}% OK` : '100% SECURE'}
                      </span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Help Docs Button */}
          <button
            onClick={() => {
              setShowHelpDocs(true);
              setShowNotifications(false);
            }}
            className={`p-1.5 rounded-lg text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
              showHelpDocs ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400' : ''
            }`}
            title="Help docs"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition"
            title={isDarkMode ? "Switch to high-contrast Light mode" : "Switch to late-night Dark mode"}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-slate-500" />
            )}
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

          {/* User profile dropdown info */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs flex items-center justify-center shadow-xs">
              {userInitials}
            </div>
            <div className="text-left hidden lg:inline-block">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{userName}</span>
              <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500 font-bold">{userTitle}</span>
            </div>
          </div>
        </div>

      </header>

      {/* THREE-COLUMN BENTO WRAPPER */}
      <div className="flex-grow flex flex-col md:flex-row print:block">
        
        {/* LEFT COLUMN: HUBSTAFF INTEGRAL SIDEBAR (Interactive Switcher) */}
        <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 space-y-6 print:hidden transition-colors duration-200">
          
          <div className="space-y-1.5">
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 dark:text-slate-500 font-bold block px-2">
              Main Operations
            </span>
            
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-bold tracking-tight transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-l-4 border-l-indigo-650 dark:border-l-indigo-500 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="h-4 w-4 shrink-0" />
                  <span>Schedules Grid</span>
                </div>
                {conflicts.length > 0 && activeTab !== 'matrix' && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('print')}
                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-bold tracking-tight transition-all ${
                  activeTab === 'print'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-l-4 border-l-indigo-650 dark:border-l-indigo-500 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Official Programs</span>
                </div>
              </button>

              {role === 'ADMIN' && (
                <button
                  onClick={() => setActiveTab('config')}
                  className={`w-full flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-bold tracking-tight transition-all ${
                    activeTab === 'config'
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-l-4 border-l-indigo-650 dark:border-l-indigo-500 font-black'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4 shrink-0" />
                    <span>Core Databases</span>
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* SCHOOL METADATA SLATE */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-150 dark:border-slate-800 space-y-2">
            <span className="text-[8px] uppercase tracking-widest font-mono text-slate-400 dark:text-slate-500 font-extrabold block">
              High School Context
            </span>
            <div className="space-y-1">
              <span className="block font-bold text-[11px] text-slate-700 dark:text-slate-300 leading-none">
                Eastern Biliran HS
              </span>
              <span className="block text-[9px] text-slate-400 dark:text-slate-505">
                Department of Education VIII
              </span>
            </div>
            
            {/* Term selector tabs (1, 2, 3) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 mt-2">
              <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase block font-mono mb-1">
                Active Year Term
              </label>
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-150-inset dark:border-slate-755">
                {([1, 2, 3] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTerm(t)}
                    className={`flex-1 py-1 text-center rounded-md text-[10px] font-extrabold font-mono transition ${
                      activeTerm === t
                        ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-600'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    T{t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EXTRA MOCK STATISTICS */}
          <div className="pt-2">
            <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 dark:text-slate-505 font-bold block px-2 mb-2">
              School Analytics
            </span>
            <div className="space-y-2.5 px-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full"></span> Load density
                </span>
                <span className="font-extrabold font-mono">81.5%</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span> Validation checks
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">Passed</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 leading-none">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full"></span> Unresolved conflicts
                </span>
                <span className={`font-extrabold font-mono ${conflicts.length > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-slate-400 dark:text-slate-505'}`}>
                  {conflicts.length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-8 text-center">
            <button
              onClick={handleFullReset}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-[10px] uppercase font-mono tracking-wider text-red-600 hover:text-red-500 rounded-xl border border-dashed border-red-200 dark:border-red-900/60 transition-all cursor-pointer"
            >
              <ListRestart className="h-3.5 w-3.5" />
              Reset All Progress
            </button>
          </div>

        </aside>

        {/* RIGHT COLUMN: WORKSPACE CONTENT */}
        <section className="flex-grow p-6 space-y-6 max-w-7xl w-full mx-auto overflow-hidden">
          
          {/* THE SUB-HEADER HERO STRIP (Directly mimicking Hubstaff header context) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 transition-colors duration-200">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500 font-extrabold">
                MASTER SCHEDULE AREA
              </span>
              <h2 className="font-display font-black tracking-tight text-slate-800 dark:text-slate-100 text-2xl mt-0.5">
                {activeTab === 'matrix' ? 'Schedules Calendar' : activeTab === 'print' ? 'Programs Sheet' : 'Core Databases'}
              </h2>
            </div>

            {/* Right actions: Today context block & blue drop 'Add a schedule' trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                Term Phase {activeTerm} of 3
              </span>
              
              <button
                onClick={() => setShowAddScheduleModal(true)}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add a schedule
              </button>
            </div>
          </div>

          {/* Real-time Conflict validation notifications */}
          {activeTab !== 'config' && (
            <ConflictBanner
              conflicts={conflicts}
              onSolveConflicts={handleResolveConflicts}
              onAutoGenerate={handleAutoGenerate}
              isLoading={isSolverLoading}
            />
          )}

          {/* Dynamic Views switcher */}
          {activeTab === 'matrix' && (
            <div className="space-y-6 pb-12 animate-in fade-in duration-200">
              {role === 'TEACHER' && (() => {
                const simulatedTeacher = teachers.find(t => t.id === teacherId);
                const minutes = simulatedTeacher ? calculateTeacherLoad(schedule, simulatedTeacher.id, activeTerm) : 0;
                const hours = (minutes / 60).toFixed(1);
                const percent = Math.min(100, (minutes / 1800) * 100); // DepEd limit is 1800 weekly mins
                return (
                  <div className="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 dark:from-slate-900/60 dark:to-slate-950/60 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-950/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-250 shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                        <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-700 dark:text-indigo-400 font-extrabold">Simulated Active Profile Load</span>
                      </div>
                      <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                        {simulatedTeacher ? simulatedTeacher.name : 'Simulated Instructor'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Department of Education • Junior High School Division VII
                      </p>
                    </div>

                    <div className="w-full md:w-80 space-y-2">
                      <div className="flex justify-between items-end text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-350">Weekly Teaching Load:</span>
                        <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">
                          {minutes} mins / {hours} hrs <span className="text-indigo-600 dark:text-indigo-400 font-black">({percent.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent > 90 ? 'bg-amber-500' : percent === 0 ? 'bg-slate-300' : 'bg-indigo-650 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Min (0 mins)</span>
                        <span className="font-semibold text-slate-500 dark:text-slate-400">Standard DepEd Limit (1,800 mins/week)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <MasterScheduleMatrix
                role={role}
                teachers={teachers}
                rooms={rooms}
                sections={filteredSections}
                subjects={subjects}
                timeSlots={initialTimeSlots}
                schedule={schedule}
                conflicts={conflicts}
                activeTerm={activeTerm}
                onUpdateEntry={handleUpdateEntry}
                onRemoveEntryByCell={handleRemoveEntryByCell}
                onUndo={handleUndo}
              />

              {/* Dashboard Loading monitor (ADMIN ONLY to preserve full school stats confidentiality) */}
              {role === 'ADMIN' && (
                <TeacherMonitor
                  teachers={teachers}
                  schedule={schedule}
                  subjects={subjects}
                  term={activeTerm}
                />
              )}

              {/* Dashboard classroom utilization & workload analytics (ADMIN ONLY to preserve full school analytics confidentiality) */}
              {role === 'ADMIN' && (
                <DashboardCharts
                  teachers={teachers}
                  rooms={rooms}
                  subjects={subjects}
                  schedule={schedule}
                  timeSlots={initialTimeSlots}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          )}

          {activeTab === 'print' && (
            <div className="pb-12 animate-in fade-in duration-200">
              <IndividualProgram
                teachers={teachers}
                rooms={rooms}
                sections={sections}
                subjects={subjects}
                timeSlots={initialTimeSlots}
                schedule={schedule}
                activeTerm={activeTerm}
              />
            </div>
          )}

          {activeTab === 'config' && (
            <div className="pb-12 animate-in fade-in duration-200">
              <ConfigurationPanel
                teachers={teachers}
                rooms={rooms}
                sections={sections}
                subjects={subjects}
                onAddTeacher={(t) => setTeachers([...teachers, t])}
                onDeleteTeacher={(id) => setTeachers(teachers.filter((x) => x.id !== id))}
                onAddRoom={(r) => setRooms([...rooms, r])}
                onDeleteRoom={(id) => setRooms(rooms.filter((x) => x.id !== id))}
                onAddSection={(s) => setSections([...sections, s])}
                onDeleteSection={(id) => setSections(sections.filter((x) => x.id !== id))}
                onAddSubject={(s) => setSubjects([...subjects, s])}
                onDeleteSubject={(id) => setSubjects(subjects.filter((x) => x.id !== id))}
              />
            </div>
          )}

        </section>

      </div>

      {/* FOOTER (Hidden during print) */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 text-center print:hidden transition-colors duration-200">
        <p>Smart School Scheduler System • Department of Education Region VIII Division of Biliran</p>
        <p className="mt-1 text-slate-300 dark:text-slate-650">Formulating optimal learning environments via clean, responsive data solutions.</p>
      </footer>

      {/* QUICK ADD SCHEDULER MODAL (Corresponds to 'Add a schedule' blue button in top-right of Hubstaff screenshot) */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/40">
              <div>
                <h3 className="font-display font-black text-slate-800 text-sm">
                  Add custom scheduled slot
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  CREATING ENTRY • TERM {activeTerm}
                </p>
              </div>
              <button 
                onClick={() => setShowAddScheduleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDirectAddSchedule} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide text-[9px] font-mono mb-1">
                    Select Section
                  </label>
                  <select
                    value={formSectionId}
                    onChange={(e) => setFormSectionId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Choose Section --</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Grade {s.gradeLevel})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide text-[9px] font-mono mb-1">
                    Select Subject
                  </label>
                  <select
                    value={formSubjectId}
                    disabled={!formSectionId}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50"
                  >
                    <option value="">-- Select --</option>
                    {formSectionId && subjects
                      .filter(s => s.gradeLevel === sections.find(i => i.id === formSectionId)?.gradeLevel)
                      .map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide text-[9px] font-mono mb-1">
                    Assigned Teacher
                  </label>
                  <select
                    value={formTeacherId}
                    disabled={!formSubjectId}
                    onChange={(e) => setFormTeacherId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-50"
                  >
                    <option value="">-- Select --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide text-[9px] font-mono mb-1">
                    Room Allocation
                  </label>
                  <select
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Room --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide text-[9px] font-mono mb-1">
                    Scheduled Day
                  </label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as any)}
                    required
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase tracking-wide text-[9px] font-mono mb-1">
                    Target Time Slot
                  </label>
                  <select
                    value={formSlotId}
                    onChange={(e) => setFormSlotId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Slot --</option>
                    {initialTimeSlots.filter(t => !t.isBreak).map(ts => (
                      <option key={ts.id} value={ts.id}>{ts.startTime} - {ts.endTime} ({ts.id.replace('ts-', 'Period ')})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddScheduleModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" /> Save Schedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* SYSTEM DOCUMENTATION & HELP CENTER MODAL */}
      {showHelpDocs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-850 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/30 dark:bg-indigo-950/20 shrink-0">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="h-5 w-5 text-indigo-650 dark:text-indigo-400" />
                <div>
                  <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">
                    Smart Scheduler Documentation
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-405 font-mono mt-0.5 uppercase tracking-wide">
                    SYSTEM MANUAL • VERSION 2.4.0
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHelpDocs(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-2 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveHelpTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-tight transition cursor-pointer ${
                  activeHelpTab === 'overview'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-450 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveHelpTab('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-tight transition cursor-pointer ${
                  activeHelpTab === 'matrix'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-450 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Grid & Hover Dimming
              </button>
              <button
                type="button"
                onClick={() => setActiveHelpTab('shortcuts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-tight transition cursor-pointer ${
                  activeHelpTab === 'shortcuts'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-450 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Keyboard Control
              </button>
              <button
                type="button"
                onClick={() => setActiveHelpTab('deped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-tight transition cursor-pointer ${
                  activeHelpTab === 'deped'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-450 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                DepEd Formulas
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto text-xs space-y-4 leading-relaxed text-slate-600 dark:text-slate-350">
              {activeHelpTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl">
                    <h4 className="font-bold text-slate-850 dark:text-slate-150 text-xs flex items-center gap-1.5">
                      🏫 Welcome to the Smart School Scheduler
                    </h4>
                    <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      This application streamlines the administration and scheduling of Junior High Schools (Grades 7 to 10). It provides automated conflict resolution algorithms, interactive drag-and-drop matrices, structured teacher monitor reports, and instant CSV uploads/PDF reports.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border border-slate-150 dark:border-slate-800 rounded-xl space-y-1">
                      <h5 className="font-bold text-slate-800 dark:text-slate-200">🔍 Real-time Conflict Auditing</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">The system automatically flags scheduling over-allocations, e.g., if a teacher is double-booked or a room exceeds maximum accommodation metrics.</p>
                    </div>
                    <div className="p-3 border border-slate-105 dark:border-slate-800 rounded-xl space-y-1">
                      <h5 className="font-bold text-slate-870 dark:text-slate-200">📤 Instant Official Programs</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Switch to the "Official Programs" tab to download paginated PDF files containing customized individual teacher timetables.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeHelpTab === 'matrix' && (
                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">🎮 Drag & Drop Plus Advanced Focus Modes</h4>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-850">
                      <span className="font-bold text-slate-850 dark:text-slate-150 text-[11px] block">🎨 High-Contrast Hover Dimming</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        When you hover over any occupied block in the matrix, the system actively highlights all other related periods (matching instructor, section, or classroom) and dynamically dims unrelated cells. This acts as an eye-safe focus buffer designed for complex schedules.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-850">
                      <span className="font-bold text-slate-850 dark:text-slate-150 text-[11px] block">🖱️ Double-Click Allocation</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Select a coordinate block in the active grid and click to trigger the Quick Allocation popover. From there, select teachers, topics, and rooms to instantly bind them together.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeHelpTab === 'shortcuts' && (
                <div className="space-y-3">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">⌨️ High-Speed Keybindings</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Designed for heavy-duty schedulers who prefer to work without touching the mouse. Bindings are globally tracked across all tabs:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-350">Undo Transaction</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">Ctrl + Z</kbd>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-350">Save & Backup Cache</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">Ctrl + S</kbd>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-350">Grid Navigation</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">Arrow Keys</kbd>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-350">Quick Edit Selected Coordinate</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">Enter</kbd>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-350">Discard Cell Content</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">Backspace</kbd>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-350">De-focus Grid Cursor</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-xs">ESC</kbd>
                    </div>
                  </div>
                </div>
              )}

              {activeHelpTab === 'deped' && (
                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs">🇵🇭 DepEd JHS Curriculum Standard Parameters</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Complies strictly with Junior High School weekly instructional loads calculated under administrative guidelines:
                  </p>
                  
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#f8fafc] dark:bg-slate-900 font-mono text-[10px] uppercase font-bold text-slate-500 border-b border-slate-150 dark:border-slate-805">
                        <tr>
                          <th className="p-2.5">Subject Category</th>
                          <th className="p-2.5">Weekly Target (Minutes)</th>
                          <th className="p-2.5">Equivalent Periods (40 m/slot)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans text-slate-700 dark:text-slate-300">
                        <tr>
                          <td className="p-2.5 font-semibold">Mathematics, Science, English, Filipino</td>
                          <td className="p-2.5">240 mins</td>
                          <td className="p-2.5 font-mono">6 periods / week</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold">Araling Panlipunan, EsP</td>
                          <td className="p-2.5">160 mins</td>
                          <td className="p-2.5 font-mono">4 periods / week</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-semibold">MAPEH, TLE</td>
                          <td className="p-2.5">160 mins</td>
                          <td className="p-2.5 font-mono">4 periods / week</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px] text-amber-800 dark:text-amber-400">
                    <strong>⚠️ Instructor Allocation Limits:</strong> Philippine administrative guidelines enforce a maximum teaching limit of 300 to 360 minutes daily per academic teacher. This system displays visual progress loads inside the "Teacher Load Tracker" sidebar.
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Close Button */}
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowHelpDocs(false)}
                className="px-4 py-1.5 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold cursor-pointer transition text-xs shadow-md"
              >
                Accept and Close Docs
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
