import React, { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import AppSelect from '../app/AppSelect';
import { optimizeImageToWebP } from '../../utils/imageOptimizer';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export default function AdminGalleryUploadPanel({ events = [], currentUserId, onUploadComplete }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '');
  const [caption, setCaption] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]); // [{ id, name, progress, status, error }]

  const eventOptions = events.map((e) => ({
    value: e.id,
    label: e.title,
  }));

  const processFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('image/'));
    if (files.length === 0) {
      showToast('Please select valid image files (JPG, PNG, or WebP).', 'warning');
      return;
    }

    const targetEventId = selectedEventId || events[0]?.id;
    if (!targetEventId) {
      showToast('Please select an event before uploading photos.', 'warning');
      return;
    }

    const batch = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      progress: 10,
      status: 'optimizing',
      error: null,
    }));

    setUploads((prev) => [...batch, ...prev]);

    let successCount = 0;

    for (const item of batch) {
      try {
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, progress: 35, status: 'optimizing' } : u))
        );

        const { file: optimizedFile } = await optimizeImageToWebP(item.file, {
          maxDimension: 1600,
          quality: 0.82,
        });

        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, progress: 70, status: 'uploading' } : u))
        );

        await adminService.uploadGalleryPhoto({
          file: optimizedFile,
          eventId: targetEventId,
          caption,
          uploadedBy: currentUserId,
          autoApprove: true,
        });

        successCount += 1;
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, progress: 100, status: 'done' } : u))
        );
      } catch (err) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, progress: 0, status: 'error', error: err.message || 'Upload failed' }
              : u
          )
        );
      }
    }

    if (successCount > 0) {
      showToast(
        `${successCount} photo${successCount > 1 ? 's' : ''} optimized to WebP & published to the public gallery!`,
        'success'
      );
      setCaption('');
      queryClient.invalidateQueries({ queryKey: ['public-gallery'] });
      queryClient.invalidateQueries({ queryKey: ['public-gallery-full'] });
      if (onUploadComplete) onUploadComplete();
    }
  };

  return (
    <Card className="p-5 space-y-4 border-line bg-surface">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-ink flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span>Upload Official Moments (Auto-Approved)</span>
          </h4>
          <p className="text-xs text-muted mt-0.5">
            Multi-file drag-and-drop. Automatically resized to 1600px WebP (q=0.82) with EXIF metadata stripped.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppSelect
          label="Target Event"
          value={selectedEventId || events[0]?.id || ''}
          onChange={(e) => setSelectedEventId(e.target.value)}
          placeholder="Select event..."
          options={eventOptions}
        />
        <Input
          label="Photo Caption (Optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. Keynote Q&A session at Main Auditorium"
        />
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          processFiles(e.dataTransfer.files);
        }}
        className={`rounded-[16px] border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary-soft/40'
            : 'border-line bg-surface-2/40 hover:border-primary/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-ink">
            Drag & drop event photos here
          </p>
          <p className="text-xs text-muted">
            Supports multiple JPG, PNG, or WebP files at once
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 text-xs"
          >
            Browse Files
          </Button>
        </div>
      </div>

      {/* Upload Progress List */}
      {uploads.length > 0 && (
        <div className="space-y-2 pt-2">
          {uploads.slice(0, 6).map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-line bg-surface-2/50 text-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink truncate">{u.name}</p>
                <div className="w-full h-1.5 rounded-full bg-line mt-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      u.status === 'error' ? 'bg-danger' : 'bg-primary'
                    }`}
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                {u.status === 'done' && (
                  <span className="text-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Published
                  </span>
                )}
                {u.status === 'error' && (
                  <span className="text-danger font-semibold flex items-center gap-1" title={u.error}>
                    <AlertCircle className="w-3.5 h-3.5" /> Failed
                  </span>
                )}
                {(u.status === 'optimizing' || u.status === 'uploading') && (
                  <span className="text-muted capitalize">{u.status} ({u.progress}%)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
