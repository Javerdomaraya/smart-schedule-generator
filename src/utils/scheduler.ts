import { ScheduleEntry, Conflict, Teacher, Room, Section, Subject, TimeSlot } from '../types';

/**
 * Validates the full schedule for a given term.
 * Detects:
 * 1. Teacher double bookings (same term, active day, time slot, teacher)
 * 2. Room double bookings (same term, active day, time slot, room)
 * 3. Section double bookings (same term, active day, time slot, section)
 */
export function validateSchedule(
  schedule: ScheduleEntry[],
  term: 1 | 2 | 3,
  teachers: Teacher[],
  rooms: Room[],
  sections: Section[],
  subjects: Subject[]
): Conflict[] {
  const activeEntries = schedule.filter((e) => e.term === term);
  const conflicts: Conflict[] = [];

  // Group by unique keys to find duplicates
  // 1. Teacher bookings: Day + TimeSlot + TeacherID
  const teacherMap = new Map<string, ScheduleEntry[]>();
  // 2. Room bookings: Day + TimeSlot + RoomID
  const roomMap = new Map<string, ScheduleEntry[]>();
  // 3. Section bookings: Day + TimeSlot + SectionID
  const sectionMap = new Map<string, ScheduleEntry[]>();

  activeEntries.forEach((entry) => {
    if (!entry.teacherId || !entry.roomId || !entry.timeSlotId || !entry.sectionId) return;

    const tKey = `${entry.day}-${entry.timeSlotId}-${entry.teacherId}`;
    const rKey = `${entry.day}-${entry.timeSlotId}-${entry.roomId}`;
    const sKey = `${entry.day}-${entry.timeSlotId}-${entry.sectionId}`;

    if (!teacherMap.has(tKey)) teacherMap.set(tKey, []);
    teacherMap.get(tKey)!.push(entry);

    if (!roomMap.has(rKey)) roomMap.set(rKey, []);
    roomMap.get(rKey)!.push(entry);

    if (!sectionMap.has(sKey)) sectionMap.set(sKey, []);
    sectionMap.get(sKey)!.push(entry);
  });

  // Calculate teacher conflicts
  teacherMap.forEach((entries, key) => {
    if (entries.length > 1) {
      const teacher = teachers.find((t) => t.id === entries[0].teacherId);
      const name = teacher ? teacher.name : 'Unknown Teacher';
      const slotLabel = entries[0].day + ' ' + (entries[0].timeSlotId === 'ts-recess' ? 'Recess' : entries[0].timeSlotId === 'ts-lunch' ? 'Lunch' : `Slot`);
      
      const secNames = entries.map((e) => {
        const sec = sections.find((s) => s.id === e.sectionId);
        return sec ? sec.name : 'Unknown Section';
      }).join(' & ');

      conflicts.push({
        id: `t-conflict-${key}`,
        type: 'teacher',
        title: 'Teacher Double Booking',
        description: `${name} is scheduled to teach ${secNames} simultaneously on ${entries[0].day} during block ${entries[0].timeSlotId.replace('ts-', 'Period ')}.`,
        affectedIds: entries.map((e) => e.id),
      });
    }
  });

  // Calculate room conflicts
  roomMap.forEach((entries, key) => {
    if (entries.length > 1) {
      const room = rooms.find((r) => r.id === entries[0].roomId);
      const name = room ? room.name : 'Unknown Room';

      const secNames = entries.map((e) => {
        const sec = sections.find((s) => s.id === e.sectionId);
        const subj = subjects.find((sub) => sub.id === e.subjectId);
        return `${sec ? sec.name : 'Unknown Section'} (${subj ? subj.code : 'No Subject'})`;
      }).join(' and ');

      conflicts.push({
        id: `r-conflict-${key}`,
        type: 'room',
        title: 'Room Overlap',
        description: `${name} is occupied by ${secNames} at the same time on ${entries[0].day} during Period ${entries[0].timeSlotId.replace('ts-', '')}.`,
        affectedIds: entries.map((e) => e.id),
      });
    }
  });

  // Calculate section conflicts
  sectionMap.forEach((entries, key) => {
    if (entries.length > 1) {
      const section = sections.find((s) => s.id === entries[0].sectionId);
      const name = section ? section.name : 'Unknown Section';

      const details = entries.map((e) => {
        const subj = subjects.find((sub) => sub.id === e.subjectId);
        const teach = teachers.find((t) => t.id === e.teacherId);
        return `${subj ? subj.name : 'Unknown Subject'} (${teach ? teach.name : 'Teacher'})`;
      }).join(' vs ');

      conflicts.push({
        id: `s-conflict-${key}`,
        type: 'section',
        title: 'Section Double Booking',
        description: `Students in ${name} are assigned to multiple subjects simultaneously: ${details} on ${entries[0].day} during ${entries[0].timeSlotId.replace('ts-', 'Period ')}.`,
        affectedIds: entries.map((e) => e.id),
      });
    }
  });

  return conflicts;
}

