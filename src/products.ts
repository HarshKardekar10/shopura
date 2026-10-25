
/**
 * Shopura sample product catalogue
 *
 * This is illustrative demo data, not a verified live shopping feed.
 * Prices, ratings, review counts, specifications and review themes are
 * generated for the prototype and must not be treated as verified facts.
 */

export type Category = "Electronics" | "Home Appliances";

export type ProductCategory =
  | "Laptops"
  | "Smartphones"
  | "Tablets"
  | "Monitors"
  | "Smartwatches"
  | "Headphones"
  | "Bluetooth Speakers"
  | "Air Fryers"
  | "Electric Kettles";

export type ReviewExample = {
  sentiment: "positive" | "negative";
  title: string;
  text: string;
};

export type Product = {
  id: number;
  name: string;
  brand: string;
  category: Category;
  type: ProductCategory;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  features: string[];
  pros: string[];
  cons: string[];
  specs: Record<string, string>;
  bestFor: string[];
  reviews: ReviewExample[];
  dataSource: string;
  reviewSource: string;
};

type ProductTemplate = {
  type: ProductCategory;
  category: Category;
  brand: string;
  name: string;
  basePrice: number;
  priceStep: number;
  ratingBase: number;
  image: string;
  features: string[];
  pros: string[];
  cons: string[];
  bestFor: string[];
  specOptions: Record<string, string[]>;
  positiveReviews: string[];
  negativeReviews: string[];
};

