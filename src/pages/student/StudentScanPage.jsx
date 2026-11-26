/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * StudentScanPage: S-M 3 Dedicated Mobile QR Attendance Scanner
 * Route: /student/scan
 * - Camera viewfinder with responsive frame guide
 * - Permission-denied and no-camera states
 * - Distinct result states:
 *   * marked present (with short check animation)
 *   * already marked
 *   * QR expired
 *   * not registered
 *   * outside time window
 *   * event not live
 * - Fallback text: "Ask your coordinator for manual attendance"
 * - Works on HTTPS (with local dev warning)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceService } from '../../services/attendanceService';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext';
import AppButton from '../../components/app/AppButton';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Spinner from '../../components/common/Spinner';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  SwitchCamera,
  ArrowLeft,
  XCircle,
  Clock,
  UserX,
  Radio,
  HelpCircle,
} from 'lucide-react';

export default function StudentScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetEventId = searchParams.get('eventId');
  const { showToast } = useToast();

  const [scannerState, setScannerState] = useState('idle'); // 'idle' | 'scanning' | 'verifying' | 'success' | 'error'
  const [errorType, setErrorType] = useState(null); // 'permission' | 'no-camera' | 'expired' | 'already' | 'not-registered' | 'time-window' | 'not-live' | 'mismatch' | 'unknown'
  const [errorMessage, setErrorMessage] = useState('');
  const [successEvent, setSuccessEvent] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isHttpsWarning, setIsHttpsWarning] = useState(false);

  const html5QrCodeRef = useRef(null);
  const containerId = 'student-live-qr-viewfinder';

  // Check HTTPS requirement
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.protocol !== 'https:' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setIsHttpsWarning(true);
    }
  }, []);

  // Initialize and list cameras
  useEffect(() => {
    let isMounted = true;

    async function initCameras() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;
        if (devices && devices.length > 0) {
          setCameras(devices);
          startCamera(devices[0].id);
        } else {
          setErrorType('no-camera');
          setErrorMessage('No camera hardware found on this device.');
          setScannerState('error');
        }
      } catch (err) {
        console.warn('Camera enumeration error:', err);
        if (!isMounted) return;
        const msg = String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorType('permission');
          setErrorMessage('Camera access was denied. Please grant camera permission in your browser settings.');
        } else {
          setErrorType('no-camera');
          setErrorMessage('Unable to initialize camera on this device.');
        }
        setScannerState('error');
      }
    }

    initCameras();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, []);

  const startCamera = async (cameraId) => {
    setScannerState('scanning');
    setErrorType(null);
    setErrorMessage('');

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(containerId, { verbose: false });
      }

      const qrConfig = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(edge * 0.78);
          return { width: size, height: size };
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      };

      const cameraParam = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraParam,
        qrConfig,
        async (decodedText) => {
          await handleScanSuccess(decodedText);
        },
        () => {}
      );
    } catch (err) {
      console.error('Failed to start camera:', err);
      const msg = String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setErrorType('permission');
        setErrorMessage('Camera permission was denied. Tap the lock icon in your browser URL bar to allow camera access.');
      } else if (msg.includes('NotFoundError')) {
        setErrorType('no-camera');
        setErrorMessage('No camera device detected.');
      } else {
        setErrorType('unknown');
        setErrorMessage('Could not open camera viewfinder. Please verify device permissions.');
      }
      setScannerState('error');
    }
  };

  const stopCamera = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.warn('Error closing camera:', err);
    }
  };

  const toggleCamera = async () => {
    if (cameras.length <= 1) return;
    await stopCamera();
    const nextIdx = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIdx);
    startCamera(cameras[nextIdx].id);
  };

  // Play audio chime and haptics on success
  const triggerSuccessHaptics = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {}

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([120, 60, 120]);
    }
  };

  // Process Scanned Token
  const handleScanSuccess = async (decodedText) => {
    if (!decodedText) return;
    await stopCamera();
    setScannerState('verifying');

    let scannedEventId = targetEventId;
    let scannedToken = decodedText.trim();

    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.e) scannedEventId = parsed.e;
      else if (parsed.eventId) scannedEventId = parsed.eventId;

      if (parsed.t) scannedToken = parsed.t;
      else if (parsed.token) scannedToken = parsed.token;
    } catch {
      // Plain text or URL
      try {
        const url = new URL(decodedText);
        const tokenParam = url.searchParams.get('token');
        if (tokenParam) scannedToken = tokenParam;
        const match = url.pathname.match(/\/events\/([^\/]+)/);
        if (match) scannedEventId = match[1];
      } catch {
        scannedToken = decodedText.trim();
      }
    }

    if (!scannedEventId) {
      setErrorType('unknown');
      setErrorMessage('Unrecognized QR format. Please scan the official live QR presented by the coordinator.');
      setScannerState('error');
      return;
    }

    try {
      const result = await attendanceService.markAttendance(scannedEventId, scannedToken);

      if (result?.success) {
        triggerSuccessHaptics();
        setSuccessEvent(result.event || { id: scannedEventId });
        setScannerState('success');
      } else {
        mapErrorMessage(result?.message || 'Attendance verification failed.');
        setScannerState('error');
      }
    } catch (err) {
      console.error('Attendance mark error:', err);
      mapErrorMessage(err.message || String(err));
      setScannerState('error');
    }
  };

  // Map backend message to distinct S-M 3 result states
  const mapErrorMessage = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes('already') || lower.includes('duplicate')) {
      setErrorType('already');
      setErrorMessage('You have already marked attendance for this event.');
    } else if (lower.includes('expired') || lower.includes('invalid token') || lower.includes('salt')) {
      setErrorType('expired');
      setErrorMessage('This QR code has expired. Please scan the fresh rotating code on the projector screen.');
    } else if (lower.includes('not registered') || lower.includes('registration required')) {
      setErrorType('not-registered');
      setErrorMessage('You are not registered for this event. Only confirmed registrants can mark attendance.');
    } else if (lower.includes('outside') || lower.includes('window') || lower.includes('closed') || lower.includes('early')) {
      setErrorType('time-window');
      setErrorMessage('Attendance is outside the permitted time window for this event.');
    } else if (lower.includes('not live') || lower.includes('draft') || lower.includes('completed')) {
      setErrorType('not-live');
      setErrorMessage('This event is not currently live for attendance.');
    } else {
      setErrorType('unknown');
      setErrorMessage(msg || 'Attendance could not be recorded.');
    }
  };

  const handleRetry = () => {
    const camId = cameras[currentCameraIndex]?.id;
    startCamera(camId);
  };

  return (
    <DashboardLayout
      title="Student Attendance Scanner"
      subtitle="Point camera at the live rotating QR on the auditorium projector screen"
    >
      <div className="max-w-md mx-auto space-y-5">
        {/* HTTPS Requirement Warning */}
        {isHttpsWarning && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Camera scanning requires HTTPS. If testing on a mobile device, ensure you access via https:// or localhost.</span>
          </div>
        )}

        {/* Viewfinder Card */}
        <div className="relative rounded-3xl overflow-hidden bg-black aspect-square border-2 border-line shadow-lg flex items-center justify-center">
          {/* HTML5 QR Code Container */}
          <div
            id={containerId}
            className={`w-full h-full object-cover ${scannerState === 'scanning' ? 'block' : 'hidden'}`}
          />

          {/* Animated Scanning Frame Guide */}
          {scannerState === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="relative w-full h-full border-2 border-white/60 rounded-2xl">
                {/* 4 Corner Accents */}
                <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Animated Laser Scan Bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary shadow-md shadow-primary animate-[bounce_2s_infinite]" />
              </div>
            </div>
          )}

          {/* Verifying State */}
          {scannerState === 'verifying' && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
              <Spinner size="lg" />
              <p className="font-semibold text-base">Verifying Cryptographic QR...</p>
              <p className="text-xs text-neutral-400">Validating time window and registration record</p>
            </div>
          )}

          {/* Success State with Animation */}
          {scannerState === 'success' && (
            <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-serif text-white">Attendance Marked!</h3>
                <p className="text-xs text-emerald-200 mt-1">
                  Your participation is cryptographically recorded.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full pt-2">
                <AppButton
                  variant="primary"
                  onClick={() => navigate('/student/attendance')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  View Attendance History
                </AppButton>
                <AppButton
                  variant="secondary"
                  onClick={handleRetry}
                  className="w-full"
                >
                  Scan Another Code
                </AppButton>
              </div>
            </div>
          )}

          {/* Error States */}
          {scannerState === 'error' && (
            <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4 overflow-y-auto">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                {errorType === 'already' ? (
                  <CheckCircle2 className="w-8 h-8 text-amber-400" />
                ) : errorType === 'expired' ? (
                  <Clock className="w-8 h-8 text-amber-400" />
                ) : errorType === 'not-registered' ? (
                  <UserX className="w-8 h-8 text-rose-400" />
                ) : (
                  <XCircle className="w-8 h-8 text-rose-400" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  {errorType === 'already'
                    ? 'Already Marked'
                    : errorType === 'expired'
                    ? 'QR Code Expired'
                    : errorType === 'not-registered'
                    ? 'Registration Required'
                    : errorType === 'time-window'
                    ? 'Outside Window'
                    : errorType === 'permission'
                    ? 'Permission Denied'
                    : errorType === 'no-camera'
                    ? 'No Camera Found'
                    : 'Attendance Error'}
                </h3>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">
                  {errorMessage}
                </p>
              </div>

              {/* Coordinator Fallback Reminder per S-M 3 */}
              <div className="p-3 rounded-xl bg-white/10 border border-white/10 text-xs text-neutral-300 w-full">
                <p className="font-medium text-amber-300">
                  Ask your coordinator for manual attendance
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Coordinators can confirm your physical presence on their roster.
                </p>
              </div>

              <div className="flex gap-2 w-full pt-1">
                <AppButton
                  variant="secondary"
                  onClick={handleRetry}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  <span>Try Again</span>
                </AppButton>
                <AppButton
                  variant="ghost"
                  onClick={() => navigate('/student/events')}
                  className="flex-1 text-white hover:bg-white/10"
                >
                  Browse Events
                </AppButton>
              </div>
            </div>
          )}
        </div>

        {/* Viewfinder Controls */}
        <div className="flex items-center justify-between gap-3 px-1">
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back</span>
          </AppButton>

          {cameras.length > 1 && scannerState === 'scanning' && (
            <AppButton
              variant="secondary"
              size="sm"
              onClick={toggleCamera}
            >
              <SwitchCamera className="w-4 h-4 mr-1.5" />
              <span>Flip Camera</span>
            </AppButton>
          )}
        </div>

        {/* Guidance Notice */}
        <div className="p-4 rounded-2xl bg-surface border border-line text-xs text-muted space-y-1.5">
          <div className="flex items-center gap-1.5 text-ink font-semibold">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>How Attendance Works</span>
          </div>
          <p className="leading-relaxed">
            The projector displays an encrypted QR code refreshed every 30 seconds. Hold your phone steady within 15–20 feet of the projector screen. If camera access fails, <strong>ask your coordinator for manual attendance</strong>.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
