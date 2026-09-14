// Single source of truth for all Wanderloom clone copy/content.

export type Destination = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
};

/**
 * The 9 destinations, with their own ACCURATE per-destination tagline and
 * listing-page description. These are correct/distinct on the live source
 * site (only the /destination/[slug] detail page BODY copy is bugged --
 * see DESTINATION_BODY_BUG below).
 */
export const DESTINATIONS: Destination[] = [
  {
    slug: "santorini-greece",
    name: "Santorini, Greece",
    tagline: "Cliffside views, blue domes, golden sunsets",
    description:
      "Famous for its whitewashed villages, dramatic cliffs, and glowing sunsets. Enjoy sailing, wine tasting, and scenic walks along the caldera.",
    image: "/t/tripvanta/images/destination-santorini-greece.jpg",
  },
  {
    slug: "moscow-russia",
    name: "Moscow, Russia",
    tagline: "Iconic domes, imperial palaces, and snowy elegance",
    description:
      "A city of bold contrasts - centuries-old cathedrals beside modern towers. Explore Red Square, world-class museums, and vibrant winter charm.",
    image: "/t/tripvanta/images/destination-moscow-russia.jpg",
  },
  {
    slug: "great-wall-china",
    name: "Great Wall, China",
    tagline: "Endless stone paths over misty mountains",
    description:
      "One of the world's greatest wonders - the Great Wall offers breathtaking views, ancient history, and unforgettable hikes across China's wild landscapes.",
    image: "/t/tripvanta/images/destination-great-wall-china.jpg",
  },
  {
    slug: "istanbul-turkey",
    name: "Istanbul, Turkey",
    tagline: "Where continents, cultures, and centuries collide",
    description:
      "A magical mix of East and West. Wander through grand mosques, spice-filled bazaars, and ferry rides that cross Europe and Asia in minutes.",
    image: "/t/tripvanta/images/destination-istanbul-turkey.jpg",
  },
  {
    slug: "cairo-egypt",
    name: "Cairo, Egypt",
    tagline: "Pyramids, pharaohs, and golden desert light",
    description:
      "Step into ancient history with the Great Pyramids, bustling markets, and the Nile's timeless flow. Cairo pulses with energy, stories, and cultural richness.",
    image: "/t/tripvanta/images/destination-cairo-egypt.jpg",
  },
  {
    slug: "inca-empire-peru",
    name: "Inca Empire, Peru",
    tagline: "Sacred ruins above the clouds",
    description:
      "Journey through the heart of the Andes to explore the ancient Inca Empire. From Cusco's cobblestone streets to Machu Picchu's hidden heights, it's a timeless adventure.",
    image: "/t/tripvanta/images/destination-inca-empire-peru.jpg",
  },
  {
    slug: "petra-jordan",
    name: "Petra, Jordan",
    tagline: "Rose-red ruins carved into desert cliffs",
    description:
      "An ancient wonder hidden in sandstone canyons. Walk the Siq to the Treasury, explore royal tombs, and feel the silence of a lost civilization.",
    image: "/t/tripvanta/images/destination-petra-jordan.jpg",
  },
  {
    slug: "cape-town-south-africa",
    name: "Cape Town, South Africa",
    tagline: "Ocean breeze, Table Mountain views, vibrant city soul",
    description:
      "A city of contrasts - surf-friendly beaches, dramatic peaks, and rich culture. Explore vineyards, coastal drives, and colorful streets full of energy.",
    image: "/t/tripvanta/images/destination-cape-town-south-africa.jpg",
  },
  {
    slug: "kyoto-japan",
    name: "Kyoto, Japan",
    tagline: "Temples, tea houses, and timeless beauty",
    description:
      "A serene blend of tradition and nature. Stroll through bamboo forests, visit ancient shrines, and experience the quiet charm of Japan's cultural heart.",
    image: "/t/tripvanta/images/destination-kyoto-japan.jpg",
  },
];

