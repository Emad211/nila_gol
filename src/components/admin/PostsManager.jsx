import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaBold,
  FaItalic,
  FaHeading,
  FaListUl,
  FaListOl,
  FaQuoteRight,
  FaLink,
  FaImage,
  FaCode,
  FaMinus,
} from 'react-icons/fa';
import {
  listAllPosts,
  createPost,
  updatePost,
  deletePost,
  uploadImage,
  removeImageByUrl,
} from '../../services/admin';
import { formatDate } from '../../lib/format';
import Markdown from '../../lib/markdown';
import '../../pages/Blog.css'; // reuse .prose typography for the live preview
import './PostsManager.css';

const EMPTY = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  tagsText: '',
  author: 'نیلا گل',
  is_published: false,
  published_at: null,
};

const toForm = (p) => ({
  title: p.title ?? '',
  slug: p.slug ?? '',
  excerpt: p.excerpt ?? '',
  content: p.content ?? '',
  cover_image_url: p.cover_image_url ?? '',
  tagsText: (p.tags ?? []).join('، '),
  author: p.author || 'نیلا گل',
  is_published: !!p.is_published,
  published_at: p.published_at ?? null,
});

const toPayload = (form) => {
  const payload = {
    title: form.title.trim(),
    excerpt: form.excerpt.trim() || null,
    content: form.content ?? '',
    cover_image_url: form.cover_image_url || null,
    tags: form.tagsText
      .split(/[\n،,]+/)
      .map((s) => s.trim())
      .filter(Boolean),
    author: form.author.trim() || 'نیلا گل',
    is_published: form.is_published,
    published_at: form.published_at,
  };
  if (form.slug.trim()) payload.slug = form.slug.trim();
  return payload;
};

// Words & reading time (~200 wpm) for the editor footer.
function readingStats(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return { words, minutes };
}

