// ============================================================================
// LIGNE PURE — single source of truth for all site content.
// Product & collection records mirror the brand's catalogue; every image is
// self-hosted under /public/images.
// ============================================================================

export type ProductOption = {
  name: string;
  values: string[];
};

export type Product = {
  slug: string;
  name: string;
  price: number;
  description: string;
  /** "Shirt" | "Pants" | "Shoes" | "LignePureCollections" */
  productType: string;
  tags: string[];
  /** LignePureCollections entries are multi-piece looks shown on /collections */
  isCollection: boolean;
  /** Editorial card shot used in grids */
  card: string;
  /** Product-detail gallery */
  gallery: string[];
  options: ProductOption[];
};

export const site = {
  brand: 'LIGNE PURE',
  tagline: 'Contemporary Fashion',
  description:
    'LIGNE PURE is an independent fashion label creating contemporary clothing and footwear for a modern, expressive wardrobe.',
  phone: '+1 751 803 6615',
  email: 'hello@lignepure.com',
  availability: { label: 'MON - FRI', hours: '09:00 - 17:00' },
  socials: [
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Facebook', href: 'https://facebook.com' },
  ],
  locale: { code: 'AL', currency: 'USD ($)', flag: '/t/elianvalen/images/flag-al.webp', label: 'AL - USD ($)' },
  copyright: [
    'All rights reserved for LIGNE PURE',
    'website and brand, Copyrights reserved',
    '\u00a9 2026',
  ],
};

export const navLinks = [
  { label: 'Shop', href: '/products' },
  { label: 'Collections', href: '/collections' },
  { label: 'Blog', href: '/blog' },
  { label: 'About us', href: '/story' },
  { label: 'Contact us', href: '/contact' },
];

export const footerColumns = [
  {
    title: 'Contact',
    items: [
      { label: site.phone, href: 'tel:+17518036615' },
      { label: site.email, href: 'mailto:hello@lignepure.com' },
    ],
  },
  {
    title: 'Availability',
    items: [
      { label: 'MON - FRI', href: null },
      { label: '09:00 - 17:00', href: null },
    ],
  },
  {
    title: 'Social',
    items: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Facebook', href: 'https://facebook.com' },
    ],
  },
  {
    title: 'Legals',
    items: [
      { label: 'Shipping & Returns', href: '/shipping' },
      { label: 'Terms & Policy', href: '/privacy' },
    ],
  },
];

