"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  GraduationCap,
  Hash,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  UserCircle,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { academicWork, courses, days, demoWeek, notices, schedule, students, routineExceptions } from "@/lib/demo-data";

export type HubSection = "home" | "notices" | "routine" | "work" | "courses" | "directory" | "admin" | "profile";
type WorkType = "All" | "Homework" | "Assignment" | "CT" | "Presentation";
type NoticeCategory = "All" | "Academic" | "General" | "Event" | "Urgent";
type PublishedNotice = {
  id: string;
  category: Exclude<NoticeCategory, "All">;
  title: string;
  body: string;
  date: string;
  pinned: boolean;
  published: boolean;
};
type RoutineException = {
  id: string;
  day: (typeof days)[number];
  classId: string;
  status: "cancelled" | "rescheduled";
  newStart?: string;
  newEnd?: string;
  newRoom?: string;
  note: string;
};

const sectionCopy: Record<HubSection, { eyebrow: string; title: string; description: string }> = {
  home: {
    eyebrow: "RUET CSE '25 · BATCH OVERVIEW",
    title: "Batch Student Portal",
    description: "Daily class routine, upcoming academic deadlines, official announcements, and department directory.",
  },
  notices: {
    eyebrow: "OFFICIAL ANNOUNCEMENTS",
    title: "Batch Notices & Broadcasts",
    description: "Department notices, exam schedules, and academic updates delivered to your portal and Gmail.",
  },
  routine: {
    eyebrow: "ACADEMIC TIMETABLE",
    title: "Class Routine & Schedule",
    description: "Weekly schedule with live tracking for room allocations, cancellations, and rescheduled classes.",
  },
  work: {
    eyebrow: "COURSEWORK & ASSESSMENTS",
    title: "Academic Deadlines",
    description: "Track Class Tests (CTs), lab assignments, homework submissions, and project milestones.",
  },
  courses: {
    eyebrow: "FACULTY & CURRICULUM",
    title: "Courses & Instructors",
    description: "Department courses, assigned instructors, lab rooms, and faculty consultation hours.",
  },
  directory: {
    eyebrow: "CLASS OF '25 DIRECTORY",
    title: "Student Batch Directory",
    description: "Connect with peers across Section A, Section B, and Section C of RUET CSE '25.",
  },
  admin: {
    eyebrow: "CR & BATCH MANAGEMENT",
    title: "Publisher Workspace",
    description: "Publish verified batch announcements, broadcast Gmail alerts, and update daily schedule exceptions.",
  },
  profile: {
    eyebrow: "STUDENT IDENTITY & SETTINGS",
    title: "Student Profile",
    description: "Manage your batch record, academic section, and instant Gmail notification preferences.",
  },
};

function PageHeading({ section }: { section: HubSection }) {
  const copy = sectionCopy[section];
  return (
    <div className="page-heading">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="page-description">{copy.description}</p>
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  href,
  linkText = "View all",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="section-heading">
      <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
      {href && <Link href={href} className="text-link">{linkText}<ArrowRight size={15} aria-hidden="true" /></Link>}
    </div>
  );
}

function NoticeCard({ notice, compact = false }: { notice: (typeof notices)[number]; compact?: boolean }) {
  return (
    <article className={`notice-card${notice.pinned ? " pinned" : ""}`}>
      <div className="notice-card-top">
        <span className={`category-pill category-${notice.category.toLowerCase()}`}>{notice.category}</span>
        {notice.pinned && <span className="pinned-label"><Sparkles size={12} aria-hidden="true" /> Pinned sample</span>}
      </div>
      <h3>{notice.title}</h3>
      {!compact && <p>{notice.body}</p>}
      <div className="notice-meta"><span><CalendarDays size={13} aria-hidden="true" />{notice.date}</span><span>Demo content</span></div>
    </article>
  );
}

function WorkCard({ item }: { item: (typeof academicWork)[number] }) {
  const typeClass = item.type.toLowerCase().replaceAll(" ", "-");
  return (
    <article className="work-card">
      <div className="work-card-top">
        <span className={`work-type type-${typeClass}`}><FileText size={13} aria-hidden="true" />{item.type}</span>
        <span className="due-date"><Clock3 size={13} aria-hidden="true" />Due {item.dueLabel}</span>
      </div>
      <h3>{item.title}</h3>
      <p className="work-course">{item.code}<span aria-hidden="true">·</span>{item.course}</p>
      <p className="work-description">{item.description}</p>
      <div className="work-card-footer"><span>{item.section}</span><span className="sample-label">Sample</span></div>
    </article>
  );
}

