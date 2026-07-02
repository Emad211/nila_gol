import { useEffect, useState } from 'react';
import {
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from '../../services/admin';
import { formatPrice } from '../../lib/format';

const AVAILABILITY_OPTIONS = [
  { value: 'in_stock', label: 'موجود' },
  { value: 'made_to_order', label: 'سفارشی‌دوز' },
  { value: 'sold_out', label: 'ناموجود' },
];

const EMPTY = {
  name: '',
  price: '',
  sale_price: '',
  availability: 'in_stock',
  category: '',
  description: '',
  featuresText: '',
  image_url: '',
  images: [],
  is_featured: false,
  is_active: true,
  sort_order: 0,
};

const toForm = (p) => ({
  name: p.name ?? '',
  price: p.price ?? '',
  sale_price: p.sale_price ?? '',
  availability: p.availability || 'in_stock',
  category: p.category ?? '',
  description: p.description ?? '',
  featuresText: (p.features ?? []).join('\n'),
  image_url: p.image_url ?? '',
  images: p.images ?? [],
  is_featured: !!p.is_featured,
  is_active: p.is_active !== false,
  sort_order: p.sort_order ?? 0,
});

const toPayload = (form) => ({
  name: form.name.trim(),
  price: Number(form.price) || 0,
  sale_price: form.sale_price === '' || form.sale_price == null ? null : Number(form.sale_price),
  availability: form.availability || 'in_stock',
  category: form.category.trim() || null,
  description: form.description.trim() || null,
  features: form.featuresText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean),
  image_url: form.image_url || null,
  images: form.images || [],
  is_featured: form.is_featured,
  is_active: form.is_active,
  sort_order: Number(form.sort_order) || 0,
});

export default function ProductsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null | 'new' | <id>
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setItems(await listAllProducts());
    } catch {
      setError('خطا در دریافت محصولات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setForm(EMPTY);
    setEditingId('new');
    setError('');
  };
  const startEdit = (p) => {
    setForm(toForm(p));
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

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file, 'products');
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setError('آپلود تصویر ناموفق بود: ' + (err.message || ''));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onUploadMore = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadImage(file, 'products'));
      setForm((f) => ({ ...f, images: [...(f.images || []), ...urls] }));
    } catch (err) {
      setError('آپلود تصاویر ناموفق بود: ' + (err.message || ''));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeMoreImage = (idx) => {
    setForm((f) => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('نام محصول الزامی است.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = toPayload(form);
      if (editingId === 'new') await createProduct(payload);
      else await updateProduct(editingId, payload);
      await load();
      cancel();
    } catch (err) {
      setError('ذخیره ناموفق بود: ' + (err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!window.confirm(`حذف «${p.name}»؟`)) return;
    try {
      await deleteProduct(p.id);
      await load();
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <h2 className="admin-panel-title">محصولات</h2>
        {editingId === null && (
          <button type="button" className="admin-btn admin-btn--primary" onClick={startNew}>
            + محصول جدید
          </button>
        )}
      </div>

      {error && <p className="admin-error">{error}</p>}

      {editingId !== null && (
        <form className="admin-form" onSubmit={onSubmit}>
          <div className="admin-form-grid">
            <label className="admin-field">
              نام
              <input name="name" value={form.name} onChange={onField} required />
            </label>
            <label className="admin-field">
              قیمت (تومان)
              <input name="price" type="number" min="0" value={form.price} onChange={onField} />
            </label>
            <label className="admin-field">
              قیمت با تخفیف (اختیاری)
              <input name="sale_price" type="number" min="0" value={form.sale_price} onChange={onField} placeholder="خالی = بدون تخفیف" />
            </label>
            <label className="admin-field">
              دسته‌بندی
              <input name="category" value={form.category} onChange={onField} placeholder="رز، لاله…" />
            </label>
            <label className="admin-field">
              وضعیت موجودی
              <select name="availability" value={form.availability} onChange={onField}>
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              ترتیب نمایش
              <input name="sort_order" type="number" value={form.sort_order} onChange={onField} />
            </label>
          </div>

          <label className="admin-field">
            توضیحات
            <textarea name="description" value={form.description} onChange={onField} />
          </label>

          <label className="admin-field">
            ویژگی‌ها (هر کدام در یک خط)
            <textarea
              name="featuresText"
              value={form.featuresText}
              onChange={onField}
              placeholder={'رنگ ثابت\nقابل شستشو'}
            />
          </label>

          <div className="admin-uploader">
            {form.image_url ? (
              <img className="admin-thumb" src={form.image_url} alt="" />
            ) : (
              <div className="admin-thumb admin-thumb--empty">🌸</div>
            )}
            <label className="admin-btn admin-btn--sm">
              {uploading ? 'در حال آپلود…' : 'آپلود تصویر'}
              <input type="file" accept="image/*" hidden onChange={onUpload} disabled={uploading} />
            </label>
            {form.image_url && (
              <button
                type="button"
                className="admin-btn admin-btn--sm admin-btn--ghost"
                onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
              >
                حذف تصویر
              </button>
            )}
          </div>

          <div className="admin-field">
            <span>تصاویر بیشتر (گالری محصول)</span>
            <div className="admin-more-images">
              {(form.images || []).map((src, i) => (
                <div className="admin-more-thumb" key={i}>
                  <img src={src} alt="" />
                  <button type="button" onClick={() => removeMoreImage(i)} aria-label="حذف تصویر">×</button>
                </div>
              ))}
              <label className="admin-more-add" title="افزودن تصویر">
                +
                <input type="file" accept="image/*" multiple hidden onChange={onUploadMore} disabled={uploading} />
              </label>
            </div>
          </div>

          <div className="admin-checks">
            <label className="admin-field admin-check">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={onField} />
              ویژه (Featured)
            </label>
            <label className="admin-field admin-check">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={onField} />
              فعال (نمایش در سایت)
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'در حال ذخیره…' : 'ذخیره'}
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
        <p className="admin-state">هنوز محصولی ثبت نشده است.</p>
      ) : (
        <div className="admin-list">
          {items.map((p) => (
            <div className="admin-item" key={p.id}>
              {p.image_url ? (
                <img className="admin-item-img" src={p.image_url} alt="" />
              ) : (
                <div className="admin-item-img admin-thumb--empty">🌸</div>
              )}
              <div className="admin-item-body">
                <p className="admin-item-title">
                  {p.name}
                  {p.is_featured && <span className="admin-badge admin-badge--feat">ویژه</span>}
                  {p.is_active ? (
                    <span className="admin-badge admin-badge--on">فعال</span>
                  ) : (
                    <span className="admin-badge">غیرفعال</span>
                  )}
                </p>
                <p className="admin-item-meta">
                  {formatPrice(p.price)} تومان · {p.category || 'بدون دسته'}
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
