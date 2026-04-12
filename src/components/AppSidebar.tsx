import {
  GraduationCap,
  Brain,
  Newspaper,
  TrendingUp,
  LayoutDashboard,
  Sparkles,
  X,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, sparkle: true },
  { title: "Learn",     url: "/learn",     icon: GraduationCap },
  { title: "Advisor",   url: "/advisor",   icon: Brain },
  { title: "News",      url: "/news",      icon: Newspaper },
  { title: "Trade",     url: "/trade",     icon: TrendingUp },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-white">
      {/* Logo */}
      <SidebarHeader className="px-5 py-4 border-b border-sidebar-border">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg grid grid-cols-2 gap-0.5 p-1 shrink-0" style={{ background: "white" }}>
            <div className="rounded-sm bg-orange-400" />
            <div className="rounded-sm bg-indigo-500" />
            <div className="rounded-sm bg-emerald-400" />
            <div className="rounded-sm bg-yellow-400" />
          </div>
          {!collapsed && (
            <span className="font-bold text-[17px] text-foreground tracking-tight">FinWise</span>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 px-3">
              {navItems.map((item) => {
                const isActive =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                          isActive
                            ? "bg-secondary text-secondary-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:bg-muted/60 hover:text-foreground"
                        }`}
                        activeClassName=""
                      >
                        {item.sparkle && isActive && !collapsed ? (
                          <Sparkles className="h-4 w-4 shrink-0 text-secondary-foreground" />
                        ) : (
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-secondary-foreground" : ""}`} />
                        )}
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>

                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Trading Masterclass promo card */}
      {!collapsed && (
        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <div className="relative rounded-xl overflow-hidden bg-[#1a1f3a] p-3 text-white">
            <button className="absolute top-2 right-2 h-5 w-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="h-3 w-3 text-white/70" />
            </button>
            <p className="text-xs font-semibold mb-0.5">Trading Masterclass</p>
            <p className="text-[10px] text-white/60 mb-2 pr-4">Check out our new expert guided program to manage your assets.</p>
            <div className="flex gap-2 text-[10px]">
              <button className="text-white/40 hover:text-white/70 transition-colors">Dismiss</button>
              <button className="text-primary font-semibold">Explore</button>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
