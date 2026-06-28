"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Headphones,
  Users,
  Sparkles,
  Brain,
  Palette,
  Type,
  LayoutDashboard,
  LogOut,
  Video,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Главная", href: "/", icon: LayoutDashboard },
  { title: "Медитации", href: "/meditations", icon: Headphones },
  { title: "Вебинары", href: "/webinars", icon: Video },
  { title: "Клубы", href: "/clubs", icon: Users },
  { title: "Аффирмации", href: "/affirmations", icon: Sparkles },
  { title: "Мышление", href: "/mindset", icon: Brain },
  { title: "Сторис", href: "/stories", icon: CalendarDays },
  { title: "Сферы жизни", href: "/life-areas", icon: Palette },
  { title: "UI тексты", href: "/ui-strings", icon: Type },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold">Школа Агеева</h2>
        <p className="text-xs text-muted-foreground">CMS Dashboard</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Контент</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => signOut(auth)}
        >
          <LogOut className="size-4 mr-2" />
          Выйти
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
