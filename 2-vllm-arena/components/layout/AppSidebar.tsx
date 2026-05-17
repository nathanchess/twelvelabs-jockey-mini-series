"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { StrandIcon } from "@/components/strand/StrandIcon";

const navItems = [
  { href: "/", label: "Overview", icon: "home" },
  { href: "/arena", label: "Arena", icon: "neural-network" },
] as const;

const STORAGE_KEY = "vllm-arena-sidebar-collapsed";

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      className={`flex h-screen min-h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-16" : "w-[240px]"
      }`}
    >
      <div
        className={`flex h-[56px] shrink-0 items-center border-b border-border ${
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-3"
        }`}
      >
        {!collapsed && (
          <Link href="/" className="flex min-w-0 flex-1 items-center">
            <Image
              src="/strand/logo-full.svg"
              alt="TwelveLabs"
              width={140}
              height={32}
              className="h-8 w-auto max-w-[calc(100%-2.5rem)]"
              priority
            />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-light text-text-secondary transition-[background-color,border-radius] duration-200 hover:rounded-lg hover:bg-card hover:text-text-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <StrandIcon
            name={collapsed ? "expand" : "collapse"}
            className="h-4 w-4"
          />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg text-header transition-colors ${
                collapsed
                  ? "justify-center p-2.5"
                  : "gap-3 px-3 py-2.5 text-[15px]"
              } ${
                active
                  ? "bg-card text-text-primary"
                  : "text-text-secondary hover:bg-card hover:text-text-primary"
              }`}
            >
              <StrandIcon name={item.icon} className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-border px-2 py-4">
        <Link
          href="#"
          title={collapsed ? "Settings" : undefined}
          className={`flex items-center rounded-lg text-[15px] text-header text-text-secondary transition-colors hover:bg-card hover:text-text-primary ${
            collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          }`}
        >
          <StrandIcon name="settings" className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
