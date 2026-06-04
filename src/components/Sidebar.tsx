"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, RadioReceiver, BarChart3, Settings, BrainCircuit } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Telemetry HUD", href: "/", icon: LayoutDashboard },
  { name: "Radio Comms", href: "/radio", icon: RadioReceiver },
  { name: "Predictions", href: "/predictions", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 glass-panel border-r border-y-0 border-l-0 flex flex-col h-full z-10 relative">
      <div className="h-16 flex items-center px-6 border-b border-[rgba(255,255,255,0.05)]">
        <BrainCircuit className="w-6 h-6 text-f1-cyan mr-2" />
        <span className="font-bold text-lg tracking-widest uppercase text-white">PitWall AI</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center px-4 py-3 rounded-md transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-[rgba(0,240,255,0.1)] text-f1-cyan shadow-[inset_2px_0_0_0_#00f0ff]" 
                  : "text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
              )}
            >
              <Icon className={clsx("w-5 h-5 mr-3 transition-colors", isActive ? "text-f1-cyan" : "group-hover:text-f1-cyan")} />
              <span className="font-medium text-sm tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[rgba(255,255,255,0.05)]">
        <div className="flex items-center px-2 py-2">
          <div className="w-2 h-2 rounded-full bg-f1-cyan animate-pulse mr-2 shadow-[0_0_8px_#00f0ff]" />
          <span className="text-xs text-slate-400 font-mono">IBM Granite Active</span>
        </div>
      </div>
    </div>
  );
}
