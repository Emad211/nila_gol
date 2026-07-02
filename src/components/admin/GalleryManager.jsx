import { useEffect, useState } from 'react';
import {
  listAllGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  uploadImage,
  removeImageByUrl,
} from '../../services/admin';
import './GalleryManager.css';

export default function GalleryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAllGallery());
    } catch {
      setError('خطا در دریافت گالری.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      // Append new images after the current max order so uploads keep their order.
      let nextOrder = items.reduce((m, it) => Math.max(m, it.sort_order ?? 0), 0);
      for (const file of files) {
        const url = await uploadImage(file, 'gallery');
        nextOrder += 1;
        await createGalleryItem({ image_url: url, sort_order: nextOrder, is_active: true });
      }
      await load();
    } catch (err) {
      setError('آپلود ناموفق بود: ' + (err.message || ''));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onFieldChange = (id, field, value) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const onSave = async (item) => {
    setSavingId(item.id);
    setError('');
    try {
      await updateGalleryItem(item.id, {
        title: item.title?.trim() || null,
        sort_order: Number(item.sort_order) || 0,
      });
      await load();
    } catch (err) {
      setError('ذخیره ناموفق بود: ' + (err.message || ''));
    } finally {
      setSavingId(null);
    }
  };

  const onDelete = async (item) => {
    if (!window.confirm('حذف این تصویر؟')) return;
    try {
      await deleteGalleryItem(item.id);
      await removeImageByUrl(item.image_url);
      await load();
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">گالری</h2>
        <label className="admin-btn admin-btn--primary">
          {uploading ? 'در حال آپلود…' : '+ افزودن تصویر'}
          <input type="file" accept="image/*" multiple hidden onChange={onUpload} disabled={uploading} />
        </label>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {!loading && items.length > 0 && (
        <p className="admin-state admin-gallery-hint">عنوان و «ترتیب» هر تصویر را می‌توانید ویرایش کنید؛ عدد کوچک‌تر جلوتر نمایش داده می‌شود.</p>
      )}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">گالری خالی است. چند تصویر اضافه کنید.</p>
      ) : (
        <div className="admin-gallery-grid">
          {items.map((item) => (
            <div className="admin-gallery-cell" key={item.id}>
              <img src={item.image_url} alt={item.title || ''} loading="lazy" />
              <button
                type="button"
                className="admin-gallery-del"
                onClick={() => onDelete(item)}
                aria-label="حذف تصویر"
              >
                ×
              </button>
              <div className="admin-gallery-edit">
                <input
                  type="text"
                  className="admin-gallery-input"
                  placeholder="عنوان (اختیاری)"
                  value={item.title || ''}
                  onChange={(e) => onFieldChange(item.id, 'title', e.target.value)}
                />
                <div className="admin-gallery-row">
                  <input
                    type="number"
                    className="admin-gallery-order"
                    aria-label="ترتیب نمایش"
                    value={item.sort_order ?? 0}
                    onChange={(e) => onFieldChange(item.id, 'sort_order', e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-btn admin-btn--sm admin-btn--primary"
                    onClick={() => onSave(item)}
                    disabled={savingId === item.id}
                  >
                    {savingId === item.id ? '…' : 'ذخیره'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
