'use client';

import { ReactNode, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  FiHome, FiUsers, FiDollarSign, FiSettings, FiLogOut, FiMenu,
  FiGrid, FiBarChart2, FiBell, FiSearch, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import Link from 'next/link';
import Breadcrumb from './Breadcrumb';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navSections = [
  {
    label: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: FiHome },
      { name: 'Employees', href: '/dashboard/employees', icon: FiUsers },
      { name: 'Departments', href: '/dashboard/departments', icon: FiGrid },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Payroll', href: '/dashboard/payroll', icon: FiDollarSign },
      { name: 'Reports', href: '/dashboard/reports', icon: FiBarChart2 },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Settings', href: '/dashboard/settings', icon: FiSettings },
    ],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentClient, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleChangeClient = () => {
    router.push('/clients');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-64';
  const contentPadding = collapsed ? 'lg:pl-[72px]' : 'lg:pl-64';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 ${sidebarWidth} bg-slate-900 transform transition-all duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Brand */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              {!collapsed && (
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  Cadenza<span className="text-accent-500">HR</span>
                </h1>
              )}
              {collapsed && (
                <span className="text-lg font-bold text-accent-500">C</span>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Client Info */}
          {currentClient && !collapsed && (
            <div className="px-4 py-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-400 font-semibold text-sm">
                    {currentClient.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {currentClient.name}
                  </p>
                  <button
                    onClick={handleChangeClient}
                    className="text-xs text-slate-500 hover:text-accent-400 transition-colors"
                  >
                    Switch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.label}>
                {!collapsed && (
                  <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                          active
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                        title={collapsed ? item.name : undefined}
                      >
                        {active && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-500 rounded-r" />
                        )}
                        <item.icon className={`text-lg flex-shrink-0 ${active ? 'text-accent-400' : ''}`} />
                        {!collapsed && item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Collapse Toggle (desktop only) */}
          <div className="hidden lg:block px-3 py-2 border-t border-slate-800">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
            >
              {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* User Info */}
          <div className="p-3 border-t border-slate-800">
            {!collapsed ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2 mb-2">
                  <div className="h-8 w-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-slate-300 font-medium text-sm">
                      {user?.first_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-slate-500">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <FiLogOut className="text-base" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Sign out"
              >
                <FiLogOut className="text-base" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${contentPadding} transition-all duration-200`}>
        {/* Top Bar */}
        <div className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="lg:hidden -m-2 p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setSidebarOpen(true)}
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <div className="flex flex-1 items-center gap-4">
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
              <FiBell className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-slate-600 font-medium text-sm">
                  {user?.first_name?.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.first_name}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
