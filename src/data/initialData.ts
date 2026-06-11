import { Teacher, Room, Section, Subject, TimeSlot, ScheduleEntry } from '../types';

export const initialSubjects: Subject[] = [
  // Grade 7 Subjects
  { id: 'sub-fil7', name: 'Filipino 7', code: 'FIL-7', minutesPerWeek: 240, gradeLevel: 7 },
  { id: 'sub-eng7', name: 'English 7', code: 'ENG-7', minutesPerWeek: 240, gradeLevel: 7 },
  { id: 'sub-mat7', name: 'Mathematics 7', code: 'MATH-7', minutesPerWeek: 240, gradeLevel: 7 },
  { id: 'sub-sci7', name: 'Science 7', code: 'SCI-7', minutesPerWeek: 240, gradeLevel: 7 },
  { id: 'sub-ap7', name: 'Araling Panlipunan 7', code: 'AP-7', minutesPerWeek: 180, gradeLevel: 7 },
  { id: 'sub-tle7', name: 'TLE 7', code: 'TLE-7', minutesPerWeek: 240, gradeLevel: 7 },
  { id: 'sub-map7', name: 'MAPEH 7', code: 'MAP-7', minutesPerWeek: 240, gradeLevel: 7 },
  { id: 'sub-esp7', name: 'EsP 7 (Values Ed)', code: 'ESP-7', minutesPerWeek: 120, gradeLevel: 7 },

  // Grade 8 Subjects
  { id: 'sub-fil8', name: 'Filipino 8', code: 'FIL-8', minutesPerWeek: 240, gradeLevel: 8 },
  { id: 'sub-eng8', name: 'English 8', code: 'ENG-8', minutesPerWeek: 240, gradeLevel: 8 },
  { id: 'sub-mat8', name: 'Mathematics 8', code: 'MATH-8', minutesPerWeek: 240, gradeLevel: 8 },
  { id: 'sub-sci8', name: 'Science 8', code: 'SCI-8', minutesPerWeek: 240, gradeLevel: 8 },
  { id: 'sub-ap8', name: 'Araling Panlipunan 8', code: 'AP-8', minutesPerWeek: 180, gradeLevel: 8 },
  { id: 'sub-tle8', name: 'TLE 8', code: 'TLE-8', minutesPerWeek: 240, gradeLevel: 8 },
  { id: 'sub-map8', name: 'MAPEH 8', code: 'MAP-8', minutesPerWeek: 240, gradeLevel: 8 },
  { id: 'sub-esp8', name: 'EsP 8', code: 'ESP-8', minutesPerWeek: 120, gradeLevel: 8 },

  // Grade 9 Subjects
  { id: 'sub-fil9', name: 'Filipino 9', code: 'FIL-9', minutesPerWeek: 240, gradeLevel: 9 },
  { id: 'sub-eng9', name: 'English 9', code: 'ENG-9', minutesPerWeek: 240, gradeLevel: 9 },
  { id: 'sub-mat9', name: 'Mathematics 9', code: 'MATH-9', minutesPerWeek: 240, gradeLevel: 9 },
  { id: 'sub-sci9', name: 'Science 9', code: 'SCI-9', minutesPerWeek: 240, gradeLevel: 9 },
  { id: 'sub-ap9', name: 'Araling Panlipunan 9', code: 'AP-9', minutesPerWeek: 180, gradeLevel: 9 },
  { id: 'sub-tle9', name: 'TLE 9', code: 'TLE-9', minutesPerWeek: 240, gradeLevel: 9 },
  { id: 'sub-map9', name: 'MAPEH 9', code: 'MAP-9', minutesPerWeek: 240, gradeLevel: 9 },
  { id: 'sub-esp9', name: 'EsP 9', code: 'ESP-9', minutesPerWeek: 120, gradeLevel: 9 },

  // Grade 10 Subjects
  { id: 'sub-fil10', name: 'Filipino 10', code: 'FIL-10', minutesPerWeek: 240, gradeLevel: 10 },
  { id: 'sub-eng10', name: 'English 10', code: 'ENG-10', minutesPerWeek: 240, gradeLevel: 10 },
  { id: 'sub-mat10', name: 'Mathematics 10', code: 'MATH-10', minutesPerWeek: 240, gradeLevel: 10 },
  { id: 'sub-sci10', name: 'Science 10', code: 'SCI-10', minutesPerWeek: 240, gradeLevel: 10 },
  { id: 'sub-ap10', name: 'Araling Panlipunan 10', code: 'AP-10', minutesPerWeek: 180, gradeLevel: 10 },
  { id: 'sub-tle10', name: 'TLE 10', code: 'TLE-10', minutesPerWeek: 240, gradeLevel: 10 },
  { id: 'sub-map10', name: 'MAPEH 10', code: 'MAP-10', minutesPerWeek: 240, gradeLevel: 10 },
  { id: 'sub-esp10', name: 'EsP 10', code: 'ESP-10', minutesPerWeek: 120, gradeLevel: 10 },
];

