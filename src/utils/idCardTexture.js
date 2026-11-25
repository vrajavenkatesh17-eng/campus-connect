/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 * Patent Reference: KRISH-IHSAN-FXEC-PATENT-2026-CC
 *
 * Canvas-drawn crisp, vector-quality ID Card Texture for Lanyard 3D component.
 * Theme-aware (Wine & Ivory), gold hairlines, strictly NO fake persons, names, or numbers.
 * Displays "Welcome back, <first name>" if stored in localStorage, otherwise no name.
 */

export function generateIdCardTexture({ theme = 'light', firstName = '' } = {}) {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isDark = theme === 'dark';

  // Palette from DESIGN_SPEC v2 (Wine & Ivory)
  const bg = isDark ? '#161012' : '#FFFFFF';
  const cardSurface = isDark ? '#1F1719' : '#FBF8F5';
  const winePrimary = isDark ? '#C95D78' : '#7A1230';
  const wineDark = isDark ? '#2A1519' : '#5F0E26';
  const gold = isDark ? '#D4B27A' : '#A8803F';
  const ink = isDark ? '#F6EFEA' : '#1C1417';
  const muted = isDark ? '#B3A5AA' : '#6B5E63';
  const line = isDark ? '#33282C' : '#E8DFD8';

  // 1. Base Card Fill with Subtle Texture
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1440);

  // Inset Card Face
  ctx.fillStyle = cardSurface;
  ctx.fillRect(16, 16, 992, 1408);

  // 2. Gold Hairline Borders (Champagne-gold decoration only)
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 960, 1376);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, 936, 1352);

  // 3. Top Header Banner (Wine Accent)
  ctx.fillStyle = winePrimary;
  ctx.fillRect(44, 44, 936, 260);

  // Lanyard clip hole punch guide
  ctx.fillStyle = isDark ? '#0D0809' : '#1C1417';
  ctx.beginPath();
  ctx.roundRect(512 - 90, 60, 180, 24, 12);
  ctx.fill();

  // Header Institution Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px "Inter Variable", Inter, sans-serif';
  ctx.fillText('FRANCIS XAVIER', 512, 145);

  ctx.font = '600 28px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText('ENGINEERING COLLEGE', 512, 185);

  ctx.font = '600 18px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = gold;
  ctx.fillText('AUTONOMOUS INSTITUTION • TIRUNELVELI', 512, 230);

  ctx.font = '500 15px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('Accredited by NBA & NAAC with "A" Grade', 512, 265);

  // Gold separator below banner
  ctx.fillStyle = gold;
  ctx.fillRect(44, 304, 936, 4);

  // 4. Central Emblem / Graphic
  const centerX = 512;
  const centerY = 490;

  // Outer Gold Decorative Crest
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 100, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isDark ? 'rgba(212, 91, 122, 0.3)' : 'rgba(122, 18, 48, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 114, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Crest Fill
  ctx.fillStyle = isDark ? wineDark : 'rgba(122, 18, 48, 0.06)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 94, 0, Math.PI * 2);
  ctx.fill();

  // Graduation Cap Vector Icon
  ctx.fillStyle = winePrimary;
  // Cap Diamond
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 45);
  ctx.lineTo(centerX + 65, centerY - 15);
  ctx.lineTo(centerX, centerY + 15);
  ctx.lineTo(centerX - 65, centerY - 15);
  ctx.closePath();
  ctx.fill();

  // Cap skullcap base
  ctx.beginPath();
  ctx.moveTo(centerX - 35, centerY);
  ctx.quadraticCurveTo(centerX, centerY + 45, centerX + 35, centerY);
  ctx.lineTo(centerX + 35, centerY - 5);
  ctx.quadraticCurveTo(centerX, centerY + 30, centerX - 35, centerY - 5);
  ctx.closePath();
  ctx.fill();

  // Golden Tassel
  ctx.strokeStyle = gold;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - 15);
  ctx.lineTo(centerX + 50, centerY + 10);
  ctx.lineTo(centerX + 55, centerY + 40);
  ctx.stroke();
  ctx.restore();

  // 5. Title Block: "Campus Connect"
  ctx.fillStyle = ink;
  ctx.font = 'bold 54px "Fraunces Variable", Fraunces, Georgia, serif';
  ctx.fillText('Campus Connect', centerX, 660);

  ctx.fillStyle = muted;
  ctx.font = '500 24px "Inter Variable", Inter, sans-serif';
  ctx.fillText('Institutional Event & Credentials Portal', centerX, 705);

  // 6. Badge Pill
  ctx.fillStyle = winePrimary;
  ctx.beginPath();
  ctx.roundRect(centerX - 160, 750, 320, 54, 27);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Inter Variable", Inter, sans-serif';
  ctx.fillText('STUDENT ID PASS', centerX, 785);

  // 7. Returning User Personalization (Strict Rule: NO fake person, name or number)
  // Only printed if a valid returning first name is present
  if (firstName && typeof firstName === 'string' && firstName.trim()) {
    const cleanFirst = firstName.trim().split(' ')[0];
    ctx.fillStyle = isDark ? 'rgba(212, 91, 122, 0.12)' : 'rgba(122, 18, 48, 0.05)';
    ctx.strokeStyle = isDark ? 'rgba(212, 91, 122, 0.3)' : 'rgba(122, 18, 48, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(centerX - 240, 845, 480, 110, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = muted;
    ctx.font = 'italic 20px "Inter Variable", Inter, sans-serif';
    ctx.fillText('Welcome back,', centerX, 885);

    ctx.fillStyle = winePrimary;
    ctx.font = 'bold 36px "Fraunces Variable", Fraunces, Georgia, serif';
    ctx.fillText(cleanFirst, centerX, 930);
  } else {
    // Standard unpersonalized badge info
    ctx.fillStyle = muted;
    ctx.font = '500 20px "Inter Variable", Inter, sans-serif';
    ctx.fillText('Single Sign-On with Official Google Account', centerX, 880);

    ctx.font = '600 22px "Inter Variable", Inter, sans-serif';
    ctx.fillStyle = ink;
    ctx.fillText('@francisxavier.ac.in', centerX, 920);
  }

  // 8. Security & RFID Chip Artwork
  const chipX = centerX - 60;
  const chipY = 1000;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.fillStyle = isDark ? 'rgba(212, 178, 122, 0.1)' : 'rgba(168, 128, 63, 0.08)';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, 120, 80, 12);
  ctx.fill();
  ctx.stroke();

  // Chip circuit lines
  ctx.beginPath();
  ctx.moveTo(chipX + 30, chipY);
  ctx.lineTo(chipX + 30, chipY + 80);
  ctx.moveTo(chipX + 90, chipY);
  ctx.lineTo(chipX + 90, chipY + 80);
  ctx.moveTo(chipX, chipY + 40);
  ctx.lineTo(chipX + 120, chipY + 40);
  ctx.stroke();

  // 9. Card Footer Information
  ctx.fillStyle = muted;
  ctx.font = '500 18px "Inter Variable", Inter, sans-serif';
  ctx.fillText('SECURE RFID & QR COMPATIBLE', centerX, 1130);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 1170);
  ctx.lineTo(924, 1170);
  ctx.stroke();

  ctx.font = '600 16px monospace';
  ctx.fillStyle = gold;
  ctx.fillText('FXEC-AUTONOMOUS-DIGITAL-IDENTITY', centerX, 1220);

  ctx.font = '500 15px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('Valid for Campus Lectures, Symposiums & Workshops', centerX, 1260);

  ctx.font = '500 13px "Inter Variable", Inter, sans-serif';
  ctx.fillText('Architected & Patented by Krish & Ihsan • All Rights Reserved', centerX, 1340);

  return canvas.toDataURL('image/png');
}

