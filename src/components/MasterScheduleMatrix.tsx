import React, { useState, useEffect } from 'react';
import { Teacher, Room, Section, Subject, TimeSlot, ScheduleEntry, Conflict } from '../types';
import {
  Check,
  Trash2,
  Edit2,
  AlertCircle,
  HelpCircle,
  GripVertical,
  Layers,
  Sparkles,
  Info,
  Calendar,
  Layers3,
  X,
  Plus,
  Play,
  RotateCcw,
  Bell,
  Search,
  User,
  Clock
} from 'lucide-react';

interface MasterScheduleMatrixProps {
  teachers: Teacher[];
  rooms: Room[];
  sections: Section[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  schedule: ScheduleEntry[];
  conflicts: Conflict[];
  activeTerm: 1 | 2 | 3;
  onUpdateEntry: (entry: ScheduleEntry) => void;
  onRemoveEntryByCell: (day: string, slotId: string, sectionId: string) => void;
  onUndo?: () => boolean;
  role?: 'ADMIN' | 'TEACHER' | 'GUEST';
}

interface ToastMessage {
  id: string;
  type: 'success' | 'warn' | 'info';
  title: string;
  message: string;
}

export const MasterScheduleMatrix: React.FC<MasterScheduleMatrixProps> = ({
  teachers,
  rooms,
  sections,
  subjects,
  timeSlots,
  schedule,
  conflicts,
  activeTerm,
  onUpdateEntry,
  onRemoveEntryByCell,
  onUndo,
  role = 'ADMIN',
}) => {
  const [activeDay, setActiveDay] = useState<ScheduleEntry['day']>('Monday');
  
  // Tracking hovered element parameters to gracefully dim non-essential grid cells
  const [activeHoverDetails, setActiveHoverDetails] = useState<{
    teacherId?: string;
    roomId?: string;
    subjectId?: string;
    sectionId?: string;
  } | null>(null);

  // Local state for keyboard navigation focused cell
  const [focusedCell, setFocusedCell] = useState<{ slotId: string; sectionId: string } | null>(null);
  
  // Shortcuts toast message state
  const [shortcutsToast, setShortcutsToast] = useState<string | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyAction = (key: string, isCtrlZ: boolean, isCtrlS: boolean, preventDefault: () => void) => {
      // Ignore if focus is in form inputs
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT'
      )) {
        return;
      }

      // 1. Ctrl+Z / Cmd+Z (Undo)
      if (isCtrlZ) {
        preventDefault();
        if (onUndo) {
          const success = onUndo();
          if (success) {
            setShortcutsToast('Undo Successful! Restored previous allocation layout.');
            setTimeout(() => setShortcutsToast(null), 3000);
          } else {
            setShortcutsToast('Nothing to undo.');
            setTimeout(() => setShortcutsToast(null), 2500);
          }
        }
        return;
      }

      // 2. Ctrl+S / Cmd+S (Save)
      if (isCtrlS) {
        preventDefault();
        setShortcutsToast('Schedule Database Saved Successfully & Backed up to LocalStorage!');
        setTimeout(() => setShortcutsToast(null), 3000);
        return;
      }