export const initialTeachers: Teacher[] = [
  { id: 't-enna', name: 'Enna F. Gler', subjects: ['sub-tle7', 'sub-tle8'], color: 'emerald', targetMinutes: 300 },
  { id: 't-hernan', name: 'Hernan B. Baquero', subjects: ['sub-ap7', 'sub-ap8'], color: 'amber', targetMinutes: 300 },
  { id: 't-marjorie', name: 'Marjorie Avila', subjects: ['sub-map7', 'sub-map9', 'sub-map10'], color: 'fuchsia', targetMinutes: 360 },
  { id: 't-juvy', name: 'Juvy V. Cañete', subjects: ['sub-sci8'], color: 'cyan', targetMinutes: 240 },
  { id: 't-marianne', name: 'Marianne Colissa G. Bunani', subjects: ['sub-fil9', 'sub-tle8', 'sub-esp8'], color: 'indigo', targetMinutes: 360 },
  { id: 't-daisy', name: 'Daisy V. Vergara', subjects: ['sub-sci9'], color: 'teal', targetMinutes: 240 },
  { id: 't-regielyn', name: 'Regielyn N. Dedil', subjects: ['sub-sci7', 'sub-sci10'], color: 'sky', targetMinutes: 300 },
  { id: 't-lianne', name: 'Lianne Mae S. Gervacio', subjects: ['sub-ap9', 'sub-ap10', 'sub-esp10'], color: 'purple', targetMinutes: 360 },
  { id: 't-reynaldo', name: 'Reynaldo Q. Ramos', subjects: ['sub-esp7', 'sub-tle9', 'sub-tle10'], color: 'orange', targetMinutes: 360 },
  { id: 't-robert', name: 'Robert A. Lanante', subjects: ['sub-mat10'], color: 'pink', targetMinutes: 240 },
  { id: 't-dalisay', name: 'Maria Dalisay R. Abordo', subjects: ['sub-mat10'], color: 'rose', targetMinutes: 240 },
  { id: 't-estefhanie', name: 'Estefhanie I. Beltran', subjects: ['sub-mat7', 'sub-mat8'], color: 'blue', targetMinutes: 300 },
  { id: 't-julius', name: 'Julius E. Ibag', subjects: ['sub-mat9', 'sub-mat10'], color: 'violet', targetMinutes: 300 },
  { id: 't-liza', name: 'Liza Marie P. Rosendal', subjects: ['sub-fil7', 'sub-fil10'], color: 'lime', targetMinutes: 300 },
  { id: 't-shiela', name: 'Shiela Mae P. Mendoza', subjects: ['sub-eng7', 'sub-eng10'], color: 'red', targetMinutes: 300 },
  { id: 't-jerrysa', name: 'Jerrysa U. Saraosos', subjects: ['sub-eng8', 'sub-eng9'], color: 'yellow', targetMinutes: 300 },
  { id: 't-nelsa', name: 'Ma. Nelsa A. Rostata', subjects: ['sub-esp9', 'sub-fil8'], color: 'emerald', targetMinutes: 300 },
];

export const initialRooms: Room[] = [
  { id: 'r-101', name: 'Room 101 - IT Lab', capacity: 40 },
  { id: 'r-102', name: 'Room 102 - Lecture A', capacity: 35 },
  { id: 'r-103', name: 'Room 103 - Lecture B', capacity: 35 },
  { id: 'r-104', name: 'Room 104 - Lecture C', capacity: 35 },
  { id: 'r-201', name: 'Room 201 - Science Lab', capacity: 40 },
  { id: 'r-202', name: 'Room 202 - Work Shop', capacity: 35 },
  { id: 'r-203', name: 'Room 203 - Shared Hall', capacity: 50 },
  { id: 'r-204', name: 'Room 204 - Audio Visual', capacity: 45 },
];

export const initialSections: Section[] = [
  // Grade 7
  { id: 'sec-g7ie', name: 'G7 - Internet Explorer', gradeLevel: 7, advisorId: 't-shiela', classroomId: 'r-101' },
  { id: 'sec-g7me', name: 'G7 - Microsoft Edge', gradeLevel: 7, advisorId: 't-liza', classroomId: 'r-102' },

  // Grade 8
  { id: 'sec-g8ko', name: 'G8 - Konqueror', gradeLevel: 8, advisorId: 't-hernan', classroomId: 'r-103' },
  { id: 'sec-g8ne', name: 'G8 - Netscape', gradeLevel: 8, advisorId: 't-enna', classroomId: 'r-104' },

  // Grade 9
  { id: 'sec-g9ma', name: 'G9 - Maxthon', gradeLevel: 9, advisorId: 't-jerrysa', classroomId: 'r-201' },
  { id: 'sec-g9op', name: 'G9 - Opera Mini', gradeLevel: 9, advisorId: 't-nelsa', classroomId: 'r-202' },

  // Grade 10
  { id: 'sec-g10ly', name: 'G10 - Lynx', gradeLevel: 10, advisorId: 't-marjorie', classroomId: 'r-203' },
  { id: 'sec-g10vi', name: 'G10 - Vivaldi', gradeLevel: 10, advisorId: 't-reynaldo', classroomId: 'r-204' },
];

