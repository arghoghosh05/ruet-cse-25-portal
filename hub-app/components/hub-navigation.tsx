"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpenCheck,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Search,
  UserCircle,
} from "lucide-react";

const navigation = [
  { href: "/", label: "Overview", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/notices", label: "Notices", shortLabel: "Notices", icon: Bell },
  { href: "/routine", label: "Class routine", shortLabel: "Routine", icon: CalendarDays },
  { href: "/work", label: "Academic work", shortLabel: "Work", icon: ClipboardList },
  { href: "/courses", label: "Courses & teachers", shortLabel: "Courses", icon: BookOpenCheck },
  { href: "/directory", label: "Student directory", shortLabel: "Directory", icon: Search },
  { href: "/profile", label: "My profile", shortLabel: "Profile", icon: UserCircle },
];

export default function HubNavigation({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  return (
    <nav className={variant === "desktop" ? "desktop-nav" : "mobile-nav"} aria-label="Main navigation">
      {navigation.map(({ href, label, shortLabel, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            className={`${variant === "desktop" ? "nav-link" : "mobile-nav-link"}${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
            aria-label={variant === "mobile" ? label : undefined}
          >
            <Icon size={variant === "desktop" ? 18 : 19} strokeWidth={1.8} aria-hidden="true" />
            <span>{variant === "mobile" ? shortLabel : label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