export const products: Product[] = [
  {
    "slug": "nocturne-short-car-coat",
    "name": "Nocturne Coat",
    "price": 710,
    "description": "A streamlined brown car coat with a pointed collar, button closure, and clean cropped silhouette. Designed for effortless layering across seasons.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-nocturne-short-car-coat.webp",
    "gallery": [
      "/t/elianvalen/images/products/nocturne-short-car-coat-1.webp",
      "/t/elianvalen/images/products/nocturne-short-car-coat-2.webp",
      "/t/elianvalen/images/products/nocturne-short-car-coat-3.webp",
      "/t/elianvalen/images/products/nocturne-short-car-coat-4.webp",
      "/t/elianvalen/images/products/nocturne-short-car-coat-5.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Brown",
          "Navy"
        ]
      },
      {
        "name": "Size",
        "values": [
          "S",
          "M",
          "L",
          "XL"
        ]
      }
    ]
  },
  {
    "slug": "essential-heavyweight-t-shirt",
    "name": "Essential T-Shirt",
    "price": 122,
    "description": "A premium crew-neck T-shirt cut from heavyweight cotton. Its relaxed shape and substantial feel make it an elevated everyday essential.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-essential-heavyweight-t-shirt.webp",
    "gallery": [
      "/t/elianvalen/images/products/essential-heavyweight-t-shirt-1.webp",
      "/t/elianvalen/images/products/essential-heavyweight-t-shirt-2.webp",
      "/t/elianvalen/images/products/essential-heavyweight-t-shirt-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black",
          "White",
          "Gray"
        ]
      },
      {
        "name": "Fabric",
        "values": [
          "Cotton"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M"
        ]
      }
    ]
  },
  {
    "slug": "mineral-washed-t-shirt",
    "name": "Washed T-Shirt",
    "price": 139.99,
    "description": "A premium black crew-neck T-shirt cut from heavyweight cotton. Its relaxed shape and substantial feel make it an elevated everyday essential.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-mineral-washed-t-shirt.webp",
    "gallery": [
      "/t/elianvalen/images/products/mineral-washed-t-shirt-1.webp",
      "/t/elianvalen/images/products/mineral-washed-t-shirt-2.webp",
      "/t/elianvalen/images/products/mineral-washed-t-shirt-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black",
          "Gray"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "S",
          "XL"
        ]
      },
      {
        "name": "Fabric",
        "values": [
          "Cotton",
          "Silk"
        ]
      }
    ]
  },
  {
    "slug": "sienna-pea-coat",
    "name": "Sienna Pea Coat",
    "price": 778,
    "description": "A structured chestnut-black pea coat featuring broad lapels, a six-button front, and a cropped boxy fit. A distinctive statement layer with timeless tailoring.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-sienna-pea-coat.webp",
    "gallery": [
      "/t/elianvalen/images/products/sienna-pea-coat-1.webp",
      "/t/elianvalen/images/products/sienna-pea-coat-2.webp",
      "/t/elianvalen/images/products/sienna-pea-coat-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Brown",
          "Black",
          "White",
          "Beige"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "XL"
        ]
      },
      {
        "name": "Fabric",
        "values": [
          "Cotton",
          "Silk"
        ]
      }
    ]
  },
  {
    "slug": "wide-leg-trousers",
    "name": "Wide-Leg Trousers",
    "price": 285,
    "description": "High-waisted black trousers with subtle front pleats and a fluid wide-leg cut. Tailored enough for formal styling while remaining relaxed and comfortable.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-wide-leg-trousers.webp",
    "gallery": [
      "/t/elianvalen/images/products/wide-leg-trousers-1.webp",
      "/t/elianvalen/images/products/wide-leg-trousers-2.webp",
      "/t/elianvalen/images/products/wide-leg-trousers-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "XL",
          "L",
          "M"
        ]
      }
    ]
  },
  {
    "slug": "pleated-trousers",
    "name": "Pleated Trousers",
    "price": 330,
    "description": "Warm taupe trousers featuring a high waist, double front pleats, and relaxed tapered legs. A versatile tailored style for understated everyday dressing.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-pleated-trousers.webp",
    "gallery": [
      "/t/elianvalen/images/products/pleated-trousers-1.webp",
      "/t/elianvalen/images/products/pleated-trousers-2.webp",
      "/t/elianvalen/images/products/pleated-trousers-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Beige",
          "Brown"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "S"
        ]
      }
    ]
  },
  {
    "slug": "noir-wide-leg-trousers",
    "name": "Noir Trousers",
    "price": 199.99,
    "description": "High-waisted black trousers with subtle front pleats and a fluid wide-leg cut. Tailored enough for formal styling while remaining relaxed and comfortable.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-noir-wide-leg-trousers.webp",
    "gallery": [
      "/t/elianvalen/images/products/noir-wide-leg-trousers-1.webp",
      "/t/elianvalen/images/products/noir-wide-leg-trousers-2.webp",
      "/t/elianvalen/images/products/noir-wide-leg-trousers-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black",
          "White"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "S",
          "XL"
        ]
      }
    ]
  },
  {
    "slug": "slate-retro-runners",
    "name": "Slate Retro Runners",
    "price": 288,
    "description": "Low-profile gray runners combining breathable mesh with tonal suede overlays. A lightweight retro-inspired silhouette suited to modern everyday styling.",
    "productType": "Shoes",
    "tags": [
      "man",
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-slate-retro-runners.webp",
    "gallery": [
      "/t/elianvalen/images/products/slate-retro-runners-1.webp",
      "/t/elianvalen/images/products/slate-retro-runners-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Gray",
          "White",
          "Black"
        ]
      },
      {
        "name": "Shoe size",
        "values": [
          "41",
          "42",
          "43",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "umber-suede-low-tops",
    "name": "Umber Low-Tops",
    "price": 263.99,
    "description": "Crisp gray leather sneakers accented by a navy heel tab and off-white sole. A refined interpretation of the classic minimalist low-top.",
    "productType": "Shoes",
    "tags": [
      "man",
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-umber-suede-low-tops.webp",
    "gallery": [
      "/t/elianvalen/images/products/umber-suede-low-tops-1.webp",
      "/t/elianvalen/images/products/umber-suede-low-tops-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Gray",
          "Black"
        ]
      },
      {
        "name": "Shoe size",
        "values": [
          "43",
          "42",
          "41",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "suede-sneaker",
    "name": "Suede sneaker",
    "price": 388,
    "description": "Chocolate-brown suede sneakers with tonal laces and a natural gum sole. Rich texture and warm color give this understated silhouette added depth.",
    "productType": "Shoes",
    "tags": [
      "man",
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-suede-sneaker.webp",
    "gallery": [
      "/t/elianvalen/images/products/suede-sneaker-1.webp",
      "/t/elianvalen/images/products/suede-sneaker-2.webp"
    ],
    "options": [
      {
        "name": "Size",
        "values": [
          "10",
          "40",
          "38",
          "36",
          "42",
          "46",
          "44"
        ]
      },
      {
        "name": "Color",
        "values": [
          "Brown"
        ]
      }
    ]
  },
  {
    "slug": "onyx-leather-low-tops",
    "name": "Onyx Leather",
    "price": 299,
    "description": "Minimal black leather sneakers with tonal laces and a warm-white rubber sole. A clean, low-profile design made for effortless daily wear.",
    "productType": "Shoes",
    "tags": [
      "man",
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-onyx-leather-low-tops.webp",
    "gallery": [
      "/t/elianvalen/images/products/onyx-leather-low-tops-1.webp",
      "/t/elianvalen/images/products/onyx-leather-low-tops-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black",
          "Beige",
          "White"
        ]
      },
      {
        "name": "Shoe size",
        "values": [
          "44",
          "43",
          "42",
          "41",
          "38",
          "39",
          "40"
        ]
      }
    ]
  },
  {
    "slug": "straight-leg-jeans",
    "name": "Straight-Leg Jeans",
    "price": 246,
    "description": "Denim indigo jeans with a classic five-pocket construction and clean straight-leg silhouette. Finished with subtle fading for a refined, lived-in appearance.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-straight-leg-jeans.webp",
    "gallery": [
      "/t/elianvalen/images/products/straight-leg-jeans-1.webp",
      "/t/elianvalen/images/products/straight-leg-jeans-2.webp",
      "/t/elianvalen/images/products/straight-leg-jeans-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Blue",
          "White"
        ]
      },
      {
        "name": "Size",
        "values": [
          "40",
          "38",
          "36",
          "42",
          "46",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "dark-indigo-denim",
    "name": "Dark indigo Denim",
    "price": 217,
    "description": "Dark indigo jeans with a classic five-pocket construction and clean straight-leg silhouette. Finished with subtle fading for a refined, lived-in appearance.",
    "productType": "Pants",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-dark-indigo-denim.webp",
    "gallery": [
      "/t/elianvalen/images/products/dark-indigo-denim-1.webp",
      "/t/elianvalen/images/products/dark-indigo-denim-2.webp",
      "/t/elianvalen/images/products/dark-indigo-denim-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Navy",
          "Black",
          "Gray"
        ]
      },
      {
        "name": "Size",
        "values": [
          "44",
          "46",
          "42",
          "36",
          "38",
          "40"
        ]
      }
    ]
  },
  {
    "slug": "charcoal-crew-neck",
    "name": "Charcoal crew-neck",
    "price": 655,
    "description": "A charcoal crew-neck T-shirt with a softly washed finish and relaxed silhouette. Subtle tonal variation gives every piece a naturally worn character.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-charcoal-crew-neck.webp",
    "gallery": [
      "/t/elianvalen/images/products/charcoal-crew-neck-1.webp",
      "/t/elianvalen/images/products/charcoal-crew-neck-2.webp",
      "/t/elianvalen/images/products/charcoal-crew-neck-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Gray",
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "S",
          "M",
          "L"
        ]
      }
    ]
  },
  {
    "slug": "clona-t-shirt",
    "name": "Clona t-shirt",
    "price": 344,
    "description": "Relaxed heavyweight cotton T-shirt in a deep chocolate-brown finish.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-clona-t-shirt.webp",
    "gallery": [
      "/t/elianvalen/images/products/clona-t-shirt-1.webp",
      "/t/elianvalen/images/products/clona-t-shirt-2.webp",
      "/t/elianvalen/images/products/clona-t-shirt-3.webp"
    ],
    "options": [
      {
        "name": "Size",
        "values": [
          "S",
          "M",
          "L",
          "XL"
        ]
      },
      {
        "name": "Color",
        "values": [
          "Brown",
          "White",
          "Black"
        ]
      }
    ]
  },
  {
    "slug": "ash-workshirt",
    "name": "Ash Workshirt",
    "price": 0,
    "description": "Washed short-sleeve overshirt with embroidered details and a utility chest pocket.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-ash-workshirt.webp",
    "gallery": [
      "/t/elianvalen/images/products/ash-workshirt-1.webp",
      "/t/elianvalen/images/products/ash-workshirt-2.webp",
      "/t/elianvalen/images/products/ash-workshirt-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Gray"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "S",
          "XL"
        ]
      }
    ]
  },
  {
    "slug": "washed-denim",
    "name": "Washed Denim",
    "price": 112,
    "description": "Relaxed cotton shorts with an elastic waistband, drawstring, and vintage wash.",
    "productType": "Pants",
    "tags": [
      "man",
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-washed-denim.webp",
    "gallery": [
      "/t/elianvalen/images/products/washed-denim-1.webp",
      "/t/elianvalen/images/products/washed-denim-2.webp",
      "/t/elianvalen/images/products/washed-denim-3.webp"
    ],
    "options": [
      {
        "name": "Size",
        "values": [
          "42",
          "46",
          "44",
          "36",
          "38",
          "40"
        ]
      },
      {
        "name": "Color",
        "values": [
          "Blue"
        ]
      }
    ]
  },
  {
    "slug": "patch-denim",
    "name": "Patch Denim",
    "price": 188,
    "description": "Light-wash denim shorts with distressed detailing and embroidered patches.",
    "productType": "Pants",
    "tags": [
      "man",
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-patch-denim.webp",
    "gallery": [
      "/t/elianvalen/images/products/patch-denim-1.webp",
      "/t/elianvalen/images/products/patch-denim-2.webp",
      "/t/elianvalen/images/products/patch-denim-3.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Brown"
        ]
      },
      {
        "name": "Size",
        "values": [
          "36",
          "38",
          "42"
        ]
      }
    ]
  },
  {
    "slug": "brown-head",
    "name": "Chocolate pants SW",
    "price": 277.99,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/brown-head-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/brown-head-1.webp",
      "/t/elianvalen/images/products/brown-head-2.webp"
    ],
    "options": [
      {
        "name": "Size",
        "values": [
          "46",
          "42",
          "36"
        ]
      },
      {
        "name": "Color",
        "values": [
          "Brown"
        ]
      }
    ]
  },
  {
    "slug": "brownie-jacket",
    "name": "Brownie Jacket",
    "price": 665,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/brownie-jacket-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/brownie-jacket-1.webp",
      "/t/elianvalen/images/products/brownie-jacket-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Brown"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "S"
        ]
      }
    ]
  },
  {
    "slug": "brown-sw",
    "name": "Brown SW 2026",
    "price": 942.99,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-brown-sw.webp",
    "gallery": [
      "/t/elianvalen/images/products/brown-sw-1.webp",
      "/t/elianvalen/images/products/brown-sw-2.webp",
      "/t/elianvalen/images/products/brown-sw-3.webp",
      "/t/elianvalen/images/products/brown-sw-4.webp",
      "/t/elianvalen/images/products/brown-sw-5.webp",
      "/t/elianvalen/images/products/brown-sw-6.webp"
    ],
    "options": [
      {
        "name": "Brownie Jacket (Size)",
        "values": [
          "L",
          "M",
          "S"
        ]
      },
      {
        "name": "Chocolate pants SW (Size)",
        "values": [
          "46",
          "42",
          "36"
        ]
      }
    ]
  },
  {
    "slug": "wide-leg-el-2026",
    "name": "Wide leg EL 2026",
    "price": 122,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/wide-leg-el-2026-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/wide-leg-el-2026-1.webp",
      "/t/elianvalen/images/products/wide-leg-el-2026-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "46",
          "42",
          "36",
          "38",
          "40",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "coat-eli-2026",
    "name": "Coat ELI 2026",
    "price": 1229,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/coat-eli-2026-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/coat-eli-2026-1.webp",
      "/t/elianvalen/images/products/coat-eli-2026-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "XL",
          "M"
        ]
      }
    ]
  },
  {
    "slug": "eli-2026",
    "name": "ELI 2026",
    "price": 13510,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "woman"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-eli-2026.webp",
    "gallery": [
      "/t/elianvalen/images/products/eli-2026-1.webp",
      "/t/elianvalen/images/products/eli-2026-2.webp",
      "/t/elianvalen/images/products/eli-2026-3.webp",
      "/t/elianvalen/images/products/eli-2026-4.webp",
      "/t/elianvalen/images/products/eli-2026-5.webp",
      "/t/elianvalen/images/products/eli-2026-6.webp"
    ],
    "options": [
      {
        "name": "Coat ELI 2026 (Size)",
        "values": [
          "L",
          "XL",
          "M"
        ]
      },
      {
        "name": "Wide leg EL 2026 (Size)",
        "values": [
          "46",
          "42",
          "36",
          "38",
          "40",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "indigo-2026",
    "name": "Indigo 2026",
    "price": 221,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/indigo-2026-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/indigo-2026-1.webp",
      "/t/elianvalen/images/products/indigo-2026-2.webp"
    ],
    "options": [
      {
        "name": "Size",
        "values": [
          "36",
          "42",
          "46",
          "44"
        ]
      },
      {
        "name": "Color",
        "values": [
          "Navy"
        ]
      }
    ]
  },
  {
    "slug": "sleeveless-indigo-2026",
    "name": "Sleeveless Indigo 2026",
    "price": 772,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/sleeveless-indigo-2026-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/sleeveless-indigo-2026-1.webp",
      "/t/elianvalen/images/products/sleeveless-indigo-2026-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Beige"
        ]
      },
      {
        "name": "Size",
        "values": [
          "S",
          "M",
          "L",
          "XL"
        ]
      }
    ]
  },
  {
    "slug": "indigo-2027",
    "name": "Indigo 2026",
    "price": 993,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "woman"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-indigo-2027.webp",
    "gallery": [
      "/t/elianvalen/images/products/indigo-2027-1.webp",
      "/t/elianvalen/images/products/indigo-2027-2.webp",
      "/t/elianvalen/images/products/indigo-2027-3.webp",
      "/t/elianvalen/images/products/indigo-2027-4.webp",
      "/t/elianvalen/images/products/indigo-2027-5.webp",
      "/t/elianvalen/images/products/indigo-2027-6.webp"
    ],
    "options": [
      {
        "name": "Indigo 2026 (Size)",
        "values": [
          "36",
          "42",
          "46",
          "44"
        ]
      },
      {
        "name": "Sleeveless Indigo 2026 (Size)",
        "values": [
          "S",
          "M",
          "L",
          "XL"
        ]
      }
    ]
  },
  {
    "slug": "baloon-pants",
    "name": "Baloon pants",
    "price": 332,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/baloon-pants-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/baloon-pants-1.webp",
      "/t/elianvalen/images/products/baloon-pants-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Beige"
        ]
      },
      {
        "name": "Size",
        "values": [
          "46",
          "42",
          "36"
        ]
      }
    ]
  },
  {
    "slug": "ivo-jacket",
    "name": "Ivo Jacket",
    "price": 555,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "woman"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/ivo-jacket-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/ivo-jacket-1.webp",
      "/t/elianvalen/images/products/ivo-jacket-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Beige"
        ]
      },
      {
        "name": "Size",
        "values": [
          "L",
          "M",
          "S"
        ]
      }
    ]
  },
  {
    "slug": "ivo-2026",
    "name": "Ivo 2026",
    "price": 887,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "woman"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-ivo-2026.webp",
    "gallery": [
      "/t/elianvalen/images/products/ivo-2026-1.webp",
      "/t/elianvalen/images/products/ivo-2026-2.webp",
      "/t/elianvalen/images/products/ivo-2026-3.webp",
      "/t/elianvalen/images/products/ivo-2026-4.webp",
      "/t/elianvalen/images/products/ivo-2026-5.webp",
      "/t/elianvalen/images/products/ivo-2026-6.webp"
    ],
    "options": [
      {
        "name": "Baloon pants (Size)",
        "values": [
          "46",
          "42",
          "36"
        ]
      },
      {
        "name": "Ivo Jacket (Size)",
        "values": [
          "L",
          "M",
          "S"
        ]
      }
    ]
  },
  {
    "slug": "kiot-pants",
    "name": "Kiot pants",
    "price": 332,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-kiot-pants.webp",
    "gallery": [
      "/t/elianvalen/images/products/kiot-pants-1.webp",
      "/t/elianvalen/images/products/kiot-pants-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black",
          "Gray",
          "White"
        ]
      },
      {
        "name": "Size",
        "values": [
          "42",
          "46",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "kiot-jacket",
    "name": "Kiot jacket",
    "price": 677,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-kiot-jacket.webp",
    "gallery": [
      "/t/elianvalen/images/products/kiot-jacket-1.webp",
      "/t/elianvalen/images/products/kiot-jacket-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black",
          "Gray",
          "Navy"
        ]
      },
      {
        "name": "Size",
        "values": [
          "S",
          "M",
          "L",
          "XL"
        ]
      }
    ]
  },
  {
    "slug": "kiot-2026",
    "name": "Kiot 2026",
    "price": 1009,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "man"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-kiot-2026.webp",
    "gallery": [
      "/t/elianvalen/images/products/kiot-2026-1.webp",
      "/t/elianvalen/images/products/kiot-2026-2.webp",
      "/t/elianvalen/images/products/kiot-2026-3.webp",
      "/t/elianvalen/images/products/kiot-2026-4.webp",
      "/t/elianvalen/images/products/kiot-2026-5.webp",
      "/t/elianvalen/images/products/kiot-2026-6.webp"
    ],
    "options": [
      {
        "name": "Kiot jacket (Size)",
        "values": [
          "S",
          "M",
          "L",
          "XL"
        ]
      },
      {
        "name": "Kiot pants (Size)",
        "values": [
          "42",
          "46",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "old-money-ss1",
    "name": "Old money SS1",
    "price": 211,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-old-money-ss1.webp",
    "gallery": [
      "/t/elianvalen/images/products/old-money-ss1-1.webp",
      "/t/elianvalen/images/products/old-money-ss1-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Beige"
        ]
      },
      {
        "name": "Size",
        "values": [
          "38",
          "36",
          "40",
          "42"
        ]
      }
    ]
  },
  {
    "slug": "ss1-jacket",
    "name": "SS1 Jacket",
    "price": 667,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-ss1-jacket.webp",
    "gallery": [
      "/t/elianvalen/images/products/ss1-jacket-1.webp",
      "/t/elianvalen/images/products/ss1-jacket-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Brown"
        ]
      },
      {
        "name": "Size",
        "values": [
          "XL",
          "L",
          "M"
        ]
      }
    ]
  },
  {
    "slug": "ss1-2026",
    "name": "SS1 2026",
    "price": 878,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "man"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-ss1-2026.webp",
    "gallery": [
      "/t/elianvalen/images/products/ss1-2026-1.webp",
      "/t/elianvalen/images/products/ss1-2026-2.webp",
      "/t/elianvalen/images/products/ss1-2026-3.webp",
      "/t/elianvalen/images/products/ss1-2026-4.webp",
      "/t/elianvalen/images/products/ss1-2026-5.webp",
      "/t/elianvalen/images/products/ss1-2026-6.webp"
    ],
    "options": [
      {
        "name": "Old money SS1 (Size)",
        "values": [
          "38",
          "36",
          "40",
          "42"
        ]
      },
      {
        "name": "SS1 Jacket (Size)",
        "values": [
          "XL",
          "L",
          "M"
        ]
      }
    ]
  },
  {
    "slug": "zara-pants",
    "name": "Zara pants",
    "price": 221,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-zara-pants.webp",
    "gallery": [
      "/t/elianvalen/images/products/zara-pants-1.webp",
      "/t/elianvalen/images/products/zara-pants-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "46",
          "42",
          "36",
          "38"
        ]
      }
    ]
  },
  {
    "slug": "zara-jackets",
    "name": "Zara jackets",
    "price": 655,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-zara-jackets.webp",
    "gallery": [
      "/t/elianvalen/images/products/zara-jackets-1.webp",
      "/t/elianvalen/images/products/zara-jackets-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "S",
          "M",
          "L"
        ]
      }
    ]
  },
  {
    "slug": "zara-2026",
    "name": "Zara 2026",
    "price": 876,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "man"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-zara-2026.webp",
    "gallery": [
      "/t/elianvalen/images/products/zara-2026-1.webp",
      "/t/elianvalen/images/products/zara-2026-2.webp",
      "/t/elianvalen/images/products/zara-2026-3.webp",
      "/t/elianvalen/images/products/zara-2026-4.webp",
      "/t/elianvalen/images/products/zara-2026-5.webp",
      "/t/elianvalen/images/products/zara-2026-6.webp"
    ],
    "options": [
      {
        "name": "Zara jackets (Size)",
        "values": [
          "S",
          "M",
          "L"
        ]
      },
      {
        "name": "Zara pants (Size)",
        "values": [
          "46",
          "42",
          "36",
          "38"
        ]
      }
    ]
  },
  {
    "slug": "chito-pants",
    "name": "Chito pants",
    "price": 332,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-chito-pants.webp",
    "gallery": [
      "/t/elianvalen/images/products/chito-pants-1.webp",
      "/t/elianvalen/images/products/chito-pants-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "36",
          "44",
          "46",
          "42"
        ]
      }
    ]
  },
  {
    "slug": "chito-jacket",
    "name": "Chito jacket",
    "price": 445,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "man"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/card-chito-jacket.webp",
    "gallery": [
      "/t/elianvalen/images/products/chito-jacket-1.webp",
      "/t/elianvalen/images/products/chito-jacket-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Gray"
        ]
      },
      {
        "name": "Size",
        "values": [
          "XL",
          "L",
          "M"
        ]
      }
    ]
  },
  {
    "slug": "chito-2026",
    "name": "Chito 2026",
    "price": 777,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "man"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-chito-2026.webp",
    "gallery": [
      "/t/elianvalen/images/products/chito-2026-1.webp",
      "/t/elianvalen/images/products/chito-2026-2.webp",
      "/t/elianvalen/images/products/chito-2026-3.webp",
      "/t/elianvalen/images/products/chito-2026-4.webp",
      "/t/elianvalen/images/products/chito-2026-5.webp",
      "/t/elianvalen/images/products/chito-2026-6.webp"
    ],
    "options": [
      {
        "name": "Chito jacket (Size)",
        "values": [
          "XL",
          "L",
          "M"
        ]
      },
      {
        "name": "Chito pants (Size)",
        "values": [
          "36",
          "44",
          "46",
          "42"
        ]
      }
    ]
  },
  {
    "slug": "beige-polo",
    "name": "Beige Polo",
    "price": 334,
    "description": "Designed with a refined silhouette and effortless versatility for everyday styling.An essential layering piece that brings a polished finish to any look.",
    "productType": "Shirt",
    "tags": [
      "man",
      "PopularSpothlight"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/beige-polo-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/beige-polo-1.webp",
      "/t/elianvalen/images/products/beige-polo-2.webp"
    ],
    "options": [
      {
        "name": "Size",
        "values": [
          "S",
          "L",
          "XL"
        ]
      },
      {
        "name": "Color",
        "values": [
          "Beige"
        ]
      }
    ]
  },
  {
    "slug": "polo-pants",
    "name": "Polo pants",
    "price": 332,
    "description": "Designed for everyday comfort with a clean, versatile fit that’s easy to style.A wardrobe essential made to take you effortlessly from casual days to elevated looks.",
    "productType": "Pants",
    "tags": [
      "man",
      "PopularSpothlight"
    ],
    "isCollection": false,
    "card": "/t/elianvalen/images/products/polo-pants-1.webp",
    "gallery": [
      "/t/elianvalen/images/products/polo-pants-1.webp",
      "/t/elianvalen/images/products/polo-pants-2.webp"
    ],
    "options": [
      {
        "name": "Color",
        "values": [
          "Black"
        ]
      },
      {
        "name": "Size",
        "values": [
          "38",
          "42",
          "46",
          "44"
        ]
      }
    ]
  },
  {
    "slug": "polo-style",
    "name": "Polo style",
    "price": 666,
    "description": "A curated collection of timeless essentials designed with versatility and effortless style in mind.Made to elevate your everyday wardrobe with pieces that feel refined, modern, and easy to wear.",
    "productType": "LignePureCollections",
    "tags": [
      "man"
    ],
    "isCollection": true,
    "card": "/t/elianvalen/images/card-polo-style.webp",
    "gallery": [
      "/t/elianvalen/images/products/polo-style-1.webp",
      "/t/elianvalen/images/products/polo-style-2.webp",
      "/t/elianvalen/images/products/polo-style-3.webp",
      "/t/elianvalen/images/products/polo-style-4.webp",
      "/t/elianvalen/images/products/polo-style-5.webp"
    ],
    "options": [
      {
        "name": "Beige Polo (Size)",
        "values": [
          "S",
          "L",
          "XL"
        ]
      },
      {
        "name": "Polo pants (Size)",
        "values": [
          "38",
          "42",
          "46",
          "44"
        ]
      }
    ]
  }
];