const imageUrl = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const templates: ProductTemplate[] = [
  {
    type: "Laptops",
    category: "Electronics",
    brand: "NovaTech",
    name: "Everyday Performance Laptop",
    basePrice: 42999,
    priceStep: 1250,
    ratingBase: 4.1,
    image: imageUrl("photo-1496181133206-80ce9b88a853"),
    features: [
      "Full-size keyboard",
      "High-speed solid-state storage",
      "Integrated webcam",
      "Multi-port connectivity",
      "Portable everyday design",
    ],
    pros: [
      "Suitable for common productivity tasks",
      "Portable enough for study or office use",
      "Solid-state storage supports responsive everyday use",
    ],
    cons: [
      "Performance depends on the selected configuration",
      "Integrated graphics may limit demanding gaming",
      "Battery life varies by workload and settings",
    ],
    bestFor: ["Students", "Office work", "Everyday computing"],
    specOptions: {
      Processor: ["Core i5-class", "Core i7-class", "Ryzen 5-class", "Ryzen 7-class"],
      RAM: ["8 GB", "16 GB", "16 GB", "32 GB"],
      Storage: ["256 GB SSD", "512 GB SSD", "1 TB SSD"],
      Display: ['14-inch Full HD', '15.6-inch Full HD', '16-inch 2K'],
      Graphics: ["Integrated graphics", "Integrated graphics", "Entry-level dedicated graphics"],
    },
    positiveReviews: [
      "Convenient for everyday work",
      "Keyboard feels comfortable for typing",
      "Storage makes routine tasks feel responsive",
    ],
    negativeReviews: [
      "Heavy workloads may need a more powerful configuration",
      "Battery performance varies with usage",
      "Screen quality differs between configurations",
    ],
  },
  {
    type: "Smartphones",
    category: "Electronics",
    brand: "PixelWave",
    name: "Smart Everyday Phone",
    basePrice: 14999,
    priceStep: 900,
    ratingBase: 4.0,
    image: imageUrl("photo-1511707171634-5f897ff02aa9"),
    features: [
      "Touchscreen interface",
      "Multi-camera system",
      "Wireless connectivity",
      "App-based productivity",
      "Portable design",
    ],
    pros: [
      "Convenient for communication and everyday apps",
      "Portable form factor",
      "Useful camera features for casual photography",
    ],
    cons: [
      "Camera results depend on lighting",
      "Battery life varies by usage",
      "Software support depends on the actual model",
    ],
    bestFor: ["Everyday use", "Communication", "Casual photography"],
    specOptions: {
      Display: ['6.1-inch OLED', '6.5-inch AMOLED', '6.7-inch AMOLED'],
      RAM: ["6 GB", "8 GB", "12 GB"],
      Storage: ["128 GB", "256 GB", "512 GB"],
      Battery: ["4,500 mAh", "5,000 mAh", "5,200 mAh"],
      Camera: ["50 MP main camera", "50 MP dual camera", "Multi-camera system"],
    },
    positiveReviews: [
      "Convenient size for daily use",
      "Useful camera modes",
      "Responsive interface for common apps",
    ],
    negativeReviews: [
      "Battery endurance changes with screen use",
      "Low-light photography can vary",
      "Storage needs may increase over time",
    ],
  },
  {
    type: "Tablets",
    category: "Electronics",
    brand: "TabSphere",
    name: "Portable Productivity Tablet",
    basePrice: 18999,
    priceStep: 1100,
    ratingBase: 4.1,
    image: imageUrl("photo-1544244015-0df4b3ffc6b0"),
    features: [
      "Large touch display",
      "Wireless connectivity",
      "Portable entertainment format",
      "Supports compatible productivity accessories",
      "App-based workflow",
    ],
    pros: [
      "Convenient for reading and media",
      "Lighter to carry than many laptops",
      "Touch interaction suits casual browsing",
    ],
    cons: [
      "Some workflows work better on a laptop",
      "Keyboard and stylus may cost extra",
      "App capabilities vary by operating system",
    ],
    bestFor: ["Reading", "Media consumption", "Light productivity"],
    specOptions: {
      Display: ['10.1-inch LCD', '11-inch LCD', '12.4-inch high-resolution display'],
      RAM: ["4 GB", "6 GB", "8 GB"],
      Storage: ["64 GB", "128 GB", "256 GB"],
      Connectivity: ["Wi-Fi", "Wi-Fi", "Wi-Fi and cellular option"],
      Battery: ["Up to 8 hours (illustrative)", "Up to 10 hours (illustrative)", "Up to 12 hours (illustrative)"],
    },
    positiveReviews: [
      "Comfortable for reading and streaming",
      "Easy to carry around",
      "Touchscreen is convenient for browsing",
    ],
    negativeReviews: [
      "Heavy multitasking may be limited",
      "Accessories can increase total cost",
      "Some desktop applications may not be available",
    ],
  },
  {
    type: "Monitors",
    category: "Electronics",
    brand: "ViewPoint",
    name: "ClearView Desktop Monitor",
    basePrice: 9999,
    priceStep: 850,
    ratingBase: 4.0,
    image: imageUrl("photo-1527443224154-c4a3942d3acf"),
    features: [
      "Desktop display",
      "Adjustable picture settings",
      "External display connectivity",
      "Suitable for a workstation setup",
      "Multiple viewing modes",
    ],
    pros: [
      "Provides more workspace than a small laptop display",
      "Useful for office and study setups",
      "Can improve multitasking comfort",
    ],
    cons: [
      "Stand adjustability varies by model",
      "Colour accuracy should be checked for professional work",
      "Connectivity must match the computer",
    ],
    bestFor: ["Office work", "Study", "Multi-window workflows"],
    specOptions: {
      Display: ['24-inch Full HD', '27-inch QHD', '32-inch 4K'],
      RefreshRate: ["75 Hz", "100 Hz", "144 Hz"],
      Panel: ["IPS", "IPS", "VA"],
      Connectivity: ["HDMI", "HDMI and DisplayPort", "HDMI, DisplayPort and USB-C"],
      Adjustment: ["Tilt", "Tilt and height", "Height, tilt and swivel"],
    },
    positiveReviews: [
      "Extra screen space helps multitasking",
      "Useful for home office setups",
      "Picture settings can be adjusted to preference",
    ],
    negativeReviews: [
      "Panel quality varies by model",
      "The included stand may have limited adjustment",
      "Higher resolutions require compatible hardware",
    ],
  },
  {
    type: "Smartwatches",
    category: "Electronics",
    brand: "PulseLoop",
    name: "Connected Fitness Watch",
    basePrice: 4999,
    priceStep: 500,
    ratingBase: 3.9,
    image: imageUrl("photo-1523275335684-37898b6baf30"),
    features: [
      "Wrist-worn notifications",
      "Activity tracking",
      "Watch-face customisation",
      "Wireless phone connection",
      "Everyday wearable design",
    ],
    pros: [
      "Convenient access to notifications",
      "Encourages basic activity tracking",
      "Compact alternative to checking a phone",
    ],
    cons: [
      "Tracking accuracy can vary",
      "Some features require a companion phone",
      "Battery life depends on display and sensor use",
    ],
    bestFor: ["Fitness tracking", "Notifications", "Everyday wear"],
    specOptions: {
      Display: ["1.4-inch LCD", "1.6-inch AMOLED", "1.8-inch AMOLED"],
      Battery: ["5 days (illustrative)", "7 days (illustrative)", "10 days (illustrative)"],
      WaterResistance: ["Splash resistant", "5 ATM class (verify model)", "Water resistant (verify model)"],
      Connectivity: ["Bluetooth", "Bluetooth", "Bluetooth and Wi-Fi"],
      Sensors: ["Heart-rate sensor", "Heart-rate and motion sensors", "Multiple wellness sensors"],
    },
    positiveReviews: [
      "Notifications are convenient on the wrist",
      "Activity summaries can support routine tracking",
      "Watch faces offer personalisation",
    ],
    negativeReviews: [
      "Sensor readings are estimates, not medical measurements",
      "Battery life changes with frequent tracking",
      "Compatibility depends on the connected phone",
    ],
  },
  {
    type: "Headphones",
    category: "Electronics",
    brand: "SoundNest",
    name: "Wireless Over-Ear Headphones",
    basePrice: 2999,
    priceStep: 450,
    ratingBase: 4.0,
    image: imageUrl("photo-1505740420928-5e560c06d30e"),
    features: [
      "Wireless audio playback",
      "Over-ear design",
      "Integrated controls",
      "Portable listening format",
      "Hands-free calling on compatible devices",
    ],
    pros: [
      "Convenient for music and video",
      "No cable needed for everyday wireless use",
      "Over-ear design can provide passive isolation",
    ],
    cons: [
      "Sound profile is subjective",
      "Comfort varies by fit and head shape",
      "Microphone quality depends on the environment",
    ],
    bestFor: ["Music", "Commute", "Video calls"],
    specOptions: {
      Connection: ["Bluetooth 5.0 class", "Bluetooth 5.2 class", "Bluetooth 5.3 class"],
      Battery: ["20 hours (illustrative)", "30 hours (illustrative)", "40 hours (illustrative)"],
      NoiseControl: ["Passive isolation", "Hybrid noise control", "Active noise cancellation"],
      Charging: ["USB-C", "USB-C fast charging", "USB-C fast charging"],
      Design: ["Over-ear", "Foldable over-ear", "Lightweight over-ear"],
    },
    positiveReviews: [
      "Convenient for everyday listening",
      "Wireless connection reduces cable clutter",
      "Physical controls can be easy to access",
    ],
    negativeReviews: [
      "Fit and comfort vary by user",
      "Noise cancellation performance varies",
      "Audio preferences differ between listeners",
    ],
  },
  {
    type: "Bluetooth Speakers",
    category: "Electronics",
    brand: "BeatHarbor",
    name: "Portable Bluetooth Speaker",
    basePrice: 1999,
    priceStep: 350,
    ratingBase: 4.0,
    image: imageUrl("photo-1608043152269-423dbba4e7e1"),
    features: [
      "Wireless audio streaming",
      "Portable speaker body",
      "Rechargeable battery",
      "Simple pairing workflow",
      "Compact entertainment setup",
    ],
    pros: [
      "Convenient for shared listening",
      "Portable design suits travel and home use",
      "Wireless pairing is straightforward",
    ],
    cons: [
      "Bass response depends on speaker size",
      "Maximum volume may affect sound quality",
      "Battery life depends on listening volume",
    ],
    bestFor: ["Travel", "Casual listening", "Small gatherings"],
    specOptions: {
      Output: ["5 W class", "10 W class", "20 W class"],
      Battery: ["8 hours (illustrative)", "12 hours (illustrative)", "18 hours (illustrative)"],
      WaterResistance: ["No verified rating", "Splash-resistant class", "Water-resistant class (verify model)"],
      Connectivity: ["Bluetooth", "Bluetooth and AUX", "Bluetooth and multipoint option"],
      Design: ["Compact", "Rugged portable", "Portable stereo-style"],
    },
    positiveReviews: [
      "Useful for casual listening away from a desk",
      "Wireless pairing is convenient",
      "Compact size is easy to store",
    ],
    negativeReviews: [
      "Deep bass is limited on smaller designs",
      "Loud environments can overwhelm compact speakers",
      "Battery performance varies with volume",
    ],
  },
  {
    type: "Air Fryers",
    category: "Home Appliances",
    brand: "CrispCraft",
    name: "Digital Air Fryer",
    basePrice: 4499,
    priceStep: 400,
    ratingBase: 4.1,
    image: imageUrl("photo-1585515320310-259814833e62"),
    features: [
      "Countertop cooking appliance",
      "Adjustable temperature control",
      "Timed cooking",
      "Removable cooking basket",
      "Compact kitchen footprint",
    ],
    pros: [
      "Convenient for small batches",
      "Timed cooking reduces the need for constant monitoring",
      "Removable parts can simplify cleaning",
    ],
    cons: [
      "Capacity may be limited for large families",
      "Cooking results depend on food quantity and preparation",
      "Basket and accessories require regular cleaning",
    ],
    bestFor: ["Small households", "Quick meals", "Convenient cooking"],
    specOptions: {
      Capacity: ["3.5 L", "4.5 L", "6 L"],
      Power: ["1200 W", "1400 W", "1700 W"],
      Controls: ["Manual dial", "Digital controls", "Digital presets"],
      Temperature: ["80–200°C class", "80–200°C class", "80–200°C class"],
      Cleaning: ["Removable basket", "Non-stick basket (verify coating)", "Removable dishwasher-safe parts (verify model)"],
    },
    positiveReviews: [
      "Useful for preparing small portions",
      "Timer is convenient for routine cooking",
      "Removable basket makes serving easier",
    ],
    negativeReviews: [
      "Food may need shaking or turning during cooking",
      "Basket capacity limits batch size",
      "Cleaning depends on the basket design",
    ],
  },
  {
    type: "Electric Kettles",
    category: "Home Appliances",
    brand: "BoilBright",
    name: "Rapid Boil Electric Kettle",
    basePrice: 1299,
    priceStep: 200,
    ratingBase: 4.0,
    image: imageUrl("photo-1602143407151-7111542de6e8"),
    features: [
      "Electric water heating",
      "Automatic shut-off on compatible models",
      "Easy-pour spout",
      "Kitchen countertop design",
      "Quick access to hot water",
    ],
    pros: [
      "Convenient for tea and hot drinks",
      "Simple everyday operation",
      "Compact options suit smaller kitchens",
    ],
    cons: [
      "Capacity should match household needs",
      "Limescale buildup may require descaling",
      "Safety features vary by model",
    ],
    bestFor: ["Tea and coffee", "Small kitchens", "Everyday hot water"],
    specOptions: {
      Capacity: ["1.0 L", "1.5 L", "1.8 L"],
      Power: ["1200 W", "1500 W", "1800 W"],
      Body: ["Food-contact plastic (verify model)", "Stainless steel", "Double-wall design"],
      Safety: ["Auto shut-off (verify model)", "Boil-dry protection (verify model)", "Auto shut-off and boil-dry protection (verify model)"],
      Base: ["Corded base", "360-degree base", "360-degree cordless base"],
    },
    positiveReviews: [
      "Convenient for hot drinks",
      "Simple controls suit everyday use",
      "Compact designs are easy to store",
    ],
    negativeReviews: [
      "Limescale can build up in hard-water areas",
      "Exterior temperature depends on body design",
      "Boiling time varies with capacity and power",
    ],
  },
];

