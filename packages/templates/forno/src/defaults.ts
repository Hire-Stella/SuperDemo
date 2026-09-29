// lib/data.ts
// Single source of truth for all copy/content on the Forno landing page.
//
// Ported from a literal Framer HTML/CSS mirror of "Pepper" — a free Framer
// restaurant template by Cristian Mielu (marketplace handle behind
// UIhub.design) — rebranded here from "Pepper" to the fictional pizzeria
// name "Forno" ("oven", Italian) in the source mirror. Three source routes
// (home, full menu, contact) are condensed into the sections this one-page
// contract renders.

// ---------------------------------------------------------------------------
// Known template fingerprints
// ---------------------------------------------------------------------------

/**
 * Original template credit. The source site's footer reads "made by
 * UIhub.design" on every page, and the Framer marketplace listing itself
 * credits the creator handle "Cristian Mielu" — the same person: the
 * footer's social row links to instagram.com/uxuicristian and
 * x.com/CristianMielu.
 */
export const TEMPLATE_CREDIT = 'Cristian Mielu (UIhub.design)';

/**
 * The source's own footer "Social" row links to the *template author's*
 * personal Instagram/X accounts (instagram.com/uxuicristian,
 * x.com/CristianMielu) and to unrelated stock accounts (a generic
 * TripAdvisor root, the Framer YouTube channel) — not the fictional
 * restaurant's. Same situation the tavola port flagged: those are
 * intentionally not reused here. These are bare, unconfigured placeholders
 * for the fictional Forno brand instead.
 */
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/',
  tripadvisor: 'https://www.tripadvisor.com/',
  youtube: 'https://www.youtube.com/',
  x: 'https://x.com/',
};

// ---------------------------------------------------------------------------
// Brand / nav
// ---------------------------------------------------------------------------

export const SITE_NAME = 'Forno';

