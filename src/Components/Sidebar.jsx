import { NavLink } from "react-router-dom";
import React from "react";
import {
  MessageSquareText,
  LayoutDashboard,
  FileText,
  Users,
  LifeBuoy,
  Settings,
  ChevronUp,
  ChevronDown,
  CircleHelp,
  LogOut,
  Zap,
} from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-gray-200 bg-white text-gray-700">

      {/* BRAND HEADER */}
      <div className="flex h-[55px] shrink-0 items-center gap-2 border-b border-gray-100 px-3">

        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-700 text-white">
          <MessageSquareText size={17} strokeWidth={2.5} />
        </div>

        <span className="text-sm font-bold tracking-tight text-gray-900">
          ReachPulse
        </span>

        <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[8px] font-bold text-green-800">
          WA API
        </span>
      </div>

      {/* WORKSPACE SELECTOR */}
      <div className="px-2 pt-3">
        <button className="flex w-full items-center justify-between rounded-md px-2 py-2 text-xs transition hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <Zap size={14} />
            </div>

            <span className="font-semibold text-gray-700">
              Operations
            </span>
          </div>

          <ChevronDown size={13} className="text-gray-400" />
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 px-2 pt-3">
      {/* Inbox   */}
        <NavLink
          to="/inbox"
          className={({ isActive }) =>
            `flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition ${
              isActive
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
            }`
          }
        >
          <FileText size={15} />
          <span>Inbox</span>
        </NavLink>
        
        
        {/* DASHBOARD */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition ${
              isActive
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
            }`
          }
        >
          <FileText size={15} />
          <span>Dashboard</span>
        </NavLink>
        {/* TEMPLATE LIBRARY */}
        <NavLink
          to="/templates"
          className={({ isActive }) =>
            `flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition ${
              isActive
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
            }`
          }
        >
          <FileText size={15} />
          <span>Template Library</span>
        </NavLink>

        {/* CONTACTS */}
          <NavLink
          to="/contacts"
          className={({ isActive }) =>
            `flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition ${
              isActive
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
            }`
          }
        >
          <FileText size={15} />
          <span>Define Contacts</span>
        </NavLink>

        {/* LIVE CHAT */}
          <NavLink
          to="/yourtemplates"
          className={({ isActive }) =>
            `flex h-8 items-center gap-2 rounded-md px-2.5 text-xs font-medium transition ${
              isActive
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-emerald-700"
            }`
          }
        >
          <FileText size={15} />
          <span>Your Template</span>
        </NavLink>
        

      </nav>

      {/* BOTTOM SECTION */}
      <div className="shrink-0 border-t border-gray-100 px-2 pb-3 pt-2">

        {/* HELP & SUPPORT */}
        <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-[11px] text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
          <CircleHelp size={14} />
          <span>Help & Support</span>
        </button>

        {/* SETTINGS */}
        <button className="flex h-7 w-full items-center gap-2 rounded-md px-2 text-[11px] text-gray-500 transition hover:bg-gray-100 hover:text-gray-800">
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* PROFILE */}
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
            KM
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold text-gray-800">
              Khushank Mathankar
            </p>

            <p className="truncate text-[9px] text-gray-500">
              Administrator
            </p>
          </div>

          <button
            aria-label="Profile options"
            className="text-gray-400 hover:text-gray-700"
          >
            <ChevronUp size={14} />
          </button>

        </div>
      </div>
    </aside>
  );
};

export default Sidebar;