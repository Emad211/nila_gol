import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaSearch } from 'react-icons/fa';
import {
  listAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from '../../services/admin';
import { formatPrice } from '../../lib/format';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

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

function validateImage(file) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('فرمت تصویر باید JPG، PNG، WebP یا AVIF باشد.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('حجم هر تصویر باید کمتر از ۸ مگابایت باشد.');
  }
}

export default function ProductsManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    setError('');
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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((product) => {
      if (filter === 'active' && product.is_active === false) return false;
      if (filter === 'inactive' && product.is_active !== false) return false;
      if (filter === 'featured' && !product.is_featured) return false;
      if (filter === 'sold_out' && product.availability !== 'sold_out') return false;
      if (!needle) return true;
      return [product.name, product.category, product.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [items, query, filter]);

  const activeCount = items.filter((product) => product.is_active !== false).length;
  const soldOutCount = items.filter((product) => product.availability === 'sold_out').length;

  const startNew = () => {
    setForm(EMPTY);
    setEditingId('new');
    setError('');
  };

  const startEdit = (p) => {
    setForm(toForm(p));
    setEditingId(p.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancel = () => {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
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
      validateImage(file);
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
      files.forEach(validateImage);
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
    const price = Number(form.price);
    const salePrice = form.sale_price === '' ? null : Number(form.sale_price);

    if (!form.name.trim()) {
      setError('نام محصول الزامی است.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('قیمت محصول باید بیشتر از صفر باشد.');
      return;
    }
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      setError('قیمت تخفیف باید بیشتر از صفر و کمتر از قیمت اصلی باشد.');
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
    if (!window.confirm(`حذف «${p.name}»؟ این محصول دیگر در فروشگاه نمایش داده نمی‌شود.`)) return;
    setError('');
    try {
      await deleteProduct(p.id);
      setItems((list) => list.filter((item) => item.id !== p.id));
    } catch {
      setError('حذف ناموفق بود.');
    }
  };

  return (
    <section className="admin-panel admin-products-panel">
      <div className="admin-panel-head admin-panel-head--rich">
        <div>
          <h2 className="admin-panel-title">محصولات</h2>
          <p className="admin-panel-subtitle">
            <span className="num">{items.length}</span> محصول · <strong className="num">{activeCount}</strong> فعال
            {soldOutCount > 0 && <> · <span className="num">{soldOutCount}</span> ناموجود</>}
          </p>
        </div>
        {editingId === null && (
          <button type="button" className="admin-btn admin-btn--primary" onClick={startNew}>
            <FaPlus aria-hidden="true" /> محصول جدید
          </button>
        )}
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {editingId !== null && (
        <form className="admin-form admin-product-form" onSubmit={onSubmit}>
          <div className="admin-form-section-head">
            <div>
              <span>{editingId === 'new' ? 'محصول جدید' : 'ویرایش محصول'}</span>
              <strong>اطلاعات اصلی و وضعیت فروش</strong>
            </div>
            <button type="button" className="admin-btn admin-btn--sm" onClick={cancel}>بستن فرم</button>
          </div>

          <div className="admin-form-grid">
            <label className="admin-field">
              نام محصول
              <input name="name" value={form.name} onChange={onField} required maxLength={160} />
            </label>
            <label className="admin-field">
              قیمت (تومان)
              <input name="price" type="number" min="1" value={form.price} onChange={onField} required />
            </label>
            <label className="admin-field">
              قیمت با تخفیف
              <input name="sale_price" type="number" min="1" value={form.sale_price} onChange={onField} placeholder="بدون تخفیف" />
            </label>
            <label className="admin-field">
              دسته‌بندی
              <input name="category" value={form.category} onChange={onField} placeholder="رز، لاله…" maxLength={100} />
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

          <div className="admin-form-divider" />

          <div className="admin-product-copy-grid">
            <label className="admin-field">
              توضیحات محصول
              <textarea name="description" value={form.description} onChange={onField} maxLength={3000} />
            </label>
            <label className="admin-field">
              ویژگی‌ها (هر مورد در یک خط)
              <textarea
                name="featuresText"
                value={form.featuresText}
                onChange={onField}
                placeholder={'رنگ ثابت\nقابل شستشو'}
                maxLength={2000}
              />
            </label>
          </div>

          <div className="admin-form-divider" />

          <div className="admin-media-editor">
            <div className="admin-uploader">
              {form.image_url ? (
                <img className="admin-thumb" src={form.image_url} alt="پیش‌نمایش تصویر اصلی محصول" />
              ) : (
                <div className="admin-thumb admin-thumb--empty">🌸</div>
              )}
              <div className="admin-uploader-copy">
                <strong>تصویر اصلی</strong>
                <span>JPG، PNG، WebP یا AVIF · حداکثر ۸MB</span>
              </div>
              <label className="admin-btn admin-btn--sm">
                {uploading ? 'در حال آپلود…' : 'انتخاب تصویر'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" hidden onChange={onUpload} disabled={uploading} />
              </label>
              {form.image_url && (
                <button type="button" className="admin-btn admin-btn--sm admin-btn--ghost" onClick={() => setForm((f) => ({ ...f, image_url: '' }))}>
                  حذف
                </button>
              )}
            </div>

            <div className="admin-field">
              <span>گالری محصول</span>
              <div className="admin-more-images">
                {(form.images || []).map((src, i) => (
                  <div className="admin-more-thumb" key={`${src}-${i}`}>
                    <img src={src} alt="" />
                    <button type="button" onClick={() => removeMoreImage(i)} aria-label="حذف تصویر">×</button>
                  </div>
                ))}
                <label className="admin-more-add" title="افزودن تصاویر بیشتر">
                  +
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={onUploadMore} disabled={uploading} />
                </label>
              </div>
            </div>
          </div>

          <div className="admin-checks">
            <label className="admin-field admin-check">
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={onField} />
              محصول ویژه
            </label>
            <label className="admin-field admin-check">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={onField} />
              نمایش در فروشگاه
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving || uploading}>
              {saving ? 'در حال ذخیره…' : editingId === 'new' ? 'ثبت محصول' : 'ذخیره تغییرات'}
            </button>
            <button type="button" className="admin-btn" onClick={cancel}>انصراف</button>
          </div>
        </form>
      )}

      {editingId === null && items.length > 0 && (
        <div className="admin-products-toolbar">
          <label className="admin-manager-search">
            <FaSearch aria-hidden="true" />
            <span className="sr-only">جستجوی محصول</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="نام، دسته‌بندی یا توضیحات…" />
          </label>
          <div className="admin-manager-filters" aria-label="فیلتر محصولات">
            <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>همه</button>
            <button type="button" className={filter === 'active' ? 'is-active' : ''} onClick={() => setFilter('active')}>فعال</button>
            <button type="button" className={filter === 'featured' ? 'is-active' : ''} onClick={() => setFilter('featured')}>ویژه</button>
            <button type="button" className={filter === 'sold_out' ? 'is-active' : ''} onClick={() => setFilter('sold_out')}>ناموجود</button>
            <button type="button" className={filter === 'inactive' ? 'is-active' : ''} onClick={() => setFilter('inactive')}>غیرفعال</button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="admin-state">در حال بارگذاری…</p>
      ) : items.length === 0 ? (
        <p className="admin-state">هنوز محصولی ثبت نشده است.</p>
      ) : editingId === null && visible.length === 0 ? (
        <div className="admin-state">
          <span>محصولی با این فیلتر پیدا نشد.</span>
          <button type="button" className="admin-btn admin-btn--sm" onClick={() => { setQuery(''); setFilter('all'); }}>نمایش همه</button>
        </div>
      ) : editingId === null ? (
        <div className="admin-list admin-product-list">
          {visible.map((p) => (
            <article className="admin-item admin-product-item" key={p.id}>
              {p.image_url ? (
                <img className="admin-item-img" src={p.image_url} alt="" />
              ) : (
                <div className="admin-item-img admin-thumb--empty">🌸</div>
              )}
              <div className="admin-item-body">
                <p className="admin-item-title">
                  {p.name}
                  {p.is_featured && <span className="admin-badge admin-badge--feat">ویژه</span>}
                  {p.is_active ? <span className="admin-badge admin-badge--on">فعال</span> : <span className="admin-badge">غیرفعال</span>}
                  {p.availability === 'sold_out' && <span className="admin-badge admin-badge--danger">ناموجود</span>}
                </p>
                <p className="admin-item-meta">
                  <strong className="num">{formatPrice(p.sale_price ?? p.price)}</strong> تومان · {p.category || 'بدون دسته'}
                  {p.sale_price && <span className="admin-product-old-price num">{formatPrice(p.price)}</span>}
                </p>
              </div>
              <div className="admin-item-actions">
                <button type="button" className="admin-btn admin-btn--sm" onClick={() => startEdit(p)}>ویرایش</button>
                <button type="button" className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => onDelete(p)}>حذف</button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
