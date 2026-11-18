/**
 * Write a demo centre's landing page.
 *
 * Onboarding gives a new centre the vertical's starter copy — three highlights,
 * three services, three questions. That is the right default for a real client
 * on day one and thin as a demo: most of a template's bands have nothing to
 * render, so the page reads as a placeholder rather than as a business.
 *
 *   pnpm demo:site --slug legend --page CAR_RENTAL --template knotch
 *
 * The page objects below are invented, exactly like the seeded staff and
 * callers. They belong on a demo tenant and nowhere near a real client's
 * published site — in particular the testimonials and prices, which the
 * enrichment pipeline is forbidden from generating for precisely that reason.
 *
 * Validated against `SiteContent` before writing, because the API parses the
 * stored JSON on read and silently serves the vertical defaults when it does
 * not match — so a typo here looks like "the seed did nothing" rather than an
 * error.
 */
import { PrismaClient } from '@prisma/client';
import { SiteContent, SiteTemplate } from '@superdemo/contracts';

const prisma = new PrismaClient();

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const SLUG = arg('slug');
const PAGE = arg('page', 'CAR_RENTAL')!;
const TEMPLATE = arg('template', 'knotch')!;

const CAR_RENTAL_PAGE = {
  hero: {
    eyebrow: 'Dubai · airport delivery · 24/7',
    headline: 'Rent a car in Dubai without the small print',
    subhead:
      'Economy to luxury, delivered to your hotel, your office or the airport. Insurance, registration and Salik handled — you get one price and the keys.',
    primaryCta: { label: 'Call the desk', kind: 'call' },
    secondaryCta: { label: 'Request a callback', kind: 'callback' },
  },
  highlights: [
    { title: 'Delivered to you', body: 'Free delivery anywhere in Dubai on rentals of three days or more, including both airport terminals.' },
    { title: 'One price, stated up front', body: 'Comprehensive insurance and registration are in the rate. Salik is billed at cost with no markup.' },
    { title: 'Deposit back in 21 days', body: 'Released once tolls and fines have cleared, and we tell you the day it goes back.' },
    { title: '24-hour roadside cover', body: 'Punctures, batteries, lockouts and recovery. A replacement car within four hours if yours is undriveable.' },
    { title: 'Visitors welcome', body: 'UK, EU, US, GCC, Canadian, Australian and Japanese licences accepted directly. No permit needed.' },
    { title: 'Fines shown before charging', body: 'You get a photograph of the notice by email before anything touches your card.' },
  ],
  services: [
    { name: 'Economy & compact', body: 'Sunny, Yaris, Rio and similar. The everyday hire — cheapest to run and easiest to park.' },
    { name: 'Mid-size sedan', body: 'Corolla, Elantra, Accord. The default for a working week or a family visit.' },
    { name: '7-seater SUV', body: 'Pajero, Fortuner, Innova. Weekend trips, airport runs and anyone travelling with luggage.' },
    { name: 'Luxury & sports', body: 'Mercedes, BMW, Range Rover and selected performance models. Minimum age 25.' },
    { name: 'Monthly & long-term lease', body: 'Twelve, twenty-four or thirty-six months with servicing, tyres and replacement vehicles included.' },
    { name: 'Corporate fleet', body: 'Five vehicles or more: a named account manager, driver swaps without re-signing, one monthly invoice.' },
  ],
  steps: [
    { title: 'Tell us the dates', body: 'One call or a message. We confirm the car, the total and the deposit before anything is signed.' },
    { title: 'Send your documents', body: 'Licence and Emirates ID, or passport and visa page if you are visiting. Photos by WhatsApp are fine.' },
    { title: 'We bring the car', body: 'To your hotel, your office or the terminal. Five minutes to check it over and sign.' },
    { title: 'Drive, and hand it back', body: 'Extend by phone if plans change. We collect from wherever you are on monthly hires.' },
  ],
  testimonials: [
    { quote: 'Landed at 2am, the car was at Terminal 3 with someone waiting. That alone is worth the difference in price.', author: 'Martin Whitfield', role: 'Visiting from Manchester' },
    { quote: 'Four cars on a two-year lease for our site team. One invoice a month and they swap a driver without making it a contract change.', author: 'Rekha Menon', role: 'Operations manager, Jebel Ali' },
    { quote: 'A fine came through six weeks after I returned the car. They emailed me the photo first — no silent charge, which is not my experience elsewhere.', author: 'Yusuf Bakr', role: 'Monthly hire customer' },
  ],
  pricing: [
    { name: 'Daily', price: 'from AED 90', note: 'Economy, per day', features: ['Comprehensive insurance', '250km a day included', 'Free delivery over 3 days', 'AED 1,000 deposit'] },
    { name: 'Monthly', price: 'from AED 1,450', note: 'Economy, per month', features: ['4,500km a month included', 'Free delivery and collection', 'Servicing included', 'Replacement car if off-road'] },
    { name: 'Corporate lease', price: 'On application', note: 'Five vehicles or more', features: ['Named account manager', 'Consolidated monthly invoice', 'Driver swaps without re-signing', 'Servicing, tyres and registration'] },
  ],
  comparison: {
    beforeLabel: 'The usual rental desk',
    afterLabel: 'With Legend',
    before: ['Queue at the counter after a long flight', 'Insurance sold as an upsell at the desk', 'Salik and fines appear weeks later, unexplained', 'Deposit held with no release date'],
    after: ['The car meets you at the terminal', 'Insurance in the quoted rate', 'Tolls at cost, fines emailed before charging', 'Deposit released in 21 days, confirmed'],
  },
  proof: {
    stats: [
      { value: '600+', label: 'Vehicles in the fleet' },
      { value: '24/7', label: 'Airport desk & roadside' },
      { value: '21 days', label: 'Deposit release' },
      { value: '4 hrs', label: 'Replacement car, Dubai' },
    ],
    quote: {
      text: 'We moved our whole Dubai fleet across after one trial month. The reporting is better than what our finance team was building by hand.',
      author: 'Fleet lead',
      role: 'Logistics group, Jebel Ali',
    },
  },
  faq: [
    { q: 'Can I drive on my home licence?', a: 'If it is from the UK, EU, US, GCC, Canada, Australia, Japan or South Africa, yes — bring your passport and visit visa page. Other licences need an International Driving Permit alongside them. UAE residents need an Emirates ID and a UAE licence.' },
    { q: 'What deposit do you hold?', a: 'AED 1,000 on economy and mid-size, AED 3,000 on SUVs, and from AED 5,000 on luxury models. It is held on the card, not taken, and released 21 days after return once Salik and any fines have cleared.' },
    { q: 'How are Salik and fines charged?', a: 'Salik is AED 4 a crossing, billed at cost with no markup. Traffic fines reach us from the RTA up to 30 days after the offence; we email you a photograph of the notice before charging the card, plus an AED 50 admin fee per fine.' },
    { q: 'Is there a mileage limit?', a: '250km a day, 1,750km a week and 4,500km a month. Beyond that it is AED 0.50 per kilometre, added to the final invoice.' },
    { q: 'What happens if I have an accident?', a: 'Call 999 and get a police report before anything else — insurance will not cover damage without one. Then call us. If the car is undriveable and you are not at fault, a replacement reaches you within four hours anywhere in Dubai.' },
    { q: 'Can I extend the rental?', a: 'Usually yes, provided the car is not reserved after you. Call the desk before the return date and we will amend the contract and reissue the invoice.' },
  ],
  contact: {
    phoneOverride: '',
    email: 'bookings@legend-rental.example',
    address: 'Sheikh Zayed Road, Dubai · Deira branch · DXB Terminal 3 desk',
    hours: 'Head office 8am – 9pm daily · Airport desk and roadside 24 hours',
    showForm: true,
    formNote: 'Leave a number and the desk calls you back — usually within the hour.',
  },
  sections: ['highlights', 'services', 'steps', 'proof', 'testimonials', 'pricing', 'comparison', 'faq', 'contact'],
  footerNote: 'Legend Rent A Car · Sheikh Zayed Road, Dubai · Fleet, corporate and long-term leasing',
};