export default function PostsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null | 'new' | <id>
  const [form, setForm] = useState(EMPTY);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false); // cover
  const [insertingImg, setInsertingImg] = useState(false); // inline body image
  const [error, setError] = useState('');

  const taRef = useRef(null);
  const stats = useMemo(() => readingStats(form.content), [form.content]);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAllPosts());
    } catch {
      setError('خطا در دریافت مقاله‌ها.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setForm(EMPTY);
    setPreview(false);
    setEditingId('new');
    setError('');
  };
  const startEdit = (p) => {
    setForm(toForm(p));
    setPreview(false);
    setEditingId(p.id);
    setError('');
  };
  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const onField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Markdown toolbar helpers (operate on the textarea selection) ──────────
  const restore = (start, end) => {
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(start, end);
    });
  };

  const wrap = (before, after = before, placeholder = '') => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const val = form.content;
    const sel = val.slice(s, e) || placeholder;
    const next = val.slice(0, s) + before + sel + after + val.slice(e);
    setForm((f) => ({ ...f, content: next }));
    restore(s + before.length, s + before.length + sel.length);
  };

  const linePrefix = (prefix) => {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const val = form.content;
    const lineStart = val.lastIndexOf('\n', s - 1) + 1;
    const block = val.slice(lineStart, e) || 'متن';
    const replaced = block
      .split('\n')
      .map((l) => (l.length ? prefix + l : l))
      .join('\n');
    const next = val.slice(0, lineStart) + replaced + val.slice(e);
    setForm((f) => ({ ...f, content: next }));
    restore(lineStart, lineStart + replaced.length);
  };

  const insert = (text) => {
    const ta = taRef.current;
    const val = form.content;
    const s = ta ? ta.selectionStart : val.length;
    const e = ta ? ta.selectionEnd : val.length;
    const next = val.slice(0, s) + text + val.slice(e);
    setForm((f) => ({ ...f, content: next }));
    restore(s + text.length, s + text.length);
  };

  const onCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file, 'blog');
      setForm((f) => ({ ...f, cover_image_url: url }));
    } catch (err) {
      setError('آپلود تصویر کاور ناموفق بود: ' + (err.message || ''));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onInsertImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInsertingImg(true);
    setError('');
    try {
      const url = await uploadImage(file, 'blog');
      insert(`\n\n![${file.name.replace(/\.[^.]+$/, '')}](${url})\n\n`);
    } catch (err) {
      setError('درج تصویر ناموفق بود: ' + (err.message || ''));
    } finally {
      setInsertingImg(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('عنوان مقاله الزامی است.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(form);
      if (editingId === 'new') await createPost(payload);
      else await updatePost(editingId, payload);
      await load();
      cancel();
    } catch (err) {
      setError('ذخیره ناموفق بود: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!window.confirm(`حذف مقاله «${p.title}»؟`)) return;
    try {
      await deletePost(p.id);
      if (p.cover_image_url) await removeImageByUrl(p.cover_image_url);
      await load();
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  const TOOLS = [
    { title: 'تیتر', Icon: FaHeading, run: () => linePrefix('## ') },
    { title: 'پررنگ', Icon: FaBold, run: () => wrap('**', '**', 'متن پررنگ') },
    { title: 'مورب', Icon: FaItalic, run: () => wrap('_', '_', 'متن مورب') },
    { title: 'فهرست', Icon: FaListUl, run: () => linePrefix('- ') },
    { title: 'فهرست شماره‌دار', Icon: FaListOl, run: () => linePrefix('1. ') },
    { title: 'نقل‌قول', Icon: FaQuoteRight, run: () => linePrefix('> ') },
    { title: 'پیوند', Icon: FaLink, run: () => wrap('[', '](https://)', 'متن پیوند') },
    { title: 'کد', Icon: FaCode, run: () => wrap('`', '`', 'کد') },
    { title: 'خط جداکننده', Icon: FaMinus, run: () => insert('\n\n---\n\n') },
  ];

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">مجله</h2>
        {editingId === null && (
          <button type="button" className="admin-btn admin-btn--primary" onClick={startNew}>
            + مقاله‌ی جدید
          </button>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}

      {editingId !== null && (
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              عنوان
              <input name="title" value={form.title} onChange={onField} required placeholder="مثلاً: چطور گل مصنوعی را تمیز کنیم؟" />
            </label>
            <label className="admin-field">
              نامک (slug) — خالی = خودکار
              <input name="slug" value={form.slug} onChange={onField} placeholder="مثلاً: نگهداری-گل-مصنوعی" dir="auto" />
            </label>
            <label className="admin-field">
              نویسنده
              <input name="author" value={form.author} onChange={onField} />
            </label>
            <label className="admin-field">
              برچسب‌ها (با ، جدا کنید)
              <input name="tagsText" value={form.tagsText} onChange={onField} placeholder="گل روسی، نگهداری" />
            </label>
          </div>

          <p className="md-slug-preview">
            نشانی نهایی: <span dir="ltr">nilagol.ir/blog/{(form.slug.trim() || 'از-روی-عنوان').replace(/\s+/g, '-')}</span>
          </p>

          <label className="admin-field">
            خلاصه (برای کارت مجله و توضیحات گوگل) <span className="md-counter">{form.excerpt.length} نویسه</span>
            <textarea name="excerpt" value={form.excerpt} onChange={onField} rows={2} maxLength={300} />
          </label>

          <div className="admin-field">
            <div className="admin-md-bar">
              <span style={{ flex: 1, fontWeight: 700 }}>متن مقاله</span>
              <button
                type="button"
                className={`admin-btn admin-btn--sm ${!preview ? 'is-active admin-btn--primary' : ''}`}
                onClick={() => setPreview(false)}
              >
                نوشتن
              </button>
              <button
                type="button"
                className={`admin-btn admin-btn--sm ${preview ? 'is-active admin-btn--primary' : ''}`}
                onClick={() => setPreview(true)}
              >
                پیش‌نمایش
              </button>
            </div>

            {!preview && (
              <div className="md-toolbar" role="toolbar" aria-label="ابزار نگارش">
                {TOOLS.map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    className="md-tool"
                    title={t.title}
                    aria-label={t.title}
                    onClick={t.run}
                  >
                    <t.Icon aria-hidden="true" />
                  </button>
                ))}
                <label className="md-tool md-tool--upload" title="درج تصویر در متن">
                  {insertingImg ? <span className="md-tool-spin">…</span> : <FaImage aria-hidden="true" />}
                  <input type="file" accept="image/*" hidden onChange={onInsertImage} disabled={insertingImg} />
                </label>
              </div>
            )}

            {preview ? (
              <div className="prose admin-md-preview">
                {form.content.trim() ? (
                  <Markdown>{form.content}</Markdown>
                ) : (
                  <p style={{ color: 'var(--muted)' }}>چیزی برای نمایش نیست.</p>
                )}
              </div>
            ) : (
              <textarea
                ref={taRef}
                name="content"
                value={form.content}
                onChange={onField}
                rows={16}
                dir="auto"
                className="md-editor"
                placeholder={'## عنوان بخش\n\nمتن پاراگراف…\n\n- نکته‌ی اول\n- نکته‌ی دوم\n\n**متن پررنگ** و [یک پیوند](https://example.com)'}
              />
            )}

            <div className="md-footer">
              <span>~{stats.minutes} دقیقه مطالعه · {stats.words} کلمه</span>
              <span className="md-md-hint">از نوار ابزار بالا برای قالب‌بندی استفاده کنید — متن به فرمت Markdown ذخیره می‌شود.</span>
            </div>
          </div>

          <div className="admin-uploader">
            {form.cover_image_url ? (
              <img className="admin-thumb" src={form.cover_image_url} alt="" />
            ) : (
              <div className="admin-thumb admin-thumb--empty">🖼️</div>
            )}
            <label className="admin-btn admin-btn--sm">
              {uploading ? 'در حال آپلود…' : 'آپلود تصویر کاور'}
              <input type="file" accept="image/*" hidden onChange={onCover} disabled={uploading} />
            </label>
            {form.cover_image_url && (
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--ghost"
                onClick={() => setForm((f) => ({ ...f, cover_image_url: '' }))}
              >
                حذف کاور
              </button>
            )}
          </div>

          <div className="admin-checks">
            <label className="admin-field admin-check">
              <input type="checkbox" name="is_published" checked={form.is_published} onChange={onField} />
              منتشر شده (نمایش در مجله)
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'در حال ذخیره…' : form.is_published ? 'ذخیره و انتشار' : 'ذخیره‌ی پیش‌نویس'}
            </button>
            <button type="button" className="admin-btn" onClick={cancel}>
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">هنوز مقاله‌ای ثبت نشده است. اولین مقاله‌ی مجله را بنویسید.</p>
      ) : (
        <div className="admin-list">
          {items.map((p) => (
            <div className="admin-item" key={p.id}>
              {p.cover_image_url ? (
                <img className="admin-item-img" src={p.cover_image_url} alt="" />
              ) : (
                <div className="admin-item-img admin-thumb--empty">📝</div>
              )}
              <div className="admin-item-body">
                <p className="admin-item-title">
                  {p.title}
                  {p.is_published ? (
                    <span className="admin-badge admin-badge--on">منتشر شده</span>
                  ) : (
                    <span className="admin-badge">پیش‌نویس</span>
                  )}
                </p>
                <p className="admin-item-meta">
                  {p.published_at ? formatDate(p.published_at) : 'بدون تاریخ'}
                  {p.tags?.length ? ` · ${p.tags.slice(0, 3).join('، ')}` : ''}
                </p>
              </div>
              <div className="admin-item-actions">
                <button type="button" className="admin-btn admin-btn--sm" onClick={() => startEdit(p)}>
                  ویرایش
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--sm admin-btn--danger"
                  onClick={() => onDelete(p)}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