/**
 * Calculates teaching load in minutes per week.
 * Each scheduled slot lasts 60 minutes.
 * Filtered by Term.
 */
export function calculateTeacherLoad(
  schedule: ScheduleEntry[],
  teacherId: string,
  term: 1 | 2 | 3
): number {
  return schedule
    .filter((e) => e.teacherId === teacherId && e.term === term)
    .reduce((sum) => sum + 60, 0); // 60 minutes per class period
}

/**
 * Intelligent deterministic local smart schedule builder
 * Tries to solve any existing conflicts, or generates a complete optimized schedule from scratch.
 */
export function autoBuildSchedule(
  currentSchedule: ScheduleEntry[],
  term: 1 | 2 | 3,
  teachers: Teacher[],
  rooms: Room[],
  sections: Section[],
  subjects: Subject[],
  timeSlots: TimeSlot[]
): ScheduleEntry[] {
  // We keep entries from other terms intact.
  const otherTermsSchedule = currentSchedule.filter((e) => e.term !== term);
  const updatedTermSchedule: ScheduleEntry[] = [];

  const days: ScheduleEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const activeSlots = timeSlots.filter((ts) => !ts.isBreak);

  // For each section, let's schedule their appropriate grade level subjects!
  sections.forEach((section) => {
    // Collect subjects for this grade level
    const gradeSubjects = subjects.filter((sub) => sub.gradeLevel === section.gradeLevel);
    if (gradeSubjects.length === 0) return;

    let subjectIndex = 0;

    days.forEach((day) => {
      activeSlots.forEach((slot, slotIndex) => {
        // Find a subject that this section needs to cover
        // We will cycle through grade subjects
        const subject = gradeSubjects[(subjectIndex + slotIndex) % gradeSubjects.length];
        
        // Find a teacher qualified to teach this subject
        const qualifiedTeacher = teachers.find((t) => t.subjects.includes(subject.id));
        if (!qualifiedTeacher) return;

        // Find standard room for this section
        const room = rooms.find((r) => r.id === section.classroomId) || rooms[0];

        // Check did the teacher already teach this slot, day, term in our updatedTermSchedule?
        const isTeacherBusy = updatedTermSchedule.some(
          (e) => e.term === term && e.day === day && e.timeSlotId === slot.id && e.teacherId === qualifiedTeacher.id
        );

        // Check is room already occupied?
        const isRoomBusy = updatedTermSchedule.some(
          (e) => e.term === term && e.day === day && e.timeSlotId === slot.id && e.roomId === room.id
        );

        // Standard assignment
        if (!isTeacherBusy && !isRoomBusy) {
          updatedTermSchedule.push({
            id: `auto-${section.id}-${day}-${slot.id}-${term}`,
            term,
            day,
            timeSlotId: slot.id,
            sectionId: section.id,
            subjectId: subject.id,
            teacherId: qualifiedTeacher.id,
            roomId: room.id,
          });
        } else {
          // Find alternative teacher or alternative room if possible
          const fallbackRoom = rooms.find(
            (r) => !updatedTermSchedule.some((e) => e.term === term && e.day === day && e.timeSlotId === slot.id && e.roomId === r.id)
          );
          if (fallbackRoom && !isTeacherBusy) {
            updatedTermSchedule.push({
              id: `auto-${section.id}-${day}-${slot.id}-${term}`,
              term,
              day,
              timeSlotId: slot.id,
              sectionId: section.id,
              subjectId: subject.id,
              teacherId: qualifiedTeacher.id,
              roomId: fallbackRoom.id,
            });
          }
        }
      });
      subjectIndex++;
    });
  });

  return [...otherTermsSchedule, ...updatedTermSchedule];
}

