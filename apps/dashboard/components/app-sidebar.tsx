"use client";

import * as React from "react";
import {
  Building2Icon,
  HelpCircleIcon,
  InboxIcon,
  LayoutDashboardIcon,
  MailIcon,
  Settings2Icon,
  ShieldCheckIcon,
  ShipIcon,
  UsersIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    { title: "Dashboard", url: "/", icon: <LayoutDashboardIcon /> },
    { title: "Submissions", url: "/submissions", icon: <InboxIcon /> },
    { title: "Carrier Quotes", url: "/quotes", icon: <MailIcon /> },
    { title: "Policies", url: "/policies", icon: <ShieldCheckIcon /> },
    { title: "Customers", url: "/customers", icon: <UsersIcon /> },
    { title: "Carriers", url: "/carriers", icon: <Building2Icon /> },
  ],
  navSecondary: [
    { title: "Settings", url: "/settings", icon: <Settings2Icon /> },
    { title: "Get Help", url: "/help", icon: <HelpCircleIcon /> },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="/" />}
            >
              <ShipIcon className="size-5!" />
              <span className="text-base font-semibold">InsureInvestors</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
