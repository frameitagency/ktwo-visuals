import { useEffect, useState } from 'react';
import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { Loader2, Calendar, Clock, Lock, Settings, LayoutDashboard, LogOut, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminLayout() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAdminAccess();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkAdminAccess() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        return;
      }
      
      setIsAuthenticated(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
         setIsAdmin(false);
         return;
      }

      // Check admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking admin user:", error);
      }

      setIsAdmin(!!adminUser);
    } catch (e) {
      console.error(e);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <p className="text-xs uppercase tracking-widest text-gray-400 font-mono">Verifying Access</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center gap-6 p-6 text-center">
        <Lock className="w-12 h-12 text-gray-300" strokeWidth={1} />
        <h2 className="text-2xl font-light text-gray-900 leading-tight">Access Restricted</h2>
        <p className="text-gray-500 max-w-md">You are signed in, but you are not authorized as an admin. Contact the studio owner for access.</p>
        <button onClick={handleSignOut} className="py-2 px-6 border border-gray-200 text-sm font-medium hover:bg-gray-50">
          Sign Out
        </button>
      </div>
    );
  }

  const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Appointments', href: '/admin/appointments', icon: Calendar },
    { name: 'Services', href: '/admin/services', icon: Camera },
    { name: 'Packages', href: '/admin/packages', icon: Camera },
    { name: 'Business Hours', href: '/admin/hours', icon: Clock },
    { name: 'Blocked Dates', href: '/admin/blocked-dates', icon: Lock },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f4] flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col fixed inset-y-0 z-10 hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-gray-100">
          <span className="font-medium text-lg uppercase tracking-widest text-gray-900">
            Workspace
          </span>
        </div>
        <div className="flex-1 py-8 overflow-y-auto">
          <nav className="space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    isActive ? 'bg-gray-50 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-4 py-3 text-sm font-medium transition-colors'
                  )}
                >
                  <item.icon className={cn('mr-3 hidden lg:block w-5 h-5 flex-shrink-0', isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="group flex w-full items-center px-4 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 w-5 h-5 text-gray-400 group-hover:text-gray-900" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 md:ml-64 flex flex-col">
        {/* Mobile header placeholder if needed */}
        <div className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center px-6 justify-between">
           <span className="font-medium text-lg uppercase tracking-widest text-gray-900">Workspace</span>
           <button onClick={handleSignOut} className="text-gray-500"><LogOut className="w-5 h-5" /></button>
        </div>
        <main className="flex-1 p-6 md:p-12 overflow-y-auto">
           <div className="max-w-6xl mx-auto">
             <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