/**
 * A neighbourhood store with delivery: the page for "Demo Business".
 *
 * Written to match the RETAIL demo pack that seeds its calls (orders and
 * delivery, payments and refunds, festival hampers, trade accounts), so the
 * page a prospect is shown and the inbox they are shown next tell the same
 * story. Generic on purpose: no named brand, no real address.
 */
const STORE_PAGE = {
  hero: {
    eyebrow: 'Groceries & home essentials · delivered same day',
    headline: 'Everything for the week, at your door by this evening',
    subhead:
      'Fresh produce, pantry staples and household essentials from one store. Order by phone or WhatsApp before 4pm and it arrives the same day — our assistant answers every call, any hour.',
    primaryCta: { label: 'Call to order', kind: 'call' },
    secondaryCta: { label: 'Request a callback', kind: 'callback' },
  },
  highlights: [
    { title: 'Same-day delivery', body: 'Order before 4pm and it arrives the same evening. Free on baskets over AED 100.' },
    { title: 'Answered on the first ring', body: 'Our AI assistant takes orders, checks stock and tracks deliveries around the clock, and hands you to a person whenever you ask.' },
    { title: 'Fresh, or it comes back', body: 'Anything that is not right is replaced on the next delivery or refunded the same day. No forms.' },
    { title: 'Pay how you like', body: 'Card on delivery, bank transfer, or a monthly invoice on a trade account.' },
    { title: 'Your usual order, remembered', body: 'Say "the usual" and we repeat your last basket. Weekly reminders if you want them.' },
    { title: 'Collect it yourself', body: 'Order ahead and we text you when it is packed and waiting at the counter.' },
  ],
  services: [
    { name: 'Fresh produce', body: 'Fruit, vegetables and herbs, delivered daily from the market and checked before they are packed.' },
    { name: 'Pantry & staples', body: 'Rice, flour, lentils, spices, oils and the brands you already buy, in household and bulk sizes.' },
    { name: 'Household essentials', body: 'Cleaning, laundry and personal care, so the weekly shop is one order rather than three.' },
    { name: 'Festival & gift hampers', body: 'Ready-made or built to order for Eid, Diwali, Christmas and corporate gifting, delivered to a list.' },
    { name: 'Trade accounts', body: 'For restaurants, offices and caterers: standing orders, credit terms and one monthly invoice.' },
    { name: 'Click & collect', body: 'Order by phone or WhatsApp, pick it up at the counter with no queue.' },
  ],
  steps: [
    { title: 'Call or message', body: 'Tell the assistant what you need, or say "the usual". It confirms stock and the total as you go.' },
    { title: 'We pack it', body: 'Picked fresh and checked against your order. You get a message if anything has to be swapped.' },
    { title: 'Delivered or collected', body: 'A delivery slot the same evening, or a text when it is ready at the counter.' },
    { title: 'Anything wrong, we fix it', body: 'Call back and it is replaced on the next delivery or refunded the same day.' },
  ],
  testimonials: [
    { quote: 'I call at eleven at night, say "the usual", and it is at the door the next evening. I have not been to a supermarket in months.', author: 'Priya Raman', role: 'Customer since 2023' },
    { quote: 'Our café runs on a standing order. One invoice a month, and when we are short on something they add it to the same day run.', author: 'Daniel Okafor', role: 'Café owner, trade account' },
    { quote: 'We sent forty Eid hampers to clients from one spreadsheet. Every one arrived on the day, and they called me when two addresses were wrong.', author: 'Huda Al Mansoori', role: 'Office manager' },
  ],
  pricing: [
    { name: 'Everyday delivery', price: 'Free over AED 100', note: 'AED 10 below that', features: ['Same day if ordered before 4pm', 'Evening delivery slots', 'Replacement or refund on anything wrong', 'Card on delivery'] },
    { name: 'Weekly standing order', price: 'No fee', note: 'Your usual, every week', features: ['Reminder before each order', 'Change or skip with one call', 'Priority delivery slot', 'Free delivery on every order'] },
    { name: 'Trade account', price: 'On application', note: 'Restaurants, offices, caterers', features: ['Credit terms', 'One monthly invoice', 'Same-day top-ups', 'Named account contact'] },
  ],
  comparison: {
    beforeLabel: 'The usual corner shop',
    afterLabel: 'With Demo Business',
    before: ['Phone rings out when it is busy', 'Orders taken on paper, items missed', 'No idea when the delivery will come', 'Refunds mean another trip to the shop'],
    after: ['Every call answered, any hour', 'Orders confirmed back to you item by item', 'A text when it leaves and when it arrives', 'Replaced on the next delivery, or refunded the same day'],
  },
  proof: {
    stats: [
      { value: '3,000+', label: 'Products in stock' },
      { value: 'Same day', label: 'Delivery before 4pm' },
      { value: '24/7', label: 'Orders by phone' },
      { value: '< 1 min', label: 'To place an order' },
    ],
    quote: {
      text: 'The phone used to ring out every Friday evening. Now every call is an order, and my team packs instead of answering.',
      author: 'Store manager',
      role: 'Demo Business',
    },
  },
  faq: [
    { q: 'What time do I need to order for same-day delivery?', a: 'Before 4pm for delivery the same evening. Orders after 4pm go out on the first slot the next day.' },
    { q: 'Is there a minimum order?', a: 'No. Delivery is free on baskets over AED 100 and AED 10 below that.' },
    { q: 'What if something is missing or not fresh?', a: 'Call us and tell the assistant. It is replaced on your next delivery or refunded the same day — you do not need to send anything back.' },
    { q: 'Can I pay on delivery?', a: 'Yes, by card or cash. Trade accounts can pay by bank transfer on a monthly invoice.' },
    { q: 'Do you make hampers for companies?', a: 'Yes. Send us a list of names and addresses and we deliver each hamper on the day you choose, with a card if you want one.' },
    { q: 'Can I speak to a person instead of the assistant?', a: 'Any time. Say so on the call and you are passed to the team with your order already on screen.' },
  ],
  contact: {
    phoneOverride: '',
    email: 'orders@demobusiness.example',
    address: 'Demo Business · Dubai',
    hours: 'Store 8am – 11pm daily · Phone orders 24 hours',
    showForm: true,
    formNote: 'Leave a number and we call you back — usually within the hour.',
  },
  sections: ['highlights', 'services', 'steps', 'proof', 'testimonials', 'pricing', 'comparison', 'faq', 'contact'],
  footerNote: 'Demo Business · Groceries and home essentials, delivered same day',
};