const pick = <T,>(items: readonly T[], index: number): T => {
  return items[((index % items.length) + items.length) % items.length];
};

const formatVariant = (variant: number): string =>
  String(variant + 1).padStart(2, "0");

function makeProduct(
  template: ProductTemplate,
  templateIndex: number,
  variant: number,
): Product {
  const price = template.basePrice + template.priceStep * variant;
  const variantLabel = formatVariant(variant);

  const selectedFeatures = [
    pick(template.features, variant),
    pick(template.features, variant + 1),
    pick(template.features, variant + 2),
  ];

  const specs: Record<string, string> = {
    "Product type": template.type,
    Variant: `Demo model ${variantLabel}`,
    ...Object.fromEntries(
      Object.entries(template.specOptions).map(([key, options]) => [
        key,
        pick(options, variant + templateIndex),
      ]),
    ),
    "Price tier":
      price < template.basePrice * 1.5
        ? "Budget"
        : price < template.basePrice * 2.5
          ? "Mid-range"
          : "Premium demo tier",
    "Data status": "Illustrative demo data",
  };

  const rating = Math.min(
    4.9,
    Math.max(
      3.5,
      Number(
        (
          template.ratingBase +
          ((variant % 5) - 2) * 0.1
        ).toFixed(1),
      ),
    ),
  );

  const reviews: ReviewExample[] = [
    {
      sentiment: "positive",
      title: "Potential strength",
      text: pick(template.positiveReviews, variant),
    },
    {
      sentiment: "positive",
      title: "Everyday usability",
      text: pick(template.positiveReviews, variant + 1),
    },
    {
      sentiment: "negative",
      title: "Trade-off to consider",
      text: pick(template.negativeReviews, variant),
    },
  ];

  return {
    id: templateIndex * 1000 + variant + 1,
    name: `${template.name} ${variantLabel}`,
    brand: template.brand,
    category: template.category,
    type: template.type,
    price,
    image: template.image,
    rating,
    reviewCount: 35 + ((templateIndex * 31 + variant * 17) % 950),
    features: selectedFeatures,
    pros: [...template.pros],
    cons: [...template.cons],
    specs,
    bestFor: [...template.bestFor],
    reviews,
    dataSource: "Shopura illustrative sample catalogue",
    reviewSource:
      "Illustrative review themes only. These are not verified customer reviews.",
  };
}

/**
 * 25 variants per product type × 9 product types = 225 products.
 */
export const products: Product[] = templates.flatMap(
  (template, templateIndex) =>
    Array.from({ length: 25 }, (_, variant) =>
      makeProduct(template, templateIndex, variant),
    ),
);

export const categories: Category[] = [
  "Electronics",
  "Home Appliances",
];

export const productTypes: ProductCategory[] = templates.map(
  (template) => template.type,
);

export const datasetSummary = {
  totalProducts: products.length,
  productsPerCategory: 25,
  totalSubcategories: templates.length,
  categories,
  productTypes,
};

/**
 * Helpful named exports for components that need category-specific data.
 */
export const getProductsByCategory = (category: Category): Product[] =>
  products.filter((product) => product.category === category);

export const getProductsByType = (type: ProductCategory): Product[] =>
  products.filter((product) => product.type === type);

export const getProductById = (id: number): Product | undefined =>
  products.find((product) => product.id === id);