export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

/** Slugs listed on /products, in the order the shop page shows them. */
export const shopOrder = [
  'dark-indigo-denim',
  'washed-denim',
  'patch-denim',
  'kiot-pants',
  'old-money-ss1',
  'zara-pants',
  'chito-pants',
  'nocturne-short-car-coat',
  'essential-heavyweight-t-shirt',
  'mineral-washed-t-shirt',
  'sienna-pea-coat',
  'charcoal-crew-neck',
  'clona-t-shirt',
  'ash-workshirt',
  'kiot-jacket',
  'ss1-jacket',
  'zara-jackets',
  'chito-jacket',
  'slate-retro-runners',
  'umber-suede-low-tops',
  'suede-sneaker',
  'onyx-leather-low-tops',
];

/** Slugs listed on /collections, in order. */
export const collectionOrder = [
  'brown-sw',
  'eli-2026',
  'indigo-2027',
  'ivo-2026',
  'kiot-2026',
  'ss1-2026',
  'zara-2026',
  'chito-2026',
  'polo-style',
];

export const shopProducts = shopOrder
  .map((s) => productBySlug(s))
  .filter((p): p is Product => Boolean(p));

export const collectionProducts = collectionOrder
  .map((s) => productBySlug(s))
  .filter((p): p is Product => Boolean(p));

