import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Car, Home, MessageCircle, User } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}

const navItems: NavItem[] = [
  {
    to: "/",
    label: "Home",
    icon: <Home className="w-5 h-5" />,
    ocid: "nav-home",
  },
  {
    to: "/my-rides",
    label: "My Rides",
    icon: <Car className="w-5 h-5" />,
    ocid: "nav-my-rides",
  },
  {
    to: "/chat",
    label: "Chat",
    icon: <MessageCircle className="w-5 h-5" />,
    ocid: "nav-chat",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    ocid: "nav-profile",
  },
];

interface BottomNavProps {
  activeRoute?: string;
}

export function BottomNav({ activeRoute }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      data-ocid="bottom-nav"
    >
      <div className="max-w-md mx-auto flex items-center justify-around px-2 pb-safe-or-2 pt-2">
        {navItems.map((item) => {
          const isActive =
            activeRoute === item.to ||
            (activeRoute?.startsWith(item.to) && item.to !== "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[60px] transition-smooth",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-ocid={item.ocid}
            >
              <span
                className={cn(
                  "p-1.5 rounded-xl transition-smooth",
                  isActive ? "bg-primary/10" : "",
                )}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
