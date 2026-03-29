import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  School,
  BookOpen,
  ClipboardList,
  Receipt,
  UserCog,
  Settings,
  ShieldCheck,
} from "lucide-react";

export const agencyNavItems = [
  { href: "/agency/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agency/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/agency/requests", label: "Requests", icon: FileText },
  { href: "/agency/teachers", label: "Teachers", icon: Users },
  { href: "/agency/schools", label: "Schools", icon: School },
  { href: "/agency/bookings", label: "Bookings", icon: BookOpen },
  { href: "/agency/timesheets", label: "Timesheets", icon: ClipboardList },
  { href: "/agency/invoices", label: "Invoices", icon: Receipt },
  { href: "/agency/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/agency/agents", label: "Agents", icon: UserCog },
  { href: "/agency/settings", label: "Settings", icon: Settings },
];
