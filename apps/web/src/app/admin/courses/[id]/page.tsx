'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Save, Loader2, Image as ImageIcon, Upload } from 'lucide-react';
import { apiRequest, apiUpload } from '@/lib/api';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/lib/auth';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  price: string;
  currency: string;
  isFree: boolean;
  isPublished: boolean;
}

export default function AdminCourseEditPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore(s => s.user);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchCourse = useCallback(async () => {
    try {
      const courses = await apiRequest<Course[]>('/api/admin/courses');
      const found = courses.find(c => c.id === id);
      if (found) {
        setCourse(found);
        setTitle(found.title);
        setSlug(found.slug);
        setDescription(found.description || '');
        setIsFree(found.isFree);
        setIsPublished(found.isPublished);
        setCoverUrl(found.coverUrl);
      }
    } catch {
      toast('error', 'Не удалось загрузить курс');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await apiRequest<Course>(`/api/admin/courses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title, slug, description: description || null, isFree, isPublished, coverUrl }),
      });
      setCourse(updated);
      toast('success', 'Сохранено');
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }, [id, title, slug, description, isFree, isPublished, coverUrl]);

  // Autosave on field changes (2s debounce)
  useEffect(() => {
    if (!course) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (title !== course.title || slug !== course.slug || description !== (course.description || '') || isFree !== course.isFree || isPublished !== course.isPublished || coverUrl !== course.coverUrl) {
        handleSave();
      }
    }, 2000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [title, slug, description, isFree, isPublished, coverUrl, course, handleSave]);

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await apiUpload<{ url: string }>('/api/admin/upload-image', formData);
      setCoverUrl(result.url);
      toast('success', 'Обложка загружена');
    } catch {
      toast('error', 'Ошибка загрузки обложки');
    } finally {
      setUploadingCover(false);
    }
  };

  function generateSlug(text: string): string {
    return text.toLowerCase()
      .replace(/[а-яё]/g, char => {
        const map: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
        return map[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  if (user?.role !== 'ADMIN') return null;

  return (
        <div className="mx-auto max-w-4xl py-2">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/admin/courses" className="hover:text-foreground transition-colors">Курсы</Link>
            <span>/</span>
            <span className="text-foreground">{course?.title || 'Загрузка...'}</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : course ? (
            <div className="space-y-6">
              {/* Basic info */}
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Название</label>
                    <input
                      value={title}
                      onChange={e => { setTitle(e.target.value); setSlug(generateSlug(e.target.value)); }}
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Slug</label>
                    <input
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Описание</label>
                  <RichTextEditor content={description} onChange={setDescription} />
                </div>

                {/* Cover image */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1.5">Обложка</label>
                  <div className="flex items-start gap-4">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Cover" className="w-40 h-24 object-cover rounded-xl border border-border" />
                    ) : (
                      <div className="w-40 h-24 rounded-xl border border-dashed border-border flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium text-foreground cursor-pointer transition-colors">
                      {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Загрузить
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }} className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)} className="accent-primary w-4 h-4" />
                    <span className="text-sm text-foreground">Бесплатный</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} className="accent-primary w-4 h-4" />
                    <span className="text-sm text-foreground">Опубликован</span>
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить
                </button>
              </div>

              {/* Links */}
              <div className="flex gap-3">
                <Link href={`/admin/courses/${id}/modules`} className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                  Модули и уроки
                </Link>
                <Link href={`/admin/courses/${id}/access`} className="px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                  Доступ студентов
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-20">Курс не найден</p>
          )}
        </div>
  );
}
