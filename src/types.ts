export type GradeLevel = 7 | 8 | 9 | 10;

export interface Teacher {
  id: string;
  name: string;
  subjects: string[]; // Subject IDs they can teach
  color: string;      // Tailind color badge style, e.g. 'indigo'
  targetMinutes: number; // target workload in minutes per week for balanced load
  passcode?: string;     // custom login passcode for private schedules lock
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export interface Section {
  id: string;
  name: string;
  gradeLevel: GradeLevel;
  advisorId: string;    // Teacher ID who is advisor
  classroomId: string;  // Default Room ID
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  minutesPerWeek: number;
  gradeLevel: GradeLevel;
}

export interface TimeSlot {
  id: string;
  startTime: string; // "07:30"
  endTime: string;   // "08:30"
  label: string;     // "07:30 AM - 08:30 AM"
  isBreak: boolean;
}

export interface ScheduleEntry {
  id: string;
  term: 1 | 2 | 3;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  timeSlotId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
}

export interface Conflict {
  id: string;
  type: 'teacher' | 'room' | 'section';
  title: string;
  description: string;
  affectedIds: string[]; // List of entry IDs involved in the conflict
}
