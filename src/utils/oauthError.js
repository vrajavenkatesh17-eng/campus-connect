/**
 * Campus Connect — OAuth URL Error Parser, Friendly Mapper & In-App Browser Guard
 */

export function extractOAuthErrorFromUrl() {
  if (typeof window === 'undefined') return null;

  const searchParams = new URLSearchParams(window.location.search || '');
  const rawHash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
  const hashParams = new URLSearchParams(rawHash.includes('?') ? rawHash.split('?')[1] : rawHash);

  const error = searchParams.get('error') || hashParams.get('error') || '';
  const errorCode = searchParams.get('error_code') || hashParams.get('error_code') || '';
  const errorDescription =
    searchParams.get('error_description') || hashParams.get('error_description') || '';

  if (!error && !errorCode && !errorDescription) return null;

  return { error, errorCode, errorDescription };
}

export function mapOAuthErrorToFriendlyMessage({ error = '', errorCode = '', errorDescription = '' } = {}) {
  const code = String(errorCode || '').toLowerCase();
  const err = String(error || '').toLowerCase();
  const desc = String(errorDescription || '').toLowerCase();

  if (code === 'bad_oauth_state' || desc.includes('state') || desc.includes('expired')) {
    return 'Your sign-in took too long or was interrupted. Please try again.';
  }
  if (err === 'access_denied' || code === 'access_denied') {
    return 'Google sign-in was cancelled. Click below to try again whenever you are ready.';
  }
  if (code === 'bad_oauth_callback' || err === 'invalid_request') {
    return 'Sign-in could not be completed. Please try again.';
  }
  if (err === 'server_error' || err === 'temporarily_unavailable' || code === 'server_error') {
    return 'Authentication service is temporarily busy. Please try again in a moment.';
  }

  return 'Sign-in could not be completed. Please try again.';
}

export function cleanOAuthErrorFromUrl() {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;

  const url = new URL(window.location.href);
  const errorKeys = ['error', 'error_code', 'error_description'];
  let changed = false;

  errorKeys.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  if (url.hash) {
    const rawHash = url.hash.replace(/^#/, '');
    const hashParams = new URLSearchParams(rawHash);
    let hashChanged = false;
    errorKeys.forEach((key) => {
      if (hashParams.has(key)) {
        hashParams.delete(key);
        hashChanged = true;
      }
    });
    if (hashChanged) {
      const remaining = hashParams.toString();
      url.hash = remaining ? `#${remaining}` : '';
      changed = true;
    }
  }

  if (changed) {
    const cleanTarget = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, cleanTarget);
  }
}

export function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Instagram|FBAN|FBAV|WhatsApp|\bLine\b/i.test(ua);
}
