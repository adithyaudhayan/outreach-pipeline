import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Megaphone,
} from "lucide-react";
import { ReactNode } from "react";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/contacts",
    label: "Contacts",
    icon: Users,
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
  },
];

export function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Mobile Top Navigation */}
      <nav className="md:hidden border-b border-border bg-card sticky top-0 z-50">
        <div className="flex justify-around p-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/" &&
                location.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col">
          <div className="h-14 flex items-center px-6 border-b border-border">
            <span className="font-semibold text-lg">
              Pipeline
            </span>
          </div>

          <nav className="flex-1 py-4 px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                location === item.href ||
                (item.href !== "/" &&
                  location.startsWith(item.href));

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;