/**
 * KNOWN SOURCE-SITE CMS BUG (intentionally replicated -- see NOTES.md):
 * every /destination/[slug] detail page's "Best Time to Visit" and
 * "Top Things to Do" body content is ALWAYS Moscow's content verbatim,
 * regardless of which destination the page is for. Only the country name
 * in the first sentence swaps per destination. Confirmed via live-rendered
 * browser capture in destination-live-rendered.json for all 9 pages.
 *
 * DO NOT "fix" this by writing correct per-destination body copy -- the
 * user explicitly chose full 1:1 parity with this bug.
 */
export const DESTINATION_COUNTRY_NAME: Record<string, string> = {
  "cairo-egypt": "Egypt",
  "great-wall-china": "China",
  "inca-empire-peru": "Peru",
  "istanbul-turkey": "Turkey",
  "moscow-russia": "Russia's",
  "santorini-greece": "Greece",
  "petra-jordan": "Jordan",
  "cape-town-south-africa": "South Africa",
  "kyoto-japan": "Japan",
};

export function getDestinationBodyBug(slug: string) {
  const country = DESTINATION_COUNTRY_NAME[slug] ?? "Moscow's";
  return {
    intro: `${country} iconic capital is a living canvas of past and present. Walk across the vast Red Square, gaze up at the colorful domes of St. Basil's Cathedral, and feel the grandeur of a city shaped by empires and revolutions.`,
    paragraph2:
      "From sunlit summer strolls to magical, snow-covered winters, Moscow offers depth, drama, and unforgettable discoveries at every turn.",
    paragraph3:
      "A destination that blends timeless culture with bold character - every season, every street, a new story to uncover.",
    bestTimeToVisit:
      "May to September for pleasant weather, or December for snowy charm and glowing city lights.",
    topThingsToDo: [
      "Explore the iconic Red Square and St. Basil's Cathedral",
      "Visit the Kremlin and its historic museums",
      "Stroll through Gorky Park or Zaryadye Park",
      "Ride the Moscow Metro - every station is a piece of art",
      "Watch a world-class ballet at the Bolshoi Theatre",
    ],
  };
}

/**
 * "Our Trusted Travel Partners" logo marquee (home page, right after the
 * hero). Confirmed on the live source: a heading followed by an infinite
 * looped `<ul>` of exactly 4 unique partner logos, doubled in the DOM for a
 * seamless scroll -- see `home.html` around the "Our Trusted Travel
 * Partners" heading.
 */
export const PARTNER_LOGOS = [
  "/t/tripvanta/images/partner-logo-1.png",
  "/t/tripvanta/images/partner-logo-2.png",
  "/t/tripvanta/images/partner-logo-3.png",
  "/t/tripvanta/images/partner-logo-4.png",
];

/**
 * "Our Visual Journey Through Unforgettable Destinations" section (home
 * page). The live source mixes 7 journey photos with one inline video tile
 * in this grid -- these images were previously (incorrectly) placed on the
 * /gallery page instead; moved here to match the source, see NOTES.md.
 */
export const JOURNEY_IMAGES = [
  "/t/tripvanta/images/journey-photo-1.jpg",
  "/t/tripvanta/images/journey-photo-2.jpg",
  "/t/tripvanta/images/journey-photo-3.jpg",
  "/t/tripvanta/images/journey-photo-4.jpg",
  "/t/tripvanta/images/journey-photo-5.jpg",
  "/t/tripvanta/images/journey-photo-6.jpg",
  "/t/tripvanta/images/journey-photo-7.jpg",
];

/**
 * /gallery page's main grid -- confirmed as the 9 `alt="gallery-img"`
 * images on the live gallery.html, in DOM order.
 */
export const GALLERY_GRID_IMAGES = [
  "/t/tripvanta/images/gallery-photo-1.jpg",
  "/t/tripvanta/images/gallery-photo-2.jpg",
  "/t/tripvanta/images/gallery-photo-3.jpg",
  "/t/tripvanta/images/gallery-photo-4.jpg",
  "/t/tripvanta/images/gallery-photo-5.jpg",
  "/t/tripvanta/images/gallery-photo-6.jpg",
  "/t/tripvanta/images/gallery-photo-7.jpg",
  "/t/tripvanta/images/gallery-photo-8.jpg",
  "/t/tripvanta/images/gallery-photo-9.jpg",
];