export const shopFilters = [
  { label: 'All', test: () => true },
  { label: 'Shirts', test: (p: Product) => p.productType === 'Shirt' },
  { label: 'Pants', test: (p: Product) => p.productType === 'Pants' },
  { label: 'Shoes', test: (p: Product) => p.productType === 'Shoes' },
  { label: 'Man', test: (p: Product) => p.tags.includes('man') },
  { label: 'Woman', test: (p: Product) => p.tags.includes('woman') },
];

export const collectionFilters = ['All', 'Man', 'Women'] as const;

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export const home = {
  hero: {
    heading: 'LIGNE PURE New Collections 2026\u00a9',
    cta: { label: 'Explore Collections', href: '/collections' },
    blurb: 'LIGNE PURE is a fashion company made in the heart of london.',
    image: '/t/elianvalen/images/hero-campaign-black-outerwear.webp',
    imageAlt: 'LIGNE PURE campaign featuring two models in black outerwear',
    wordmark: 'LIGNE PURE',
  },
  intro: {
    heading: ['Our products and collections'],
    blurb: "fashion pieces from the \u201880s.",
    cta: { label: 'Discover Products', href: '/products' },
    images: [
      { src: '/t/elianvalen/images/collection-polo-jackets.webp', alt: 'Polo Jackets collection image' },
      { src: '/t/elianvalen/images/collection-basic-shirts.webp', alt: 'Basic Shirts collection image' },
    ],
  },
  popularCollection: {
    heading: ['Popular Collection', 'sw winter (4)'],
    blurb:
      'Complete the look with complementary pieces designed to work together across seasons.',
    cta: { label: 'More informations', href: '/products/polo-style' },
    image: '/t/elianvalen/images/lookbook-beige-ribbed-polo.webp',
    imageAlt: 'Model wearing a beige ribbed polo with black tailored trousers',
  },
  popularProducts: {
    heading: ['Popular products', 'LIGNE PURE (6)'],
    blurb:
      'Discover clothing and footwear selected for everyday versatility, considered details, and effortless styling.',
    cta: { label: 'See More', href: '/products' },
    slugs: [
      'straight-leg-jeans',
      'dark-indigo-denim',
      'sienna-pea-coat',
      'charcoal-crew-neck',
      'umber-suede-low-tops',
      'onyx-leather-low-tops',
    ],
  },
  showcase: [
    {
      slugs: [
        'nocturne-short-car-coat',
        'essential-heavyweight-t-shirt',
        'mineral-washed-t-shirt',
        'sienna-pea-coat',
      ],
      banner: {
        src: '/t/elianvalen/images/lookbook-brown-jacket-studio.webp',
        alt: 'Model wearing a brown jacket with black trousers in a minimalist studio',
        align: 'right' as const,
      },
    },
    {
      slugs: [
        'wide-leg-trousers',
        'pleated-trousers',
        'noir-wide-leg-trousers',
        'straight-leg-jeans',
      ],
      banner: {
        src: '/t/elianvalen/images/lookbook-pale-gray-overshirt.webp',
        alt: 'Model seated in a pale-gray overshirt and matching wide-leg trousers',
        align: 'left' as const,
      },
    },
    {
      slugs: [
        'slate-retro-runners',
        'umber-suede-low-tops',
        'suede-sneaker',
        'onyx-leather-low-tops',
      ],
      banner: null,
    },
  ],
};

