import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { materialService } from '../../services/materialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import AppSelect from '../../components/app/AppSelect';
import AppSpotlightCard from '../../components/app/AppSpotlightCard';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import {
  BookOpen,
  PlusCircle,
  FileText,
  Link2,
  Calendar,
  ExternalLink,
  Download,
  Trash2,
  CheckCircle2,
  FileCode,
  FileSpreadsheet,
  UploadCloud,
  Clock
} from 'lucide-react';

export default function CoordinatorMaterialsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);

  // Add Material Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialType, setMaterialType] = useState('pdf');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadSessions() {
      setIsLoading(true);
      try {
        const events = await eventService.getCoordinatorEvents();
        setSessions(events || []);
        if (events && events.length > 0) {
          setSelectedEventId(events[0].id);
        }
      } catch (err) {
        console.error('Error loading coordinator events:', err);
        showToast('Error loading events.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadSessions();
  }, []);

  const loadMaterialsForEvent = async (eventId) => {
    if (!eventId) {
      setMaterials([]);
      return;
    }
    setIsMaterialsLoading(true);
    try {
      const data = await materialService.getMaterialsByEvent(eventId);
      setMaterials(data || []);
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setIsMaterialsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      loadMaterialsForEvent(selectedEventId);
    }
  }, [selectedEventId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        showToast('File size exceeds 25MB limit.', 'error');
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !materialTitle.trim()) {
      showToast('Please provide a title.', 'warning');
      return;
    }

    if (materialType === 'link' && !linkUrl.trim()) {
      showToast('Please provide a valid web URL.', 'warning');
      return;
    }

    if (materialType !== 'link' && !selectedFile) {
      showToast('Please choose a file to upload.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await materialService.uploadMaterial(selectedEventId, {
        title: materialTitle.trim(),
        description: materialDescription.trim(),
        materialType,
        file: selectedFile,
        linkUrl,
      });

      showToast('Learning material uploaded successfully!', 'success');
      setIsAddModalOpen(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialType('pdf');
      setLinkUrl('');
      setSelectedFile(null);
      await loadMaterialsForEvent(selectedEventId);
    } catch (err) {
      console.error('Upload failed:', err);
      showToast(err.message || 'Failed to upload material.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (item) => {
    if (!true /* confirmed */) return;

    try {
      await materialService.deleteMaterial(item.id, item.file_url);
      showToast('Material deleted.', 'info');
      await loadMaterialsForEvent(selectedEventId);
    } catch (err) {
      console.error('Delete failed:', err);
      showToast(err.message || 'Failed to delete material.', 'error');
    }
  };

  const handleOpenDownload = async (item) => {
    try {
      const url = await materialService.getDownloadUrl(item.file_url);
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      showToast('Unable to open material: ' + err.message, 'error');
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'slides':
        return <FileSpreadsheet className="w-5 h-5 text-amber-600" />;
      case 'code':
        return <FileCode className="w-5 h-5 text-indigo-600" />;
      case 'link':
        return <Link2 className="w-5 h-5 text-sky-600" />;
      default:
        return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted font-medium">Loading event learning materials...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Learning Materials"
      subtitle="Upload and manage lecture presentations, PDFs, code repositories, and links (visible only to verified attendees)"
      actions={
        sessions.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setIsAddModalOpen(true)}
          >
            Upload Material
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Event Selector Header */}
        <div className="bg-surface p-5 rounded-[20px] border border-line shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Select Event</h3>
            <p className="text-xs text-muted">
              Visible only to attendees: materials uploaded here are locked to students with verified attendance.
            </p>
          </div>

          <div className="w-full sm:w-80">
            {sessions.length === 0 ? (
              <span className="text-xs text-muted">No events available.</span>
            ) : (
              <AppSelect
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                options={sessions.map((s) => ({
                  label: `${s.title} (${new Date(s.start_time).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })})`,
                  value: s.id,
                }))}
              />
            )}
          </div>
        </div>

        {/* Materials List */}
        {sessions.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Events Found"
            description="Propose an event to begin uploading presentation slides, reference notes, and study links."
            actionLabel="Propose Event"
            onAction={() => (window.location.href = '/coordinator/events/new')}
          />
        ) : isMaterialsLoading ? (
          <div className="py-16 text-center">
            <Spinner size="md" />
            <p className="text-xs text-muted mt-2">Loading materials from secure storage...</p>
          </div>
        ) : materials.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Materials Uploaded Yet"
            description="Share keynote slides, research papers, or source code for students who attend this event."
            actionLabel="Upload First Material"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((item) => (
              <AppSpotlightCard key={item.id} className="p-5 flex flex-col justify-between bg-surface">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                        {getMaterialIcon(item.material_type)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink leading-snug line-clamp-1">
                          {item.title}
                        </h4>
                        <Badge variant="neutral" size="sm" className="uppercase text-xs mt-0.5">
                          {item.material_type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMaterial(item)}
                      className="text-muted hover:text-red-600 p-1 rounded transition-colors"
                      title="Delete Material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {item.description && (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-line">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {item.file_size && (
                      <span>{(item.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-line">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    icon={item.material_type === 'link' ? ExternalLink : Download}
                    onClick={() => handleOpenDownload(item)}
                  >
                    {item.material_type === 'link' ? 'Open Link' : 'Download File'}
                  </Button>
                </div>
              </AppSpotlightCard>
            ))}
          </div>
        )}

        {/* Upload Modal */}
        {isAddModalOpen && (
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            title="Upload Learning Material"
            subtitle="Access is restricted by Supabase Storage RLS to students who attend this event."
          >
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Material Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  placeholder="e.g. Keynote Presentation Slides (PDF)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Type of Resource <span className="text-red-500">*</span>
                </label>
                <AppSelect
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  options={[
                    { label: 'PDF Document (.pdf)', value: 'pdf' },
                    { label: 'Slide Presentation (.ppt, .pptx, .pdf)', value: 'slides' },
                    { label: 'Code / Archive (.zip, .tar, .py, etc)', value: 'code' },
                    { label: 'Lecture Notes (.docx, .txt, .pdf)', value: 'notes' },
                    { label: 'External Web Link (URL)', value: 'link' },
                  ]}
                  required
                />
              </div>

              {materialType === 'link' ? (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Resource URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://github.com/... or https://drive.google.com/..."
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Select File (Max 25MB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-muted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    required
                  />
                  {selectedFile && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description / Topic Notes (Optional)
                </label>
                <Textarea
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  placeholder="Summary of contents covered in this resource..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  icon={UploadCloud}
                >
                  Upload Material
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
