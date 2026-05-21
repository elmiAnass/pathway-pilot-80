import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Bell, Home, Menu } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function StudentBottomNav() {
  const { t, dir } = useI18n();
  const router = useRouter();
  const location = useLocation();
  const isHome = location.pathname === "/student";

  const items = [
    {
      key: "back",
      icon: dir === "rtl" ? ArrowRight : ArrowLeft,
      label: t("nav.back"),
      onClick: () => router.history.back(),
    },
    {
      key: "forward",
      icon: dir === "rtl" ? ArrowLeft : ArrowRight,
      label: t("nav.forward"),
      onClick: () => router.history.forward(),
    },
    { key: "home", icon: Home, label: t("nav.home"), to: "/student" },
    {
      key: "notifications",
      icon: Bell,
      label: t("nav.notifications"),
      to: "/student/notifications",
    },
    { key: "menu", icon: Menu, label: t("nav.menu"), to: "/student/menu" },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = "to" in item && item.to ? location.pathname === item.to : false;
          const inner = (
            <span
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
                item.key === "home" && isHome && "text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </span>
          );
          return (
            <li key={item.key} className="flex-1">
              {"to" in item && item.to ? (
                <Link to={item.to} className="block">
                  {inner}
                </Link>
              ) : (
                <button onClick={item.onClick} className="block w-full">
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
