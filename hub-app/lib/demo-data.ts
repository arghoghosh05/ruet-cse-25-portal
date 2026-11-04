export const demoWeek = "12–18 October 2026";

export const notices = [
  {
    id: "notice-1",
    category: "Academic",
    title: "Data Structures & Algorithms Lab Schedule Update",
    body: "The upcoming Lab Session for CSE 2202 will be conducted in Software Lab 2. Please ensure your GitHub repositories are initialized prior to class.",
    date: "08 Oct 2026",
    pinned: true,
  },
  {
    id: "notice-2",
    category: "General",
    title: "Mid-Term Examination Routine & Class Test (CT-2) Schedule",
    body: "The department exam committee has finalized the schedule for CT-2 across all sections. Check your Academic Deadlines tab for specific syllabus scopes.",
    date: "07 Oct 2026",
    pinned: false,
  },
  {
    id: "notice-3",
    category: "Event",
    title: "RUET CSE '25 Intra-Batch Competitive Programming Contest",
    body: "Registration is open for the Intra-Batch Programming Contest on VJudge. Organized by the batch CRs and Competitive Programming wing.",
    date: "05 Oct 2026",
    pinned: false,
  },
  {
    id: "notice-4",
    category: "Urgent",
    title: "Database Systems Lab Project Submission Deadline Extended",
    body: "Per faculty approval, the preliminary ERD & Schema submission deadline for CSE 2208 is extended to Thursday, 11:59 PM.",
    date: "03 Oct 2026",
    pinned: false,
  },
] as const;
export const schedule = [
  { id: "class-1", day: "Monday", start: "09:00", end: "10:00", course: "Data Structures", code: "CSE 2201", room: "Room 301, CSE Dept", teacher: "Prof. Dr. Md. Al-Amin" },
  { id: "class-2", day: "Monday", start: "10:15", end: "11:15", course: "Digital Logic Design", code: "CSE 2203", room: "Room 204, CSE Dept", teacher: "Dr. Boshir Ahmed" },
  { id: "class-3", day: "Tuesday", start: "11:00", end: "12:00", course: "Algorithms", code: "CSE 2205", room: "Room 301, CSE Dept", teacher: "Prof. Dr. Md. Al-Amin" },
  { id: "class-4", day: "Wednesday", start: "09:30", end: "10:30", course: "Database Systems", code: "CSE 2207", room: "Software Lab 2", teacher: "Dr. Boshir Ahmed" },
  { id: "class-5", day: "Thursday", start: "12:00", end: "13:00", course: "Technical Writing", code: "HUM 2201", room: "Room 105, New Academic", teacher: "Asst. Prof. Sadia Tasnim" },
  { id: "class-6", day: "Saturday", start: "10:00", end: "11:00", course: "Algorithms", code: "CSE 2205", room: "Room 301, CSE Dept", teacher: "Prof. Dr. Md. Al-Amin" },
] as const;

export const academicWork = [
  {
    id: "work-1",
    type: "Assignment",
    course: "Data Structures",
    code: "CSE 2201",
    title: "Graph Traversal & BFS/DFS Implementation",
    due: "2026-10-12T23:00:00+06:00",
    dueLabel: "Mon, 12 Oct · 11:00 PM",
    section: "All sections",
    description: "Implement adjacency list representation and cycle detection in undirected graphs using C++ STL.",
  },
  {
    id: "work-2",
    type: "CT",
    course: "Digital Logic Design",
    code: "CSE 2203",
    title: "Class Test 2: Karnaugh Maps & Sequential Circuits",
    due: "2026-10-14T10:00:00+06:00",
    dueLabel: "Wed, 14 Oct · 10:00 AM",
    section: "Section A",
    description: "Covers Chapter 4–6: Flip-flops, Synchronous Counters, and State Reduction techniques.",
  },
  {
    id: "work-3",
    type: "Homework",
    course: "Algorithms",
    code: "CSE 2205",
    title: "Divide & Conquer: Master Theorem Problem Set",
    due: "2026-10-15T22:00:00+06:00",
    dueLabel: "Thu, 15 Oct · 10:00 PM",
    section: "All sections",
    description: "Solve problems 1 through 8 from CLRS Chapter 4. Submit handwritten or LaTeX PDF.",
  },
  {
    id: "work-4",
    type: "Presentation",
    course: "Technical Writing",
    code: "HUM 2201",
    title: "Engineering Feasibility Study Report Presentation",
    due: "2026-10-17T12:00:00+06:00",
    dueLabel: "Sat, 17 Oct · 12:00 PM",
    section: "Section B",
    description: "5-minute team presentation evaluating technical infrastructure proposals for smart campuses.",
  },
] as const;

export const courses = [
  { code: "CSE 2201", title: "Data Structures", teacher: "Prof. Dr. Md. Al-Amin", room: "Room 301, CSE Building", email: "alamin@cse.ruet.ac.bd", officeHours: "Tuesday & Thursday: 2:00–3:30 PM" },
  { code: "CSE 2203", title: "Digital Logic Design", teacher: "Dr. Boshir Ahmed", room: "Room 204, CSE Building", email: "boshir@cse.ruet.ac.bd", officeHours: "Wednesday: 11:30 AM–1:00 PM" },
  { code: "CSE 2205", title: "Algorithms", teacher: "Prof. Dr. Md. Al-Amin", room: "Room 301, CSE Building", email: "alamin@cse.ruet.ac.bd", officeHours: "Thursday: 2:00–3:30 PM" },
  { code: "CSE 2207", title: "Database Systems", teacher: "Dr. Boshir Ahmed", room: "Software Lab 2", email: "boshir@cse.ruet.ac.bd", officeHours: "Sunday & Monday: 12:00–1:30 PM" },
  { code: "HUM 2201", title: "Technical Writing", teacher: "Asst. Prof. Sadia Tasnim", room: "Room 105, New Academic", email: "sadia@hum.ruet.ac.bd", officeHours: "Monday & Wednesday: 10:00–11:00 AM" },
] as const;

export const students = [
  { id: "student-1", name: "Argho Ghosh", nickname: "Argho", roll: "2503001", section: "A", email: "arghoghosh0712@gmail.com" },
  { id: "student-2", name: "Tanvir Hasan", nickname: "Tanvir", roll: "2503002", section: "A", email: "tanvir.25@cse.ruet.ac.bd" },
  { id: "student-3", name: "Nafis Fuad", nickname: "Nafis", roll: "2503003", section: "B", email: "nafis.25@cse.ruet.ac.bd" },
  { id: "student-4", name: "Mehedi Hasan", nickname: "Mehedi", roll: "2503004", section: "B", email: "mehedi.25@cse.ruet.ac.bd" },
  { id: "student-5", name: "Sadia Rahman", nickname: "Sadia", roll: "2503005", section: "C", email: "sadia.25@cse.ruet.ac.bd" },
] as const;

export const days = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

export const routineExceptions = [
  {
    id: 'exc-1',
    day: 'Monday' as const,
    classId: 'class-1', // Data Structures, 09:00–10:00
    status: 'cancelled' as const,
    note: 'Class cancelled due to department faculty meeting.',
  },
  {
    id: 'exc-2',
    day: 'Wednesday' as const,
    classId: 'class-4', // Database Systems, 09:30–10:30
    status: 'rescheduled' as const,
    newStart: '14:00',
    newEnd: '15:00',
    newRoom: 'Room 402, CSE Dept',
    note: 'Moved to afternoon session due to Software Lab maintenance.',
  },
] as const;
