import React, { useState } from 'react';
import Papa from 'papaparse';
import { Teacher, Room, Section, Subject, GradeLevel } from '../types';
import { UserPlus, PlusCircle, Trash, Settings, ShieldAlert, Check } from 'lucide-react';

interface ConfigurationPanelProps {
  teachers: Teacher[];
  rooms: Room[];
  sections: Section[];
  subjects: Subject[];
  
  onAddTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
  onAddSection: (section: Section) => void;
  onDeleteSection: (id: string) => void;
  onAddSubject: (subject: Subject) => void;
  onDeleteSubject: (id: string) => void;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  teachers,
  rooms,
  sections,
  subjects,
  
  onAddTeacher,
  onDeleteTeacher,
  onAddRoom,
  onDeleteRoom,
  onAddSection,
  onDeleteSection,
  onAddSubject,
  onDeleteSubject,
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'rooms' | 'sections' | 'subjects' | 'csv-import'>('teachers');

  // Form states
  const [teacherName, setTeacherName] = useState('');
  const [teacherSelectedSubjs, setTeacherSelectedSubjs] = useState<string[]>([]);
  const [teacherTargetMinutes, setTeacherTargetMinutes] = useState(300);
  const [teacherPasscode, setTeacherPasscode] = useState('');

  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(40);

