import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, ExternalLink, X } from 'lucide-react';
import {
  extractOAuthErrorFromUrl,
  mapOAuthErrorToFriendlyMessage,
  cleanOAuthErrorFromUrl,
  isInAppBrowser,
} from '../../utils/oauthError';
import AppButton from '../app/AppButton';

export default function OAuthErrorBanner() {
  const location = useLocation();
  const [friendlyError, setFriendlyError] = useState(null);
  const [inAppWebview] = useState(() => isInAppBrowser());

  // On app load and route changes (except /login which renders inline in its own card),
  // read OAuth errors from search + hash, show friendly banner, and clean the URL.
  useEffect(() => {
    if (location.pathname.startsWith('/login')) return;

    const raw = extractOAuthErrorFromUrl();
    if (raw) {
      setFriendlyError(mapOAuthErrorToFriendlyMessage(raw));
      cleanOAuthErrorFromUrl();
    }
  }, [location.pathname, location.search, location.hash]);

  const isLoginRoute = location.pathname.startsWith('/login');
  const showWebviewBanner = inAppWebview && !isLoginRoute;

  if (!friendlyError && !showWebviewBanner) return null;

  return (
    <div className="w-full space-y-2 px-4 sm:px-6 lg:px-8 pt-3 max-w-[1280px] mx-auto">
      {showWebviewBanner && (
        <div
          role="status"
          className="p-3.5 rounded-[14px] bg-warning/15 border border-warning/40 text-ink text-xs sm:text-sm flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <ExternalLink className="w-4 h-4 text-warning shrink-0" />
            <span className="font-medium">
              Open this link in Chrome/Safari to sign in with Google.
            </span>
          </div>
        </div>
      )}

      {friendlyError && (
        <div
          role="alert"
          className="p-3.5 rounded-[14px] bg-danger/10 border border-danger/30 text-ink text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            <span className="font-medium">{friendlyError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/login" onClick={() => setFriendlyError(null)}>
              <AppButton variant="primary" size="xs">
                Try again
              </AppButton>
            </Link>
            <AppButton
              variant="ghost"
              size="xs"
              onClick={() => setFriendlyError(null)}
              aria-label="Dismiss sign-in message"
            >
              <X className="w-4 h-4" />
            </AppButton>
          </div>
        </div>
      )}
    </div>
  );
}
