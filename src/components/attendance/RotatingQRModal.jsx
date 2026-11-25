import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import AppSlideConfirm from '../app/AppSlideConfirm';
import {
  QrCode,
  RefreshCw,
  Maximize2,
  Minimize2,
  Users,
  ShieldCheck,
  Clock,
  X,
  AlertCircle
} from 'lucide-react';

export default function RotatingQRModal({ isOpen, onClose, event }) {
  const { showToast } = useToast();
  const [tokenData, setTokenData] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [attendees, setAttendees] = useState([]);
  const modalContainerRef = useRef(null);

  // Fetch token function
  const fetchToken = async () => {
    if (!event?.id) return;
    try {
      const data = await attendanceService.getAttendanceToken(event.id);
      if (data?.token) {
        setTokenData(data);
        setSecondsLeft(data.expires_in || 30);
      }
    } catch (err) {
      console.error('Failed to fetch attendance token:', err);
      showToast(err.message || 'Could not generate QR attendance token.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and live count setup
  useEffect(() => {
    if (!isOpen || !event?.id) return;

    setIsLoading(true);
    fetchToken();

    // Fetch initial attendees count
    attendanceService.getEventAttendance(event.id)
      .then((records) => {
        setAttendees(records);
        setLiveCount(records.length);
      })
      .catch((err) => console.error('Error fetching attendees count:', err));

    // Subscribe to live Realtime updates
    const subscription = attendanceService.subscribeToAttendance(event.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLiveCount((prev) => prev + 1);
        attendanceService.getEventAttendance(event.id).then(setAttendees);
      } else if (payload.eventType === 'DELETE') {
        setLiveCount((prev) => Math.max(0, prev - 1));
        attendanceService.getEventAttendance(event.id).then(setAttendees);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isOpen, event?.id]);

  // 1-second interval timer for the 30-second rotating QR token
  useEffect(() => {
    if (!isOpen || !tokenData) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Token expired, fetch fresh token
          fetchToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, tokenData]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;

    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!isOpen || !event) return null;

  // The payload encoded in the QR code: JSON string with event_id, token, and institution header
  const qrPayload = JSON.stringify({
    app: 'campus_connect_fxec',
    eventId: event.id,
    token: tokenData?.token || '',
    slot: tokenData?.slot || 0,
  });

  const progressPercentage = ((secondsLeft / 30) * 100);

  return (
    <div
      ref={modalContainerRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-colors ${
        isFullscreen ? 'bg-surface-2 text-white' : 'bg-black/60 backdrop-blur-xs'
      }`}
    >
      <div
        className={`w-full max-w-xl rounded-2xl shadow-2xl border transition-all ${
          isFullscreen
            ? 'h-full flex flex-col justify-between border-line bg-surface-2 text-white p-8 max-w-4xl'
            : 'bg-white border-line p-6'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line dark:border-line">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <QrCode className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold truncate max-w-sm sm:max-w-md">
                Live Attendance QR
              </h2>
              <Badge variant="success" size="sm" className="gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Session
              </Badge>
            </div>
            <p className="text-xs text-muted line-clamp-1">
              {event.title} • {event.venue?.name || event.custom_venue || 'FXEC Campus'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Projector Fullscreen Mode'}
              className="p-2 rounded-lg border border-line hover:bg-surface-2 dark:border-line dark:hover:bg-surface-2 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 rounded-lg border border-line hover:bg-surface-2 dark:border-line dark:hover:bg-surface-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* QR Code Presentation Area */}
        <div className="my-6 flex flex-col items-center justify-center space-y-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" />
              <p className="text-xs text-muted">Generating secure rotating HMAC token...</p>
            </div>
          ) : (
            <>
              {/* QR Code Box */}
              <div className="relative p-6 rounded-2xl bg-white shadow-xl border-2 border-line dark:border-line">
                <QRCodeSVG
                  value={qrPayload}
                  size={isFullscreen ? 380 : 270}
                  level="M"
                  includeMargin={true}
                  className="rounded-lg"
                />

                {/* Overlaid security badge */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface-2 text-white text-xs font-mono font-medium px-3 py-0.5 rounded-full shadow-md border border-line flex items-center gap-1.5 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30s Rotating Dynamic Token</span>
                </div>
              </div>

              {/* Countdown Progress Ring */}
              <div className="flex items-center gap-3 pt-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-ink dark:text-ink"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`transition-all duration-1000 ${
                        secondsLeft <= 5 ? 'text-red-500' : 'text-primary'
                      }`}
                      strokeDasharray={`${progressPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold font-mono">
                    {secondsLeft}
                  </span>
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-ink dark:text-ink">
                    Refreshing in {secondsLeft} seconds
                  </p>
                  <p className="text-xs text-muted">
                    Rotates dynamically to prevent photo sharing & proxies
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live Attendance Counter & Info Footer */}
        <div className="pt-4 border-t border-line dark:border-line flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-semibold">
              <Users className="w-4 h-4" />
              <span>{liveCount} Attended</span>
            </div>
            <span className="text-muted text-xs">
              (Auto-updates in real time)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchToken}
              disabled={isLoading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Rotate Now
            </Button>
            <AppSlideConfirm
              label="Slide to end attendance"
              doneLabel="Attendance Ended"
              width={220}
              height={36}
              radius={18}
              onConfirm={() => {
                showToast(`Live attendance presentation completed (${liveCount} attended).`, 'success');
                onClose();
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