/**
 * /gallery page's small looped photo-strip marquee -- confirmed on the live
 * gallery.html as 9 unique 119x133 thumbnails, each doubled in the DOM
 * (identical looped-marquee pattern to the partner logos).
 */
export const GALLERY_STRIP_IMAGES = [
  "/t/tripvanta/images/gallery-strip-1.jpg",
  "/t/tripvanta/images/gallery-strip-2.jpg",
  "/t/tripvanta/images/gallery-strip-3.jpg",
  "/t/tripvanta/images/gallery-strip-4.jpg",
  "/t/tripvanta/images/gallery-strip-5.jpg",
  "/t/tripvanta/images/gallery-strip-6.jpg",
  "/t/tripvanta/images/gallery-strip-7.jpg",
  "/t/tripvanta/images/gallery-strip-8.jpg",
  "/t/tripvanta/images/gallery-strip-9.jpg",
];

/**
 * Hero floating photo collage (home page). Confirmed via source CSS: each
 * collage photo is a circular bubble (border-radius:55px on a 98px box --
 * functionally a full circle), and the collage container holds 6 of these
 * scattered around the hero corners/edges, not 4. The real 6 are the 4
 * dedicated hero-collage-*.jpg files plus hero-avatar-1.jpg/hero-avatar-2.jpg
 * (confirmed via hash lookup to belong to this same collage container, one
 * with transform:rotate(8deg), both at fixed pixel coordinates like
 * top:94px;left:184px -- NOT the avatar-stack images). See NOTES.md §12.5/12.6.
 */
export const HERO_COLLAGE_IMAGES = [
  // Two upper corners
  { src: "/t/tripvanta/images/hero-collage-1.jpg", className: "left-[5%] top-[8%] rotate-[-8deg]" },
  { src: "/t/tripvanta/images/hero-collage-2.jpg", className: "right-[5%] top-[8%] rotate-[6deg]" },
  // Two mid-height edges
  { src: "/t/tripvanta/images/hero-avatar-1.jpg", className: "left-[2%] top-[45%] rotate-[8deg]" },
  { src: "/t/tripvanta/images/hero-avatar-2.jpg", className: "right-[2%] top-[45%] rotate-[-7deg]" },
  // Two lower corners
  { src: "/t/tripvanta/images/hero-collage-3.jpg", className: "left-[9%] bottom-[10%] rotate-[7deg]" },
  { src: "/t/tripvanta/images/hero-collage-4.jpg", className: "right-[6%] bottom-[10%] rotate-[-6deg]" },
];

export type HomeDestinationCard = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

/**
 * The home page's 6 destination cards, reproduced with their EXACT
 * mismatched taglines as they appear on the live home page (a second,
 * separate source-site content-mismatch bug -- see NOTES.md). These
 * intentionally do NOT match the DESTINATIONS array's correct taglines.
 */
export const HOME_DESTINATION_CARDS: HomeDestinationCard[] = [
  {
    slug: "santorini-greece",
    name: "Santorini, Greece",
    tagline: "Cliffside views, blue domes, and golden sunsets.",
    image: "/t/tripvanta/images/destination-santorini-greece.jpg",
  },
  {
    slug: "moscow-russia",
    name: "Moscow, Russia",
    tagline: "East meets West with spice markets and mosques.",
    image: "/t/tripvanta/images/destination-moscow-russia.jpg",
  },
  {
    slug: "great-wall-china",
    name: "Great Wall, China",
    tagline: "Walk centuries of history across mountain-top paths.",
    image: "/t/tripvanta/images/destination-great-wall-china.jpg",
  },
  {
    slug: "istanbul-turkey",
    name: "Istanbul, Turkey",
    tagline: "East meets West with spice markets and mosques.",
    image: "/t/tripvanta/images/destination-istanbul-turkey.jpg",
  },
  {
    slug: "cairo-egypt",
    name: "Cairo, Egypt",
    tagline: "Pyramids, pharaohs, and golden desert sunsets.",
    image: "/t/tripvanta/images/destination-cairo-egypt.jpg",
  },
  {
    slug: "inca-empire-peru",
    name: "Inca Empire, Peru",
    tagline: "Cliffside views, blue domes, and golden sunsets.",
    image: "/t/tripvanta/images/destination-inca-empire-peru.jpg",
  },
];

