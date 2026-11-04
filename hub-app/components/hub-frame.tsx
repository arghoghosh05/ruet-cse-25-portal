"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { GraduationCap, ShieldCheck, Bell, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import HubNavigation from "./hub-navigation";
import { notices } from "@/lib/demo-data";

export default function HubFrame({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, error, signInWithGoogle, signOut } = useAuth();
  const [bellRead, setBellRead] = useState(false);
  const urgentCount = notices.filter(n => n.category === 'Urgent' || n.pinned).length;
  const unread = bellRead ? 0 : urgentCount;

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar">
        <Link className="brand-lockup" href="/" aria-label="RUET CSE '25 Hub overview">
          <span className="brand-mark"><GraduationCap size={22} aria-hidden="true" /></span>
          <span className="brand-copy"><strong>RUET CSE ’25</strong><small>Batch hub</small></span>
        </Link>
        <p className="sidebar-label">YOUR SPACE</p>
        <HubNavigation variant="desktop" />
        <div className="sidebar-spacer" />
        <Link href="/admin" className="admin-link">
          <ShieldCheck size={17} aria-hidden="true" />
          Admin tools preview
        </Link>
        <div className="sidebar-footer">
          <span className="online-dot" aria-hidden="true" />
          RUET CSE &apos;25 &middot; Batch Hub
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <span className="brand-mark small"><GraduationCap size={18} aria-hidden="true" /></span>
            <span><strong>RUET CSE &apos;25</strong><small>Batch hub</small></span>
          </div>
          <div className="topbar-note">
            <span className={user ? "live-dot" : "preview-dot"} aria-hidden="true" />
            {user ? "Google Verified \u00b7 CSE '25" : "Sign in with Google"}
          </div>
          <button
            type="button"
            className="bell-btn"
            aria-label={unread > 0 ? `${unread} unread notices` : 'Notices'}
            onClick={() => setBellRead(true)}
          >
            <Bell size={18} aria-hidden="true" />
            {unread > 0 && <span className="bell-badge" aria-hidden="true">{unread}</span>}
          </button>
          <div className="profile-chip">
            {loading ? (
              <span className="avatar" aria-label="Loading">…</span>
            ) : user ? (
              <>
                <Link href="/profile" className="avatar-link" title="View Profile">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="avatar avatar-photo" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="avatar">{(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}</span>
                  )}
                </Link>
                <Link href="/profile" className="profile-chip-copy" title="View Profile">
                  <strong>{user.displayName ?? 'Student'}</strong>
                  <small>{isAdmin ? 'Admin' : 'Class of \'25'}</small>
                </Link>
                <button type="button" className="signout-btn" onClick={signOut} title="Sign out">
                  <LogOut size={14} aria-hidden="true" />
                </button>
              </>
            ) : (
              <button type="button" className="signin-btn" onClick={signInWithGoogle}>
                <LogIn size={14} aria-hidden="true" />
                Sign in with Google
              </button>
            )}
          </div>
        </header>
        {error && (
          <p role="alert" className="mx-4 mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-8">
            {error}
          </p>
        )}
        <main id="main-content" className="content-area" tabIndex={-1}>{children}</main>
        <HubNavigation variant="mobile" />
      </div>
    </div>
  );
}