/** The paired Men's / Women's split banner reused across pages. */
export const genderBanners = [
  {
    title: "Men\u2019s 2026 Collection",
    productsTitle: "Men\u2019s 2026 Products",
    cta: 'Discover more',
    href: '/collections?category=man',
    image: '/t/elianvalen/images/collection-mens-2026.webp',
    alt: "Men\u2019s 2026 Collection campaign image",
  },
  {
    title: "Women's 2026 Collection",
    productsTitle: "Women's 2026 Products",
    cta: 'Discover more',
    href: '/collections?category=woman',
    image: '/t/elianvalen/images/collection-womens-2026.webp',
    alt: "Women\u2019s 2026 Collection campaign image",
  },
];

export const shippingRules = {
  heading: ['Shipping rules', 'how you get the product.'],
  points: [
    'Orders are prepared carefully and dispatched with tracking so you can follow every delivery.',
    'Delivery times vary by destination, with clear estimates provided before checkout.',
    'Returns are accepted within 30 days when items are unworn and returned in their original condition.',
  ],
  cta: { label: 'Discover privacy', href: '/privacy' },
};

export const contactTeaser = {
  heading: ['Contact us', 'how you can'],
  blurb: 'Questions about an order, product, or collaboration? Our team is ready to help.',
  cta: { label: 'Contact us', href: '/contact' },
};