const PAGES: Record<string, { content: unknown; metaTitle: string; metaDescription: string }> = {
  STORE: {
    content: STORE_PAGE,
    metaTitle: 'Demo Business · Groceries and essentials, delivered same day',
    metaDescription:
      'Fresh produce, pantry staples and household essentials, ordered by phone or WhatsApp any hour and delivered the same day.',
  },
  CAR_RENTAL: {
    content: CAR_RENTAL_PAGE,
    metaTitle: 'Legend Rent A Car · Car rental in Dubai',
    metaDescription:
      'Economy to luxury car hire in Dubai, delivered to your hotel, office or the airport. Insurance and registration included, Salik at cost.',
  },
};

async function main() {
  if (!SLUG) throw new Error('--slug is required');

  const page = PAGES[PAGE];
  if (!page) throw new Error(`No demo page "${PAGE}". Available: ${Object.keys(PAGES).join(', ')}`);

  const template = SiteTemplate.safeParse(TEMPLATE);
  if (!template.success) {
    throw new Error(`"${TEMPLATE}" is not a template. Available: ${SiteTemplate.options.join(', ')}`);
  }

  // Parse before writing. The API serves the vertical defaults rather than an
  // error when the stored JSON does not match, so an unvalidated write fails
  // silently and looks like the seed never ran.
  const parsed = SiteContent.safeParse(page.content);
  if (!parsed.success) {
    throw new Error(`page "${PAGE}" does not match SiteContent:\n${JSON.stringify(parsed.error.format(), null, 2)}`);
  }

  const org = await prisma.organization.findUnique({ where: { slug: SLUG } });
  if (!org) throw new Error(`No centre with slug "${SLUG}"`);

  const site = await prisma.site.upsert({
    where: { orgId: org.id },
    create: {
      orgId: org.id,
      content: parsed.data as object,
      template: template.data,
      style: { surface: 'ink', display: 'sans', corners: 'soft', density: 'regular' },
      isPublished: true,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
    },
    update: {
      content: parsed.data as object,
      template: template.data,
      style: { surface: 'ink', display: 'sans', corners: 'soft', density: 'regular' },
      isPublished: true,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
    },
  });

  console.log(`site     /${org.slug} · ${site.template} · ${parsed.data.sections.length} sections`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
