import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import {
  BookOpen, Plus, Edit2, Trash2, Search, GraduationCap, Lock, Unlock, Eye,
  Loader2, Check, X, Clock, Play, ChevronUp, ChevronDown, Video, Star, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/context/AdminAuthContext';

const API_BASE = window.location.origin;
const getAdminToken = () => localStorage.getItem('admin_token') || '';
const CATEGORIES = ['AI', 'Prompt Engineering', 'Cloud', 'DevOps', 'Cybersecurity', 'Data Science', 'Software Engineering', 'Product Management'];
const LEVELS = ['beginner', 'intermediate', 'advanced'];

// ============== Lesson Editor ==============
const LessonEditor = ({ lessons, onChange }) => {
  const add = () => onChange([...lessons, { id: '', title: '', video_url: '', duration: '', content: '', type: 'video', order: lessons.length }]);
  const update = (i, field, value) => { const copy = [...lessons]; copy[i] = { ...copy[i], [field]: value }; onChange(copy); };
  const remove = (i) => onChange(lessons.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    if ((dir === -1 && i === 0) || (dir === 1 && i === lessons.length - 1)) return;
    const copy = [...lessons];
    [copy[i], copy[i + dir]] = [copy[i + dir], copy[i]];
    copy.forEach((l, idx) => { l.order = idx; });
    onChange(copy);
  };

  return (
    <div className="space-y-2" data-testid="lesson-editor">
      {lessons.map((lesson, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">{i + 1}</span>
            <Input value={lesson.title} onChange={e => update(i, 'title', e.target.value)} placeholder="Lesson title *" className="flex-1 text-sm h-8" data-testid={`lesson-title-${i}`} />
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === lessons.length - 1}><ChevronDown className="w-3 h-3" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => remove(i)}><X className="w-3 h-3" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input value={lesson.video_url} onChange={e => update(i, 'video_url', e.target.value)} placeholder="Video URL (YouTube/Vimeo)" className="text-xs h-7 col-span-2" />
            <Input value={lesson.duration} onChange={e => update(i, 'duration', e.target.value)} placeholder="Duration (e.g. 20 min)" className="text-xs h-7" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full gap-1.5 text-xs" data-testid="add-lesson-btn">
        <Plus className="w-3 h-3" /> Add Lesson
      </Button>
    </div>
  );
};

// ============== Course Form Dialog ==============
const CourseFormDialog = ({ open, onOpenChange, course, onSave }) => {
  const [form, setForm] = useState({});
  const [lessons, setLessons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState('details');

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title || '', description: course.description || '',
        category: course.category || 'AI', level: course.level || 'beginner',
        instructor_name: course.instructor_name || '', instructor_avatar: course.instructor_avatar || '',
        instructor_title: course.instructor_title || '', thumbnail: course.thumbnail || '',
        is_premium: course.is_premium || false, price: course.price || 0,
        tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
        what_you_learn: Array.isArray(course.what_you_learn) ? course.what_you_learn.join('\n') : '',
        prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites.join('\n') : '',
        estimated_hours: course.estimated_hours || 0,
        status: course.status || 'draft',
      });
      setLessons(course.lessons || []);
    } else {
      setForm({ title: '', description: '', category: 'AI', level: 'beginner', instructor_name: '', instructor_avatar: '', instructor_title: '', thumbnail: '', is_premium: false, price: 0, tags: '', what_you_learn: '', prerequisites: '', estimated_hours: 0, status: 'draft' });
      setLessons([]);
    }
    setActiveFormTab('details');
  }, [course, open]);

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      what_you_learn: form.what_you_learn ? form.what_you_learn.split('\n').filter(Boolean) : [],
      prerequisites: form.prerequisites ? form.prerequisites.split('\n').filter(Boolean) : [],
      price: parseFloat(form.price) || 0,
      estimated_hours: parseFloat(form.estimated_hours) || 0,
      lessons: lessons.map((l, i) => ({ ...l, order: i })),
    };
    await onSave(payload, course?.id);
    setSaving(false);
    onOpenChange(false);
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="course-form-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-violet-500" />
            {course ? 'Edit Course' : 'Create Course'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeFormTab} onValueChange={setActiveFormTab} className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-3">
            <div><label className="text-xs font-medium mb-1 block">Title *</label><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Course title" data-testid="course-title-input" /></div>
            <div><label className="text-xs font-medium mb-1 block">Description</label><Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Course description..." rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium mb-1 block">Category</label>
                <Select value={form.category} onValueChange={v => set('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Level</label>
                <Select value={form.level} onValueChange={v => set('level', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-xs font-medium mb-1 block">Thumbnail URL</label><Input value={form.thumbnail} onChange={e => set('thumbnail', e.target.value)} placeholder="https://..." /></div>
            <div className="border-t pt-3">
              <label className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2 block">Instructor</label>
              <div className="grid grid-cols-3 gap-3">
                <Input value={form.instructor_name} onChange={e => set('instructor_name', e.target.value)} placeholder="Name" className="text-sm" />
                <Input value={form.instructor_title} onChange={e => set('instructor_title', e.target.value)} placeholder="Title / Role" className="text-sm" />
                <Input value={form.instructor_avatar} onChange={e => set('instructor_avatar', e.target.value)} placeholder="Avatar URL" className="text-sm" />
              </div>
            </div>
            <div><label className="text-xs font-medium mb-1 block">What You'll Learn (one per line)</label><Textarea value={form.what_you_learn} onChange={e => set('what_you_learn', e.target.value)} placeholder="Master AI fundamentals&#10;Build neural networks&#10;Deploy models" rows={3} className="text-sm" /></div>
            <div><label className="text-xs font-medium mb-1 block">Prerequisites (one per line)</label><Textarea value={form.prerequisites} onChange={e => set('prerequisites', e.target.value)} placeholder="Basic Python knowledge" rows={2} className="text-sm" /></div>
            <div><label className="text-xs font-medium mb-1 block">Tags (comma-separated)</label><Input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="AI, Machine Learning, Neural Networks" /></div>
          </TabsContent>

          <TabsContent value="lessons" className="mt-4">
            <LessonEditor lessons={lessons} onChange={setLessons} />
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium mb-1 block">Estimated Hours</label><Input type="number" value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} /></div>
              <div><label className="text-xs font-medium mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <input type="checkbox" id="is_premium" checked={form.is_premium} onChange={e => set('is_premium', e.target.checked)} className="rounded border-gray-300" />
              <div>
                <label htmlFor="is_premium" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-amber-500" /> Premium Course (Pro subscription required)</label>
                <p className="text-[11px] text-gray-400 mt-0.5">Only users with Pro or Enterprise subscription can access this course</p>
              </div>
            </div>
            {form.is_premium && (
              <div><label className="text-xs font-medium mb-1 block">Price ($)</label><Input type="number" value={form.price} onChange={e => set('price', e.target.value)} placeholder="29.00" /></div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.title} className="bg-violet-600 hover:bg-violet-700 gap-1.5" data-testid="save-course-btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {course ? 'Update Course' : 'Create Course'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============== Main Page ==============
const AdminCoursesPage = () => {
  const { toast } = useToast();
  const { adminUser } = useAdminAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPremium, setFilterPremium] = useState('all');

  const getHeaders = () => ({ 'Authorization': `Bearer ${getAdminToken()}`, 'Content-Type': 'application/json' });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/academy/admin/courses`, { headers: getHeaders() });
      if (res.ok) { const d = await res.json(); setCourses(d.courses || []); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSave = async (payload, courseId) => {
    const url = courseId ? `${API_BASE}/api/academy/admin/courses/${courseId}` : `${API_BASE}/api/academy/admin/courses`;
    const method = courseId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(payload) });
      if (res.ok) {
        toast({ title: courseId ? 'Course updated' : 'Course created' });
        fetchCourses();
      } else { const d = await res.json(); toast({ variant: 'destructive', title: d.detail || 'Failed' }); }
    } catch { toast({ variant: 'destructive', title: 'Network error' }); }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/academy/admin/courses/${id}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) { toast({ title: 'Course deleted' }); fetchCourses(); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const handleToggleStatus = async (course) => {
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`${API_BASE}/api/academy/admin/courses/${course.id}`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) { toast({ title: `Course ${newStatus}` }); fetchCourses(); }
    } catch { toast({ variant: 'destructive', title: 'Failed' }); }
  };

  const filtered = courses.filter(c => {
    if (searchQuery && !c.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.category?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterPremium === 'premium' && !c.is_premium) return false;
    if (filterPremium === 'free' && c.is_premium) return false;
    return true;
  });

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.status === 'published').length,
    draft: courses.filter(c => c.status === 'draft').length,
    premium: courses.filter(c => c.is_premium).length,
    totalEnrolled: courses.reduce((s, c) => s + (c.enrolled_count || 0), 0),
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto" data-testid="admin-courses-page">
      <Helmet><title>Courses Management | Admin</title></Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-violet-500" /> Courses Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage academy courses</p>
        </div>
        <Button onClick={() => { setEditCourse(null); setFormOpen(true); }} className="bg-violet-600 hover:bg-violet-700 gap-1.5" data-testid="create-course-btn">
          <Plus className="w-4 h-4" /> Create Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Published', value: stats.published, color: 'text-green-600' },
          { label: 'Draft', value: stats.draft, color: 'text-amber-600' },
          { label: 'Premium', value: stats.premium, color: 'text-violet-600' },
          { label: 'Enrolled', value: stats.totalEnrolled, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search courses..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm" data-testid="courses-search" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPremium} onValueChange={setFilterPremium}>
          <SelectTrigger className="w-32 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="premium">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No courses found</p>
          <p className="text-gray-400 text-sm mt-1">Create your first course to get started</p>
          <Button onClick={() => { setEditCourse(null); setFormOpen(true); }} className="mt-4 bg-violet-600 hover:bg-violet-700 gap-1.5"><Plus className="w-4 h-4" /> Create Course</Button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-sm" data-testid="courses-table">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Course</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Level</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Type</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Lessons</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Enrolled</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(course => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-testid={`course-row-${course.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt="" className="w-12 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-violet-400" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate max-w-[250px]">{course.title}</p>
                        {course.instructor_name && <p className="text-[11px] text-gray-400 truncate">By {course.instructor_name}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{course.category}</Badge></td>
                  <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", course.level === 'beginner' ? 'bg-green-100 text-green-700' : course.level === 'intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{course.level}</span></td>
                  <td className="px-4 py-3">
                    {course.is_premium ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 flex items-center gap-1 w-fit"><Lock className="w-2.5 h-2.5" /> Pro ${course.price}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Free</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleStatus(course)} className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize cursor-pointer transition-colors", course.status === 'published' ? 'bg-green-100 text-green-700 hover:bg-green-200' : course.status === 'draft' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-red-100 text-red-600 hover:bg-red-200')} title="Click to toggle">
                      {course.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400"><Video className="w-3 h-3" /> {course.lessons?.length || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400"><Users className="w-3 h-3" /> {course.enrolled_count || 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(`/academy/courses/${course.id}`, '_blank')} title="Preview"><Eye className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditCourse(course); setFormOpen(true); }} title="Edit" data-testid={`edit-course-${course.id}`}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(course.id, course.title)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Dialog */}
      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editCourse}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdminCoursesPage;