  const [sectionName, setSectionName] = useState('');
  const [sectionGrade, setSectionGrade] = useState<GradeLevel>(7);
  const [sectionAdvisor, setSectionAdvisor] = useState('');
  const [sectionRoom, setSectionRoom] = useState('');

  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectMinutes, setSubjectMinutes] = useState(240);
  const [subjectGrade, setSubjectGrade] = useState<GradeLevel>(7);

  // CSV Import States
  const [csvTarget, setCsvTarget] = useState<'teachers' | 'rooms' | 'sections'>('teachers');
  const [csvText, setCsvText] = useState(`name,targetMinutes,subjectCodes,passcode\nJuan Dela Cruz,360,MATH-7;SCI-7,delacruz7\nMaria Santos,300,ENG-8,msantos8\nPedro Penduko,240,AP-7;TLE-7,teacher`);
  const [importResult, setImportResult] = useState<{ status: 'success' | 'warn'; message: string } | null>(null);

  const csvTemplates = {
    teachers: `name,targetMinutes,subjectCodes,passcode\nJuan Dela Cruz,360,MATH-7;SCI-7,delacruz7\nMaria Santos,300,ENG-8,msantos8\nPedro Penduko,240,AP-7;TLE-7,teacher`,
    rooms: `name,capacity\nRoom 201,45\nBiology Lab,30\nComputer Room A,40`,
    sections: `name,gradeLevel,advisorName,classroomName\nSt. Luke,7,Juan Dela Cruz,Room 201\nSt. Matthew,8,Maria Santos,Biology Lab`,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setCsvText(text);
        setImportResult({ status: 'success', message: `Successfully loaded file "${file.name}" into edit buffer.` });
      }
    };
    reader.readAsText(file);
  };

  const handleParseCSV = () => {
    if (!csvText.trim()) {
      setImportResult({ status: 'warn', message: 'The CSV field is blank.' });
      return;
    }

    // Use PapaParse to handle standards-compliant CSV parsing (escaped commas, quotes, etc)
    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      setImportResult({
        status: 'warn',
        message: `CSV parsing errors: ${parsed.errors.map(e => e.message).join(', ')}`
      });
      return;
    }

    if (parsed.data.length === 0) {
      setImportResult({ status: 'warn', message: 'No records found to import aside from header.' });
      return;
    }

    let successCount = 0;
    let errCount = 0;

    // Normalizes row fields to accommodate casing and edge whitespaces
    const normalizeRow = (rawRow: Record<string, string>) => {
      const normalized: Record<string, string> = {};
      Object.entries(rawRow).forEach(([key, val]) => {
        normalized[key.toLowerCase().trim()] = val ? val.trim() : '';
      });
      return normalized;
    };

    if (csvTarget === 'teachers') {
      parsed.data.forEach((rawRow, i) => {
        const row = normalizeRow(rawRow);
        const name = row['name'];
        if (!name) {
          errCount++;
          return;
        }

        const targetMinutesVal = row['targetminutes'] || row['target_minutes'] || row['weekly_target'] || row['weeklytarget'];
        const targetMinutes = targetMinutesVal ? (parseInt(targetMinutesVal) || 300) : 300;
        
        const rawCodesStr = row['subjectcodes'] || row['subject_codes'] || row['subjects'] || '';
        const rawCodes = rawCodesStr ? rawCodesStr.split(';').map(c => c.trim()) : [];

        // Match subject codes to subject IDs in database
        const matchedSubjectIds: string[] = [];
        rawCodes.forEach((code) => {
          const found = subjects.find(s => s.code.toUpperCase() === code.toUpperCase());
          if (found) {
            matchedSubjectIds.push(found.id);
          }
        });

        const colors = ['indigo', 'emerald', 'amber', 'fuchsia', 'cyan', 'teal', 'purple', 'rose', 'pink', 'blue', 'lime'];
        const csvPasscode = row['passcode'] || row['password'] || 'teacher';
        const newTeacher: Teacher = {
          id: `t-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          subjects: matchedSubjectIds,
          color: colors[Math.floor(Math.random() * colors.length)],
          targetMinutes,
          passcode: csvPasscode.trim(),
        };

        onAddTeacher(newTeacher);
        successCount++;
      });

      setImportResult({
        status: errCount > 0 ? 'warn' : 'success',
        message: `Registered ${successCount} teacher records successfully.${errCount > 0 ? ` Skipped ${errCount} records due to validation format errors (e.g. missing name column).` : ''}`
      });

    } else if (csvTarget === 'rooms') {
      parsed.data.forEach((rawRow, i) => {
        const row = normalizeRow(rawRow);
        const name = row['name'] || row['roomname'] || row['classroom_name'] || row['classroomname'] || row['room'] || row['designation'];
        if (!name) {
          errCount++;
          return;
        }

        const capVal = row['capacity'] || row['maxcapacity'] || row['max_capacity'] || row['studentcapacity'];
        const capacity = capVal ? (parseInt(capVal) || 40) : 40;

        const newRoom: Room = {
          id: `r-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          capacity,
        };

        onAddRoom(newRoom);
        successCount++;
      });

      setImportResult({
        status: errCount > 0 ? 'warn' : 'success',
        message: `Saved ${successCount} classrooms successfully.${errCount > 0 ? ` Failed parsing on ${errCount} records.` : ''}`
      });

    } else if (csvTarget === 'sections') {
      parsed.data.forEach((rawRow, i) => {
        const row = normalizeRow(rawRow);
        const name = row['name'] || row['sectionname'] || row['section_name'] || row['section'] || row['gradelevel_name'];
        const gradeVal = row['gradelevel'] || row['grade_level'] || row['grade'] || row['level'];
        
        if (!name || !gradeVal) {
          errCount++;
          return;
        }

        const gradeLevel = (parseInt(gradeVal) || 7) as GradeLevel;
        const rawAdvisor = row['advisorname'] || row['advisor_name'] || row['adviser'] || row['advisername'] || row['teacher_id'] || '';
        const rawRoom = row['classroomname'] || row['classroom_name'] || row['room'] || row['roomname'] || '';

        // Match advisor name to registered ID
        const matchedAdvisor = teachers.find(t => t.name.toLowerCase().includes(rawAdvisor.toLowerCase())) || teachers[0];
        // Match room name to registered ID
        const matchedRoom = rooms.find(r => r.name.toLowerCase().includes(rawRoom.toLowerCase())) || rooms[0];

        const newSec: Section = {
          id: `sec-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          gradeLevel,
          advisorId: matchedAdvisor?.id || '',
          classroomId: matchedRoom?.id || '',
        };

        onAddSection(newSec);
        successCount++;
      });

      setImportResult({
        status: errCount > 0 ? 'warn' : 'success',
        message: `Created ${successCount} student sections matching advisor and classroom credentials. ${errCount > 0 ? `Failed parsing on ${errCount} records.` : ''}`
      });
    }
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName) return;
    const colors = ['indigo', 'emerald', 'amber', 'fuchsia', 'cyan', 'teal', 'purple', 'rose', 'pink', 'blue', 'lime'];
    const newT: Teacher = {
      id: `t-${Date.now()}`,
      name: teacherName,
      subjects: teacherSelectedSubjs,
      color: colors[Math.floor(Math.random() * colors.length)],
      targetMinutes: teacherTargetMinutes,
      passcode: teacherPasscode.trim() || 'teacher',
    };
    onAddTeacher(newT);
    setTeacherName('');
    setTeacherSelectedSubjs([]);
    setTeacherTargetMinutes(300);
    setTeacherPasscode('');
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;
    const newR: Room = {
      id: `r-${Date.now()}`,
      name: roomName,
      capacity: roomCapacity,
    };
    onAddRoom(newR);
    setRoomName('');
    setRoomCapacity(40);
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionName) return;
    const newS: Section = {
      id: `sec-${Date.now()}`,
      name: sectionName,
      gradeLevel: sectionGrade,
      advisorId: sectionAdvisor || (teachers[0]?.id || ''),
      classroomId: sectionRoom || (rooms[0]?.id || ''),
    };
    onAddSection(newS);
    setSectionName('');
    setSectionAdvisor('');
    setSectionRoom('');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !subjectCode) return;
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name: subjectName,
      code: subjectCode.toUpperCase(),
      minutesPerWeek: subjectMinutes,
      gradeLevel: subjectGrade,
    };
    onAddSubject(newSub);
    setSubjectName('');
    setSubjectCode('');
    setSubjectMinutes(240);
  };

  const toggleTeacherSubjectSelection = (subjId: string) => {
    if (teacherSelectedSubjs.includes(subjId)) {
      setTeacherSelectedSubjs(teacherSelectedSubjs.filter((id) => id !== subjId));
    } else {
      setTeacherSelectedSubjs([...teacherSelectedSubjs, subjId]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden print:hidden">
      <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
        <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          School Configuration &amp; Database Settings
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Manage core registration variables of the ICT High School database. Updates here instantly sync schedule validation rules.
        </p>

        {/* Tab triggers */}
        <div className="flex flex-wrap gap-1.5 mt-4 border-b border-slate-200 dark:border-slate-800">
          {(['teachers', 'rooms', 'sections', 'subjects', 'csv-import'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-3 text-xs font-semibold capitalize border-b-2 -mb-[1px] transition cursor-pointer ${
                activeTab === tab
                  ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab === 'csv-import' ? 'CSV Bulk Import' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Registered list */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Registered Teachers ({teachers.length})</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Primary Subjects</th>
                      <th className="py-2.5 px-3">Target Load</th>
                      <th className="py-2.5 px-3">Passcode Account</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {teachers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{t.name}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {t.subjects.length > 0 ? (
                              t.subjects.map((subId) => {
                                const sub = subjects.find((s) => s.id === subId);
                                return (
                                  <span
                                    key={subId}
                                    className="text-[9px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1 rounded"
                                  >
                                    {sub ? sub.code : 'UNKNOWN'}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-slate-300 dark:text-slate-650 italic text-[10px]">No subjects assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{t.targetMinutes || 300} mins/wk</td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                            {t.passcode || 'teacher'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onDeleteTeacher(t.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition cursor-pointer"
                            title="Remove Teacher"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Creation form */}
            <form onSubmit={handleCreateTeacher} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-lg space-y-3.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <UserPlus className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Register Teacher
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Clara"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Weekly Target (Minutes)</label>
                <input
                  type="number"
                  placeholder="300"
                  value={teacherTargetMinutes}
                  onChange={(e) => setTeacherTargetMinutes(parseInt(e.target.value) || 300)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Teacher Login Passcode</label>
                <input
                  type="text"
                  placeholder="Defaults to 'teacher'"
                  value={teacherPasscode}
                  onChange={(e) => setTeacherPasscode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 font-mono">Teaching Specializations</label>
                <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-950 p-1.5 space-y-1">
                  {subjects.map((sub) => {
                    const isSelected = teacherSelectedSubjs.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleTeacherSubjectSelection(sub.id)}
                        className={`w-full flex items-center justify-between text-left px-2 py-1 rounded text-[10px] transition cursor-pointer ${
                          isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                        }`}
                      >
                        <span>{sub.name} ({sub.code})</span>
                        {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add &amp; Save Teacher
              </button>
            </form>
          </div>
        )}

        {/* ROOMS TAB */}
        {activeTab === 'rooms' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Rooms &amp; Laboratories ({rooms.length})</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Room Name</th>
                      <th className="py-2.5 px-3">Student Capacity</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rooms.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{r.capacity} students max</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onDeleteRoom(r.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition cursor-pointer"
                            title="Remove Room"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleCreateRoom} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-lg space-y-3.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <PlusCircle className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> New Room Registration
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Room Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 303 - Tech Lab"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Max Capacity</label>
                <input
                  type="number"
                  required
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(parseInt(e.target.value) || 40)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add &amp; Save Room
              </button>
            </form>
          </div>
        )}

        {/* SECTIONS TAB */}
        {activeTab === 'sections' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Student Sections ({sections.length})</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Grade Level &amp; Name</th>
                      <th className="py-2.5 px-3">Adviser</th>
                      <th className="py-2.5 px-3">Default Classroom</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sections.map((sec) => {
                      const adviser = teachers.find((t) => t.id === sec.advisorId);
                      const room = rooms.find((r) => r.id === sec.classroomId);
                      return (
                        <tr key={sec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-indigo-700 dark:text-indigo-300 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 px-1 py-0.5 rounded leading-none">
                              GR {sec.gradeLevel}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 ml-2">{sec.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">{adviser ? adviser.name : <span className="text-red-400 dark:text-red-500">Unassigned</span>}</td>
                          <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{room ? room.name : <span className="text-red-400 dark:text-red-500">Unassigned</span>}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onDeleteSection(sec.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition cursor-pointer"
                              title="Remove Section"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleCreateSection} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-lg space-y-3.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <PlusCircle className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> Register Section
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Section Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. G7 - Chrome"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono block animate-none">Grade Level</label>
                <div className="flex gap-2">
                  {([7, 8, 9, 10] as GradeLevel[]).map((gl) => (
                    <button
                      key={gl}
                      type="button"
                      onClick={() => setSectionGrade(gl)}
                      className={`flex-1 py-1 px-2.5 rounded text-xs font-bold transition border cursor-pointer ${
                        sectionGrade === gl
                          ? 'bg-indigo-600 border-indigo-600 dark:border-indigo-500 text-white'
                          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      Gr {gl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono block">Class Adviser</label>
                <select
                  value={sectionAdvisor}
                  onChange={(e) => setSectionAdvisor(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">Select advisor...</option>
                  {teachers.map((teach) => (
                    <option key={teach.id} value={teach.id}>
                      {teach.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono block">Default Classroom</label>
                <select
                  value={sectionRoom}
                  onChange={(e) => setSectionRoom(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value="">Select classroom...</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add &amp; Save Section
              </button>
            </form>
          </div>
        )}

        {/* SUBJECTS TAB */}
        {activeTab === 'subjects' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">Registered Course Material ({subjects.length})</h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950/80 font-mono text-[10px] uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Subject Name</th>
                      <th className="py-2.5 px-3">Target Minutes</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 dark:text-indigo-350">{sub.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{sub.name}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{sub.minutesPerWeek} mins/wk</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Grade {sub.gradeLevel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onDeleteSubject(sub.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition cursor-pointer"
                            title="Remove Subject"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <form onSubmit={handleCreateSubject} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-lg space-y-3.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <PlusCircle className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> New Subject Registration
              </h4>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Subject Full Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science &amp; Technology 7"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SCI-7"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Required Minutes / Week</label>
                <input
                  type="number"
                  required
                  value={subjectMinutes}
                  onChange={(e) => setSubjectMinutes(parseInt(e.target.value) || 240)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">Class Level target</label>
                <select
                  value={subjectGrade}
                  onChange={(e) => setSubjectGrade(parseInt(e.target.value) as GradeLevel)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
                >
                  <option value={7}>Grade 7</option>
                  <option value={8}>Grade 8</option>
                  <option value={9}>Grade 9</option>
                  <option value={10}>Grade 10</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Add &amp; Save Subject
              </button>
            </form>
          </div>
        )}

        {/* CSV IMPORT TAB */}
        {activeTab === 'csv-import' && (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-50/55 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
              <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-100 flex items-center gap-1.5 mb-1 uppercase tracking-wider font-mono">
                Bulk Import School Configuration Data
              </h4>
              <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300 leading-relaxed font-sans">
                Streamline database setup in seconds. Copy-paste comma-separated values (CSV) or choose a physical CSV file below to instantly ingest database fields. If subject codes are supplied for teachers, the installer will locate and link matching records dynamically.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
              {/* Import options */}
              <div className="p-4 bg-slate-50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-800 rounded-xl space-y-4">
                <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">1. Select Target Type</h5>
                
                <div className="space-y-2">
                  {(['teachers', 'rooms', 'sections'] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs font-semibold uppercase transition select-none ${
                        csvTarget === type
                          ? 'bg-blue-50/50 dark:bg-indigo-950/35 border-indigo-400 dark:border-indigo-850 text-indigo-950 dark:text-indigo-250 shadow-xs'
                          : 'bg-white dark:bg-slate-950 border-slate-205 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                      }`}
                    >
                      <input
                        type="radio"
                        name="csv-target"
                        checked={csvTarget === type}
                        onChange={() => {
                          setCsvTarget(type);
                          setCsvText(csvTemplates[type]);
                          setImportResult(null);
                        }}
                        className="sr-only"
                      />
                      <span className={`h-3.5 w-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        csvTarget === type ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950'
                      }`}>
                        {csvTarget === type && <span className="h-1.5 w-1.5 rounded-full bg-white block" />}
                      </span>
                      <span>Format: {type}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-widest font-mono">Or Upload CSV File</h5>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-indigo-55 dark:file:bg-slate-800 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-110 dark:hover:file:bg-slate-750 cursor-pointer"
                  />
                </div>
              </div>

              {/* Paste values */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider font-mono">2. Edit / Paste CSV Lines</h5>
                  <button
                    onClick={() => {
                      setCsvText(csvTemplates[csvTarget]);
                      setImportResult(null);
                    }}
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 uppercase tracking-tight cursor-pointer"
                  >
                    Load Fresh Template
                  </button>
                </div>

                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full h-44 p-3 font-mono text-[11px] text-slate-700 dark:text-slate-250 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed font-semibold shadow-inner"
                  placeholder="name,targetMinutes,subject_codes..."
                />

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleParseCSV}
                    className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition cursor-pointer"
                  >
                    Import {csvTarget} Bulk
                  </button>
                </div>

                {importResult && (
                  <div className={`p-4 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in duration-200 ${
                    importResult.status === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-250 shadow-xs'
                      : 'bg-amber-50 dark:bg-amber-950/20 border-amber-150 dark:border-amber-900/40 text-amber-950 dark:text-amber-250 shadow-xs'
                  }`}>
                    <div className="flex-grow">
                      <p className="font-black uppercase tracking-widest font-mono text-[10px] mb-1">
                        {importResult.status === 'success' ? 'Import Successful' : 'Import Partially Saved'}
                      </p>
                      <p className="leading-relaxed opacity-90">{importResult.message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
