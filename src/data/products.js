// Static fallback for the catalog + singular site copy.
//
// `products` and `features` mirror the Supabase tables of the same name and are
// used only when Supabase is unconfigured or unreachable (see src/services/catalog.js).
// Prices are integers in Toman to match the database; UI formatting lives in src/lib/format.js.
// `aboutContent` is static page copy and is rendered directly by Hero/About.

const products = [
  {
    id: 1,
    slug: "rose-red",
    name: "دسته گل رز قرمز",
    description: "دسته گل رز روسی با کیفیت عالی و رنگ‌آمیزی طبیعی",
    price: 450000,
    features: ["انعطاف‌پذیر و شستشو‌پذیر", "رنگ ثابت", "ماندگاری بالا"],
    category: "رز",
    image_url: "/img/rose-red.webp",
    availability: "in_stock",
    is_featured: true,
  },
  {
    id: 2,
    slug: "rose-pink",
    name: "دسته گل رز صورتی",
    description: "گل رز روسی با رنگ صورتی ملایم و زیبا",
    price: 450000,
    features: ["رنگ‌آمیزی طبیعی", "قابل شستشو", "ضد حساسیت"],
    category: "رز",
    image_url: "/img/rose-pink.webp",
    availability: "in_stock",
  },
  {
    id: 3,
    slug: "rose-white",
    name: "دسته گل رز سفید",
    description: "گل رز سفید روسی برای مناسبت‌های خاص",
    price: 450000,
    features: ["رنگ خالص", "کیفیت پریمیوم", "بدون بو"],
    category: "رز",
    image_url: "/img/rose-white.webp",
    availability: "in_stock",
  },
  {
    id: 4,
    slug: "sunflower",
    name: "دسته گل آفتابگردان",
    description: "گل آفتابگردان روسی با طراحی زیبا و رنگ زرد درخشان",
    price: 380000,
    features: ["طراحی واقع‌گرایانه", "رنگ پایدار", "سبک و انعطاف‌پذیر"],
    category: "آفتابگردان",
    image_url: "/img/sunflower.webp",
    availability: "in_stock",
  },
  {
    id: 5,
    slug: "tulip",
    name: "دسته گل لاله",
    description: "گل لاله روسی با رنگ‌های متنوع",
    price: 420000,
    features: ["رنگ‌های متنوع", "کیفیت عالی", "مناسب دکوراسیون"],
    category: "لاله",
    image_url: "/img/tulip.webp",
    availability: "in_stock",
    is_featured: true,
  },
  {
    id: 6,
    slug: "mixed-bouquet",
    name: "دسته گل ترکیبی",
    description: "ترکیبی از انواع گل‌های روسی برای هدیه",
    price: 550000,
    features: ["ترکیب هماهنگ", "رنگ‌های متنوع", "مناسب هدیه"],
    category: "ترکیبی",
    image_url: "/img/mixed.webp",
    availability: "in_stock",
    is_featured: true,
  },
];

const features = [
  {
    id: 1,
    title: "انعطاف‌پذیری بالا",
    description: "گل‌های روسی ما از مواد انعطاف‌پذیر با کیفیت ساخته شده‌اند که در برابر آسیب مقاوم هستند.",
    icon: "✨"
  },
  {
    id: 2,
    title: "رنگ‌های پایدار",
    description: "رنگ‌آمیزی با مواد مرغوب که در طول زمان تغییر رنگ نمی‌دهند.",
    icon: "🎨"
  },
  {
    id: 3,
    title: "قابل شستشو",
    description: "به راحتی با آب و صابون ملایم قابل شستشو و تمیز کردن هستند.",
    icon: "💧"
  },
  {
    id: 4,
    title: "ماندگاری بلندمدت",
    description: "برخلاف گل‌های طبیعی، این گل‌ها سال‌ها زیبایی خود را حفظ می‌کنند.",
    icon: "⏰"
  },
  {
    id: 5,
    title: "ضد حساسیت",
    description: "مناسب برای افراد حساس به گرده گل‌های طبیعی.",
    icon: "🛡️"
  },
  {
    id: 6,
    title: "کاربردهای متنوع",
    description: "مناسب برای دکوراسیون خانه، مهمانی‌ها، هدیه و مراسم‌های مختلف.",
    icon: "🏡"
  }
];

const aboutContent = {
  title: "گل‌های روسی انعطاف‌پذیر",
  subtitle: "زیبایی پایدار برای خانه شما",
  description: `گل‌های روسی انعطاف‌پذیر ما با استفاده از بهترین مواد و تکنولوژی روز تولید می‌شوند.
  این گل‌ها ترکیبی عالی از زیبایی گل‌های طبیعی و دوام محصولات مصنوعی هستند.

  با خرید گل‌های روسی، می‌توانید از زیبایی گل‌ها بدون نگرانی از پژمردگی و نگهداری پیچیده لذت ببرید.
  این محصولات به دلیل انعطاف‌پذیری، کیفیت بالا و رنگ‌های پایدار، انتخابی عالی برای دکوراسیون منزل،
  محل کار و یا هدیه دادن به عزیزان شما هستند.`,
  uses: [
    "دکوراسیون داخلی منزل و محل کار",
    "تزئین میزهای پذیرایی و اتاق خواب",
    "هدیه برای مناسبت‌های مختلف",
    "تزئین مراسم عروسی و جشن",
    "فضاسازی برای عکاسی",
    "دکوراسیون ویترین مغازه‌ها"
  ]
};

export { products, features, aboutContent };