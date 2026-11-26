/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * S-L.6 SEO & Metadata Manager
 * Manages document title, description, Open Graph metadata, canonical URLs,
 * and strictly sets "noindex, nofollow" on all authenticated portal routes.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://campus-connect-fxec.vercel.app';

const ROUTE_SEO = {
  '/': {
    title: 'Campus Connect | Francis Xavier Engineering College (Autonomous)',
    description:
      'Autonomous guest lecture management, experiential learning platform, rotating QR attendance, and verified credentials at Francis Xavier Engineering College.',
  },
  '/events': {
    title: 'Guest Lectures & Technical Sessions | Campus Connect FXEC',
    description:
      'Explore upcoming and past industry lectures, workshops, and symposiums at Francis Xavier Engineering College. Reserve your seat and earn accredited activity points.',
  },
  '/verify': {
    title: 'Verify Digital Certificate | FXEC E-Credential Registry',
    description:
      'Verify the authentic cryptographic credential code of student participation certificates issued by Francis Xavier Engineering College.',
  },
  '/gallery': {
    title: 'Moments Gallery | Campus Connect FXEC',
    description:
      'Visual archive of technical symposia, keynote guest lectures, and student orientation sessions at Francis Xavier Engineering College.',
  },
  '/privacy': {
    title: 'Privacy & Data Governance Policy | Campus Connect FXEC',
    description:
      'Institutional data governance, Google OAuth authentication policy, and student privacy protocols at Francis Xavier Engineering College.',
  },
  '/terms': {
    title: 'Terms of Service & Usage | Campus Connect FXEC',
    description:
      'Code of conduct, QR attendance integrity, and seat reservation policies for FXEC Campus Connect.',
  },
  '/contact': {
    title: 'Contact & Campus Directory | Campus Connect FXEC',
    description:
      'Contact department event coordinators and the Event Management Cell at Francis Xavier Engineering College, Tirunelveli.',
  },
  '/login': {
    title: 'Institutional Sign In | Campus Connect FXEC',
    description:
      'Sign in with your verified Francis Xavier Engineering College Google ID to manage events, track attendance, and claim credentials.',
  },
};

export default function SeoHead() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const isPortalRoute =
      path.startsWith('/student') ||
      path.startsWith('/coordinator') ||
      path.startsWith('/admin') ||
      path.startsWith('/profile');

    // 1. Resolve Title & Description
    const matchedSeo = ROUTE_SEO[path] || {
      title: 'Campus Connect | Francis Xavier Engineering College',
      description:
        'Francis Xavier Engineering College autonomous event management, real-time attendance, and credential registry.',
    };

    if (isPortalRoute) {
      document.title = 'Portal | Campus Connect FXEC';
    } else {
      document.title = matchedSeo.title;
    }

    // Helper to set or create meta tag
    const setMetaTag = (attrName, attrVal, content) => {
      let meta = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLinkTag = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // 2. Set Meta Description
    setMetaTag('name', 'description', matchedSeo.description);

    // 3. Strict Rule: DON'T index any logged-in page (noindex on all portal routes)
    if (isPortalRoute) {
      setMetaTag('name', 'robots', 'noindex, nofollow');
    } else {
      setMetaTag('name', 'robots', 'index, follow');
    }

    // 4. Canonical URL
    const canonicalUrl = `${BASE_URL}${path === '/' ? '' : path}`;
    setLinkTag('canonical', canonicalUrl);

    // 5. Open Graph Metadata
    setMetaTag('property', 'og:title', document.title);
    setMetaTag('property', 'og:description', matchedSeo.description);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:site_name', 'FXEC Campus Connect');
    setMetaTag('property', 'og:image', `${BASE_URL}/og-image.png`);

    // 6. Twitter Card Metadata
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', document.title);
    setMetaTag('name', 'twitter:description', matchedSeo.description);
    setMetaTag('name', 'twitter:image', `${BASE_URL}/og-image.png`);
  }, [location.pathname]);

  return null;
}