/**
 * Reverse Face Texture of Lanyard Card
 */
export function generateIdCardBackTexture({ theme = 'light' } = {}) {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isDark = theme === 'dark';
  const bg = isDark ? '#161012' : '#FFFFFF';
  const cardSurface = isDark ? '#1F1719' : '#FBF8F5';
  const winePrimary = isDark ? '#C95D78' : '#7A1230';
  const gold = isDark ? '#D4B27A' : '#A8803F';
  const ink = isDark ? '#F6EFEA' : '#1C1417';
  const muted = isDark ? '#B3A5AA' : '#6B5E63';
  const line = isDark ? '#33282C' : '#E8DFD8';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1440);

  ctx.fillStyle = cardSurface;
  ctx.fillRect(16, 16, 992, 1408);

  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 960, 1376);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, 936, 1352);

  // Top Wine Header
  ctx.fillStyle = winePrimary;
  ctx.fillRect(44, 44, 936, 180);

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px "Inter Variable", Inter, sans-serif';
  ctx.fillText('CAMPUS CONNECT SYSTEM', 512, 130);

  ctx.font = '500 18px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = gold;
  ctx.fillText('INSTITUTIONAL TERMS OF USE', 512, 175);

  // Instruction terms
  ctx.textAlign = 'left';
  ctx.fillStyle = ink;
  ctx.font = '600 22px "Inter Variable", Inter, sans-serif';

  const bulletY = 320;
  const bullets = [
    '1. Non-transferable digital identity credential for FXEC events.',
    '2. Attendance recorded via live rotating cryptographic QR codes.',
    '3. Certificates issued upon verified faculty coordinator check-in.',
    '4. Misuse or attempted privilege tampering is logged and penalized.',
    '5. Strictly bound to @francisxavier.ac.in Google authentication.'
  ];

  bullets.forEach((b, idx) => {
    ctx.fillText(b, 100, bulletY + idx * 75);
  });

  // Center QR Placeholder graphic
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.fillStyle = isDark ? 'rgba(212, 178, 122, 0.05)' : 'rgba(168, 128, 63, 0.05)';
  ctx.beginPath();
  ctx.roundRect(512 - 120, 780, 240, 240, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('DYNAMIC QR PASS', 512, 910);
  ctx.font = '500 14px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('Scan at Lecture Entry', 512, 940);
  ctx.restore();

  // Footer
  ctx.textAlign = 'center';
  ctx.font = '600 16px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = winePrimary;
  ctx.fillText('Francis Xavier Engineering College (Autonomous)', 512, 1240);

  ctx.font = '500 14px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('103/G2, Bypass Road, Vannarpettai, Tirunelveli - 627003', 512, 1280);

  return canvas.toDataURL('image/png');
}

