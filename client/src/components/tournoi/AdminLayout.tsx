import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { useActiveLeague, useTeams, useMatches, usePlayerConflicts } from '@/hooks/use-tournoi';
import AdminGuard from '@/components/tournoi/AdminGuard';
import {
  LayoutDashboard, Trophy, Users, Calendar, LogOut, ExternalLink,
  AlertTriangle, ChevronRight, Menu, X,
} from 'lucide-react';

const navItems = [
  { href: '/tournoi/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/tournoi/admin/league', label: 'Leagues', icon: Trophy },
  { href: '/tournoi/admin/teams', label: 'Équipes', icon: Users },
  { href: '/tournoi/admin/matchs', label: 'Matchs', icon: Calendar },
];

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const AdminLayoutContent = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();
  const { data: league } = useActiveLeague();
  const { data: teams } = useTeams(league?.id);
  const { data: matches } = useMatches(league?.id);
  const { data: conflicts } = usePlayerConflicts();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const completedCount = matches?.filter(m => m.status === 'completed').length || 0;
  const scheduledCount = matches?.filter(m => m.status === 'scheduled').length || 0;

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/tournoi/admin/login');
  };

  const handleNav = (href: string) => {
    setLocation(href);
    setSidebarOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rayoblue/20 border border-rayoblue/30 flex items-center justify-center">
              <Trophy className="w-4.5 h-4.5 text-rayoblue" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Tournoi Admin</h1>
              <p className="text-[10px] text-gray-500">Ramadan 2026</p>
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* League info card */}
      {league && (
        <div className="mx-3 mt-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">League active</span>
          </div>
          <p className="text-xs font-bold text-white">{league.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{league.season}{league.city ? ` · ${league.city}` : ''}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center">
              <p className="text-sm font-bold text-white">{teams?.length || 0}</p>
              <p className="text-[9px] text-gray-500">Équipes</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">{completedCount}</p>
              <p className="text-[9px] text-gray-500">Joués</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">{scheduledCount}</p>
              <p className="text-[9px] text-gray-500">À venir</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = isActive(item.href, item.exact);
          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                active
                  ? 'bg-rayoblue/15 text-rayoblue border border-rayoblue/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60 border border-transparent'
              }`}
            >
              <item.icon className={`w-4 h-4 ${active ? 'text-rayoblue' : 'text-gray-500 group-hover:text-white'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.href === '/tournoi/admin/teams' && conflicts && conflicts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">
                  {conflicts.length}
                </span>
              )}
              {active && <ChevronRight className="w-3.5 h-3.5 text-rayoblue/50" />}
            </button>
          );
        })}

        <div className="pt-3 mt-3 border-t border-gray-800">
          <button
            onClick={() => window.open('/tournoi', '_blank')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:text-white hover:bg-gray-800/60 transition-all border border-transparent"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="flex-1 text-left">Voir le tournoi</span>
          </button>
        </div>
      </nav>

      {/* Conflicts alert */}
      {conflicts && conflicts.length > 0 && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-semibold text-amber-400">
              {conflicts.length} conflit{conflicts.length > 1 ? 's' : ''} joueurs
            </span>
          </div>
          <button
            onClick={() => handleNav('/tournoi/admin/teams')}
            className="mt-1.5 text-[10px] text-amber-500/80 hover:text-amber-400 font-medium transition-colors"
          >
            Gérer les conflits →
          </button>
        </div>
      )}

      {/* User / Logout */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
            <span className="text-xs font-bold text-gray-400">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">{user?.email || 'Admin'}</p>
            <p className="text-[10px] text-gray-600">Administrateur</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Déconnexion"
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: fixed, Mobile: slide-in drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-screen z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:z-30
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Burger menu - mobile only */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-white truncate">{title}</h2>
                {subtitle && <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const AdminLayout = (props: AdminLayoutProps) => (
  <AdminGuard>
    <AdminLayoutContent {...props} />
  </AdminGuard>
);

export default AdminLayout;
