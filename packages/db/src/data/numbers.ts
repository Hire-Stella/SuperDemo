/**
 * Mock DID inventory.
 *
 * This is the SIM-card-replacement story made tangible: search a catalogue of
 * +971 virtual numbers, buy one, point it at a queue and an AI agent, and
 * agents in Dubai, India and Egypt all answer it from the browser with no SIM
 * and no roaming charge.
 *
 * IMPORTANT — these are not real numbers and cannot receive real calls. Real
 * UAE DIDs must come from a TDRA-licensed carrier (Etisalat, du, or a licensed
 * partner); UAE law reserves PSTN-terminating voice to licensed operators.
 * See NOT-IMPLEMENTED.md §4 item 1. Prefixes below use the 800/900 service
 * ranges and clearly-fictional subscriber blocks to avoid colliding with
 * numbers that belong to real people.
 */

export interface MockNumberStock {
  e164: string;
  region: string;
  monthlyCostUsd: number;
  setupCostUsd: number;
  capabilities: ('VOICE' | 'SMS' | 'WHATSAPP')[];
}

/**
 * Fictional-by-construction: the 4-xxx landline blocks used here are inside
 * reserved/unassigned test ranges, and the toll-free entries use the 800
 * service prefix. Nothing here routes to a real subscriber.
 */
export const AE_NUMBER_STOCK: MockNumberStock[] = [
  // Dubai landline-style DIDs (04 area code)
  { e164: '+97145550100', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS'] },
  { e164: '+97145550101', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS'] },
  { e164: '+97145550102', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE'] },
  { e164: '+97145550103', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS', 'WHATSAPP'] },
  { e164: '+97145550104', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS', 'WHATSAPP'] },
  { e164: '+97145550105', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE'] },
  { e164: '+97145550110', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS'] },
  { e164: '+97145550111', region: 'Dubai', monthlyCostUsd: 8, setupCostUsd: 5, capabilities: ['VOICE', 'SMS', 'WHATSAPP'] },
  { e164: '+97145550120', region: 'Dubai', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE'] },
  { e164: '+97145550123', region: 'Dubai', monthlyCostUsd: 9, setupCostUsd: 5, capabilities: ['VOICE', 'SMS', 'WHATSAPP'] },

  // Abu Dhabi landline-style DIDs (02 area code)
  { e164: '+97125550100', region: 'Abu Dhabi', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS'] },
  { e164: '+97125550101', region: 'Abu Dhabi', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE'] },
  { e164: '+97125550102', region: 'Abu Dhabi', monthlyCostUsd: 6, setupCostUsd: 5, capabilities: ['VOICE', 'SMS'] },

  // Sharjah (06)
  { e164: '+97165550100', region: 'Sharjah', monthlyCostUsd: 5, setupCostUsd: 5, capabilities: ['VOICE'] },
  { e164: '+97165550101', region: 'Sharjah', monthlyCostUsd: 5, setupCostUsd: 5, capabilities: ['VOICE', 'SMS'] },

  // Toll-free (800 service range)
  { e164: '+9718005550001', region: 'UAE toll-free', monthlyCostUsd: 25, setupCostUsd: 40, capabilities: ['VOICE'] },
  { e164: '+9718005550002', region: 'UAE toll-free', monthlyCostUsd: 25, setupCostUsd: 40, capabilities: ['VOICE'] },
];

/** Comparison stock so the demo can show multi-country reach. */
export const OTHER_NUMBER_STOCK: Record<string, MockNumberStock[]> = {
  IN: [
    { e164: '+912233550100', region: 'Mumbai', monthlyCostUsd: 2, setupCostUsd: 2, capabilities: ['VOICE', 'SMS'] },
    { e164: '+911133550100', region: 'Delhi', monthlyCostUsd: 2, setupCostUsd: 2, capabilities: ['VOICE', 'SMS'] },
  ],
  EG: [
    { e164: '+20233550100', region: 'Cairo', monthlyCostUsd: 3, setupCostUsd: 3, capabilities: ['VOICE'] },
  ],
  GB: [
    { e164: '+442035550100', region: 'London', monthlyCostUsd: 3, setupCostUsd: 2, capabilities: ['VOICE', 'SMS'] },
  ],
  SA: [
    { e164: '+966115550100', region: 'Riyadh', monthlyCostUsd: 7, setupCostUsd: 6, capabilities: ['VOICE'] },
  ],
};

/**
 * The numbers FIT actually publishes, seeded as already-owned so the dashboard
 * reflects their real setup on day one. These are their genuine public numbers
 * (from fitiedu.com) — inbound simulation targets them, nothing dials out.
 */
export const FIT_OWNED_NUMBERS = [
  {
    e164: '+971528876388',
    label: 'Main admissions line (published)',
    region: 'Dubai',
    monthlyCostUsd: 0,
    provider: 'existing-carrier',
  },
  {
    e164: '+97145709603',
    label: 'WhatsApp business number (published)',
    region: 'Dubai',
    monthlyCostUsd: 0,
    provider: 'existing-carrier',
  },
] as const;