/**
 * Helper to split text into wrapped lines with maximum width and line count
 */
function wrapCanvasText(ctx, text, maxWidth, maxLines = 2) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) {
        // Final line: gather rest and truncate with ellipsis if necessary
        const remaining = words.slice(i).join(' ');
        let truncated = remaining;
        while (truncated.length > 0 && ctx.measureText(truncated + '…').width > maxWidth) {
          truncated = truncated.slice(0, -1).trim();
        }
        lines.push(truncated ? truncated + '…' : word);
        return lines;
      }
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * Generate authenticated user ID card texture with REAL data (S-F Role Home).
 * Features:
 * - Avatar: Google photo with crossOrigin (falls back to initials monogram)
 * - Clean full name in Fraunces Variable (wraps to 2 lines, then truncates)
 * - Role pill: STUDENT / FACULTY COORDINATOR / ADMINISTRATOR
 * - Department
 * - ID Line:
 *   - Student: Register number (JetBrains Mono)
 *   - Coordinator: Department + "Faculty Coordinator"
 *   - Admin: "Administrator" (no number)
 * - College Name
 * - Small QR-free footer line
 */
export async function generateUserCardTexture({
  theme = 'light',
  fullName = '',
  avatarUrl = '',
  role = 'student',
  department = '',
  registerNumber = '',
} = {}) {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const isDark = theme === 'dark';

  // Palette from DESIGN_SPEC v2 (Wine & Ivory)
  const bg = isDark ? '#161012' : '#FFFFFF';
  const cardSurface = isDark ? '#1F1719' : '#FBF8F5';
  const winePrimary = isDark ? '#C95D78' : '#7A1230';
  const wineDark = isDark ? '#2A1519' : '#5F0E26';
  const gold = isDark ? '#D4B27A' : '#A8803F';
  const ink = isDark ? '#F6EFEA' : '#1C1417';
  const muted = isDark ? '#B3A5AA' : '#6B5E63';
  const line = isDark ? '#33282C' : '#E8DFD8';

  // 1. Base Card Fill
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1024, 1440);

  // Inset Card Face
  ctx.fillStyle = cardSurface;
  ctx.fillRect(16, 16, 992, 1408);

  // 2. Gold Hairline Borders
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 960, 1376);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, 936, 1352);

  // 3. Top Header Banner
  ctx.fillStyle = winePrimary;
  ctx.fillRect(44, 44, 936, 250);

  // Lanyard clip hole punch guide
  ctx.fillStyle = isDark ? '#0D0809' : '#1C1417';
  ctx.beginPath();
  ctx.roundRect(512 - 90, 60, 180, 24, 12);
  ctx.fill();

  // Header Institution Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px "Inter Variable", Inter, sans-serif';
  ctx.fillText('FRANCIS XAVIER', 512, 140);

  ctx.font = '600 28px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText('ENGINEERING COLLEGE', 512, 180);

  ctx.font = '600 18px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = gold;
  ctx.fillText('AUTONOMOUS INSTITUTION • TIRUNELVELI', 512, 222);

  ctx.font = '500 15px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('Accredited by NBA & NAAC with "A" Grade', 512, 255);

  // Gold separator below banner
  ctx.fillStyle = gold;
  ctx.fillRect(44, 294, 936, 4);

  // 4. Central Avatar / Photo Area
  const centerX = 512;
  const avatarY = 470;
  const avatarRadius = 100;

  // Outer Gold Decorative Ring
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, avatarY, avatarRadius + 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = isDark ? 'rgba(201, 93, 120, 0.35)' : 'rgba(122, 18, 48, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, avatarY, avatarRadius + 18, 0, Math.PI * 2);
  ctx.stroke();

  // Attempt to load Google photo
  let loadedImage = null;
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('http')) {
    try {
      loadedImage = await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 1200);
        img.src = avatarUrl;
      });
    } catch {
      loadedImage = null;
    }
  }

  // Draw Avatar or Fallback Monogram
  ctx.beginPath();
  ctx.arc(centerX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (loadedImage) {
    ctx.drawImage(
      loadedImage,
      centerX - avatarRadius,
      avatarY - avatarRadius,
      avatarRadius * 2,
      avatarRadius * 2
    );
  } else {
    // Initials Monogram
    ctx.fillStyle = isDark ? wineDark : 'rgba(122, 18, 48, 0.15)';
    ctx.fillRect(centerX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);

    const initials = (fullName || 'User')
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

    ctx.fillStyle = winePrimary;
    ctx.font = 'bold 72px "Fraunces Variable", Fraunces, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, centerX, avatarY);
  }
  ctx.restore();

  // 5. Clean Full Name in Fraunces (wraps to 2 lines, then truncates)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = ink;
  ctx.font = 'bold 44px "Fraunces Variable", Fraunces, Georgia, serif';

  const cleanDisplayName = fullName
    ? fullName.replace(/\b\d{2}[A-Z]{2,4}\d{2,4}\b/gi, '').trim() || fullName.trim()
    : 'Student Pass';

  const nameLines = wrapCanvasText(ctx, cleanDisplayName, 780, 2);
  let nameStartY = 640;
  if (nameLines.length === 1) {
    nameStartY = 650;
    ctx.fillText(nameLines[0], centerX, nameStartY);
  } else {
    ctx.fillText(nameLines[0], centerX, nameStartY);
    ctx.fillText(nameLines[1], centerX, nameStartY + 50);
  }

  // 6. Role Pill
  const pillY = nameLines.length > 1 ? 750 : 720;
  const roleLabel =
    role === 'admin'
      ? 'ADMINISTRATOR'
      : role === 'coordinator'
      ? 'FACULTY COORDINATOR'
      : 'STUDENT PASS';

  ctx.fillStyle = winePrimary;
  ctx.beginPath();
  ctx.roundRect(centerX - 180, pillY, 360, 52, 26);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px "Inter Variable", Inter, sans-serif';
  ctx.fillText(roleLabel, centerX, pillY + 34);

  // 7. Department Line
  const deptY = pillY + 90;
  const cleanDept = department || (role === 'admin' ? 'Institutional Administration' : 'Engineering & Technology');
  ctx.fillStyle = muted;
  ctx.font = '600 22px "Inter Variable", Inter, sans-serif';
  ctx.fillText(cleanDept, centerX, deptY);

  // 8. ID Line
  const idY = deptY + 50;
  let idText = '';
  if (role === 'student') {
    idText = registerNumber ? `REG NO: ${registerNumber}` : 'ID: FXEC-STUDENT';
  } else if (role === 'coordinator') {
    idText = `${cleanDept} • Faculty Coordinator`;
  } else {
    idText = 'Institutional Administrator';
  }

  ctx.fillStyle = gold;
  ctx.font = 'bold 20px "JetBrains Mono Variable", monospace';
  ctx.fillText(idText, centerX, idY);

  // 9. RFID Circuit Box Graphic
  const chipX = centerX - 60;
  const chipY = 1010;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.fillStyle = isDark ? 'rgba(212, 178, 122, 0.1)' : 'rgba(168, 128, 63, 0.08)';
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, 120, 80, 12);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(chipX + 30, chipY);
  ctx.lineTo(chipX + 30, chipY + 80);
  ctx.moveTo(chipX + 90, chipY);
  ctx.lineTo(chipX + 90, chipY + 80);
  ctx.moveTo(chipX, chipY + 40);
  ctx.lineTo(chipX + 120, chipY + 40);
  ctx.stroke();

  // 10. Small QR-free footer line
  ctx.fillStyle = muted;
  ctx.font = '500 16px "Inter Variable", Inter, sans-serif';
  ctx.fillText('SECURE DIGITAL CREDENTIAL • NO PRINTED PASS REQUIRED', centerX, 1140);

  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 1180);
  ctx.lineTo(924, 1180);
  ctx.stroke();

  ctx.font = '600 16px monospace';
  ctx.fillStyle = gold;
  ctx.fillText('FXEC-AUTONOMOUS-DIGITAL-IDENTITY', centerX, 1225);

  ctx.font = '500 15px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('Francis Xavier Engineering College (Autonomous) • Tirunelveli', centerX, 1265);

  ctx.font = '500 13px "Inter Variable", Inter, sans-serif';
  ctx.fillStyle = muted;
  ctx.fillText('Architected & Patented by Krish & Ihsan • All Rights Reserved', centerX, 1340);

  return canvas.toDataURL('image/png');
}