export const initialTimeSlots: TimeSlot[] = [
  { id: 'ts-1', startTime: '07:30', endTime: '08:30', label: '07:30 AM - 08:30 AM', isBreak: false },
  { id: 'ts-2', startTime: '08:30', endTime: '09:30', label: '08:30 AM - 09:30 AM', isBreak: false },
  { id: 'ts-recess', startTime: '09:30', endTime: '09:45', label: '09:30 AM - 09:45 AM (Recess)', isBreak: true },
  { id: 'ts-3', startTime: '09:45', endTime: '10:45', label: '09:45 AM - 10:45 AM', isBreak: false },
  { id: 'ts-4', startTime: '10:45', endTime: '11:45', label: '10:45 AM - 11:45 AM', isBreak: false },
  { id: 'ts-lunch', startTime: '11:45', endTime: '01:00', label: '11:45 AM - 01:00 PM (Lunch Break)', isBreak: true },
  { id: 'ts-5', startTime: '01:00', endTime: '02:00', label: '01:00 PM - 02:00 PM', isBreak: false },
  { id: 'ts-6', startTime: '02:00', endTime: '03:00', label: '02:00 PM - 03:00 PM', isBreak: false },
  { id: 'ts-7', startTime: '03:15', endTime: '04:15', label: '03:15 PM - 04:15 PM', isBreak: false },
];

