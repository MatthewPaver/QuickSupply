import {
  LayoutDashboard,
  FileText,
  Users,
  School,
  BookOpen,
  UserCog,
  Settings,
} from "lucide-react";

export const agencyNavItems = [
  { href: "/agency/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agency/requests", label: "Requests", icon: FileText },
  { href: "/agency/teachers", label: "Teachers", icon: Users },
  { href: "/agency/schools", label: "Schools", icon: School },
  { href: "/agency/bookings", label: "Bookings", icon: BookOpen },
  { href: "/agency/agents", label: "Agents", icon: UserCog },
  { href: "/agency/settings", label: "Settings", icon: Settings },
];
