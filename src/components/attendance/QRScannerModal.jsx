import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceService } from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Badge from '../common/Badge';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  ShieldCheck,
  SwitchCamera,
  Upload,
  Award,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function QRScannerModal({ isOpen, onClose, event, onSuccess }) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [scannerState, setScannerState] = useState('idle'); // 'idle' | 'scanning' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(true);
  const [successData, setSuccessData] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [autoRedirectSeconds, setAutoRedirectSeconds] = useState(4);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerContainerId = 'fxec-qr-scanner-region';

  // Synthesize instant scan chime via Web Audio API
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15); // A6 note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch {
      // AudioContext not supported or allowed, ignore silently
    }
  };

  // Play haptic feedback on successful scan
  const triggerSuccessFeedback = () => {
    playScanBeep();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // Start QR scanner using Html5Qrcode with native hardware acceleration
  const startScanning = async (cameraId) => {
    setScannerState('scanning');
    setErrorMessage('');

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, { verbose: false });
      }

      // 20 fps for responsive scanning + dynamic responsive qrbox
      const qrConfig = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.85);
          return { width: size, height: size };
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true, // Native hardware scanner on mobile Chrome & Safari
        },
      };

      const cameraChoice = cameraId || { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraChoice,
        qrConfig,
        async (decodedText) => {
          // Found QR Code!
          await handleScannedResult(decodedText);
        },
        () => {
          // Frame scanned without QR code - normal scanning loop
        }
      );
      setCameraPermissionGranted(true);
    } catch (err) {
      console.error('Camera startup error:', err);
      const msg = err?.message || String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraPermissionGranted(false);
        setErrorMessage('Camera access was denied. Please tap the lock icon in your browser address bar and grant camera permission.');
      } else if (msg.includes('NotFoundError')) {
        setErrorMessage('No camera found on your device.');
      } else {
        setErrorMessage(msg || 'Unable to start camera.');
      }
      setScannerState('error');
    }
  };

  // Stop scanner safely
  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping QR scanner:', err);
    }
  };

  // Handle scanned payload
  const handleScannedResult = async (decodedText) => {
    if (!decodedText) return;

    // Check network connectivity first
    if (!navigator.onLine) {
      showToast('You are currently offline. Please reconnect to the internet to mark attendance.', 'error');
      setErrorMessage('Network connection lost. Please check your WiFi or mobile data.');
      setScannerState('error');
      await stopScanning();
      return;
    }

    await stopScanning();
    setScannerState('verifying');

    let scannedEventId = event?.id;
    let scannedToken = decodedText.trim();

    // Parse JSON or URL format if applicable
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.eventId) scannedEventId = parsed.eventId;
      if (parsed.token) scannedToken = parsed.token;
    } catch {
      // Check if it's a URL
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

    // Validate event mismatch
    if (scannedEventId && scannedEventId !== event?.id) {
      setErrorMessage('This QR code is for a different session. Please scan the live QR code displayed for this specific event.');
      setScannerState('error');
      return;
    }

    // Call atomic RPC on server
    try {
      const result = await attendanceService.markAttendance(event.id, scannedToken);
      if (result?.success) {
        triggerSuccessFeedback();
        setSuccessData(result);
        setScannerState('success');
        setAutoRedirectSeconds(4);
        showToast('Attendance recorded! (+50 points earned)', 'success');
        if (onSuccess) onSuccess(result);
      } else if (result?.already_marked) {
        triggerSuccessFeedback();
        setSuccessData(result);
        setScannerState('success');
        setAutoRedirectSeconds(4);
        showToast(result.message || 'Attendance was already recorded.', 'info');
        if (onSuccess) onSuccess(result);
      } else {
        throw new Error(result?.message || 'Attendance verification failed.');
      }
    } catch (err) {
      console.error('Attendance marking error:', err);
      setErrorMessage(err.message || 'Failed to verify attendance token.');
      setScannerState('error');
    }
  };

  // Upload Screenshot / Image Fallback
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await stopScanning();
      setScannerState('verifying');

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId, { verbose: false });
      }

      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      await handleScannedResult(decodedText);
    } catch (err) {
      console.error('File scan error:', err);
      setErrorMessage('Could not find a valid QR code in the uploaded image. Please try taking a clearer screenshot.');
      setScannerState('error');
    }
  };

  // Setup camera devices when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setScannerState('idle');
      return;
    }

    setScannerState('scanning');
    setErrorMessage('');
    setSuccessData(null);

    // Enumerate video devices
    Html5Qrcode.getCameras()
      .then((devs) => {
        if (devs && devs.length > 0) {
          setCameras(devs);
          const backCam = devs.find((d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          const initialCamId = backCam ? backCam.id : devs[0].id;
          setSelectedCameraId(initialCamId);
          startScanning(initialCamId);
        } else {
          startScanning(null);
        }
      })
      .catch((err) => {
        console.warn('Could not enumerate cameras, falling back to facingMode:', err);
        startScanning(null);
      });

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  // Flip camera switch
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    await stopScanning();
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    startScanning(nextCamId);
  };

  // Auto-redirect countdown on successful attendance recording
  useEffect(() => {
    if (scannerState !== 'success') return;

    const timer = setInterval(() => {
      setAutoRedirectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          stopScanning();
          onClose();
          navigate('/student/attendance');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scannerState, navigate, onClose]);

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-burgundy/10 text-burgundy">
              <Camera className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-neutral-900 leading-tight">
                Scan Attendance QR
              </h2>
              <p className="text-xs text-neutral-500 truncate max-w-[220px]">
                {event.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {cameras.length > 1 && scannerState === 'scanning' && (
              <button
                onClick={switchCamera}
                title="Switch Camera"
                className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                stopScanning();
                onClose();
              }}
              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scanner Viewport / States */}
        <div className="relative p-4 bg-neutral-900 flex flex-col items-center justify-center min-h-[340px]">
          {/* Camera region div required by html5-qrcode */}
          <div
            id={scannerContainerId}
            className={`w-full max-w-[340px] sm:max-w-[380px] overflow-hidden rounded-xl bg-black ${
              scannerState !== 'scanning' ? 'hidden' : 'block'
            }`}
          />

          {/* Scanning Overlay Reticle */}
          {scannerState === 'scanning' && (
            <div className="mt-3 text-center space-y-1">
              <p className="text-xs font-semibold text-white">
                Align the rotating QR code inside the camera viewfinder
              </p>
              <p className="text-[11px] text-neutral-400">
                Auto-detects instantly • Code rotates every 30 seconds
              </p>
            </div>
          )}

          {/* Verifying Spinner State */}
          {scannerState === 'verifying' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Spinner size="lg" className="text-burgundy" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">
                  Verifying QR Attendance Token...
                </p>
                <p className="text-xs text-neutral-400">
                  Validating student registration & 30s cryptographic salt
                </p>
              </div>
            </div>
          )}

          {/* Success State with Reward Points & Auto-Redirect */}
          {scannerState === 'success' && (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-4 w-full">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">
                  Attendance Verified!
                </h3>
                <p className="text-xs text-neutral-300 max-w-xs">
                  {successData?.message || 'Your presence has been officially recorded.'}
                </p>
              </div>

              {/* Reward Points Badge */}
              <div className="w-full bg-emerald-950/80 border border-emerald-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  +50 Reward Points
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-[11px] text-neutral-400">
                Redirecting to your attendance history in <span className="font-bold text-white">{autoRedirectSeconds}s</span>...
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    stopScanning();
                    onClose();
                    navigate('/student/attendance');
                  }}
                  className="w-full text-xs gap-1.5"
                >
                  <span>View Attendance Record</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopScanning();
                    onClose();
                  }}
                  className="w-full sm:w-auto text-xs text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                >
                  Stay on Event
                </Button>
              </div>
            </div>
          )}

          {/* Error / Rejected State */}
          {scannerState === 'error' && (
            <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40">
                {!cameraPermissionGranted ? (
                  <Camera className="w-7 h-7" />
                ) : !navigator.onLine ? (
                  <WifiOff className="w-7 h-7" />
                ) : (
                  <AlertTriangle className="w-7 h-7" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Verification Failed
                </h3>
                <p className="text-xs text-red-200 max-w-xs">
                  {errorMessage || 'Could not verify attendance.'}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    stopScanning();
                    onClose();
                  }}
                  className="flex-1 text-xs text-neutral-300 border-neutral-700 hover:bg-neutral-800"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => startScanning(selectedCameraId)}
                  className="flex-1 text-xs gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Guidance & Screenshot Upload Fallback */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <p className="text-[11px] text-neutral-500">
            Camera blurry or glare?
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] py-1 px-2.5 gap-1 border-neutral-300"
          >
            <Upload className="w-3 h-3" />
            Upload QR Image
          </Button>
        </div>
      </div>
    </div>
  );
}
