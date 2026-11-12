import { BarChart3, Gift, Heart, Home, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: "/borsen" | "/lav" | "/mit-net" | "/send-tak" | "/";
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/borsen", label: "Børsen", icon: BarChart3 },
  { to: "/lav", label: "Send surprise", icon: Gift },
  { to: "/mit-net", label: "My Net", icon: Users },
  { to: "/send-tak", label: "Send Tak", icon: Heart },
  { to: "/", label: "My Feed", icon: Home },
];
