import React from "react";
import {
  MessageSquareText,
  Search,
  FileText,
  Bell,
  UserRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 h-[72px] w-full border-b border-gray-200 bg-white">
      <div className="flex h-full w-full items-center">

        {/* LEFT: BRAND */}
        <div className="flex h-full w-[265px] shrink-0 items-center gap-3 border-r border-gray-200 px-5">

          {/* Logo */}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <MessageSquareText size={23} strokeWidth={2.5} />
          </div>

          {/* Brand Name */}
          <h1 className="text-[20px] font-semibold tracking-tight text-gray-900">
            ReachPulse
          </h1>

          {/* WhatsApp API Badge */}
          <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-1 text-[10px] font-semibold text-green-800">
            ● WA API
          </span>
        </div>

        {/* SEARCH BAR */}
        <div className="flex flex-1 items-center justify-center px-5">
          <div className="flex h-10 w-full max-w-[440px] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100">

            <Search
              size={19}
              className="shrink-0 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search campaigns, templates, phone numbers..."
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            />

            <kbd className="hidden whitespace-nowrap rounded border border-gray-200 bg-white px-1.5 py-1 text-[10px] text-gray-500 xl:block">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex h-full shrink-0 items-center gap-4 px-5">

          {/* API STATUS */}
          <div className="flex min-w-[210px] items-center gap-2 rounded-full border border-green-200 bg-green-100 px-3 py-2">

            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-green-200" />

            <div className="text-xs font-semibold leading-4 text-green-800">
              <div>API Connected · 99.4%</div>
              <div className="text-green-700">Health</div>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="h-9 w-px bg-gray-200" />

          {/* NOTIFICATIONS */}
          <button
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-emerald-700"
          >
            <Bell size={21} strokeWidth={1.8} />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* PROFILE */}
          <button
            aria-label="User profile"
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-gray-100"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-white">
              <UserRound size={21} />
            </div>

            <ChevronDown
              size={15}
              className="text-gray-500"
            />
          </button>

        </div>
      </div>
    </header>
  );
};

export default Navbar;