export type Guide = {
  name: string;
  role: string;
  bio: string;
  image: string;
};

/**
 * "Leo Martinez" appears twice with two different roles/bios -- this is
 * the source site's own data as-is (confirmed in both the static crawl and
 * the live rendered page), not a scrape error. Guide #3's bio is genuinely
 * truncated mid-sentence on the live source itself -- reproduced verbatim.
 */
export const GUIDES: Guide[] = [
  {
    name: "Leo Martinez",
    role: "Nature & Trek Guide",
    bio: "10+ years leading hikes across Dubai and Asia.",
    image: "/t/tripvanta/images/guide-leo-martinez-1.jpg",
  },
  {
    name: "Carlos Mendes",
    role: "Island & Coastal Guide",
    bio: "7+ years guiding travelers to tropical beaches, islands, and hidden coastal trails.",
    image: "/t/tripvanta/images/guide-carlos-mendes.jpg",
  },
  {
    name: "Amir Haddad",
    role: "Cultural Immersion Guide",
    // Genuinely truncated on the live source -- do not complete the sentence.
    bio: "9+ years helping travelers discover authentic local",
    image: "/t/tripvanta/images/guide-amir-haddad.jpg",
  },
  {
    name: "Leo Martinez",
    role: "Desert & Wildlife Guide",
    bio: "10+ years leading safaris and desert adventures across the Middle East and Africa.",
    image: "/t/tripvanta/images/guide-leo-martinez-2.jpg",
  },
  {
    name: "Luca Romano",
    role: "Historical & Architecture Guide",
    bio: "11+ years exploring Europe's iconic monuments, museums, and ancient cities.",
    image: "/t/tripvanta/images/guide-luca-romano.jpg",
  },
  {
    name: "Diego Ramirez",
    role: "Jungle & Eco Adventure Guide",
    bio: "10+ years leading rainforest treks and wildlife expeditions across South America.",
    image: "/t/tripvanta/images/guide-diego-ramirez.jpg",
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  location: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We planned a two-week trip through Asia with Wanderloom and it was amazing. The tools were easy to use, and the support team helped us with custom routes and last-minute changes. Highly recommended for busy professionals.",
    name: "Mei Lin & Andrew",
    location: "Singapore",
  },
  {
    quote:
      "Wanderloom made our anniversary trip completely stress-free. From planning the itinerary to booking unique stays, everything was smooth and personal. We felt taken care of every step of the way",
    name: "Devon Lane",
    location: "Canada",
  },
  {
    quote:
      "As a solo traveler, I always look for platforms I can trust. Wanderloom gave me more than just destinations - it offered insights, flexibility, and real local connections. I'll definitely use it again and again",
    name: "David Kane",
    location: "Australia",
  },
];

export type Faq = {
  question: string;
  answer: string;
};

export const FAQS: Faq[] = [
  {
    question: "How do I plan a trip with Wanderloom?",
    answer:
      "Simply choose your destination, customize your experience, and confirm your booking - all from one smooth, guided interface.",
  },
  {
    question: "Can I make changes to my trip after booking?",
    answer:
      "Yes! Most bookings allow flexible changes. You can adjust dates, preferences, or add services - just contact our support team.",
  },
  {
    question: "Are your guides verified?",
    answer:
      "Absolutely. Every Wanderloom guide is vetted for experience, local knowledge, and traveler feedback to ensure safe and enriching experiences.",
  },
  {
    question: "Do you offer group or solo travel options?",
    answer:
      "Both! Whether you're planning a solo escape or a group adventure, we offer options and support tailored to your travel style.",
  },
  {
    question: "What if I need help during my trip?",
    answer:
      "We offer 24/7 support before, during, and after your journey. Chat with our team anytime - we're always here to help.",
  },
  {
    question: "Is Wanderloom available worldwide?",
    answer:
      "Yes! We cover top destinations across Asia, Europe, Africa, and the Americas - and we're expanding every month.",
  },
];