export const curatedBand = {
  lines: ['Curated fasion products', 'from london'],
};

/** The three campaign cards that close most pages. */
export const campaignCards = [
  { title: 'ELI 2026', href: '/products/eli-2026', image: '/t/elianvalen/images/campaign-seasonal.webp', alt: 'LIGNE PURE seasonal fashion campaign image' },
  { title: 'Kiot 2026', href: '/products/kiot-2026', image: '/t/elianvalen/images/campaign-modern.webp', alt: 'LIGNE PURE modern fashion campaign image' },
  { title: 'Chito 2026', href: '/products/chito-2026', image: '/t/elianvalen/images/campaign-footwear.webp', alt: 'LIGNE PURE footwear campaign image' },
];

// ---------------------------------------------------------------------------
// Route-level page content
// ---------------------------------------------------------------------------

export const shopPage = {
  title: 'Shop',
  heading: ['LIGNE PURE', '2026 New Products'],
  cta: { label: 'Discover Collections', href: '/collections' },
};

export const collectionsPage = {
  title: 'Collections',
  hero: {
    image: '/t/elianvalen/images/collections-hero.webp',
    alt: 'LIGNE PURE 2026 collections campaign image',
    heading: ['EV(2) 2026', 'Collections Products'],
    blurb:
      'Explore the LIGNE PURE 2026 collections, bringing together modern silhouettes, versatile layers, and expressive details.',
  },
  heading: ['LIGNE PURE', '2026 New Collections'],
  cta: { label: 'Discover Products', href: '/products' },
};