// Helper to generate some beautiful schedule records
export const getPrepopulatedSchedule = (): ScheduleEntry[] => {
  const schedule: ScheduleEntry[] = [];
  const days: ScheduleEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Let's fill out Term 1 systematiaclly. We can also replicate some to Term 2 and 3 with different courses.
  // We'll populate some default entries to make the dashboard alive instantly and contain some manageable conflicts so the user can see.
  
  // Section G7IE (Grade 7 Internet Explorer)
  days.forEach((day, index) => {
    // Session 1: English 7 with Shiela in room 101
    schedule.push({
      id: `se-g7ie-1-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-1',
      sectionId: 'sec-g7ie',
      subjectId: 'sub-eng7',
      teacherId: 't-shiela',
      roomId: 'r-101',
    });

    // Session 2: Math 7 with Estefhanie in room 101
    schedule.push({
      id: `se-g7ie-2-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-2',
      sectionId: 'sec-g7ie',
      subjectId: 'sub-mat7',
      teacherId: 't-estefhanie',
      roomId: 'r-101',
    });

    // Session 3: Science 7 with Regielyn in room 201
    schedule.push({
      id: `se-g7ie-3-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-3',
      sectionId: 'sec-g7ie',
      subjectId: 'sub-sci7',
      teacherId: 't-regielyn',
      roomId: 'r-201',
    });

    // Session 4: MAPEH 7 with Marjorie in room 101
    schedule.push({
      id: `se-g7ie-4-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-4',
      sectionId: 'sec-g7ie',
      subjectId: 'sub-map7',
      teacherId: 't-marjorie',
      roomId: 'r-101',
    });
  });

  // Section G7ME (Grade 7 Microsoft Edge)
  days.forEach((day, index) => {
    if (day !== 'Friday') {
      // Session 1: Filipino 7 with Liza in room 102
      schedule.push({
        id: `se-g7me-1-${day}`,
        term: 1,
        day,
        timeSlotId: 'ts-1',
        sectionId: 'sec-g7me',
        subjectId: 'sub-fil7',
        teacherId: 't-liza',
        roomId: 'r-102',
      });
    }

    // Session 2: TLE 7 with Enna in room 102
    schedule.push({
      id: `se-g7me-2-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-2',
      sectionId: 'sec-g7me',
      subjectId: 'sub-tle7',
      teacherId: 't-enna',
      roomId: 'r-102',
    });

    // Session 3: Math 7 with Estefhanie in room 102
    schedule.push({
      id: `se-g7me-3-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-3',
      sectionId: 'sec-g7me',
      subjectId: 'sub-mat7',
      teacherId: 't-estefhanie',
      roomId: 'r-102',
    });
  });

  // Section G8KO (Grade 8 Konqueror)
  days.forEach((day) => {
    // Session 1: AP 8 with Hernan in room 103
    schedule.push({
      id: `se-g8ko-1-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-1',
      sectionId: 'sec-g8ko',
      subjectId: 'sub-ap8',
      teacherId: 't-hernan',
      roomId: 'r-103',
    });

    // Session 2: Math 8 with Estefhanie in room 103 (Wait, Estefhanie is at G7ME session 3 and G7IE session 2, so ts-4 is fine)
    schedule.push({
      id: `se-g8ko-4-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-4',
      sectionId: 'sec-g8ko',
      subjectId: 'sub-mat8',
      teacherId: 't-estefhanie',
      roomId: 'r-103',
    });

    // Session 3: Science 8 with Juvy in room 201
    schedule.push({
      id: `se-g8ko-5-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-5',
      sectionId: 'sec-g8ko',
      subjectId: 'sub-sci8',
      teacherId: 't-juvy',
      roomId: 'r-201',
    });
  });

  // Let's add standard entries for other sections as well
  // G8NE (Netscape)
  days.forEach((day, index) => {
    // Session 1: Filipino 8 with Nelsa in room 104
    schedule.push({
      id: `se-g8ne-1-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-1',
      sectionId: 'sec-g8ne',
      subjectId: 'sub-fil8',
      teacherId: 't-nelsa',
      roomId: 'r-104',
    });

    // Session 2: TLE 8 with Marianne in room 104
    schedule.push({
      id: `se-g8ne-2-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-2',
      sectionId: 'sec-g8ne',
      subjectId: 'sub-tle8',
      teacherId: 't-marianne',
      roomId: 'r-104',
    });
  });

  // G9MA (Maxthon)
  days.slice(0, 4).forEach((day) => { // Monday to Thursday
    // Session 3: Science 9 with Daisy in room 201
    schedule.push({
      id: `se-g10ly-3-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-3',
      sectionId: 'sec-g9ma',
      subjectId: 'sub-sci9',
      teacherId: 't-daisy',
      roomId: 'r-201',
    });

    // Session 5: English 9 with Jerrysa in room 201
    schedule.push({
      id: `se-g9ma-5-${day}`,
      term: 1,
      day,
      timeSlotId: 'ts-5',
      sectionId: 'sec-g9ma',
      subjectId: 'sub-eng9',
      teacherId: 't-jerrysa',
      roomId: 'r-201',
    });
  });

  // INTENTIONAL CONFLICT 1: Teacher double booking
  // Estefhanie scheduled for both G7IE and G7ME on Monday slot ts-2 (originally G7ME-2 is Marianne, let's schedule Estefhanie there to make a conflict)
  schedule.push({
    id: `se-conflict-teacher`,
    term: 1,
    day: 'Monday',
    timeSlotId: 'ts-2',
    sectionId: 'sec-g7me',
    subjectId: 'sub-mat7',
    teacherId: 't-estefhanie', // Estefhanie is already at ts-2 for g7ie!
    roomId: 'r-102',
  });

  // INTENTIONAL CONFLICT 2: Room double booking
  // Room 201 scheduled for both G7IE (sub-sci7 with Regielyn) and G8KO (sub-sci8 with Juvy) at Monday ts-3
  schedule.push({
    id: `se-conflict-room`,
    term: 1,
    day: 'Monday',
    timeSlotId: 'ts-3',
    sectionId: 'sec-g8ko',
    subjectId: 'sub-sci8',
    teacherId: 't-juvy',
    roomId: 'r-201', // Room 201 is already taken by G7IE at Monday ts-3!
  });

  // INTENTIONAL CONFLICT 3: Section Double Booking (G9MA has sub-sci9 and sub-tle9 at ts-3 on Tuesday)
  schedule.push({
    id: `se-conflict-section`,
    term: 1,
    day: 'Tuesday',
    timeSlotId: 'ts-3',
    sectionId: 'sec-g9ma',
    subjectId: 'sub-tle9',
    teacherId: 't-reynaldo',
    roomId: 'r-202', // 201 is taken, this is a section conflict
  });

  // Setup some distinct schedules for Term 2 and Term 3 as well
  days.forEach((day) => {
    // Term 2 - G7IE English
    schedule.push({
      id: `se_t2-g7ie-1-${day}`,
      term: 2,
      day,
      timeSlotId: 'ts-1',
      sectionId: 'sec-g7ie',
      subjectId: 'sub-eng7',
      teacherId: 't-shiela',
      roomId: 'r-101',
    });
    // Term 3 - G7IE Math
    schedule.push({
      id: `se_t3-g7ie-2-${day}`,
      term: 3,
      day,
      timeSlotId: 'ts-2',
      sectionId: 'sec-g7ie',
      subjectId: 'sub-mat7',
      teacherId: 't-estefhanie',
      roomId: 'r-101',
    });
  });

  return schedule;
};
