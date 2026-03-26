'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, FileVideo, Loader2 } from 'lucide-react';
import { apiRequest, apiUpload } from '@/lib/api';
import { VideoPlayer } from '@/components/lms/VideoPlayer';
import { useI18n } from '@/lib/i18n/context';
import { useAuthStore } from '@/lib/auth';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  type: string;
  videoUrl: string | null;
  videoKey: string | null;
  duration: number | null;
  content: string | null;
  order: number;
  isFree: boolean;
  isPublished: boolean;
  moduleId: string;
}

export default function AdminLessonEditPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore(s => s.user);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('VIDEO');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const fetchLesson = useCallback(async () => {
    try {
      // Fetch lesson via admin endpoint — get it from the update endpoint by doing a findUnique
      const data = await apiRequest<Lesson>(`/api/admin/lessons/${lessonId}`);
      setLesson(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setType(data.type);
      setContent(data.content || '');
      setIsFree(data.isFree);
      setIsPublished(data.isPublished);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load lesson' });
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await apiRequest<Lesson>(`/api/admin/lessons/${lessonId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, description: description || null, type, content: content || null, isFree, isPublished }),
      });
      setLesson(updated);
      setMessage({ type: 'success', text: 'Сохранено' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowed.includes(file.type)) {
      setMessage({ type: 'error', text: 'Допустимы только mp4, webm, mov файлы' });
      return;
    }

    setUploadProgress(0);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const updated = await apiUpload<Lesson>(
        `/api/admin/lessons/${lessonId}/upload-video`,
        formData,
        setUploadProgress,
      );
      setLesson(updated);
      setMessage({ type: 'success', text: 'Видео загружено' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Upload failed' });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleVideoUpload(file);
  };

  if (user?.role !== 'ADMIN') return null;

  return (
        <div className="mx-auto max-w-4xl py-2">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="p-2 rounded-xl bg-card hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Редактирование урока</h1>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : lesson ? (
            <div className="space-y-6">
              {/* Basic fields */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Название</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Описание</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Тип</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="VIDEO">Видео</option>
                      <option value="TEXT">Текст</option>
                      <option value="QUIZ">Тест</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="accent-primary w-4 h-4" />
                      <span className="text-sm text-foreground">Бесплатный</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-primary w-4 h-4" />
                      <span className="text-sm text-foreground">Опубликован</span>
                    </label>
                  </div>
                </div>

                {type === 'TEXT' && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Контент</label>
                    <textarea
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      rows={10}
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить
                </button>
              </div>

              {/* Video section */}
              {type === 'VIDEO' && (
                <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Видео</h2>

                  {/* Current video preview */}
                  {lesson.videoUrl && (
                    <div className="rounded-xl overflow-hidden">
                      <VideoPlayer src={lesson.videoUrl} />
                    </div>
                  )}

                  {/* Upload zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {uploadProgress !== null ? (
                      <div className="space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                        <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    ) : (
                      <>
                        <FileVideo className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground mb-2">
                          Перетащите видео сюда или нажмите для выбора
                        </p>
                        <p className="text-xs text-muted-foreground">MP4, WebM, MOV (до 500 МБ)</p>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f); }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-20">Урок не найден</p>
          )}
        </div>
  );
}