export const productFaq = [
  {
    q: 'How do returns work?',
    a: 'You can return unused items within 30 days for a full refund; refunds issued within 7 days after we receive the return.',
  },
  {
    q: 'When will I get my order?',
    a: 'Domestic delivery: 3\u20137 business days; international: 7\u201321 business days (depending on destination).',
  },
  {
    q: 'Do you ship worldwide?',
    a: 'Yes \u2014 we ship to most countries; international orders may incur duties and taxes at delivery.',
  },
];

export const relatedSection = {
  heading: ['Related products', 'to your choice'],
  blurb:
    'Discover more pieces selected to complement this product and complete the LIGNE PURE look.',
  cta: { label: 'See More', href: '/products' },
};

export type BlogPost = {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  featured: boolean;
  intro?: string;
  sections: { heading: string; level: 2 | 3; body: string }[];
};

export const blogPage = {
  eyebrow: 'LIGNE PURE JOURNAL',
  heading: 'Notes on what we wear and why it lasts.',
  blurb:
    'A quieter look at clothing, care, construction, and the decisions that shape a lasting wardrobe.',
  latestHeading: 'Latest stories',
  latestEyebrow: 'CARE \u00b7 STYLE \u00b7 PROCESS',
};

export const blogPosts: BlogPost[] = [
  {
    slug: 'quiet-architecture-of-a-wardrobe',
    category: 'Perspective',
    readTime: '5 min read',
    title: 'The Quiet Architecture of a Wardrobe',
    excerpt:
      'A considered approach to building a wardrobe where proportion, texture, and restraint do the lasting work.',
    image: '/t/elianvalen/images/journal-quiet-architecture.webp',
    imageAlt:
      'Tailored black trousers and a folded white shirt in a cool gray architectural studio',
    featured: true,
    intro:
      'A wardrobe becomes useful when every piece has a clear purpose. Begin with proportion: the relationship between a trouser, a shirt, and the space around the body. When those decisions feel resolved, dressing becomes quieter and more instinctive.',
    sections: [
      {
        heading: 'Build Around Proportion',
        level: 2,
        body: 'Start with a small group of silhouettes that work together. A longer coat asks for a different trouser volume than a cropped jacket; a softer knit changes the balance again. Think of the wardrobe as a set of relationships, not a list of isolated objects.',
      },
      {
        heading: 'Let Materials Carry the Mood',
        level: 3,
        body: 'When the palette is restrained, texture becomes expressive. Crisp cotton, dense wool, brushed knits, and washed denim can create contrast without noise. The result is a wardrobe that feels coherent while still changing with the season and the person wearing it.',
      },
    ],
  },
  {
    slug: 'how-to-make-clothes-last',
    category: 'Care',
    readTime: '4 min read',
    title: 'How to Make Clothes Last',
    excerpt:
      'Small rituals for washing, resting, storing, and repairing the pieces you return to most.',
    image: '/t/elianvalen/images/journal-clothes-last.webp',
    imageAlt: 'Folded monochrome garments arranged with care',
    featured: false,
    sections: [
      {
        heading: 'Wash Less, Wash Better',
        level: 2,
        body: 'Use cool water, a gentle cycle, and a small amount of mild detergent. Turn dark pieces inside out and separate rough hardware from delicate surfaces. Heat causes more stress than most people realize, so air-drying is usually the quieter and safer choice.',
      },
      {
        heading: 'Storage Is Part of Care',
        level: 3,
        body: 'Fold heavy knits so their shoulders keep their shape, hang structured pieces with room to breathe, and keep everything away from direct light. Repair loose buttons and small seams early. Care works best as a series of small actions, not a rescue after damage has settled in.',
      },
    ],
  },
  {
    slug: 'a-study-in-monochrome',
    category: 'Style Notes',
    readTime: '3 min read',
    title: 'A Study in Monochrome',
    excerpt: 'Why a limited palette makes silhouette, material, and movement easier to see.',
    image: '/t/elianvalen/images/journal-monochrome.webp',
    imageAlt: 'Minimal white and gray composition',
    featured: false,
    sections: [
      {
        heading: 'Contrast Without Color',
        level: 2,
        body: 'Pair matte surfaces with a subtle sheen, soft layers with tailored edges, and pale gray with deep black. These shifts create depth while keeping the whole look calm. Monochrome succeeds when the materials are allowed to disagree slightly.',
      },
      {
        heading: 'Shape Becomes the Statement',
        level: 3,
        body: 'A reduced palette makes proportion immediate. A wide leg, a dropped shoulder, or an elongated hem reads clearly because nothing competes with it. That clarity leaves more room for personal gesture: a rolled cuff, an open collar, or a single precise accessory.',
      },
    ],
  },
  {
    slug: 'from-studio-to-doorstep',
    category: 'Behind the Scenes',
    readTime: '4 min read',
    title: 'From Studio to Doorstep',
    excerpt:
      'Inside the considered packing process that protects each piece without unnecessary excess.',
    image: '/t/elianvalen/images/journal-studio-to-doorstep.webp',
    imageAlt: 'A carefully packed fashion order in white and gray materials',
    featured: false,
    sections: [
      {
        heading: 'Protection With Less Waste',
        level: 2,
        body: 'Each order is folded to reduce creasing, wrapped in clean recyclable paper, and placed in a right-sized outer box. Fewer layers mean less waste, but every layer still has a clear job: protecting the surface, holding the shape, or keeping the parcel secure in transit.',
      },
      {
        heading: 'A Final Human Check',
        level: 3,
        body: 'Before sealing, the garment, size, finish, and delivery details are checked by hand. The package should arrive feeling composed rather than overworked\u2014a simple continuation of the same decisions that shaped the piece inside.',
      },
    ],
  },
];

