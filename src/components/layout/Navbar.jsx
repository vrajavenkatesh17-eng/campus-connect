/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Navbar: Top navigation bar conforming to DESIGN_SPEC sections 2 and 4.
 * - Sticky 64px, surface at 80% opacity with backdrop blur, 1px line + 1px gold hairline.
 * - Left: 36px logo mark + "Campus Connect" (Fraunces) + "Francis Xavier Engineering College" 11px muted.
 * - Center: GooeyNav (React Bits) with synchronized route items per role.
 * - Right: ThemeToggle, Notification bell with unread badge (opens panel with AppNotificationList + "Mark all read"),
 *   User chip (avatar + first name + role Badge) opening keyboard-accessible menu (Profile, Theme, Sign out).
 * - Strictly NO separate logout icon.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { eventService } from '../../services/eventService';
import { supabase } from '../../services/supabase';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ThemeToggle from '../common/ThemeToggle';
import GooeyNav from '../ui/GooeyNav';
import AppNotificationList from '../app/AppNotificationList';
import {
  Menu,
  X,
  Bell,
  CheckCheck,
  ChevronDown,
  User,
  Sun,
  Moon,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, role, isLoading: isAuthLoading, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const drawerRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Clean first name and full name extraction
  const cleanName = useMemo(() => {
    if (profile?.name && typeof profile.name === 'string') {
      return profile.name.replace(/\b\d{2}[A-Z]{2,4}\d{2,4}\b/gi, '').trim() || profile.name.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  }, [profile?.name, user?.email]);

  const cleanFirstName = useMemo(() => {
    return cleanName.split(' ')[0] || 'User';
  }, [cleanName]);

  // Real-time notifications subscription
  useEffect(() => {
    if (!user?.id) return;

    eventService
      .getNotifications()
      .then((list) => {
        setNotifications(list || []);
      })
      .catch(console.error);

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

  // Click outside to close notification and user menu dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trap focus and handle escape key for mobile drawer
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Close menus on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelectNotification = async (item) => {
    if (!item?.id) return;
    if (!item.is_read) {
      await eventService.markNotificationAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }
    if (item.event_id) {
      setIsNotifOpen(false);
      navigate(`/events/${item.event_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await eventService.markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    navigate('/');
  };

  /**
   * Top GooeyNav item definitions strictly per DESIGN_SPEC sections 2 & 4:
   * - Student: Home, Events, Calendar, Passport, Profile
   * - Coordinator: Home, Dashboard, Calendar, Profile
   * - Admin: Home, Dashboard, Calendar, Profile
   * - Signed-out visitor: Home, Events, Verify
   */
  const navItems = useMemo(() => {
    if (!user) {
      return [
        { label: 'Home', path: '/' },
        { label: 'Events', path: '/events' },
        { label: 'Verify', path: '/verify' },
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin' },
        { label: 'Calendar', path: '/events?tab=calendar' },
        { label: 'Profile', path: '/profile' },
      ];
    }

    if (role === 'coordinator') {
      return [
        { label: 'Dashboard', path: '/coordinator' },
        { label: 'Calendar', path: '/events?tab=calendar' },
        { label: 'Profile', path: '/profile' },
      ];
    }

    // Default: Student
    return [
      { label: 'Home', path: '/student' },
      { label: 'Events', path: '/events' },
      { label: 'Calendar', path: '/events?tab=calendar' },
      { label: 'Passport', path: '/student/passport' },
      { label: 'Profile', path: '/profile' },
    ];
  }, [user, role]);

  // GooeyNav items: labels only (NO href to prevent full page reloads)
  const gooeyItems = useMemo(() => {
    return navItems.map((item) => ({ label: item.label }));
  }, [navItems]);

  /**
   * Accurate activeIndex derivation from route & query state:
   * Automatically remains in sync with back/forward history navigation.
   */
  const activeIndex = useMemo(() => {
    const pathname = location.pathname;
    const search = location.search;

    // 1. Calendar query check
    if (search.includes('tab=calendar')) {
      const calIdx = navItems.findIndex((i) => i.label === 'Calendar');
      if (calIdx !== -1) return calIdx;
    }

    // 2. Profile check
    if (pathname.startsWith('/profile')) {
      const profIdx = navItems.findIndex((i) => i.label === 'Profile');
      if (profIdx !== -1) return profIdx;
    }

    // 3. Passport check
    if (pathname.startsWith('/student/passport')) {
      const passIdx = navItems.findIndex((i) => i.label === 'Passport');
      if (passIdx !== -1) return passIdx;
    }

    // 4. Student home portal
    if (role === 'student' && pathname.startsWith('/student')) {
      const homeIdx = navItems.findIndex((i) => i.label === 'Home');
      if (homeIdx !== -1) return homeIdx;
    }

    // 5. Coordinator Dashboard
    if (role === 'coordinator' && pathname.startsWith('/coordinator')) {
      const dashIdx = navItems.findIndex((i) => i.label === 'Dashboard');
      if (dashIdx !== -1) return dashIdx;
    }

    // 6. Admin Dashboard
    if (role === 'admin' && pathname.startsWith('/admin')) {
      const dashIdx = navItems.findIndex((i) => i.label === 'Dashboard');
      if (dashIdx !== -1) return dashIdx;
    }

    // 7. Events check
    if (pathname.startsWith('/events')) {
      const evtIdx = navItems.findIndex((i) => i.label === 'Events');
      if (evtIdx !== -1) return evtIdx;
    }

    // 8. Public Verify check
    if (pathname.startsWith('/verify')) {
      const verIdx = navItems.findIndex((i) => i.label === 'Verify');
      if (verIdx !== -1) return verIdx;
    }

    // 9. Root path
    if (pathname === '/') {
      const homeIdx = navItems.findIndex((i) => i.label === 'Home');
      if (homeIdx !== -1) return homeIdx;
    }

    return 0;
  }, [location.pathname, location.search, navItems, role]);

  const handleNavChange = useCallback(
    (index) => {
      const target = navItems[index];
      if (target?.path) {
        navigate(target.path);
      }
    },
    [navItems, navigate]
  );

  const primaryAccent = 'rgb(var(--primary))';

  // Format notification items for AppNotificationList
  const notificationListItems = useMemo(() => {
    return notifications.map((n) => ({
      id: n.id,
      title: n.title || 'Notification',
      description: n.message || '',
      meta: new Date(n.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      is_read: n.is_read,
      event_id: n.event_id,
    }));
  }, [notifications]);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-line transition-colors duration-200">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: 36px logo mark + "Campus Connect" (Fraunces 18) + College Name (hidden under 1280px) */}
          <Link
            to={
              user
                ? role === 'admin'
                  ? '/admin'
                  : role === 'coordinator'
                  ? '/coordinator'
                  : '/student'
                : '/'
            }
            className="flex items-center gap-3 group shrink-0 select-none"
            aria-label="Campus Connect Home"
          >
            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-2 p-0.5 border border-line shadow-xs transition-transform duration-200 group-hover:scale-105 shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/fxec-logo.png"
                alt="Francis Xavier Engineering College Logo"
                className="w-full h-full object-contain"
                width="40"
                height="40"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-lg leading-tight text-ink group-hover:text-primary transition-colors">
                Campus Connect
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted leading-none hidden xl:inline">
                Francis Xavier Engineering College
              </span>
            </div>
          </Link>

          {/* Center: Centered GooeyNav (Desktop only >= 768px, framed) */}
          <div className="hidden md:flex flex-1 items-center justify-center px-2">
            {isAuthLoading ? (
              <div className="flex items-center justify-center h-10 px-6 rounded-full bg-surface-2/60 border border-line/40 animate-pulse">
                <div className="h-3 w-48 bg-line/60 rounded-full" />
              </div>
            ) : (
              <GooeyNav
                items={gooeyItems}
                activeIndex={activeIndex}
                onChange={handleNavChange}
                theme={resolvedTheme || 'light'}
                size="md"
                frame={true}
                particleCount={12}
                spread={48}
                animationTime={500}
                gooeyness={0.5}
                wobble={0.4}
                hoverEffect={true}
                color={primaryAccent}
                activeTextColor="rgb(var(--on-primary))"
              />
            )}
          </div>

          {/* Right Section: Theme Toggle, Notifications, User Chip / Login */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <ThemeToggle />

            {user ? (
              <>
                {/* Notification Bell Dropdown */}
                <div className="relative" ref={notifRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="p-2 rounded-[12px] text-muted hover:text-ink hover:bg-surface-2 transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    title="Notifications"
                    aria-label="View notifications"
                    aria-expanded={isNotifOpen}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface" />
                    )}
                  </Button>

                  {isNotifOpen && (
                    <div
                      role="region"
                      aria-label="Notification Center"
                      className="absolute right-0 mt-2 w-84 bg-surface border border-line rounded-[20px] shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* Dropdown Header */}
                      <div className="px-4 py-3 border-b border-line/60 flex items-center justify-between bg-surface-2/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink uppercase tracking-wider">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <Badge variant="primary" size="sm">
                              {unreadCount} new
                            </Badge>
                          )}
                        </div>

                        {unreadCount > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll}
                            className="text-xs font-semibold text-primary hover:underline px-2 py-1 h-auto flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </Button>
                        )}
                      </div>

                      {/* Dropdown Body: AppNotificationList */}
                      <div className="max-h-80 overflow-y-auto p-2">
                        <AppNotificationList
                          items={notificationListItems}
                          onSelect={handleSelectNotification}
                          emptyMessage="No recent notifications at this time."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-5 w-px bg-line mx-0.5" />

                {/* User Chip: Avatar + First Name + Role Badge (Opens keyboard-accessible menu) */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2.5 py-1.5 pl-2 pr-3 rounded-[12px] bg-surface-2/60 border border-line hover:bg-surface-2 hover:border-line focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer select-none h-10"
                  >
                    {/* Avatar circle with initial */}
                    <div className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
                      {cleanName ? cleanName[0].toUpperCase() : 'U'}
                    </div>

                    {/* Name + Role stack */}
                    <div className="flex flex-col items-start text-left">
                      <span className="text-xs font-semibold text-ink leading-tight truncate max-w-[110px]" title={cleanName}>
                        {cleanFirstName}
                      </span>
                      <Badge
                        variant={role || 'neutral'}
                        size="sm"
                        className="text-xs uppercase tracking-wider px-1.5 py-0 mt-0.5 leading-tight"
                      >
                        {role || 'User'}
                      </Badge>
                    </div>

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>

                  {/* Keyboard-Accessible User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      aria-orientation="vertical"
                      className="absolute right-0 mt-2 w-60 bg-surface border border-line rounded-[16px] shadow-lg z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* Identity Header */}
                      <div className="px-3 py-2.5 border-b border-line/60">
                        <p className="text-xs font-bold text-ink truncate" title={cleanName}>
                          {cleanName}
                        </p>
                        <p className="text-xs text-muted truncate mt-0.5" title={user.email}>
                          {user.email}
                        </p>
                      </div>

                      {/* Menu Item: Profile */}
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-semibold text-ink hover:bg-surface-2 hover:text-primary transition-colors select-none"
                      >
                        <User className="w-4 h-4 text-muted" />
                        <span>Profile</span>
                      </Link>

                      {/* Menu Item: Theme Switcher */}
                      <Button
                        variant="ghost"
                        size="sm"
                        role="menuitem"
                        onClick={() => {
                          toggleTheme();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-semibold text-ink hover:bg-surface-2 hover:text-primary transition-colors text-left h-auto"
                      >
                        <div className="flex items-center gap-2.5">
                          {resolvedTheme === 'dark' ? (
                            <Moon className="w-4 h-4 text-muted" />
                          ) : (
                            <Sun className="w-4 h-4 text-muted" />
                          )}
                          <span>Theme</span>
                        </div>
                        <span className="text-xs font-mono text-muted uppercase capitalize">
                          {resolvedTheme}
                        </span>
                      </Button>

                      <div className="my-1 border-t border-line/60" />

                      {/* Menu Item: Sign out */}
                      <Button
                        variant="ghost"
                        size="sm"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-semibold text-danger hover:bg-danger-soft transition-colors text-left h-auto"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="primary" size="sm">
                    College Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Top Bar Controls (< 768px) */}
          <div className="flex items-center gap-1.5 md:hidden">
            <ThemeToggle />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-[12px] text-muted hover:text-ink relative"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-[12px] text-muted hover:text-ink hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 1px Gold Gradient Hairline Accent Under Navbar per DESIGN_SPEC v2 */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      {/* Mobile Drawer (Below 768px, focus-trapped, closes on navigation) */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="md:hidden border-b border-line bg-surface px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2"
        >
          {/* Mobile Nav Links */}
          <div className="space-y-1">
            {navItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <Button
                  key={item.label}
                  variant={isActive ? 'primary' : 'ghost'}
                  size="md"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate(item.path);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-[12px] text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-primary text-on-primary font-semibold shadow-xs'
                      : 'text-muted hover:text-ink hover:bg-surface-2'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-on-primary shrink-0" />
                  )}
                </Button>
              );
            })}
          </div>

          {/* Mobile User Profile & Session Action */}
          <div className="pt-3 border-t border-line/60">
            {user ? (
              <div className="px-2 pt-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0">
                    {cleanName ? cleanName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink truncate" title={cleanName}>
                      {cleanFirstName}
                    </p>
                    <Badge variant={role || 'neutral'} size="sm" className="mt-0.5 text-xs">
                      {role || 'User'}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  icon={LogOut}
                  className="text-xs text-danger hover:bg-danger-soft border-line"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="pt-1">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Sign In with College ID
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
