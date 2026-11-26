/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * LiveProjectorPage: S-M 2 High-Contrast Projector Display
 * Fullscreen presentation screen:
 * - QR code (white card, black modules, >= 60vh)
 * - 30-second rotating token with animated SVG ring countdown
 * - Live turnout counter (attended / registered)
 * - Event title and venue
 * - AppSlideConfirm to end attendance
 * - Screen Wake Lock API integration (keeps display awake)
 * - ESC key to exit
 * - Fixed dark surround for maximum auditorium contrast
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import AppSlideConfirm from '../../components/app/AppSlideConfirm';
import AppButton from '../../components/app/AppButton';
import Spinner from '../../components/common/Spinner';
import {
  Maximize2,
  Minimize2,
  Users,
  MapPin,
  Calendar,
  ShieldCheck,
  Radio,
  ArrowLeft,
  SunMedium,
} from 'lucide-react';

export default function LiveProjectorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [event, setEvent] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const containerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // 1. Fetch Event & Setup Initial Attendance
  useEffect(() => {
    let isMounted = true;

    async function loadEventData() {
      try {
        const evt = await eventService.getEventById(id);
        if (!isMounted) return;
        setEvent(evt);

        // Fetch attendees count
        const attendees = await attendanceService.getEventAttendance(id);
        if (isMounted) {
          setLiveCount(attendees?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching event data:', err);
        showToast('Failed to load event details.', 'error');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEventData();

    // Subscribe to attendance Realtime updates
    const subscription = attendanceService.subscribeToAttendance(id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLiveCount((prev) => prev + 1);
      } else if (payload.eventType === 'DELETE') {
        setLiveCount((prev) => Math.max(0, prev - 1));
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [id]);

  // 2. Attendance Token Fetcher
  const fetchToken = async () => {
    if (!id) return;
    try {
      const data = await attendanceService.getAttendanceToken(id);
      if (data?.token) {
        setTokenData(data);
        setSecondsLeft(data.expires_in || 30);
      }
    } catch (err) {
      console.error('Failed to fetch attendance token:', err);
    }
  };

  useEffect(() => {
    fetchToken();
  }, [id]);

  // 3. 30s Countdown Timer
  useEffect(() => {
    if (!tokenData) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          fetchToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tokenData]);

  // 4. Screen Wake Lock API (keeps projector display from sleeping)
  useEffect(() => {
    let released = false;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          setWakeLockActive(true);
          wakeLockRef.current.addEventListener('release', () => {
            if (!released) setWakeLockActive(false);
          });
        }
      } catch (err) {
        console.warn('Screen Wake Lock not active:', err);
        setWakeLockActive(false);
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // 5. ESC Key to Exit / Fullscreen Handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          navigate(`/coordinator/events/${id}/attendance`);
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [id, navigate]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  const handleEndAttendance = () => {
    showToast('Attendance session concluded.', 'success');
    navigate(`/coordinator/events/${id}/attendance`);
  };

  if (isLoading || !event) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-neutral-300">Initializing Live QR Projector Screen...</p>
      </div>
    );
  }

  // QR Payload: JSON payload encoded with token and metadata
  const qrValue = tokenData?.token
    ? JSON.stringify({
        t: tokenData.token,
        e: id,
        s: tokenData.salt || 'cc',
      })
    : '';

  // Ring Countdown Circle Dimensions
  const ringRadius = 26;
  const circumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = circumference - (secondsLeft / 30) * circumference;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
    >
      {/* Top Bar: Event Meta & Controls */}
      <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/coordinator/events/${id}/attendance`)}
            className="text-neutral-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span>Exit Projector (ESC)</span>
          </AppButton>
          <div className="h-5 w-px bg-white/20 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Live Session
            </span>
            {wakeLockActive && (
              <span className="inline-flex items-center gap-1 text-xs text-neutral-400 ml-2 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                <span>Wake Lock Active</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="text-neutral-300 hover:text-white hover:bg-white/10"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-5 h-5 mr-1.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-5 h-5 mr-1.5" />
                <span>Fullscreen</span>
              </>
            )}
          </AppButton>
        </div>
      </header>

      {/* Main Center Stage: QR Code (>= 60vh on white card) & Real-time Info */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 py-4">
        {/* White Card containing Black Module QR (Height >= 60vh) per S-M 2 */}
        <div className="relative flex items-center justify-center bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-white/20 shrink-0">
          <div className="w-[62vh] h-[62vh] max-w-[85vw] max-h-[85vw] flex items-center justify-center">
            {qrValue ? (
              <QRCodeSVG
                value={qrValue}
                size={500}
                level="H"
                includeMargin={false}
                fgColor="black"
                bgColor="white"
                className="w-full h-full object-contain"
              />
            ) : (
              <Spinner size="lg" />
            )}
          </div>
        </div>

        {/* Right Info Column: Event Title, Countdown Ring, Turnout Counter */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg space-y-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
              Francis Xavier Engineering College
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mt-1 leading-tight">
              {event.title}
            </h1>
            <div className="flex items-center justify-center lg:justify-start gap-4 text-neutral-300 text-sm mt-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-light text-amber-400" />
                <span>{event.venues?.name || event.custom_venue || 'FXEC Campus'}</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Official Attendance Portal</span>
              </span>
            </div>
          </div>

          {/* 30-Second Animated SVG Ring Countdown */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-white/5 border border-white/10 w-full justify-center lg:justify-start">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 60 60">
                {/* Background Track */}
                <circle
                  cx="30"
                  cy="30"
                  r={ringRadius}
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  className="text-white/15"
                />
                {/* Animated Progress Ring */}
                <circle
                  cx="30"
                  cy="30"
                  r={ringRadius}
                  stroke="currentColor"
                  strokeWidth="4.5"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute font-mono text-lg font-bold text-white">
                {secondsLeft}s
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Rotating QR Code</p>
              <p className="text-xs text-neutral-400">Refreshes every 30s to prevent proxy attendance</p>
            </div>
          </div>

          {/* Live Turnout Counter: Attended / Registered */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Attended</span>
              </div>
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-emerald-400">
                {liveCount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400 mb-1">
                <Radio className="w-4 h-4 text-neutral-400" />
                <span>Capacity / Registered</span>
              </div>
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-neutral-200">
                {event.seat_capacity || 100}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Slide to End Attendance Confirmation */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-4 max-w-5xl mx-auto w-full">
        <p className="text-xs text-neutral-400 text-center sm:text-left">
          Students: Open <strong>Campus Connect</strong> on your phone & navigate to <strong>Scan QR</strong>
        </p>
        <div className="w-full sm:w-80">
          <AppSlideConfirm
            label="Slide to End Attendance"
            confirmLabel="Confirming..."
            onConfirm={handleEndAttendance}
          />
        </div>
      </footer>
    </div>
  );
}