function HomeView() {
  const { user } = useAuth();
  const firstName = user?.displayName ? user.displayName.split(" ")[0] : "RUETian";
  const todayClasses = schedule.filter((item) => item.day === "Monday");
  const nextWork = academicWork[0];
  return (
    <>
      <PageHeading section="home" />
      <div className="week-context">
        <CalendarDays size={15} aria-hidden="true" />
        <span>Academic Calendar</span>
        <strong>{demoWeek}</strong>
        <span className="timezone-tag">Bangladesh (UTC+6)</span>
      </div>

      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="welcome-kicker">
            <Sparkles size={14} aria-hidden="true" /> RUET CSE &apos;25 PORTAL
          </span>
          <h2>Welcome back, {firstName}.<br />Your academic week at a glance.</h2>
          <p>Real-time class schedule, verified batch announcements, and upcoming course deadlines.</p>
          <Link className="welcome-action" href="/routine">
            View Today&apos;s Routine <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="art-orbit orbit-one" /><span className="art-orbit orbit-two" />
          <span className="art-calendar"><CalendarCheck2 size={43} strokeWidth={1.4} /><span>12—18</span><small>OCT</small></span>
          <span className="art-spark spark-one">✦</span><span className="art-spark spark-two">✳</span>
        </div>
      </section>

      <div className="quick-stats">
        <Link href="/routine" className="stat-card">
          <span className="stat-icon stat-mint"><CalendarDays size={18} aria-hidden="true" /></span>
          <span className="stat-copy">
            <small>WEEKLY SESSIONS</small>
            <strong>{schedule.length}<em> classes</em></strong>
          </span>
          <ArrowUpRight className="stat-arrow" size={16} aria-hidden="true" />
        </Link>
        <Link href="/work" className="stat-card">
          <span className="stat-icon stat-peach"><ClipboardIcon /></span>
          <span className="stat-copy">
            <small>PENDING ASSESSMENTS</small>
            <strong>{academicWork.length}<em> items</em></strong>
          </span>
          <ArrowUpRight className="stat-arrow" size={16} aria-hidden="true" />
        </Link>
        <Link href="/notices" className="stat-card">
          <span className="stat-icon stat-lavender"><Bell size={18} aria-hidden="true" /></span>
          <span className="stat-copy">
            <small>BATCH ANNOUNCEMENTS</small>
            <strong>{notices.length}<em> notices</em></strong>
          </span>
          <ArrowUpRight className="stat-arrow" size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="dashboard-columns">
        <div className="dashboard-main-column">
          <section className="surface-card">
            <SectionHeading title="Today's Schedule" subtitle="Monday · 3 scheduled classes" href="/routine" />
            <div className="mini-class-list">
              {todayClasses.map((item) => (
                <div className="mini-class" key={item.id}>
                  <div className="mini-class-time">{item.start}<small>{item.end}</small></div>
                  <div className="class-time-rail" />
                  <div className="mini-class-info">
                    <strong>{item.course}</strong>
                    <span>{item.code} <span aria-hidden="true">·</span> {item.room}</span>
                    <small>{item.teacher}</small>
                  </div>
                </div>
              ))}
            </div>
            <Link className="card-bottom-link" href="/routine">Open full routine <ArrowRight size={15} aria-hidden="true" /></Link>
          </section>

          <section className="surface-card">
            <SectionHeading title="Next Academic Deadline" subtitle="Class Test & Assignment Tracker" href="/work" />
            <div className="next-deadline">
              <div className="deadline-date"><small>OCT</small><strong>12</strong><span>MON</span></div>
              <div className="deadline-copy">
                <span className="work-type type-assignment"><FileText size={13} aria-hidden="true" />{nextWork.type}</span>
                <h3>{nextWork.title}</h3>
                <p>{nextWork.code} · {nextWork.course}</p>
                <span className="deadline-time"><Clock3 size={13} aria-hidden="true" />{nextWork.dueLabel}</span>
              </div>
              <ArrowDownRight className="deadline-arrow" size={17} aria-hidden="true" />
            </div>
          </section>
        </div>

        <div className="dashboard-side-column">
          <section className="surface-card">
            <SectionHeading title="Notice Board" subtitle="Latest department broadcasts" href="/notices" />
            <div className="notice-preview-list">{notices.slice(0, 3).map((notice) => <NoticeCard key={notice.id} notice={notice} compact />)}</div>
          </section>
          <section className="side-callout">
            <div className="side-callout-icon"><Users size={18} aria-hidden="true" /></div>
            <div>
              <span>BATCH COMMUNITY</span>
              <h3>Student Batch Directory</h3>
              <p>Find classmates, sections, and contact info across CSE &apos;25.</p>
              <Link href="/directory">Browse directory <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function NoticesView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("All");
  const categories: NoticeCategory[] = ["All", "Academic", "General", "Event", "Urgent"];
  const filtered = useMemo(() => notices.filter((notice) => (
    (category === "All" || notice.category === category) &&
    `${notice.title} ${notice.body}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  )), [category, query]);

  return (
    <>
      <PageHeading section="notices" />
      <div className="content-toolbar">
        <label className="search-box"><Search size={17} aria-hidden="true" /><span className="visually-hidden">Search notices</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notices by title or words" /></label>
        <div className="filter-row" role="group" aria-label="Filter notices by category">{categories.map((item) => <button type="button" key={item} className={`filter-chip${category === item ? " selected" : ""}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
      </div>
      <p className="result-count" aria-live="polite">Showing {filtered.length} of {notices.length} fictional sample notices</p>
      {filtered.length ? <div className="notice-grid">{filtered.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}</div> : <EmptyState title="No sample notices match" body="Try a different search term or category." />}
    </>
  );
}

function RoutineView() {
  const [selectedDay, setSelectedDay] = useState<(typeof days)[number]>("Monday");
  const dayClasses = schedule.filter((item) => item.day === selectedDay);
  return (
    <>
      <PageHeading section="routine" />
      <section className="routine-week-card">
        <div className="routine-week-heading"><div><span className="eyebrow">SAMPLE TIMETABLE</span><h2>{demoWeek}</h2><p>Example schedule · Bangladesh time (UTC+6)</p></div><span className="week-status"><span />Illustrative only</span></div>
        <div className="day-selector" role="tablist" aria-label="Select a day in the sample week">{days.map((day) => <button type="button" role="tab" aria-selected={selectedDay === day} className={`day-tab${selectedDay === day ? " active" : ""}`} key={day} onClick={() => setSelectedDay(day)}><span>{day.slice(0, 3)}</span><strong>{day === "Monday" ? "12" : day === "Tuesday" ? "13" : day === "Wednesday" ? "14" : day === "Thursday" ? "15" : day === "Saturday" ? "17" : day === "Sunday" ? "18" : "16"}</strong></button>)}</div>
        <div className="routine-day-heading"><div><h3>{selectedDay}</h3><p>{dayClasses.length} sample {dayClasses.length === 1 ? "class" : "classes"}</p></div><span className="timezone-tag">UTC+6 · Bangladesh</span></div>
        {dayClasses.length ? <div className="routine-list">{dayClasses.map((item) => <article className="routine-item" key={item.id}><div className="routine-time"><strong>{item.start}</strong><span>{item.end}</span></div><div className="routine-line" /><div className="routine-info"><div className="routine-info-title"><div><h4>{item.course}</h4><p>{item.code}</p></div><span className="sample-label">Sample</span></div><div className="routine-details"><span><Clock3 size={13} aria-hidden="true" />{item.start}–{item.end}</span><span><MapPin size={13} aria-hidden="true" />{item.room}</span><span><GraduationCap size={14} aria-hidden="true" />{item.teacher}</span></div></div></article>)}</div> : <EmptyState title={`No sample classes on ${selectedDay}`} body="This is just a fictional example timetable; a real schedule would be maintained by an authorized administrator." />}
      </section>
      <div className="inline-note"><CalendarClock size={17} aria-hidden="true" /><p><strong>Routine changes:</strong> In the connected version, dated cancellations and replacement classes will appear as separate schedule updates without altering the recurring routine.</p></div>
    </>
  );
}

function WorkView() {
  const [type, setType] = useState<WorkType>("All");
  const [range, setRange] = useState("This sample week");
  const types: WorkType[] = ["All", "Homework", "Assignment", "CT", "Presentation"];
  const filtered = useMemo(() => academicWork.filter((item) => (
    (type === "All" || item.type === type) &&
    range !== "Next week"
  )), [range, type]);
  return (
    <>
      <PageHeading section="work" />
      <div className="work-controls">
        <label className="select-wrap"><CalendarDays size={16} aria-hidden="true" /><span className="visually-hidden">Choose date range</span><select value={range} onChange={(event) => setRange(event.target.value)}><option>This sample week</option><option>Next week</option><option>All sample items</option></select><ChevronDown size={15} aria-hidden="true" /></label>
        <div className="filter-row" role="group" aria-label="Filter by academic item type"><Filter size={15} aria-hidden="true" />{types.map((item) => <button type="button" key={item} className={`filter-chip${type === item ? " selected" : ""}`} aria-pressed={type === item} onClick={() => setType(item)}>{item}</button>)}</div>
      </div>
      <div className="work-week-label"><div><h2>{range}</h2><p>12–18 October · all dates are fictional sample data</p></div><span className="timezone-tag">Bangladesh time</span></div>
      <p className="result-count" aria-live="polite">Showing {filtered.length} sample {filtered.length === 1 ? "item" : "items"}</p>
      {filtered.length ? <div className="work-list">{filtered.map((item) => <WorkCard key={item.id} item={item} />)}</div> : <EmptyState title="No sample items in this view" body="Try another item type or date range. This prototype contains only one sample week." />}
      <div className="inline-note"><Check size={17} aria-hidden="true" /><p>Items are informational examples only. The prototype does not record submissions, completion, grades, or attendance.</p></div>
    </>
  );
}

function CoursesView() {
  return (
    <>
      <PageHeading section="courses" />
      <div className="course-intro"><BookOpen size={18} aria-hidden="true" /><p>Course names and contact details below are fictional examples. No real teacher contacts have been added.</p></div>
      <div className="course-grid">{courses.map((course, index) => <article className="course-card" key={course.code}><div className={`course-icon course-icon-${index % 4}`}><BookOpen size={19} aria-hidden="true" /></div><div className="course-code">{course.code}</div><h2>{course.title}</h2><div className="teacher-row">      <span className="teacher-avatar">{course.teacher.split(" ").slice(-1)[0]?.slice(0, 1) ?? "?"}</span><div><small>INSTRUCTOR · SAMPLE</small><strong>{course.teacher}</strong></div></div><div className="course-contact"><span><MapPin size={14} aria-hidden="true" />{course.room}</span><span><Bell size={14} aria-hidden="true" />{course.officeHours}</span><span><BookOpen size={14} aria-hidden="true" />{course.email}</span></div><div className="course-card-footer"><span>Term 2 · example data</span><Link href="/routine" aria-label={`View routine for ${course.title}`}>Routine <ArrowRight size={14} aria-hidden="true" /></Link></div></article>)}</div>
    </>
  );
}

function DirectoryView() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("All sections");
  const filtered = useMemo(() => students.filter((student) => (
    (section === "All sections" || student.section === section) &&
    `${student.name} ${student.nickname ?? ""} ${student.roll}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  )), [query, section]);
  return (
    <>
      <PageHeading section="directory" />
      <div className="directory-controls">
        <label className="search-box"><Search size={17} aria-hidden="true" /><span className="visually-hidden">Search student directory</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, nickname, or roll" /></label>
        <label className="select-wrap"><Users size={15} aria-hidden="true" /><span className="visually-hidden">Filter by section</span><select value={section} onChange={(event) => setSection(event.target.value)}><option>All sections</option><option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option></select><ChevronDown size={15} aria-hidden="true" /></label>
      </div>
      <p className="result-count" aria-live="polite">Showing {filtered.length} of {students.length} fictional sample profiles</p>
      {filtered.length ? <div className="directory-grid">{filtered.map((student, index) => <article className="student-card" key={student.id}><div className={`student-avatar student-avatar-${index % 5}`}>{student.name.charAt(0)}</div><div className="student-copy"><h2>{student.name}</h2>{student.nickname && <p className="student-nickname">“{student.nickname}” <span>sample nickname</span></p>}<p className="student-roll">{student.roll}</p><span className="section-pill">Section {student.section}</span></div><span className="fiction-tag">DEMO</span></article>)}</div> : <EmptyState title="No demo profiles match" body="Try a different search term or section." />}
      <p className="privacy-note"><ShieldCheck size={16} aria-hidden="true" />A connected directory should display only the profile fields students have agreed to share.</p>
    </>
  );
}

function AdminView() {
  const [tab, setTab] = useState<'notices' | 'exceptions'>('notices');

  // Notices state
  const [localNotices, setLocalNotices] = useState<PublishedNotice[]>(
    notices.map(n => ({ ...n, published: true, pinned: n.pinned }))
  );
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<PublishedNotice["category"]>('General');
  const [newNoticeBody, setNewNoticeBody] = useState('');

  // Exceptions state
  const [localExceptions, setLocalExceptions] = useState<RoutineException[]>([...routineExceptions]);
  const [showExcForm, setShowExcForm] = useState(false);
  const [excClassId, setExcClassId] = useState<string>(schedule[0].id);
  const [excStatus, setExcStatus] = useState<'cancelled' | 'rescheduled'>('cancelled');
  const [excNewStart, setExcNewStart] = useState('');
  const [excNewEnd, setExcNewEnd] = useState('');
  const [excNewRoom, setExcNewRoom] = useState('');
  const [excNote, setExcNote] = useState('');

  function submitNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoticeTitle.trim()) return;
    setLocalNotices(prev => [{
      id: `notice-new-${Date.now()}`,
      category: newNoticeCategory,
      title: newNoticeTitle,
      body: newNoticeBody,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pinned: false,
      published: true,
    }, ...prev]);
    setNewNoticeTitle(''); setNewNoticeBody(''); setShowNoticeForm(false);
  }

  function submitException(e: React.FormEvent) {
    e.preventDefault();
    const cls = schedule.find(s => s.id === excClassId);
    if (!cls) return;
    setLocalExceptions(prev => [...prev, {
      id: `exc-new-${Date.now()}`,
      day: cls.day,
      classId: excClassId,
      status: excStatus,
      ...(excStatus === 'rescheduled' ? { newStart: excNewStart, newEnd: excNewEnd, newRoom: excNewRoom } : {}),
      note: excNote,
    }]);
    setExcNote(''); setExcNewStart(''); setExcNewEnd(''); setExcNewRoom(''); setShowExcForm(false);
  }

  return (
    <>
      <PageHeading section="admin" />
      <section className="admin-preview-hero">
        <div className="admin-preview-icon"><ShieldCheck size={23} aria-hidden="true" /></div>
        <div>
          <span>ADMIN WORKSPACE · LOCAL PREVIEW</span>
          <h2>Publisher tools — demo mode</h2>
          <p>Changes below update this session only. No data is saved or published. Connect a backend to make these controls real.</p>
        </div>
      </section>

      {/* Tab switcher */}
      <div className="filter-row" role="tablist" style={{margin: '18px 0 14px'}}>
        <button type="button" role="tab" aria-selected={tab==='notices'} className={`filter-chip${tab==='notices'?' selected':''}`} onClick={()=>setTab('notices')}>Notices</button>
        <button type="button" role="tab" aria-selected={tab==='exceptions'} className={`filter-chip${tab==='exceptions'?' selected':''}`} onClick={()=>setTab('exceptions')}>Routine exceptions</button>
      </div>

      {tab === 'notices' && (
        <div style={{display:'grid', gap:'12px'}}>
          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button type="button" className="profile-btn-save" onClick={()=>setShowNoticeForm(v=>!v)}>+ New notice</button>
          </div>
          {showNoticeForm && (
            <form className="surface-card admin-form" onSubmit={submitNotice}>
              <h3 style={{margin:'0 0 14px', fontSize:'13px'}}>New notice</h3>
              <div className="admin-form-field">
                <label className="profile-field-label">Title</label>
                <input className="profile-field-input" style={{width:'100%'}} value={newNoticeTitle} onChange={e=>setNewNoticeTitle(e.target.value)} placeholder="Notice title" required />
              </div>
              <div className="admin-form-field">
                <label className="profile-field-label">Category</label>
                <select className="profile-field-select" value={newNoticeCategory} onChange={e=>setNewNoticeCategory(e.target.value as PublishedNotice["category"])}>
                  <option>General</option><option>Academic</option><option>Event</option><option>Urgent</option>
                </select>
              </div>
              <div className="admin-form-field">
                <label className="profile-field-label">Body</label>
                <textarea className="admin-textarea" value={newNoticeBody} onChange={e=>setNewNoticeBody(e.target.value)} placeholder="Notice body text" rows={3} />
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                <button type="submit" className="profile-btn-save">Publish (demo)</button>
                <button type="button" className="profile-btn-cancel" onClick={()=>setShowNoticeForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          {localNotices.map(notice => (
            <div key={notice.id} className="surface-card admin-notice-row">
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
                <div style={{flex:1,minWidth:0}}>
                  <span className={`category-pill category-${notice.category.toLowerCase()}`}>{notice.category}</span>
                  <h3 style={{margin:'8px 0 4px',fontSize:'12px'}}>{notice.title}</h3>
                  <p style={{margin:0,color:'#768489',fontSize:'10px'}}>{notice.date}</p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'8px',alignItems:'flex-end'}}>
                  <label className="admin-toggle-wrap" title="Published">
                    <input type="checkbox" checked={notice.published} onChange={()=>setLocalNotices(prev=>prev.map(n=>n.id===notice.id?{...n,published:!n.published}:n))} />
                    <span>{notice.published ? 'Published' : 'Draft'}</span>
                  </label>
                  <label className="admin-toggle-wrap" title="Pinned">
                    <input type="checkbox" checked={notice.pinned} onChange={()=>setLocalNotices(prev=>prev.map(n=>n.id===notice.id?{...n,pinned:!n.pinned}:n))} />
                    <span>{notice.pinned ? 'Pinned' : 'Not pinned'}</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'exceptions' && (
        <div style={{display:'grid', gap:'12px'}}>
          <div style={{display:'flex', justifyContent:'flex-end'}}>
            <button type="button" className="profile-btn-save" onClick={()=>setShowExcForm(v=>!v)}>+ Add exception</button>
          </div>
          {showExcForm && (
            <form className="surface-card admin-form" onSubmit={submitException}>
              <h3 style={{margin:'0 0 14px', fontSize:'13px'}}>New routine exception</h3>
              <div className="admin-form-field">
                <label className="profile-field-label">Class</label>
                <select className="profile-field-select" value={excClassId} onChange={e=>setExcClassId(e.target.value)}>
                  {schedule.map(s => <option key={s.id} value={s.id}>{s.day} · {s.start} · {s.course}</option>)}
                </select>
              </div>
              <div className="admin-form-field">
                <label className="profile-field-label">Status</label>
                <select className="profile-field-select" value={excStatus} onChange={e=>setExcStatus(e.target.value as 'cancelled'|'rescheduled')}>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
              {excStatus === 'rescheduled' && (
                <>
                  <div className="admin-form-field">
                    <label className="profile-field-label">New start</label>
                    <input type="time" className="profile-field-input" value={excNewStart} onChange={e=>setExcNewStart(e.target.value)} />
                  </div>
                  <div className="admin-form-field">
                    <label className="profile-field-label">New end</label>
                    <input type="time" className="profile-field-input" value={excNewEnd} onChange={e=>setExcNewEnd(e.target.value)} />
                  </div>
                  <div className="admin-form-field">
                    <label className="profile-field-label">New room</label>
                    <input className="profile-field-input" value={excNewRoom} onChange={e=>setExcNewRoom(e.target.value)} placeholder="e.g. Room 302" />
                  </div>
                </>
              )}
              <div className="admin-form-field">
                <label className="profile-field-label">Note</label>
                <textarea className="admin-textarea" value={excNote} onChange={e=>setExcNote(e.target.value)} placeholder="Reason or note for students" rows={2} />
              </div>
              <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
                <button type="submit" className="profile-btn-save">Add exception (demo)</button>
                <button type="button" className="profile-btn-cancel" onClick={()=>setShowExcForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          {localExceptions.map(exc => {
            const cls = schedule.find(s => s.id === exc.classId);
            return (
              <div key={exc.id} className="surface-card admin-notice-row">
                <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                  <span className={`exc-badge ${exc.status==='cancelled'?'exc-cancelled':'exc-rescheduled'}`}>{exc.status.toUpperCase()}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <strong style={{fontSize:'12px'}}>{cls?.course ?? exc.classId}</strong>
                    <p style={{margin:'3px 0 0',color:'#768489',fontSize:'9px'}}>{exc.day} · {cls?.start}–{cls?.end} · {'note' in exc ? exc.note : ''}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="inline-note" style={{marginTop:'18px'}}>
        <ShieldCheck size={17} aria-hidden="true" />
        <p>All changes here are local to this browser session. In the connected app, actions will require authentication and verified admin role.</p>
      </div>
    </>
  );
}

function ClipboardIcon() {
  return <FileText size={18} aria-hidden="true" />;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><span><Search size={20} aria-hidden="true" /></span><h2>{title}</h2><p>{body}</p></div>;
}

function ProfileView() {
  const { user, loading, isAdmin, isConfigured, emailNotifications, setEmailNotifications, signInWithGoogle, signOut } = useAuth();
  const [nickname, setNickname] = useState('');
  const [roll, setRoll] = useState('2503001');
  const [section, setSection] = useState('A');
  const [editing, setEditing] = useState(false);
  const [tempNickname, setTempNickname] = useState('');
  const [tempRoll, setTempRoll] = useState('2503001');
  const [tempSection, setTempSection] = useState('A');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user?.displayName) {
      const initNick = user.displayName.split(' ')[0] ?? '';
      setNickname(initNick);
      setTempNickname(initNick);
    }
    if (typeof window !== 'undefined' && user) {
      const savedNick = localStorage.getItem(`nick_${user.uid}`);
      if (savedNick) {
        setNickname(savedNick);
        setTempNickname(savedNick);
      }
      const savedR = localStorage.getItem(`roll_${user.uid}`);
      if (savedR) {
        setRoll(savedR);
        setTempRoll(savedR);
      }
      const savedSec = localStorage.getItem(`sec_${user.uid}`);
      if (savedSec) {
        setSection(savedSec);
        setTempSection(savedSec);
      }
    }
  }, [user]);

  function handleStartEditing() {
    setTempNickname(nickname);
    setTempRoll(roll);
    setTempSection(section);
    setEditing(true);
  }

  function handleSaveProfile() {
    setNickname(tempNickname);
    setRoll(tempRoll);
    setSection(tempSection);
    setEditing(false);
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`nick_${user.uid}`, tempNickname);
      localStorage.setItem(`roll_${user.uid}`, tempRoll);
      localStorage.setItem(`sec_${user.uid}`, tempSection);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  if (loading) {
    return (
      <>
        <PageHeading section="profile" />
        <div className="surface-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
          <div className="loading-spinner" />
          <p style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600 }}>Loading student credentials…</p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageHeading section="profile" />
        <section className="surface-card profile-auth-gate">
          <div className="gate-icon-badge">
            <GraduationCap size={32} />
          </div>
          <h2>Sign in with Google</h2>
          <p>
            Authenticate with your university or personal Google account to link your student profile, customize your academic section, and receive real-time notice alerts directly in your Gmail inbox.
          </p>
          {!isConfigured && (
            <div className="inline-note" style={{ maxWidth: '520px', margin: '0 auto 20px' }}>
              <ShieldCheck size={18} aria-hidden="true" />
              <p>
                <strong>Connection note:</strong> Add your project credentials to <code>.env.local</code> to connect live Firebase Auth.
              </p>
            </div>
          )}
          <button type="button" className="google-auth-btn" onClick={signInWithGoogle}>
            <LogIn size={18} aria-hidden="true" />
            Sign in with Google OAuth
          </button>
        </section>
      </>
    );
  }

  return (
    <div className="profile-layout-container">
      <PageHeading section="profile" />

      {savedSuccess && (
        <div className="save-banner animate-fade-in">
          <CheckCircle2 size={16} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Hero Identity Card */}
      <section className="profile-hero-card">
        <div className="profile-hero-cover">
          <div className="cover-pattern" />
        </div>
        <div className="profile-hero-content">
          <div className="profile-avatar-wrapper">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName ?? ''} className="profile-avatar-large" referrerPolicy="no-referrer" />
            ) : (
              <div className="profile-avatar-placeholder">
                {(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="avatar-verified-badge" title="Google Verified Account">
              <Check size={12} strokeWidth={3} />
            </span>
          </div>

          <div className="profile-hero-meta">
            <div className="profile-hero-name-row">
              <h2>{user.displayName ?? 'Student'}</h2>
              {isAdmin ? (
                <span className="badge-admin">Admin / CR</span>
              ) : (
                <span className="badge-verified">Verified Student</span>
              )}
            </div>
            <p className="profile-hero-email">
              <Mail size={13} aria-hidden="true" />
              {user.email}
            </p>
            <div className="profile-tag-list">
              <span className="hero-pill">RUET CSE &apos;25</span>
              <span className="hero-pill">Roll: {roll}</span>
              <span className="hero-pill">Section {section}</span>
            </div>
          </div>

          <div className="profile-hero-actions">
            {!editing ? (
              <button type="button" className="btn-edit-profile" onClick={handleStartEditing}>
                Edit Details
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-save-profile" onClick={handleSaveProfile}>
                  Save
                </button>
                <button type="button" className="btn-cancel-profile" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid: Academic Information & Gmail Engine */}
      <div className="profile-two-column-grid">
        {/* Academic Profile Details */}
        <section className="surface-card profile-details-card">
          <div className="card-header-row">
            <div>
              <h3>Academic Identity</h3>
              <p>Your batch registration information</p>
            </div>
            <GraduationCap size={20} className="header-icon-muted" />
          </div>

          <div className="profile-input-groups">
            <div className="input-group">
              <label>Full Name</label>
              <div className="readonly-input-field">
                <User size={15} />
                <span>{user.displayName ?? '—'}</span>
                <span className="lock-tag">Google Managed</span>
              </div>
            </div>

            <div className="input-group">
              <label>Google Email</label>
              <div className="readonly-input-field">
                <Mail size={15} />
                <span>{user.email}</span>
                <span className="lock-tag">Verified</span>
              </div>
            </div>

            <div className="input-group">
              <label>Roll Number</label>
              {editing ? (
                <div className="editable-input-field">
                  <Hash size={15} />
                  <input
                    type="text"
                    value={tempRoll}
                    onChange={(e) => setTempRoll(e.target.value)}
                    placeholder="e.g. 2503001"
                    maxLength={10}
                  />
                </div>
              ) : (
                <div className="readonly-input-field">
                  <Hash size={15} />
                  <span>{roll}</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Preferred Nickname</label>
              {editing ? (
                <div className="editable-input-field">
                  <UserCircle size={15} />
                  <input
                    type="text"
                    value={tempNickname}
                    onChange={(e) => setTempNickname(e.target.value)}
                    placeholder="Short name / Nickname"
                    maxLength={20}
                  />
                </div>
              ) : (
                <div className="readonly-input-field">
                  <UserCircle size={15} />
                  <span>{nickname || '—'}</span>
                </div>
              )}
            </div>

            <div className="input-group">
              <label>Academic Section</label>
              {editing ? (
                <div className="section-pill-selector">
                  {(['A', 'B', 'C'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`section-selector-btn ${tempSection === sec ? 'active' : ''}`}
                      onClick={() => setTempSection(sec)}
                    >
                      Section {sec}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="readonly-input-field">
                  <span className="section-active-badge">Section {section}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '11px', marginLeft: '6px' }}>
                    Routine & Class Test notifications are aligned to Section {section}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gmail Notification Engine Card */}
        <section className="surface-card gmail-engine-card">
          <div className="card-header-row">
            <div>
              <div className="engine-badge-tag">
                <Zap size={12} />
                <span>ACTIVE ENGINE</span>
              </div>
              <h3>Gmail Notifications</h3>
              <p>Instant notice broadcasting to your inbox</p>
            </div>
            <div className="gmail-icon-box">
              <Mail size={22} />
            </div>
          </div>

          <div className="gmail-status-panel">
            <div className="gmail-toggle-row">
              <div className="gmail-toggle-info">
                <strong>Dispatch to {user.email}</strong>
                <p>
                  {emailNotifications
                    ? 'Active · Notices & schedule changes are automatically sent to your Gmail inbox.'
                    : 'Paused · You will only see notices when opening the web portal.'}
                </p>
              </div>
              <label className="modern-switch" title="Toggle Gmail Notifications">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                />
                <span className="slider round" />
              </label>
            </div>

            <div className="engine-features-list">
              <div className="feature-item">
                <CheckCircle2 size={15} className="feature-check" />
                <span>Exam & Class Test (CT) announcements</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={15} className="feature-check" />
                <span>Emergency class cancellations & room changes</span>
              </div>
              <div className="feature-item">
                <CheckCircle2 size={15} className="feature-check" />
                <span>Urgent department and CR broadcasts</span>
              </div>
            </div>
          </div>

          <div className="engine-footer-note">
            <Shield size={14} />
            <span>Secured via Firebase Cloud Functions. Unsubscribe anytime.</span>
          </div>
        </section>
      </div>

      {/* Account Actions Bar */}
      <div className="profile-signout-row">
        <button type="button" className="btn-signout" onClick={signOut}>
          <LogOut size={15} />
          Sign Out of Google
        </button>
      </div>
    </div>
  );
}

export function HubView({ section }: { section: HubSection }) {
  switch (section) {
    case "home": return <HomeView />;
    case "notices": return <NoticesView />;
    case "routine": return <RoutineView />;
    case "work": return <WorkView />;
    case "courses": return <CoursesView />;
    case "directory": return <DirectoryView />;
    case "admin": return <AdminView />;
    case "profile": return <ProfileView />;
  }
}