/**
 * Quick helper to resolve current conflicts in place
 * This inspects each conflict, and moves/re-assigns elements to solve issues.
 */
export function resolveConflictsInPlace(
  schedule: ScheduleEntry[],
  term: 1 | 2 | 3,
  teachers: Teacher[],
  rooms: Room[],
  sections: Section[],
  subjects: Subject[],
  timeSlots: TimeSlot[]
): ScheduleEntry[] {
  // Let's resolve the current schedule for the term by checking conflicts
  // A robust approach is to keep non-conflicting items, and for conflicting ones, find free slots, rooms, or teachers
  let solvedSchedule = [...schedule];
  let tries = 0;
  const maxTries = 15;

  while (tries < maxTries) {
    const conflicts = validateSchedule(solvedSchedule, term, teachers, rooms, sections, subjects);
    if (conflicts.length === 0) break;

    // Pick first conflict and fix it
    const conflict = conflicts[0];
    const affectedEntryIds = conflict.affectedIds;
    if (affectedEntryIds.length < 2) break;

    // We can solve by moving the second affected entry's time slot, room, or teacher
    const offenderId = affectedEntryIds[1];
    const offenderIdx = solvedSchedule.findIndex((e) => e.id === offenderId);

    if (offenderIdx !== -1) {
      const offender = solvedSchedule[offenderIdx];

      if (conflict.type === 'teacher') {
        // Teacher double booked. Find an alternate teacher who teaches the same subject and is free at this slot.
        const subject = subjects.find((s) => s.id === offender.subjectId);
        const alternateTeacher = teachers.find(
          (t) =>
            t.id !== offender.teacherId &&
            t.subjects.includes(offender.subjectId) &&
            !solvedSchedule.some((e) => e.term === term && e.day === offender.day && e.timeSlotId === offender.timeSlotId && e.teacherId === t.id)
        );

        if (alternateTeacher) {
          solvedSchedule[offenderIdx] = { ...offender, teacherId: alternateTeacher.id };
        } else {
          // No alternate teacher free. Move offender to a different slot that is free for both section, teacher and room
          const availableSlot = timeSlots.find(
            (ts) =>
              !ts.isBreak &&
              !solvedSchedule.some((e) => e.term === term && e.day === offender.day && e.timeSlotId === ts.id && (e.sectionId === offender.sectionId || e.teacherId === offender.teacherId || e.roomId === offender.roomId))
          );
          if (availableSlot) {
            solvedSchedule[offenderIdx] = { ...offender, timeSlotId: availableSlot.id };
          } else {
            // Drop scheduling item as last resort to resolve conflict
            solvedSchedule.splice(offenderIdx, 1);
          }
        }
      } else if (conflict.type === 'room') {
        // Room double booked. Let's find an unoccupied room.
        const alternateRoom = rooms.find(
          (r) =>
            !solvedSchedule.some((e) => e.term === term && e.day === offender.day && e.timeSlotId === offender.timeSlotId && e.roomId === r.id)
        );
        if (alternateRoom) {
          solvedSchedule[offenderIdx] = { ...offender, roomId: alternateRoom.id };
        } else {
          // Move time slot
          const availableSlot = timeSlots.find(
            (ts) =>
              !ts.isBreak &&
              !solvedSchedule.some((e) => e.term === term && e.day === offender.day && e.timeSlotId === ts.id && (e.sectionId === offender.sectionId || e.teacherId === offender.teacherId || e.roomId === offender.roomId))
          );
          if (availableSlot) {
            solvedSchedule[offenderIdx] = { ...offender, timeSlotId: availableSlot.id };
          } else {
            solvedSchedule.splice(offenderIdx, 1);
          }
        }
      } else if (conflict.type === 'section') {
        // Section double booked. Move to a completely free timeslot
        const availableSlot = timeSlots.find(
          (ts) =>
            !ts.isBreak &&
            !solvedSchedule.some((e) => e.term === term && e.day === offender.day && e.timeSlotId === ts.id && (e.sectionId === offender.sectionId || e.teacherId === offender.teacherId || e.roomId === offender.roomId))
        );
        if (availableSlot) {
          solvedSchedule[offenderIdx] = { ...offender, timeSlotId: availableSlot.id };
        } else {
          solvedSchedule.splice(offenderIdx, 1);
        }
      }
    }
    tries++;
  }

  return solvedSchedule;
}