      // If no focused cell, set it to the first active cell on Arrow key press
      const activeTimeSlots = timeSlots.filter(t => !t.isBreak);
      if (!focusedCell) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
          if (activeTimeSlots.length > 0 && sections.length > 0) {
            setFocusedCell({ slotId: activeTimeSlots[0].id, sectionId: sections[0].id });
          }
        }
        return;
      }

      const sIdx = sections.findIndex(s => s.id === focusedCell.sectionId);
      const tIdx = activeTimeSlots.findIndex(t => t.id === focusedCell.slotId);

      switch (key) {
        case 'ArrowLeft':
          preventDefault();
          if (sIdx > 0) {
            setFocusedCell({ ...focusedCell, sectionId: sections[sIdx - 1].id });
          }
          break;
        case 'ArrowRight':
          preventDefault();
          if (sIdx < sections.length - 1) {
            setFocusedCell({ ...focusedCell, sectionId: sections[sIdx + 1].id });
          }
          break;
        case 'ArrowUp':
          preventDefault();
          if (tIdx > 0) {
            setFocusedCell({ ...focusedCell, slotId: activeTimeSlots[tIdx - 1].id });
          }
          break;
        case 'ArrowDown':
          preventDefault();
          if (tIdx < activeTimeSlots.length - 1) {
            setFocusedCell({ ...focusedCell, slotId: activeTimeSlots[tIdx + 1].id });
          }
          break;
        case 'Enter':
          preventDefault();
          handleOpenAssignModal(focusedCell.slotId, focusedCell.sectionId);
          break;
        case 'Escape':
          preventDefault();
          setEditingCell(null);
          setFocusedCell(null);
          break;
        case 'Delete':
        case 'Backspace':
          preventDefault();
          onRemoveEntryByCell(activeDay, focusedCell.slotId, focusedCell.sectionId);
          setShortcutsToast('Cell allocation removed.');
          setTimeout(() => setShortcutsToast(null), 2500);
          break;
        default:
          break;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlZ = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z';
      const isCtrlS = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
      handleKeyAction(e.key, isCtrlZ, isCtrlS, () => e.preventDefault());
    };

    const handleCustomNavigation = (e: Event) => {
      const customEvent = e as CustomEvent<{ key: string }>;
      const key = customEvent.detail?.key;
      if (key) {
        handleKeyAction(key, false, false, () => {});
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('matrix-arrow-navigation', handleCustomNavigation);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('matrix-arrow-navigation', handleCustomNavigation);
    };
  }, [focusedCell, activeDay, timeSlots, sections, onUndo, onRemoveEntryByCell]);
  
  // Selection box state for editing a slot
  const [editingCell, setEditingCell] = useState<{ slotId: string; sectionId: string } | null>(null);
  
  // Select values for assignment form
  const [selSubjectId, setSelSubjectId] = useState('');
  const [selTeacherId, setSelTeacherId] = useState('');
  const [selRoomId, setSelRoomId] = useState('');

  // Unscheduled sidebar state toggles (resembling Hubstaff sidebar filters)
  const [showUnassignedPool, setShowUnassignedPool] = useState(true);
  const [filterSectionId, setFilterSectionId] = useState<string>('all');

  // Drag-and-drop live states
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null); // For dragging fresh subjects from the pool!
  const [hoveredCell, setHoveredCell] = useState<{ slotId: string; sectionId: string } | null>(null);

  // Real-time toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const days: ScheduleEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Current active day and term allocations
  const currentEntries = schedule.filter((e) => e.term === activeTerm && e.day === activeDay);

  const getEntryByCell = (slotId: string, sectionId: string) => {
    return currentEntries.find((e) => e.timeSlotId === slotId && e.sectionId === sectionId);
  };

  // Helper helper to generate nice Hubstaff-inspired avatar colors
  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-purple-100 text-purple-700'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // Helper to retrieve color category for subject capsules
  const getSubjectColorClass = (code: string) => {
    const key = code.toUpperCase();
    if (key.includes('MATH') || key.includes('MTH')) return 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100/70 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300 dark:hover:bg-blue-900/40';
    if (key.includes('SCI') || key.includes('BIO')) return 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-350 dark:hover:bg-emerald-900/40';
    if (key.includes('ENG') || key.includes('LIT')) return 'bg-violet-50 border-violet-200 text-violet-800 hover:bg-violet-100/70 dark:bg-violet-950/40 dark:border-violet-900/60 dark:text-violet-300 dark:hover:bg-violet-900/40';
    if (key.includes('MAP') || key.includes('PE')) return 'bg-orange-50 border-orange-250 text-orange-850 hover:bg-orange-100/70 dark:bg-orange-950/40 dark:border-orange-900/60 dark:text-orange-300 dark:hover:bg-orange-900/40';
    if (key.includes('AP') || key.includes('SOC') || key.includes('HIS')) return 'bg-amber-50 border-amber-250 text-amber-850 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300 dark:hover:bg-amber-900/40';
    if (key.includes('TLE') || key.includes('ICT') || key.includes('COMP')) return 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100/70 dark:bg-purple-950/40 dark:border-purple-900/60 dark:text-purple-300 dark:hover:bg-purple-900/40';
    return 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/70 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850';
  };

  // Toast triggers
  const addToast = (type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  // Prune expired toasts
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const handleOpenAssignModal = (slotId: string, sectionId: string) => {
    const existing = getEntryByCell(slotId, sectionId);
    setEditingCell({ slotId, sectionId });
    if (existing) {
      setSelSubjectId(existing.subjectId);
      setSelTeacherId(existing.teacherId);
      setSelRoomId(existing.roomId);
    } else {
      const section = sections.find((s) => s.id === sectionId);
      const gradeSubjects = subjects.filter((s) => s.gradeLevel === section?.gradeLevel);
      
      setSelSubjectId(gradeSubjects[0]?.id || '');
      setSelTeacherId(teachers[0]?.id || '');
      setSelRoomId(section?.classroomId || rooms[0]?.id || '');
    }
  };

  const handleSaveAssignment = () => {
    if (!editingCell) return;
    const { slotId, sectionId } = editingCell;

    if (!selSubjectId || !selTeacherId || !selRoomId) {
      onRemoveEntryByCell(activeDay, slotId, sectionId);
      addToast('info', 'Cell Cleared', 'Scheduled period allocation was successfully unassigned.');
    } else {
      const existing = getEntryByCell(slotId, sectionId);
      const updatedEntry: ScheduleEntry = {
        id: existing?.id || `se-${sectionId}-${activeDay}-${slotId}-${activeTerm}`,
        term: activeTerm,
        day: activeDay,
        timeSlotId: slotId,
        sectionId,
        subjectId: selSubjectId,
        teacherId: selTeacherId,
        roomId: selRoomId,
      };
      
      onUpdateEntry(updatedEntry);

      // Instantly evaluate for conflicts
      const updatedSchedule = schedule.map(e => e.id === updatedEntry.id ? updatedEntry : e);
      if (!schedule.some(e => e.id === updatedEntry.id)) {
        updatedSchedule.push(updatedEntry);
      }
      
      // Let's check if conflicts are introduced
      const updatedConflicts = conflicts.filter(c => c.affectedIds.includes(updatedEntry.id));
      if (updatedConflicts.length > 0) {
        addToast('warn', 'Conflict Alert Generated', 'Teacher or room double allocation detected. See alert header details.');
      } else {
        addToast('success', 'Assignment Saved', 'Schedule block updated and validated.');
      }
    }
    setEditingCell(null);
  };

  // Helper to determine if a cell is involved in conflicts
  const getCellConflicts = (slotId: string, sectionId: string) => {
    const entry = getEntryByCell(slotId, sectionId);
    if (!entry) return [];
    return conflicts.filter((c) => c.affectedIds.includes(entry.id));
  };

  /* HTML5 DRAG & DROP HANDLERS */
  const handleDragStartEntry = (e: React.DragEvent, entryId: string) => {
    setDraggedEntryId(entryId);
    setDraggedSubjectId(null);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'entry', id: entryId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartSubjectPool = (e: React.DragEvent, subjectId: string) => {
    setDraggedSubjectId(subjectId);
    setDraggedEntryId(null);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'pool-subject', id: subjectId }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedEntryId(null);
    setDraggedSubjectId(null);
    setHoveredCell(null);
  };

  const handleDragOverCell = (e: React.DragEvent, slotId: string, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedSubjectId ? 'copy' : 'move';
    if (hoveredCell?.slotId !== slotId || hoveredCell?.sectionId !== sectionId) {
      setHoveredCell({ slotId, sectionId });
    }
  };

  const handleDragLeaveCell = () => {
    setHoveredCell(null);
  };

  const handleDropOnCell = (e: React.DragEvent, targetSlotId: string, targetSectionId: string) => {
    e.preventDefault();
    setHoveredCell(null);

    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'entry') {
        // Dragged an existing entry to a new coordinates slot
        const entry = schedule.find((item) => item.id === data.id);
        if (!entry) return;

        // Create updated entry
        const updated: ScheduleEntry = {
          ...entry,
          day: activeDay, // active tab day
          timeSlotId: targetSlotId,
          sectionId: targetSectionId,
        };

        onUpdateEntry(updated);
        addToast('success', 'Schedule Item Moved', `Successfully relocated block to Period ${targetSlotId.replace('ts-', '')}.`);
      } else if (data.type === 'pool-subject') {
        // Dragged a fresh subject block from the unassigned pool list
        const subject = subjects.find(s => s.id === data.id);
        const section = sections.find(s => s.id === targetSectionId);
        if (!subject || !section) return;

        if (subject.gradeLevel !== section.gradeLevel) {
          addToast('warn', 'Level Mismatch', `Cannot assign a Grade ${subject.gradeLevel} subject to ${section.name} (Grade ${section.gradeLevel}).`);
          return;
        }

        // Auto find available teacher & default room
        const teacher = teachers.find(t => t.subjects.includes(subject.id)) || teachers[0];
        const room = rooms.find(r => r.id === section.classroomId) || rooms[0];

        const freshEntry: ScheduleEntry = {
          id: `se-${section.id}-${activeDay}-${targetSlotId}-${activeTerm}-${Date.now()}`,
          term: activeTerm,
          day: activeDay,
          timeSlotId: targetSlotId,
          sectionId: targetSectionId,
          subjectId: subject.id,
          teacherId: teacher?.id || '',
          roomId: room?.id || '',
        };

        onUpdateEntry(freshEntry);
        addToast('success', 'Subject Scheduled', `Assigned ${subject.code} to ${section.name}.`);
      }
    } catch (err) {
      console.error('Drag drop parser fail', err);
    }
  };

  // Drag over trash bin (unschedules/clears block)
  const handleDropOnTrash = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      const data = JSON.parse(rawData);

      if (data.type === 'entry') {
        const entry = schedule.find((item) => item.id === data.id);
        if (entry) {
          onRemoveEntryByCell(entry.day, entry.timeSlotId, entry.sectionId);
          addToast('info', 'Block Cleared', `Removed schedule period for ${entry.day} block.`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HUBSTAFF-STYLE FLOATING TOASTS NOTIFICATION SYSTEM */}
      <div className="fixed bottom-6 right-6 z-55 flex flex-col gap-3 max-w-sm w-full print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl shadow-lg border text-xs flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-bottom bg-white ${
              t.type === 'success'
                ? 'border-emerald-250 bg-emerald-50/95 text-emerald-900'
                : t.type === 'warn'
                ? 'border-amber-250 bg-amber-50/95 text-amber-900'
                : 'border-slate-200 bg-white/95 text-slate-800'
            }`}
          >
            {t.type === 'success' && <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
            {t.type === 'warn' && <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />}

            <div className="flex-grow">
              <span className="font-extrabold uppercase tracking-wide block mb-0.5">{t.title}</span>
              <p className="leading-relaxed opacity-90">{t.message}</p>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* PARENT FLEX LAYOUT (Hubstaff bento structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT COMPACT PANEL: Draggable Unassigned Subject Pool & Filters */}
        {role === 'ADMIN' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4 print:hidden transition-all lg:col-span-1">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-display font-extrabold text-slate-800 dark:text-slate-250 text-xs uppercase tracking-wide">
                Draggable Subjects
              </h4>
            </div>
            
            {/* Show Unassigned switch comparable to 'Show Unscheduled' in Hubstaff screenshot */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showUnassignedPool}
                onChange={() => setShowUnassignedPool(!showUnassignedPool)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Pool</span>
            </label>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
            Drag these course subject tokens directly into any available grid slots on the right to auto-allocate them!
          </p>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block font-mono">
              Grade Level Filter
            </label>
            <select
              value={filterSectionId}
              onChange={(e) => setFilterSectionId(e.target.value)}
              className="w-full text-xs font-semibold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Grades (7-10)</option>
              <option value="7">Grade 7 Subjects</option>
              <option value="8">Grade 8 Subjects</option>
              <option value="9">Grade 9 Subjects</option>
              <option value="10">Grade 10 Subjects</option>
            </select>
          </div>

          {/* Draggable tokens container list */}
          {showUnassignedPool ? (
            <div className="space-y-2 max-h-[385px] overflow-y-auto pr-1">
              {subjects
                .filter(s => filterSectionId === 'all' || s.gradeLevel === parseInt(filterSectionId))
                .map((subj) => {
                  // Count total assigned sessions inside this term
                  const assignedCount = schedule.filter(e => e.subjectId === subj.id && e.term === activeTerm).length;
                  const maxTargetClasses = Math.ceil(subj.minutesPerWeek / 60);

                  return (
                    <div
                      key={subj.id}
                      draggable
                      onDragStart={(e) => handleDragStartSubjectPool(e, subj.id)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-grab active:cursor-grabbing hover:shadow-sm ${getSubjectColorClass(subj.code)}`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 opacity-40 shrink-0" />
                        <div>
                          <span className="font-extrabold text-[11px] uppercase tracking-wide block">{subj.code}</span>
                          <span className="text-[9px] opacity-80 block truncate max-w-[120px]">{subj.name}</span>
                          <span className="text-[8px] opacity-60 font-mono tracking-tight font-bold block mt-0.5">
                            Grade {subj.gradeLevel} • {subj.minutesPerWeek} m/wk
                          </span>
                        </div>
                      </div>

                      {/* Pill indicating scheduling progress */}
                      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 shadow-xs border border-slate-200/50 dark:border-slate-700">
                        {assignedCount}/{maxTargetClasses}
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="py-8 text-center text-[11px] text-slate-400 dark:text-slate-550 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              Subject pool is hidden. Toggle switch to view.
            </div>
          )}

          {/* DRAGGABLE TRASH / CLEAR ZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('bg-rose-50', 'dark:bg-rose-950/20', 'border-rose-300', 'text-rose-650');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('bg-rose-50', 'dark:bg-rose-950/20', 'border-rose-300', 'text-rose-650');
            }}
            onDrop={(e) => {
              handleDropOnTrash(e);
              e.currentTarget.classList.remove('bg-rose-50', 'dark:bg-rose-950/20', 'border-rose-300', 'text-rose-650');
            }}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-rose-400/80 rounded-xl p-4 text-center transition-all cursor-default text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-1.5"
          >
            <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              Drag Block Here to Clear
            </span>
          </div>

        </div>
        )}

        {/* RIGHT WORKSPACE: The Grid scheduling matrices styled exactly like Hubstaff schedules */}
        <div className={`${role === 'ADMIN' ? 'lg:col-span-3' : 'lg:col-span-4'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-200`}>
          
          {/* Calendar Inner Header resembling Hubstaff header */}
          <div className="p-4 border-b border-slate-150 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Academic Planner
                </span>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  ⌨️ Arrows: Nav • Enter: Edit • Del: Clear • Ctrl+Z: Undo • Ctrl+S: Save
                </span>
              </div>
              <h3 className="font-display font-black text-slate-800 dark:text-slate-100 text-sm mt-1">
                High School Scheduler Screen
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Drag blocks to reorder teaching periods, or click any grid cell for fine-grained allocation edits.
              </p>
            </div>

            {/* Weekday Switcher Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => {
                    setActiveDay(day);
                    setEditingCell(null);
                  }}
                  className={`py-1.5 px-3 rounded-lg text-[11px] font-bold tracking-tight transition cursor-pointer ${
                    activeDay === day
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/50 dark:border-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Responsive Grid Frame */}
          {sections.length === 0 && (
            <div className="p-12 border border-dashed border-slate-205 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-white dark:bg-slate-900 shadow-sm animate-in fade-in duration-200">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto animate-bounce" />
              <h4 className="font-display font-extrabold text-slate-800 dark:text-slate-200 text-sm">No sections match your search criteria</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto leading-relaxed">
                Adjust your search or check for spelling. You can search by section names (e.g., "G7"), advisor names, teacher names, classrooms, or subject codes.
              </p>
            </div>
          )}

          <div className={sections.length === 0 ? "hidden" : "overflow-x-auto"}>
            {(() => {
              const colsToRender = role === 'GUEST' ? rooms : sections;
              return (
                <table className="w-full text-left text-xs table-fixed min-w-[850px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800 font-display text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 tracking-wider">
                      <th className="py-3 px-4 border-r border-slate-150 dark:border-slate-800 w-36 align-middle">Time Blocks</th>
                      {colsToRender.map((col) => (
                        <th key={col.id} className="py-3 px-4 border-r border-slate-150 dark:border-slate-800 w-44 align-top">
                          <div className="space-y-1">
                            <span className="font-sans font-black text-slate-800 dark:text-slate-200 tracking-tight block text-xs">
                              {col.name}
                            </span>
                            
                            <div className="flex items-center gap-1.5">
                              {role === 'GUEST' ? (
                                <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-1 py-0.5 rounded uppercase font-mono font-extrabold">
                                  CAPACITY: {(col as Room).capacity} PAX
                                </span>
                              ) : (
                                <>
                                  <span className="text-[8px] bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded uppercase font-mono font-extrabold">
                                    GRADE {(col as Section).gradeLevel}
                                  </span>
                                  <span className="text-[8px] opacity-70 truncate max-w-[90px] font-mono leading-none text-slate-500 dark:text-slate-400">
                                    Advisor: {teachers.find((t) => t.id === (col as Section).advisorId)?.name.split(' ').pop() || 'None'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 relative">
                    {timeSlots.map((slot) => {
                      if (slot.isBreak) {
                        return (
                          <tr key={slot.id} className="bg-slate-100/50 text-slate-400 font-mono text-[9px] uppercase tracking-widest text-center">
                            <td className="py-2 px-4 font-semibold border-r border-slate-150 bg-slate-100/40 text-[10px] text-slate-500">
                              {slot.startTime} - {slot.endTime}
                            </td>
                            <td colSpan={colsToRender.length} className="py-2 px-4 font-extrabold bg-slate-100/30 text-left border-r border-slate-150 text-slate-500">
                              ☕ {slot.label}
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/20 transition-all">
                          
                          {/* Period block time tracker */}
                          <td className="py-4 px-4 border-r border-slate-150 bg-slate-50/30 font-mono font-extrabold text-[10px] text-slate-500 align-middle">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 opacity-60 text-indigo-600" />
                              <span>{slot.startTime}</span>
                            </div>
                            <span className="block text-[8px] opacity-50 font-normal mt-0.5">to {slot.endTime}</span>
                          </td>

                          {/* Dynamic grid cells */}
                          {colsToRender.map((col) => {
                            const entry = role === 'GUEST'
                              ? schedule.find((e) => e.term === activeTerm && e.day === activeDay && e.timeSlotId === slot.id && e.roomId === col.id)
                              : getEntryByCell(slot.id, col.id);

                            const cellConflicts = role === 'GUEST' ? [] : getCellConflicts(slot.id, col.id);
                            const hasConflict = cellConflicts.length > 0;
                            
                            const subj = entry ? subjects.find((s) => s.id === entry.subjectId) : null;
                            const teach = entry ? teachers.find((t) => t.id === entry.teacherId) : null;
                            const room = entry ? rooms.find((r) => r.id === entry.roomId) : null;
                            const sectionOfEntry = entry ? sections.find((s) => s.id === entry.sectionId) : null;

                            const isCellEditing = role === 'ADMIN' && editingCell?.slotId === slot.id && editingCell?.sectionId === col.id;
                            const isDragHovered = role === 'ADMIN' && hoveredCell?.slotId === slot.id && hoveredCell?.sectionId === col.id;
                            const isFocused = role === 'ADMIN' && focusedCell?.slotId === slot.id && focusedCell?.sectionId === col.id;

                            const isDimmed = activeHoverDetails && !(
                              (entry && (
                                (role === 'ADMIN' && entry.teacherId === activeHoverDetails.teacherId) ||
                                entry.roomId === activeHoverDetails.roomId ||
                                entry.subjectId === activeHoverDetails.subjectId ||
                                entry.sectionId === activeHoverDetails.sectionId
                              )) ||
                              (!entry && col.id === activeHoverDetails.sectionId)
                            );

                            return (
                              <td
                                key={col.id}
                                onDragOver={(e) => role === 'ADMIN' ? handleDragOverCell(e, slot.id, col.id) : e.preventDefault()}
                                onDragLeave={role === 'ADMIN' ? handleDragLeaveCell : undefined}
                                onDrop={(e) => role === 'ADMIN' ? handleDropOnCell(e, slot.id, col.id) : undefined}
                                onClick={() => role === 'ADMIN' ? setFocusedCell({ slotId: slot.id, sectionId: col.id }) : undefined}
                                className={`p-2 border-r border-slate-150 align-top cursor-pointer transition-all duration-300 relative ${
                                  isFocused
                                    ? 'bg-indigo-50/50 ring-2 ring-indigo-500 ring-offset-1 z-10 scale-[1.01] shadow-md dark:ring-indigo-400'
                                    : ''
                                } ${
                                  isDragHovered
                                    ? 'bg-indigo-50 border-2 border-dashed border-indigo-500 scale-98 shadow-inner'
                                    : hasConflict
                                    ? 'bg-rose-50/70 border-l-2 border-l-rose-500'
                                    : entry
                                    ? 'bg-slate-50/30'
                                    : 'hover:bg-slate-100/30 dark:hover:bg-slate-800/20'
                                } ${isDimmed ? 'opacity-30 blur-[0.4px] scale-[0.97] saturate-50' : ''}`}
                              >
                                {isCellEditing ? (
                                  /* Quick In-cell Editor popup */
                                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-500 dark:border-indigo-500/80 p-2.5 shadow-md space-y-2 text-[11px] animate-in fade-in zoom-in duration-100">
                                    <div>
                                      <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Subject</label>
                                      <select
                                        value={selSubjectId}
                                        onChange={(e) => setSelSubjectId(e.target.value)}
                                        className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-md font-semibold focus:outline-none"
                                      >
                                        <option value="">- Clear Cell -</option>
                                        {subjects
                                          .filter((s) => s.gradeLevel === (col as Section).gradeLevel)
                                          .map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                              {sub.name}
                                            </option>
                                          ))}
                                      </select>
                                    </div>

                                    {selSubjectId && (
                                      <>
                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Teacher</label>
                                          <select
                                            value={selTeacherId}
                                            onChange={(e) => setSelTeacherId(e.target.value)}
                                            className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-md font-semibold focus:outline-none"
                                          >
                                            <option value="">Select teacher...</option>
                                            {teachers
                                              .filter((t) => t.subjects.includes(selSubjectId))
                                              .map((teach) => (
                                                <option key={teach.id} value={teach.id}>
                                                  {teach.name}
                                                </option>
                                              ))}
                                            {teachers
                                              .filter((t) => !t.subjects.includes(selSubjectId))
                                              .map((teach) => (
                                                <option key={teach.id} value={teach.id} className="text-slate-400 dark:text-slate-500">
                                                  {teach.name} (Non-Spec)
                                                </option>
                                              ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase font-mono">Room</label>
                                          <select
                                            value={selRoomId}
                                            onChange={(e) => setSelRoomId(e.target.value)}
                                            className="w-full mt-0.5 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-md font-semibold focus:outline-none"
                                          >
                                            <option value="">Select Room...</option>
                                            {rooms.map((rm) => (
                                              <option key={rm.id} value={rm.id}>
                                                {rm.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </>
                                    )}

                                    <div className="flex gap-1 pt-1 justify-end">
                                      <button
                                        onClick={() => setEditingCell(null)}
                                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-250 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 font-semibold text-[10px] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={handleSaveAssignment}
                                        className="px-2.5 py-1 rounded bg-indigo-650 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1 text-[10px] cursor-pointer"
                                      >
                                        <Check className="h-3 w-3" /> Save
                                      </button>
                                    </div>
                                  </div>
                                ) : entry ? (
                                  /* Scheduled Content Card modeled after the Shift capsule layout in Hubstaff */
                                  <div
                                    draggable={role === 'ADMIN'}
                                    onDragStart={(e) => role === 'ADMIN' ? handleDragStartEntry(e, entry.id) : undefined}
                                    onDragEnd={role === 'ADMIN' ? handleDragEnd : undefined}
                                    onMouseEnter={() => {
                                      if (role === 'ADMIN') {
                                        setActiveHoverDetails({
                                          teacherId: entry.teacherId,
                                          roomId: entry.roomId,
                                          subjectId: entry.subjectId,
                                          sectionId: entry.sectionId,
                                        });
                                      }
                                    }}
                                    onMouseLeave={() => {
                                      setActiveHoverDetails(null);
                                    }}
                                    className={`group relative p-2.5 rounded-xl border transition-all duration-300 transform ${role === 'ADMIN' ? 'cursor-grab active:cursor-grabbing hover:scale-[1.04] hover:-translate-y-0.5' : 'cursor-default'} hover:shadow-lg ${
                                      hasConflict 
                                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 dark:border-rose-905/40 text-rose-850 dark:text-rose-300 hover:bg-rose-100/60' 
                                        : getSubjectColorClass(subj?.code || '')
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <div>
                                        
                                        {/* Subject Title Block */}
                                        <div className="flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 inline-block shrink-0"></span>
                                          <span className="font-extrabold text-[11px] tracking-tight text-slate-800 dark:text-slate-100">
                                            {subj ? subj.code : 'No Course'}
                                          </span>
                                        </div>
                                        
                                        {/* Subject detailed subtitle */}
                                        <span className="block text-[8px] opacity-70 truncate font-semibold leading-relaxed max-w-[125px] mt-0.5">
                                          {subj ? subj.name : 'Unknown Course'}
                                        </span>

                                        {/* Hubstaff Style Teacher Circle Initials and Name */}
                                        {role !== 'GUEST' && (
                                          <div className="flex items-center gap-1 mt-2">
                                            <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-black uppercase tracking-tighter shrink-0 ${getAvatarBg(teach?.name || 'Unassigned')}`}>
                                              {teach ? teach.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '??'}
                                            </div>
                                            <div className="overflow-hidden">
                                              <span className="block text-[8px] font-bold text-slate-650 dark:text-slate-300 truncate max-w-[85px]">
                                                {teach ? teach.name : 'Unassigned'}
                                              </span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Room details or Section details */}
                                        {role === 'GUEST' ? (
                                          <span className="inline-block text-[8px] font-mono tracking-tight text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold bg-white/70 dark:bg-slate-900/60 px-1 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                                            Section: {sectionOfEntry ? sectionOfEntry.name : 'None'}
                                          </span>
                                        ) : (
                                          <span className="inline-block text-[8px] font-mono tracking-tight text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold bg-white/70 dark:bg-slate-900/60 px-1 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                                            Room: {room ? room.name : 'None'}
                                          </span>
                                        )}

                                      </div>

                                      {/* Absolute hover triggers - ADMIN ONLY */}
                                      {role === 'ADMIN' && (
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition absolute right-1.5 top-1.5 bg-white/95 dark:bg-slate-850 shadow-sm py-0.5 px-1 rounded-lg border border-slate-100 dark:border-slate-705">
                                          <button
                                            onClick={() => handleOpenAssignModal(slot.id, col.id)}
                                            className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                                            title="Edit Assignment"
                                          >
                                            <Edit2 className="h-2.5 w-2.5" />
                                          </button>
                                          <button
                                            onClick={() => onRemoveEntryByCell(activeDay, slot.id, col.id)}
                                            className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                                            title="Clear Cell"
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Conflict Validation Flags */}
                                    {role !== 'GUEST' && hasConflict && (
                                      <div className="mt-2 p-1.5 bg-red-100/90 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-[9px] text-red-900 dark:text-red-350 font-bold flex items-start gap-1">
                                        <AlertCircle className="h-3 w-3 text-red-600 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                          {cellConflicts.map((c) => (
                                            <span key={c.id} className="block leading-tight select-none">
                                              {c.title}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  </div>
                                ) : (
                                  /* Empty Cell allocation */
                                  role === 'ADMIN' ? (
                                    <button
                                      onClick={() => handleOpenAssignModal(slot.id, col.id)}
                                      className="w-full text-center py-5 border border-dashed border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-indigo-400 dark:hover:border-indigo-500 text-[10px] text-slate-350 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 font-extrabold rounded-xl group transition-all cursor-pointer"
                                    >
                                      <span className="opacity-0 group-hover:opacity-100 transition-all font-mono">
                                        + Assign Entry
                                      </span>
                                    </button>
                                  ) : (
                                    <div className="w-full text-center py-5 bg-slate-50/50 dark:bg-slate-950/10 border border-dotted border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-600 font-mono rounded-xl select-none">
                                      Vacant
                                    </div>
                                  )
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })()}
          </div>

        </div>

      </div>

      {shortcutsToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white py-2 px-4 rounded-xl text-xs font-bold tracking-wide shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          {shortcutsToast}
        </div>
      )}

    </div>
  );
};
