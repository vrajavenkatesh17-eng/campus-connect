/**
 * Campus Connect — FXEC Autonomous Event Management System
 * Architected & Patented by Krish & Ihsan. All Rights Reserved.
 *
 * CertificateFlipCard: 3D Flippable Certificate Card
 * Conforms to DESIGN_SPEC v2:
 * - Front: Certificate preview (navy & gold border, gold seal watermark, Fraunces name, event title, date, speaker)
 * - Back: Verification QR canvas, certificate code, copy URL, Download PDF button
 */

import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Button from '../common/Button';
import AppButton from '../app/AppButton';
import Badge from '../common/Badge';
import { Award, Download, Copy, RotateCw, ShieldCheck, Calendar, User, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function CertificateFlipCard({
  certificate,
  studentName,
  departmentName,
  onDownload,
  onCopyLink,
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const ev = certificate.event || {};
  const speaker = ev.speaker || {};
  const code = certificate.certificate_code;
  const verifyUrl = `${window.location.origin}/verify/${code}`;

  return (
    <div className="w-full [perspective:1200px] select-none">
      <div
        className={`relative w-full h-[400px] transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* ================= FRONT SIDE ================= */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-[24px] bg-surface border border-line p-6 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
          {/* Top Border Hairline & Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
                  <Award className="w-4 h-4" />
                </div>
                <span className="font-serif font-bold text-xs tracking-wider text-ink uppercase">
                  Francis Xavier Autonomous
                </span>
              </div>

              <span className="font-mono text-xs font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20">
                {code}
              </span>
            </div>

            {/* Certificate Body Preview */}
            <div className="text-center py-4 space-y-2 relative">
              {/* Decorative Gold Seal Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <Award className="w-44 h-44 text-gold" />
              </div>

              <p className="text-xs uppercase tracking-widest text-muted font-semibold">
                Certificate of Academic Excellence
              </p>
              <p className="text-xs text-muted">This certifies that</p>
              <h3 className="font-serif text-2xl font-bold text-ink leading-snug">
                {studentName}
              </h3>
              <p className="text-xs text-muted">
                has actively participated in the technical keynote
              </p>
              <p className="font-serif font-bold text-base text-primary line-clamp-1">
                "{ev.title || 'Technical Session'}"
              </p>
            </div>
          </div>

          {/* Footer Metadata & Flip Trigger */}
          <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
            <div className="text-xs text-muted space-y-0.5">
              <p className="font-semibold text-ink">
                {certificate.issued_at
                  ? new Date(certificate.issued_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Issued'}
              </p>
              <p className="text-muted text-xs">{departmentName}</p>
            </div>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => setIsFlipped(true)}
              className="gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip for QR & Verify</span>
            </Button>
          </div>
        </div>

        {/* ================= BACK SIDE ================= */}
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[24px] bg-surface border border-line p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-1.5 text-success font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Cryptographic Proof</span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setIsFlipped(false)}
                className="gap-1 text-muted hover:text-ink"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip to Certificate</span>
              </Button>
            </div>

            {/* QR Code Canvas */}
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              <div className="p-3 bg-white rounded-[16px] border border-line shadow-2xs">
                <QRCodeCanvas
                  value={verifyUrl}
                  size={140}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <div className="text-center space-y-1">
                <p className="font-mono text-xs font-bold text-ink">{code}</p>
                <p className="text-xs text-muted max-w-xs">
                  Scan to verify authenticity against the institutional ledger
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCopyLink(code)}
              className="gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </Button>

            <AppButton
              variant="primary"
              size="sm"
              onClick={() => onDownload(certificate)}
              className="gap-1.5 shadow-xs text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
