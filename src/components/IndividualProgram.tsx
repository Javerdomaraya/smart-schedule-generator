import React, { useState } from 'react';
import { Teacher, Room, Section, Subject, TimeSlot, ScheduleEntry } from '../types';
import { Printer, Calendar, User, BookOpen, Layers, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useUser } from '../context/UserContext';

interface IndividualProgramProps {
  teachers: Teacher[];
  rooms: Room[];
  sections: Section[];
  subjects: Subject[];
  timeSlots: TimeSlot[];
  schedule: ScheduleEntry[];
  activeTerm: 1 | 2 | 3;
}

export const IndividualProgram: React.FC<IndividualProgramProps> = ({
  teachers,
  rooms,
  sections,
  subjects,
  timeSlots,
  schedule,
  activeTerm,
}) => {
  const { role, teacherId } = useUser();
  const [filterTypeState, setFilterType] = useState<'teacher' | 'section' | 'room'>('section');
  const [selectedIdState, setSelectedId] = useState<string>(sections[0]?.id || '');

  const filterType = role === 'TEACHER' ? 'teacher' : filterTypeState;
  const selectedId = role === 'TEACHER' ? (teacherId || 't-1') : selectedIdState;

  // Reset selected ID when type changes
  const handleFilterTypeChange = (type: 'teacher' | 'section' | 'room') => {
    setFilterType(type);
    if (type === 'teacher' && teachers.length > 0) setSelectedId(teachers[0].id);
    else if (type === 'section' && sections.length > 0) setSelectedId(sections[0].id);
    else if (type === 'room' && rooms.length > 0) setSelectedId(rooms[0].id);
  };

  const days: ScheduleEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Filter current term schedule
  const termSchedule = schedule.filter((e) => e.term === activeTerm);

  // Helper to get active entry at slot & day for filter target
  const getEntryForCell = (day: ScheduleEntry['day'], timeSlotId: string) => {
    return termSchedule.find((entry) => {
      if (entry.day !== day || entry.timeSlotId !== timeSlotId) return false;
      if (filterType === 'teacher' && entry.teacherId === selectedId) return true;
      if (filterType === 'section' && entry.sectionId === selectedId) return true;
      if (filterType === 'room' && entry.roomId === selectedId) return true;
      return false;
    });
  };

  // Get printed document title metadata
  const getHeaderDetails = () => {
    switch (filterType) {
      case 'teacher':
        const t = teachers.find((x) => x.id === selectedId);
        return {
          title: 'TEACHER INDIVIDUAL PROGRAM',
          name: t ? t.name : 'Unknown Teacher',
          subtitle: t ? `Specialization: ${t.subjects.map(sId => subjects.find(s=>s.id===sId)?.code).join(', ')}` : '',
        };
      case 'section':
        const s = sections.find((x) => x.id === selectedId);
        const advisor = teachers.find((t) => t.id === s?.advisorId);
        return {
          title: 'CLASS WEEKLY TIMETABLE',
          name: s ? s.name : 'Unknown Section',
          subtitle: s ? `Class Adviser: ${advisor ? advisor.name : 'Unassigned advisor'}` : '',
        };
      case 'room':
        const r = rooms.find((x) => x.id === selectedId);
        return {
          title: 'ROOM ASSIGNMENT SCHEDULE',
          name: r ? r.name : 'Unknown Room',
          subtitle: r ? `Capacity: ${r.capacity} students max` : '',
        };
    }
  };

  const meta = getHeaderDetails();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    // Base font setup. Standard jsPDF fonts include Helvetica
    doc.setFont('helvetica', 'normal');

    // Add DepEd Official Header text
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Republic of the Philippines', 297, 40, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(70);
    doc.setFont('helvetica', 'bold');
    doc.text('DEPARTMENT OF EDUCATION', 297, 52, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Region VIII - Eastern Visayas', 297, 64, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHOOLS DIVISION OF BILIRAN', 297, 76, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('ICT HIGH SCHOOL OF EASTERN BILIRAN', 297, 95, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`School Year 2024-2025 | Term ${activeTerm} Schedule`, 297, 107, { align: 'center' });

    // Draw double underline
    doc.setDrawColor(40);
    doc.setLineWidth(1.5);
    doc.line(40, 115, 555, 115);
    doc.setLineWidth(0.5);
    doc.line(40, 118, 555, 118);

    // Selected program metadata content
    doc.setFillColor(248, 250, 252);
    doc.rect(40, 128, 515, 45, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(40, 128, 515, 45, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(meta.name, 50, 145);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(meta.subtitle || '', 50, 158);

    // Doc ID info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70);
    doc.text(`DOC-ID: H-SCH-2024-00${activeTerm}`, 540, 143, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('District II Approved Schedule', 540, 155, { align: 'right' });

    // Draw the weekly timetable
    const startX = 40;
    let startY = 190;
    const colWidths = [85, 86, 86, 86, 86, 86];
    const rowHeight = 45;

    // Header row
    doc.setFillColor(241, 245, 249);
    doc.rect(startX, startY, 515, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(startX, startY, 515, 22, 'S');

    // Header texts
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Time Blocks', startX + 10, startY + 14);

    days.forEach((day, i) => {
      doc.text(day, startX + colWidths[0] + (i * colWidths[1]) + colWidths[1] / 2, startY + 14, { align: 'center' });
    });

    startY += 22;

    // Timetable cells
    timeSlots.forEach((slot) => {
      // Check if slot is break
      if (slot.isBreak) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, startY, 515, 18, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(startX, startY, 515, 18, 'S');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(148, 163, 184);
        doc.text(`${slot.startTime} - ${slot.endTime}`, startX + 10, startY + 12);
        doc.text(`☕ ${slot.label}`, startX + colWidths[0] + 10, startY + 12);

        startY += 18;
      } else {
        // Regular period row grid cells
        doc.setFillColor(255, 255, 255);
        doc.rect(startX, startY, 515, rowHeight, 'F');
        doc.setDrawColor(203, 213, 225);
        doc.rect(startX, startY, 515, rowHeight, 'S');

        // Leftmost block time
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100);
        doc.text(`${slot.startTime}`, startX + 8, startY + 20);
        doc.text(`to ${slot.endTime}`, startX + 8, startY + 31);

        // Draw separator vertical line for time block
        doc.line(startX + colWidths[0], startY, startX + colWidths[0], startY + rowHeight);

        // Draw columns and cells
        days.forEach((day, idx) => {
          const cellX = startX + colWidths[0] + (idx * colWidths[1]);
          
          // Draw column separator
          if (idx < 4) {
            doc.line(cellX + colWidths[1], startY, cellX + colWidths[1], startY + rowHeight);
          }

          const entry = getEntryForCell(day, slot.id);
          if (entry) {
            const subj = subjects.find((s) => s.id === entry.subjectId);
            const teach = teachers.find((t) => t.id === entry.teacherId);
            const room = rooms.find((r) => r.id === entry.roomId);
            const sec = sections.find((s) => s.id === entry.sectionId);

            // Render subject
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            
            let nameStr = subj ? subj.name : 'Allocated';
            if (nameStr.length > 18) {
              nameStr = nameStr.substring(0, 16) + '...';
            }
            doc.text(nameStr, cellX + colWidths[1]/2, startY + 15, { align: 'center' });

            // Render teacher / room metadata
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(100);

            let detailText = '';
            if (filterType === 'teacher' && room && sec) {
              detailText = `${sec.name} | R-${room.name}`;
            } else if (filterType === 'section' && teach && room) {
              detailText = `${teach.name.split(' ').pop()} | R-${room.name}`;
            } else if (filterType === 'room' && teach && sec) {
              detailText = `${teach.name.split(' ').pop()} | ${sec.name}`;
            } else {
              detailText = `${teach?.name.split(' ').pop() || ''}`;
            }
            if (detailText.length > 22) {
              detailText = detailText.substring(0, 20) + '..';
            }
            doc.text(detailText, cellX + colWidths[1]/2, startY + 28, { align: 'center' });
          } else {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(6.5);
            doc.setTextColor(180);
            doc.text('Unassigned', cellX + colWidths[1]/2, startY + 24, { align: 'center' });
          }
        });

        startY += rowHeight;
      }
    });

    // Approved Signatures Section
    startY += 30;
    doc.setLineWidth(0.5);
    doc.setDrawColor(180);

    // Left Sign line
    doc.line(80, startY + 20, 240, startY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40);
    const leftName = filterType === 'teacher' ? (meta.name || '') : 'ENNA F. GLER';
    doc.text(leftName, 160, startY + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('PREPARED & SUBMITTED BY', 160, startY + 30, { align: 'center' });

    // Right Sign line
    doc.line(350, startY + 20, 510, startY + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(40);
    doc.text('SHIELA MAE P. MENDOZA', 430, startY + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('APPROVED SCHOOL PRINCIPAL I', 430, startY + 30, { align: 'center' });

    // Save the PDF file
    const safeTitle = (meta.name || 'document').replace(/\s+/g, '_');
    const fileName = `${safeTitle}_Schedule_Term_${activeTerm}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">
      {/* Selector Control Panel (Hidden during print) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {role === 'TEACHER' ? (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 rounded-xl border border-indigo-150 dark:border-indigo-900/65 font-sans">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Simulating Lock: <strong className="font-extrabold">{meta.name}</strong> • Private teaching timetable</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleFilterTypeChange('section')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  filterType === 'section'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Section Schedules
              </button>

              <button
                onClick={() => handleFilterTypeChange('teacher')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  filterType === 'teacher'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Teacher Programs
              </button>

              <button
                onClick={() => handleFilterTypeChange('room')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                  filterType === 'room'
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-900'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Room Timetables
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {role !== 'TEACHER' && (
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-250 focus:outline-indigo-500 w-full sm:w-48 font-semibold"
              >
                {filterType === 'section' &&
                  sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                {filterType === 'teacher' &&
                  teachers.map((teach) => (
                    <option key={teach.id} value={teach.id}>
                      {teach.name}
                    </option>
                  ))}
                {filterType === 'room' &&
                  rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name}
                    </option>
                  ))}
              </select>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-sm transition shrink-0 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Program
            </button>

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition shrink-0 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" />
              Download as PDF
            </button>
          </div>
        </div>
      </div>

      {/* Official Government Print Document Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md p-8 max-w-4xl mx-auto print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        
        {/* DepEd Official Header */}
        <div className="text-center space-y-1 mb-8 border-b-2 border-slate-800 dark:border-slate-700 pb-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-450 leading-none">Republic of the Philippines</p>
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-700 dark:text-slate-300">Department of Education</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-serif italic">Region VIII - Eastern Visayas</p>
          <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Schools Division of Biliran</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-450 uppercase tracking-wider">Caibiran District II</p>
          
          <h1 className="text-base font-display font-extrabold text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
            ICT HIGH SCHOOL OF EASTERN BILIRAN
          </h1>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">School Year 2024-2025 • Term {activeTerm} Schedule</p>
        </div>

        {/* Selected Program Meta Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800 mb-6 print:bg-white print:border-slate-800 print:rounded-none">
          <div>
            <span className="text-[9px] uppercase font-mono bg-indigo-500 text-white px-2 py-0.5 rounded font-bold print:hidden">
              {filterType} program
            </span>
            <h2 className="text-lg font-display font-bold text-slate-800 dark:text-slate-200 mt-1 print:text-black">{meta.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans print:text-black">{meta.subtitle}</p>
          </div>

          <div className="text-left sm:text-right font-mono text-[10px] text-slate-400 dark:text-slate-500 space-y-0.5 print:text-black">
            <p>DOC-ID: H-SCH-2024-00{activeTerm}</p>
            <p>APPROVED: Caibiran Dist II Admin</p>
            <p>STATUS: OFFICIAL DOCUMENT</p>
          </div>
        </div>

        {/* Weekly Micro Grid timetable */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-collapse border-slate-200 dark:border-slate-800">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 print:bg-white print:border-slate-800">
                <th className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 w-32 font-display uppercase tracking-widest font-bold text-[10px] text-slate-700 dark:text-slate-300">
                  Time Blocks
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 text-center font-display uppercase tracking-wider font-bold text-[10px] text-slate-700 dark:text-slate-300"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => {
                if (slot.isBreak) {
                  return (
                    <tr
                      key={slot.id}
                      className="bg-slate-50/80 dark:bg-slate-950/40 text-center font-mono text-[9px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-semibold print:bg-white print:border-black"
                    >
                      <td className="py-1.5 px-3 border border-slate-200 dark:border-slate-800 font-semibold text-slate-550 dark:text-slate-450">
                        {slot.startTime} - {slot.endTime}
                      </td>
                      <td colSpan={5} className="py-1.5 px-3 border border-slate-200 dark:border-slate-800">
                        {slot.label}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={slot.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40 divide-y divide-slate-100 dark:divide-slate-850 print:hover:bg-none">
                    <td className="py-3 px-3 border border-slate-200 dark:border-slate-800 font-mono text-[10px] bg-slate-50/50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 font-semibold">
                      {slot.startTime} - {slot.endTime}
                    </td>

                    {days.map((day) => {
                      const entry = getEntryForCell(day, slot.id);
                      if (!entry) {
                        return (
                          <td
                            key={day}
                            className="py-3 px-3 border border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-300 dark:text-slate-700 font-serif italic"
                          >
                            Unscheduled
                          </td>
                        );
                      }

                      const subj = subjects.find((s) => s.id === entry.subjectId);
                      const teach = teachers.find((t) => t.id === entry.teacherId);
                      const room = rooms.find((r) => r.id === entry.roomId);
                      const sec = sections.find((s) => s.id === entry.sectionId);

                      return (
                        <td
                          key={day}
                          className="py-2.5 px-3 border border-slate-200 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300 font-sans text-center rounded-sm print:bg-white print:border-black print:text-black"
                        >
                          <div className="font-semibold text-xs text-indigo-900 dark:text-indigo-200 leading-tight print:text-black">
                            {subj ? subj.name : 'Unknown Course'}
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-center gap-1 mt-1 text-[9px] text-indigo-700/80 dark:text-indigo-400 font-medium print:text-black font-mono">
                            {filterType !== 'teacher' && teach && (
                              <span className="bg-white/80 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 px-1 rounded-sm print:border-none">
                                {teach.name}
                              </span>
                            )}
                            {filterType !== 'room' && room && (
                              <span className="bg-white/80 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950/60 px-1 rounded-sm print:border-none">
                                {room.name}
                              </span>
                            )}
                            {filterType !== 'section' && sec && (
                              <span className="bg-indigo-100 dark:bg-indigo-900 border border-indigo-100 dark:border-indigo-950/60 px-1 rounded-sm print:border-none font-sans font-bold text-indigo-900 dark:text-indigo-200 uppercase">
                                {sec.name.replace('G', 'GR ')}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Verification Sign-offs */}
        <div className="mt-12 pt-8 border-t border-dashed border-slate-300 dark:border-slate-800 grid grid-cols-2 gap-8 text-center text-xs text-slate-500 dark:text-slate-400 font-sans print:text-black print:border-black">
          <div className="space-y-4">
            <p className="font-bold border-b border-slate-400 dark:border-slate-700 pb-1 max-w-[200px] mx-auto uppercase">
              {filterType === 'teacher' ? meta.name : 'ENNA F. GLER'}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Prepared &amp; Submitted By</p>
          </div>
          <div className="space-y-4">
            <p className="font-bold border-b border-slate-400 dark:border-slate-700 pb-1 max-w-[200px] mx-auto uppercase text-slate-800 dark:text-slate-300">
              SHIELA MAE P. MENDOZA
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Approved School Principal I</p>
          </div>
        </div>

        {/* Printer Friendly Footnote */}
        <p className="text-center text-[10px] text-slate-300 dark:text-slate-650 mt-10 print:hidden font-serif">
          Official School Form schedule exports fully comply with Department of Education administrative regulations. Click printer icon to print directly.
        </p>
      </div>
    </div>
  );
};
