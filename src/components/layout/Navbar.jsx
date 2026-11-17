import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService } from '../../services/eventService';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { GraduationCap, Menu, X, LogOut, User, Bell, CheckCircle2 } from 'lucide-react';

export default function Navbar() {
  const { user, profile, role, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    eventService.getNotifications().then((list) => {
      setNotifications(list || []);
    }).catch(console.error);

    // Realtime notifications subscription
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setNotifications((prev) => [payload.new, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notif) => {
    if (!notif.is_read) {
      await eventService.markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }
    if (notif.event_id) {
      setIsNotifOpen(false);
      navigate(`/events/${notif.event_id}`);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'coordinator') return '/coordinator';
    return '/student';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-neutral-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-burgundy flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight text-neutral-900 group-hover:text-burgundy transition-colors">
                Campus Connect
              </span>
              <span className="text-[11px] font-medium text-neutral-500 tracking-wide uppercase">
                Francis Xavier Engg College
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-neutral-600 hover:text-burgundy transition-colors"
            >
              Home
            </Link>

            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="text-sm font-medium text-neutral-600 hover:text-burgundy transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="text-sm font-medium text-neutral-600 hover:text-burgundy transition-colors"
                >
                  My Profile
                </Link>

                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 rounded-lg text-neutral-600 hover:text-burgundy hover:bg-neutral-100 transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-burgundy ring-2 ring-white" />
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                        <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <Badge variant="primary" size="sm">
                            {unreadCount} new
                          </Badge>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-neutral-500">
                            No notifications at this time.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkAsRead(n)}
                              className={`p-3 text-xs cursor-pointer hover:bg-neutral-50 transition-colors ${
                                !n.is_read ? 'bg-burgundy-50/30' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <span className="font-bold text-neutral-900">{n.title}</span>
                                {!n.is_read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-burgundy shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-neutral-600 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-neutral-400 mt-1 block">
                                {new Date(n.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-5 w-px bg-neutral-200 mx-1" />

                {/* Profile Pill */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-neutral-900 leading-tight">
                      {profile?.name || user.email?.split('@')[0]}
                    </span>
                    <Badge variant={role || 'neutral'} size="sm" className="mt-0.5 uppercase tracking-wider text-[10px]">
                      {role || 'User'}
                    </Badge>
                  </div>

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 rounded-lg text-neutral-500 hover:text-burgundy hover:bg-neutral-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    College Sign In
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Home
          </Link>
          {user ? (
            <>
              <Link
                to={getDashboardPath()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-neutral-700 hover:bg-neutral-100"
              >
                My Profile
              </Link>
              <div className="pt-2 border-t border-neutral-200">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {profile?.name || user.email}
                    </p>
                    <Badge variant={role || 'neutral'} size="sm" className="mt-1">
                      {role || 'User'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    icon={LogOut}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  Sign In with College ID
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
