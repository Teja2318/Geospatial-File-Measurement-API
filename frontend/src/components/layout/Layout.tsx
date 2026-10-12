import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileStack,
  Settings,
  Globe2,
  Menu,
  X,
  ChevronLeft,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealth } from '@/hooks/useApi';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { path: '/upload', icon: Upload, label: 'Upload Data', badge: 'Fast' },
  { path: '/files', icon: FileStack, label: 'File Repository', badge: null },
  { path: '/settings', icon: Settings, label: 'Preferences', badge: null },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data: health } = useHealth();

  return (
    <div className="flex h-screen overflow-hidden bg-[#070b14] text-slate-100">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-slate-800/70 bg-slate-950/80 backdrop-blur-2xl transition-all duration-300 z-30 select-none shadow-2xl',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/25 shrink-0 flex items-center justify-center">
            <div className="w-full h-full rounded-[10px] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center text-white">
              <Globe2 className="w-5 h-5 text-cyan-300" />
            </div>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  GeoMeasure
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  GIS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Vector Precision Engine
              </p>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn(
                'w-4 h-4 transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </div>
          )}
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-transparent text-white border-l-2 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60',
                  collapsed && 'justify-center px-0'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                    isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                  )}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Diagnostic Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-slate-800/60">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 shadow-inner space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  FastAPI Engine
                </span>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {health?.status === 'healthy' ? 'READY' : 'ONLINE'}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>CRS Engine: PROJ 9</span>
                <span>v1.0.0</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 md:hidden flex flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
            <Globe2 className="w-5 h-5 text-cyan-200" />
          </div>
          <span className="font-bold text-lg text-white">GeoMeasure</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500/20 to-blue-500/10 text-white border-l-2 border-indigo-500 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive ? 'text-cyan-400' : 'text-slate-400')} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top ambient luminous glow */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-cyan-500/5 via-indigo-500/5 to-transparent blur-3xl" />

        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-base text-white">GeoMeasure</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