export const storyPage = {
  title: 'Our Story',
  heading: 'We stand on inovation',
  paragraphs: [
    'The customer is at the heart of our unique business model, which includes design, production, distribution, and sales, through our extensive retail network. LIGNE PURE is an independent fashion label creating contemporary clothing and footwear for a modern, expressive wardrobe.',
    'LIGNE PURE is focused on refined silhouettes, thoughtful details, and versatile pieces made to move between seasons.',
    'The collection is an evolving composition of seasonless, gender-neutral black clothing. Pieces have no external, internal or applied elements pointing any specific sex, age or status.',
    'It is about thoughtful design, highlighting the relevant to create effortless meaningful wardrobe. Collection is made of sustainable premium materials, manufactured with responsible producers in Europe.',
    'The LIGNE PURE point of view begins with confidence, individuality, and the freedom to dress on your own terms.',
  ],
  images: [
    { src: '/t/elianvalen/images/story-detail.webp', alt: 'LIGNE PURE garment detail' },
    { src: '/t/elianvalen/images/story-portrait.webp', alt: 'LIGNE PURE studio portrait' },
  ],
};

export const contactPage = {
  title: 'Contact',
  blocks: [
    {
      title: 'Contact',
      lines: [
        { text: '+81 75 803 6615', href: 'tel:+817580366155' },
        { text: 'hello@lignepure.com', href: 'mailto:hello@lignepure.com' },
      ],
    },
    {
      title: 'Office',
      lines: [
        { text: '31 Rue de Longchamp,', href: null },
        { text: '75116 Paris, France', href: null },
      ],
    },
    {
      title: 'Press',
      lines: [{ text: 'press@lignepure.com', href: 'mailto:press@lignepure.com' }],
    },
    {
      title: 'Opportunities',
      lines: [
        { text: 'applications@lignepure.com', href: 'mailto:applications@lignepure.com' },
      ],
    },
    {
      title: 'Sales enquiries',
      lines: [{ text: 'sales@lignepure.com', href: 'mailto:sales@lignepure.com' }],
    },
  ],
  images: [
    { src: '/t/elianvalen/images/contact-detail.webp', alt: 'LIGNE PURE garment detail' },
    { src: '/t/elianvalen/images/contact-portrait.webp', alt: 'LIGNE PURE campaign portrait' },
  ],
  form: {
    heading: 'Send us a message',
    blurb:
      'Tell us what you need and we will reply from hello@lignepure.com within one business day.',
    submit: 'Send message',
  },
};

export const shippingPage = {
  title: 'Shipping & Delivery',
  heading: 'Shipping, handled with care',
  paragraphs: [
    'Every LIGNE PURE order is prepared with care and packed to protect your pieces throughout their journey. Available delivery methods and estimated arrival times are shown at checkout for your destination.',
    'Once your order leaves us, you\u2019ll receive a shipping confirmation with tracking details so you can follow its progress.',
    'Delivery estimates begin after dispatch and may vary during busy periods or while a parcel passes through customs.',
    'Please review your delivery address before placing an order. If something needs to change, contact us as soon as possible.',
    'If your parcel arrives damaged or has not moved for an unusual amount of time, contact us with your order number and we\u2019ll help with the next steps.',
  ],
  images: [
    { src: '/t/elianvalen/images/journal-studio-to-doorstep.webp', alt: 'A carefully packed LIGNE PURE order' },
    { src: '/t/elianvalen/images/journal-monochrome.webp', alt: 'Minimal white and gray composition' },
  ],
};

export const privacyPage = {
  title: 'Privacy Policy',
  breadcrumb: [
    { label: 'Home', href: '/' },
    { label: 'Privacy Policy', href: null },
  ],
  intro:
    'At LIGNE PURE, we respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and protect your information.',
  sections: [
    {
      heading: '1. Information We Collect:',
      items: [
        'Personal information (name, email, address, phone number, etc.)',
        'Payment details (processed securely via third-party services)',
        'Usage data (cookies, IP address, device information)',
      ],
      body: null,
    },
    {
      heading: '2. How We Use Your Data:',
      items: [
        'To process and deliver your orders',
        'To improve our website and services',
        'For customer support and communication',
        'To comply with legal obligations',
      ],
      body: null,
    },
    {
      heading: '3. Data Protection:',
      items: [],
      body: 'We implement security measures to safeguard your information, but no method of transmission is 100% secure. You are responsible for maintaining the confidentiality of your account details.',
    },
    {
      heading: '4. Your Rights:',
      items: [
        'Request access, correction, or deletion of your data',
        'Opt-out of marketing communications',
        'Manage cookie preferences',
      ],
      body: null,
    },
  ],
  outro: 'For any privacy-related inquiries, contact us at hello@lignepure.com.',
};

export const newsletter = {
  placeholder: 'jane@lignepure.com',
  success: 'Thank you \u2014 you are on the list.',
};

export const formatPrice = (value: number) =>
  '$' +
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