export const STATS = {
  // Confirmed final values (stats-final.txt, live-browser count-up on scroll):
  tripsBooked: "4.5K",
  destinationsCovered: "30+",
  verifiedStays: "150+",
  customerRating: "4.7",
  heading: "Rated Excellent by Over 500K Happy Global Travelers",
  // Confirmed via source HTML: the count-up element feeding this stat has
  // aria-label="Counter ends at 500" -- see NOTES.md.
  heroReviewCount: "500K+",
  heroReviewRating: "4.7/5 rating",
};

export const TRIP_STEPS = [
  {
    number: "1",
    title: "Choose Destination",
    description: "Pick a place that excites you - from cities to urban area's hidden gems.",
  },
  {
    number: "2",
    title: "Customize Your Experience",
    description: "Select activities, stays, and add-ons to match on your own style.",
  },
  {
    number: "3",
    title: "Book & Go",
    description: "Confirm your trip in minutes and start the countdown.",
  },
];

export const ABOUT_FEATURES = [
  {
    title: "Smart Tools, Beautifully Simple",
    description:
      "We believe travel planning should feel effortless - not overwhelming. That's why Wanderloom offers intuitive tools that remove clutter, reduce friction, and guide you clearly from dream to destination.",
  },
  {
    title: "Guides You Can Truly Trust",
    description:
      "Our network of local experts and seasoned travelers gives you real, grounded advice - not just tourist traps. Verified reviews and insider tips help you explore like you belong there.",
  },
  {
    title: "Every Journey, Any Style",
    description:
      "Whether you're chasing solitude, romance, adventure, or family moments, Wanderloom adapts to your travel rhythm. From weekend getaways to once-in-a-lifetime trips, we help make it yours.",
  },
];

export const OFFICES = [
  {
    label: "Office Address 01",
    address: "Wanderloom HQ, 123 Explorer Street, Nomad City, NY 10001",
    phone: "+1 800 234 5678",
    email: "support1@wanderloom.com",
  },
  {
    label: "Office Address 02",
    address: "3891 Ranchview Dr. Richardson, California 62639",
    phone: "+1 800 654 3698",
    // Both offices list the same email on the live source -- keep as-is.
    email: "support1@wanderloom.com",
  },
];

export const GUEST_OPTIONS_CONTACT = ["2 Child 2 Adult", "1 Child 2 Adult", "3 Child 2 Adult"];
export const GUEST_OPTIONS_HERO = ["2 Child 1 Adult", "1 Child 2 Adult", "3 Child 2 Adult"];

/**
 * "designtocodes" is the template studio's credit/brand (linked, on the
 * live source, from a "Buy this template" marketplace cross-sell button to
 * a designtocodes.com add-to-cart page). Per this pipeline's convention,
 * that purchase/cross-sell button has NO place on an owned, self-hosted
 * site and was intentionally NOT built anywhere. Keep/replace/remove this
 * credit line at the site owner's discretion -- see NOTES.md.
 */
export const TEMPLATE_CREDIT = "designtocodes";

// Footer "Popular Destination" list -- verbatim order from the live
// source, which lists 8 of the 9 destinations (Cape Town is NOT included
// in this footer list on the source -- keep it that way, don't add it).
const FOOTER_DESTINATION_SLUGS = [
  "great-wall-china",
  "petra-jordan",
  "santorini-greece",
  "kyoto-japan",
  "inca-empire-peru",
  "cairo-egypt",
  "istanbul-turkey",
  "moscow-russia",
];

export const FOOTER_DESTINATIONS = FOOTER_DESTINATION_SLUGS.map(
  (slug) => DESTINATIONS.find((d) => d.slug === slug)!
);
