import { Link, Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("shielddocs_session");
    window.location.href = "/login";
  };

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Create Share", path: "/share" },
    { name: "Activity", path: "/activity" },
    { name: "Trust Scores", path: "/trust-scores" },
  ];

  const [showNotifications, setShowNotifications] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const sessionData = localStorage.getItem("shielddocs_session");
        if (!sessionData) return;
        const userData = JSON.parse(sessionData);

        const { data: myShares } = await supabase
          .from("shares")
          .select("id, receiver_name")
          .eq("owner_id", userData.user.id)
          .eq("status", "Active");

        if (!myShares || myShares.length === 0) return;

        const shareMap = myShares.reduce((acc, s) => ({...acc, [s.id]: s.receiver_name}), {});

        const { data: acts } = await supabase
          .from("share_activities")
          .select()
          .in("share_id", myShares.map(s => s.id))
          .in("action_type", ['screenshot_attempt', 'copy_or_print_attempt', 'right_click_attempt'])
          .order("created_at", { ascending: false });

        if (acts) {
          const ignoredIds = JSON.parse(localStorage.getItem("ignored_notifications") || "[]");
          const newNotifs = acts
             .filter(a => !ignoredIds.includes(a.id))
             .map(a => ({
                id: a.id,
                share_id: a.share_id,
                text: `${shareMap[a.share_id] || 'Someone'} attempted a ${a.action_type.replace('_attempt', '').replace(/_/g, ' ')}!`,
                suspicious: true
             }));
          setNotifications(newNotifs);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRevoke = async (notif) => {
    try {
      await supabase.from("shares").update({ status: 'Revoked' }).eq("id", notif.share_id);
      
      const ignoredIds = JSON.parse(localStorage.getItem("ignored_notifications") || "[]");
      ignoredIds.push(notif.id);
      localStorage.setItem("ignored_notifications", JSON.stringify(ignoredIds));
      
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      alert("Access revoked successfully for this user.");
    } catch (err) {
      console.error(err);
      alert("Failed to revoke access.");
    }
  };

  const handleIgnore = (notif) => {
    const ignoredIds = JSON.parse(localStorage.getItem("ignored_notifications") || "[]");
    ignoredIds.push(notif.id);
    localStorage.setItem("ignored_notifications", JSON.stringify(ignoredIds));
    
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-dark-surface backdrop-blur-md border-b border-dark-border sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-300 hover:text-white hover:bg-dark-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden sm:block">Shield<span className="text-brand-400">Docs</span></span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-300 hover:text-white hover:bg-dark-border rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark-surface"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-dark-surface border border-dark-border rounded-xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-dark-border flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">No new notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-dark-border/50 hover:bg-dark-border transition-colors">
                        <p className="text-sm text-gray-200 mb-2 font-medium">{n.text}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleRevoke(n)} className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-2.5 py-1.5 rounded-md transition-colors font-medium">Revoke Access</button>
                          <button onClick={() => handleIgnore(n)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1.5 rounded-md transition-colors">Ignore</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 text-sm font-medium text-gray-300 hover:text-white rounded-full bg-dark-surface border border-dark-border transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <div className="w-7 h-7 bg-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                U
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-surface border border-dark-border rounded-xl shadow-2xl py-1 z-50">
                <div className="px-4 py-2 border-b border-dark-border">
                  <p className="text-sm text-white font-medium">Current User</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-border hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-dark-bg/80 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sliding Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-surface border-r border-dark-border transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-dark-border">
            <span className="font-bold text-xl tracking-tight text-white">Menu</span>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-md">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                    ? "bg-brand-500/20 text-primary-300 border border-brand-500/30 shadow-[0_0_15px_rgba(74,221,242,0.15)]" 
                    : "text-gray-300 hover:bg-dark-border hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-dark-border">
            <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors shadow-sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
