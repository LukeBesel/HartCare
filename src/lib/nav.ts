import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Apple,
  BarChart3,
  Bot,
  CalendarDays,
  CreditCard,
  Dumbbell,
  HeartPulse,
  Home,
  Moon,
  PawPrint,
  Pill,
  Settings,
  Smile,
  Sparkles,
  Target,
  Users,
  Baby,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "Today" | "Body" | "Care" | "Household" | "Account";
  premium?: boolean;
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, group: "Today" },
  { href: "/coach", label: "AI Coach", icon: Bot, group: "Today" },
  { href: "/goals", label: "Goals", icon: Target, group: "Today" },

  { href: "/fitness", label: "Fitness", icon: Dumbbell, group: "Body" },
  { href: "/nutrition", label: "Nutrition", icon: Apple, group: "Body" },
  { href: "/recipes", label: "Recipes", icon: Sparkles, group: "Body" },
  { href: "/sleep", label: "Sleep", icon: Moon, group: "Body" },
  { href: "/wellness", label: "Mental Wellness", icon: Smile, group: "Body" },

  { href: "/health", label: "Health Records", icon: HeartPulse, group: "Care" },
  { href: "/medications", label: "Medications", icon: Pill, group: "Care" },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, group: "Care" },
  { href: "/children", label: "Child Health", icon: Baby, group: "Care" },
  { href: "/pets", label: "Pet Care", icon: PawPrint, group: "Care" },

  { href: "/family", label: "Family", icon: Users, group: "Household" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, group: "Household" },
  { href: "/harthome", label: "HartHome", icon: Activity, group: "Household", premium: true },

  { href: "/billing", label: "Subscription", icon: CreditCard, group: "Account" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Account" },
];

export const NAV_GROUPS: NavItem["group"][] = ["Today", "Body", "Care", "Household", "Account"];