export const NAV_LINKS = [
  { label: 'Menu', href: '#menu' },
  { label: 'Deals', href: '#deals' },
  { label: 'Locations', href: '#locations' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Contact', href: '#contact' },
];

/** The source's literal button text, reused everywhere a CTA points at the menu. */
export const ORDER_LABEL = 'Order Now';

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

/**
 * The home page's actual hero: no background photo at all — a plain page
 * background with a two-line headline, a subhead, one CTA pill, and a
 * single big pizza product photo floating beside the text with six small
 * ingredient graphics (basil, jalapeño, garlic, olive, mushroom, cherry
 * tomato) scattered and gently bobbing around it. Recovered from the
 * source's own "Ingredients Stack" / "pepperoni_pizza" layer names, not
 * guessed. Because the hero text never sits over the photo, this template
 * has none of tavola's scrim-over-video legibility risk — worth stating
 * explicitly since that was the exact bug tavola shipped with.
 */
export const HERO = {
  eyebrow: '',
  titleLines: ['Your Pizza Party', 'Starts Here!'],
  subhead: 'Gather your friends and family and enjoy the best pizza in town. Freshly made and delivered hot!',
  primaryCta: { label: 'View Our Menu', href: '#menu' },
  secondaryCta: null as { label: string; href: string } | null,
  image: '/t/forno/images/hero-pizza.webp',
  /** The source's own floating decorative ingredient graphics, literally cloned. */
  ingredients: [
    '/t/forno/images/ingredient-basil.webp',
    '/t/forno/images/ingredient-jalapeno.webp',
    '/t/forno/images/ingredient-garlic.webp',
    '/t/forno/images/ingredient-olive.webp',
    '/t/forno/images/ingredient-mushroom.webp',
    '/t/forno/images/ingredient-tomato.webp',
  ],
};

// ---------------------------------------------------------------------------
// Locations — the home/contact pages' "Find Your Nearest Pizza Spot"
// ---------------------------------------------------------------------------

/**
 * The source lists five storefronts with a "View map" link each. Kept as
 * the literal city list — this is a demo template's own multi-location
 * conceit, the same way tavola kept "Prague" as its single reservation
 * city; none of this is a real restaurant's real footprint.
 */
export const LOCATIONS = {
  eyebrow: 'Find Us',
  title: 'Find Your Nearest Pizza Spot',
  subhead: 'Locate our stores, check delivery zones, and pick the best option for you.',
  items: [
    { title: 'New York', body: 'View map', icon: 'map-pin' },
    { title: 'London', body: 'View map', icon: 'map-pin' },
    { title: 'Amsterdam', body: 'View map', icon: 'map-pin' },
    { title: 'Berlin', body: 'View map', icon: 'map-pin' },
    { title: 'Bucharest', body: 'View map', icon: 'map-pin' },
  ],
};

// ---------------------------------------------------------------------------
// Menu / Services — "Fan Favorites" + "Save Room for Dessert!"
// ---------------------------------------------------------------------------

/**
 * The source splits pizzas and desserts into two home-page bands ("Fan
 * Favorites" and "Save Room for Dessert!"); this one-page contract has a
 * single `services` band, so — the same curation tavola applied to its
 * sixteen-roll menu — three of each stand in for both, numbered 01–06.
 * Names, prices and ingredient lists are copied verbatim from the source,
 * including each dish's own literal photo.
 */
export const SERVICES = {
  eyebrow: 'Fan Favorites',
  title: 'Handcrafted Favorites',
  subhead: 'From classic combinations to bold flavors — and a little something sweet to finish.',
  items: [
    {
      number: '01',
      name: 'Cheese Avalanche',
      price: '$14.99',
      body: 'Mozzarella, cheddar, Parmesan, gouda, ricotta, marinara sauce, oregano.',
      image: '/t/forno/images/dish-cheese-avalanche.webp',
    },
    {
      number: '02',
      name: 'Buffalo Bliss',
      price: '$15.99',
      body: 'Buffalo chicken, blue cheese crumbles, mozzarella, ranch dressing, red onions.',
      image: '/t/forno/images/dish-buffalo-bliss.webp',
    },
    {
      number: '03',
      name: 'Mediterranean Marvel',
      price: '$15.99',
      body: 'Feta cheese, Kalamata olives, red onions, sun-dried tomatoes, spinach, mozzarella, olive oil, oregano.',
      image: '/t/forno/images/dish-mediterranean-marvel.webp',
    },
    {
      number: '04',
      name: 'Nutella Pizza',
      price: '$7.99',
      body: 'Pizza dough, Nutella spread, powdered sugar, strawberries, whipped cream.',
      image: '/t/forno/images/dish-nutella-pizza.webp',
    },
    {
      number: '05',
      name: 'Classic Cannoli',
      price: '$5.99',
      body: 'Cannoli shells, ricotta cheese, powdered sugar, chocolate chips, vanilla extract. Two per order.',
      image: '/t/forno/images/dish-classic-cannoli.webp',
    },
    {
      number: '06',
      name: 'Tiramisu Temptation',
      price: '$7.49',
      body: 'Ladyfingers, mascarpone cheese, espresso, cocoa powder, sugar, heavy cream.',
      image: '/t/forno/images/dish-tiramisu.webp',
    },
  ],
};

// ---------------------------------------------------------------------------
// Deals / Pricing — "Hot Pizza, Hotter Deals"
// ---------------------------------------------------------------------------

/**
 * The source's five combo bundles, each two named pizzas at a flat price
 * with a literal "Save $X" badge — the real orange (`#ff9100`) badge colour
 * the source uses for exactly this. Mapped onto the shared schema's pricing
 * tiers, which tavola's source had no equivalent for and so never used.
 */
export const PRICING = {
  eyebrow: 'Hot Deals',
  title: 'Hot Pizza, Hotter Deals',
  subhead: 'From family-sized deals to solo slices, find the perfect offer for your pizza cravings.',
  items: [
    {
      name: 'Spicy Duo Deal',
      price: '$21.99',
      note: 'Save $4',
      features: ['1 Medium Firecracker Inferno', '1 Medium Buffalo Bliss'],
      featured: false,
    },
    {
      name: 'Cheese Lovers Pair',
      price: '$22.99',
      note: 'Save $5',
      features: ['1 Medium Cheese Avalanche', '1 Medium Truffle Temptation'],
      featured: false,
    },
    {
      name: 'Meat Feast Combo',
      price: '$23.99',
      note: 'Save $6',
      features: ["1 Medium Meat Lover's Feast", '1 Medium BBQ Blaze'],
      featured: true,
    },
    {
      name: 'Veggie Delight Duo',
      price: '$21.99',
      note: 'Save $4',
      features: ['1 Medium Mediterranean Marvel', '1 Medium Garlic Supreme'],
      featured: false,
    },
    {
      name: 'Sweet & Savory Combo',
      price: '$22.99',
      note: 'Save $5',
      features: ['1 Medium Hawaiian Heatwave', '1 Medium Pepperoni Popper'],
      featured: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Reviews / Testimonials — "Pizza Perfection, Expertly Rated"
// ---------------------------------------------------------------------------

/**
 * Six attributed quotes from named chefs and food writers, each with the
 * source's own literal portrait photo (recovered from each image's `alt`
 * attribute, which matched the name in the quote beside it exactly).
 * Tavola's source had nothing like this, so tavola never supports
 * `testimonials` — this template is the first in the library that can.
 */
export const TESTIMONIALS = {
  eyebrow: 'Reviews',
  title: 'Pizza Perfection, Expertly Rated',
  subhead: 'Top foodies and chefs share their thoughts on why our pizzas stand out from the crowd.',
  items: [
    {
      quote:
        "The balance of flavors in their Truffle Temptation pizza is simply divine. It's a perfect example of how simplicity, when done right, can create an unforgettable culinary experience.",
      author: 'Chef Marco Di Luca',
      role: 'Executive Chef, Trattoria La Bella (New York)',
      image: '/t/forno/images/testimonial-marco.webp',
    },
    {
      quote:
        'With fresh ingredients and bold flavors, this pizzeria redefines what fast-casual pizza can be. Their BBQ Blaze is a must-try for anyone who loves the perfect mix of sweet and smoky.',
      author: 'Emma Gallagher',
      role: 'Senior Food Writer, London Eats Magazine',
      image: '/t/forno/images/testimonial-emma.webp',
    },
    {
      quote:
        "Their Mediterranean Marvel pizza took me straight to the coast of Greece. It's clear they're passionate about quality and authenticity, with every bite delivering a burst of vibrant, fresh ingredients.",
      author: 'Lucas van den Berg',
      role: 'Restaurant Critic, The Amsterdam Culinary Journal',
      image: '/t/forno/images/testimonial-lucas.webp',
    },
    {
      quote:
        'Few places combine traditional pizza-making techniques with modern creativity so effortlessly. The Garlic Supreme is a prime example of innovation in comfort food.',
      author: 'Sophie Jensen',
      role: 'Head of Culinary Arts, Gourmet Institute',
      image: '/t/forno/images/testimonial-sophie.webp',
    },
    {
      quote:
        "The Meat Lover's Feast is everything a carnivore dreams of, loaded with perfectly cooked meats and balanced with just the right amount of sauce. This is pizza at its finest.",
      author: 'Maximilian Schneider',
      role: 'Food Blogger, Berlin Bites',
      image: '/t/forno/images/testimonial-maximilian.webp',
    },
    {
      quote:
        'In a city full of pizza joints, this place stands out. Their Firecracker Inferno brings the perfect level of spice without overwhelming the flavor. A true gem in the heart of Bucharest.',
      author: 'Andreea Dumitrescu',
      role: 'Editor-in-Chief, Bucharest Foodie',
      image: '/t/forno/images/testimonial-andreea.webp',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

/**
 * Form fields are literal: the source's own "Write Us a Message" form has
 * exactly Name (text, placeholder "Full Name"), Email, Phone (placeholder
 * "+01 000 999 555") and Message (textarea, placeholder "Type your
 * message") — a plain enquiry form, not a reservation form with a guest
 * count and a time slot the way tavola's source wanted. The address, phone
 * and hours below are the source's own literal New York location and
 * footer hours; the fictional Forno brand keeps them the same way tavola
 * kept Prague and a Czech phone format from its own source.
 */
export const CONTACT = {
  eyebrow: 'Contact',
  title: 'Contact Us',
  subhead:
    "Whether you have a question, feedback, or just want to say hi, we're always here for you. Reach out and let us know how we can make your experience even better.",
  phone: '+1 222 555 444',
  email: 'contact@forno.pizza',
  address: '113 E 31st St, New York, NY 10016',
  hours: 'Mon–Fri 9am–10pm · Sat 10am–11pm · Sun 10am–8pm',
  showForm: true,
  formNote: "We'll get back to you within one business day.",
  fields: {
    name: 'Full Name',
    namePlaceholder: 'Full Name',
    email: 'Email',
    emailPlaceholder: 'youremail@email.com',
    phone: 'Phone',
    phonePlaceholder: '+01 000 999 555',
    message: 'Message',
    messagePlaceholder: 'Type your message',
    submit: 'Send Message',
  },
};

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

export const FOOTER = {
  tagline: 'Wood-fired pizza, fresh desserts, and a menu worth gathering for.',
  quickLinksTitle: 'Menu',
  quickLinks: NAV_LINKS,
  /** The year is appended at render time (see Footer.tsx), not baked in here. */
  copyright: 'Forno. All rights reserved.',
};
