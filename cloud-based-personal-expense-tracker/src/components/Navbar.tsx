/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Cloud, Terminal, Calendar, HelpCircle } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setSidebarOpen: () => void;
  onShowAwsDevOps: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setSidebarOpen,
  onShowAwsDevOps,
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Analytics Dashboard';
      case 'expenses':
        return 'Expense History';
      case 'categories':
        return 'Category Budgets';
      case 'reports':
        return 'Spending Reports';
      case 'profile':
        return 'User Account Settings';
      default:
        return 'Personal Expense Tracker';
    }
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={setSidebarOpen}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-900 font-sans tracking-tight">
            {getTabTitle()}
          </h1>
          <p className="text-[10px] text-gray-400 font-sans hidden sm:block">
            System Status: <span className="text-emerald-600 font-semibold">Cloud Sync Active</span>
          </p>
        </div>
      </div>

      {/* Right side: DevOps Telemetry trigger, Date, User widget */}
      <div className="flex items-center space-x-3.5">
        {/* AWS & DevOps Internship Showcase Trigger */}
        <button
          onClick={onShowAwsDevOps}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-xs font-semibold font-sans transition-all cursor-pointer shadow-sm shadow-blue-50/50"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AWS & DevOps Info</span>
        </button>

        {/* Date Panel */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 font-sans font-medium">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{formattedDate}</span>
        </div>

        {/* User Card Display */}
        {user && (
          <div className="flex items-center space-x-2.5 pl-2 border-l border-gray-100">
            <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
              {user.name.substring(0, 1).toUpperCase()}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-800 leading-tight">{user.name}</span>
              <span className="text-[9px] font-mono text-gray-400">ID: {user.id.substring(4, 9)}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
