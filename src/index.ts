interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * HUD MCP — U.S. Department of Housing and Urban Development APIs.
 *
 * Tools:
 * - hud_fair_market_rents: Fair Market Rents (FMR) by state, county, or ZIP
 * - hud_income_limits: Income limits for housing programs by area
 * - hud_crosswalk: ZIP/county/CBSA/tract geographic crosswalk
 * - hud_chas: Comprehensive Housing Affordability Strategy data
 * - hud_list_states: List all state codes and names
 *
 * BYO key: HUD API token from https://www.huduser.gov/portal/dataset/fmr-api.html
 */


const BASE = 'https://www.huduser.gov/hudapi/public';

function extractToken(args: Record<string, unknown>): string {
  const token = args._apiKey as string;
  delete args._apiKey;
  if (!token) throw new Error('HUD API token required. Get one at https://www.huduser.gov/portal/dataset/fmr-api.html');
  return token;
}

async function hudFetch(url: string, token: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HUD API error (${res.status}): ${text}`);
  }
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'hud_fair_market_rents',
    description:
      'Get Fair Market Rents (FMR) from HUD. FMRs are used to determine payment standards for the Housing Choice Voucher program, initial rents for Section 8 project-based assistance, and rent ceilings for HOME-assisted rental units. Returns rent estimates by bedroom count.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        state_code: { type: 'string', description: 'Two-letter state code (e.g., "CA", "NY", "TX"). Required to get state-level summary.' },
        entity_id: { type: 'string', description: 'FIPS code or ZIP code to get FMR for a specific area. Omit to get all areas in the state.' },
        year: { type: 'number', description: 'Fiscal year (e.g., 2024). Omit for the most recent year.' },
        _apiKey: { type: 'string', description: 'HUD API token' },
      },
      required: ['state_code', '_apiKey'],
    },
  },
  {
    name: 'hud_income_limits',
    description:
      'Get HUD income limits for housing programs by area. Income limits determine eligibility for HUD-assisted housing programs. Returns thresholds for extremely low, very low, and low income categories by family size.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        state_code: { type: 'string', description: 'Two-letter state code (e.g., "CA", "NY").' },
        entity_id: { type: 'string', description: 'FIPS code or metro area code for a specific area. Omit to get all areas in the state.' },
        year: { type: 'number', description: 'Fiscal year (e.g., 2024). Omit for the most recent year.' },
        _apiKey: { type: 'string', description: 'HUD API token' },
      },
      required: ['state_code', '_apiKey'],
    },
  },
  {
    name: 'hud_crosswalk',
    description:
      'HUD USPS ZIP code crosswalk. Maps between ZIP codes, census tracts, counties, CBSAs (metro areas), and congressional districts. Essential for geographic analysis when joining data from different sources.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: { type: 'number', description: 'Crosswalk type: 1=ZIP-to-tract, 2=ZIP-to-county, 3=ZIP-to-CBSA, 4=ZIP-to-congressional-district, 7=county-to-ZIP.' },
        query: { type: 'string', description: 'Input value: ZIP code (for types 1-4), or FIPS county code (for type 7). Example: "90210" or "06037".' },
        _apiKey: { type: 'string', description: 'HUD API token' },
      },
      required: ['type', 'query', '_apiKey'],
    },
  },
  {
    name: 'hud_chas',
    description:
      'Get Comprehensive Housing Affordability Strategy (CHAS) data from HUD. CHAS data demonstrates the extent of housing problems and housing needs, particularly for low-income households. Used by communities to plan affordable housing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        state_code: { type: 'string', description: 'Two-letter state code (e.g., "CA", "NY").' },
        entity_id: { type: 'string', description: 'FIPS code for a specific county or place. Omit to get state-level data.' },
        year: { type: 'number', description: 'Data year (e.g., 2020). Omit for the most recent available.' },
        _apiKey: { type: 'string', description: 'HUD API token' },
      },
      required: ['state_code', '_apiKey'],
    },
  },
  {
    name: 'hud_list_states',
    description:
      'List all U.S. state codes and names recognized by the HUD API. Useful for discovering valid state codes to use with other HUD tools.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'HUD API token' },
      },
      required: ['_apiKey'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'hud_fair_market_rents':
      return hudFairMarketRents(args);
    case 'hud_income_limits':
      return hudIncomeLimits(args);
    case 'hud_crosswalk':
      return hudCrosswalk(args);
    case 'hud_chas':
      return hudChas(args);
    case 'hud_list_states':
      return hudListStates(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function hudFairMarketRents(args: Record<string, unknown>) {
  const token = extractToken(args);
  const stateCode = args.state_code as string;
  const entityId = args.entity_id as string | undefined;
  const year = args.year as number | undefined;

  let url: string;
  if (entityId) {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    const qs = params.toString();
    url = `${BASE}/fmr/data/${encodeURIComponent(entityId)}${qs ? `?${qs}` : ''}`;
  } else {
    url = `${BASE}/fmr/statedata/${encodeURIComponent(stateCode)}`;
    if (year) url += `?year=${year}`;
  }

  const data = await hudFetch(url, token);
  return { state: stateCode, entity_id: entityId ?? null, year: year ?? 'latest', data };
}

async function hudIncomeLimits(args: Record<string, unknown>) {
  const token = extractToken(args);
  const stateCode = args.state_code as string;
  const entityId = args.entity_id as string | undefined;
  const year = args.year as number | undefined;

  let url: string;
  if (entityId) {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    const qs = params.toString();
    url = `${BASE}/il/data/${encodeURIComponent(entityId)}${qs ? `?${qs}` : ''}`;
  } else {
    url = `${BASE}/il/statedata/${encodeURIComponent(stateCode)}`;
    if (year) url += `?year=${year}`;
  }

  const data = await hudFetch(url, token);
  return { state: stateCode, entity_id: entityId ?? null, year: year ?? 'latest', data };
}

async function hudCrosswalk(args: Record<string, unknown>) {
  const token = extractToken(args);
  const type = args.type as number;
  const query = args.query as string;

  const typeLabels: Record<number, string> = {
    1: 'ZIP-to-tract',
    2: 'ZIP-to-county',
    3: 'ZIP-to-CBSA',
    4: 'ZIP-to-congressional-district',
    7: 'county-to-ZIP',
  };

  const url = `${BASE}/usps?type=${type}&query=${encodeURIComponent(query)}`;
  const data = await hudFetch(url, token);
  return { crosswalk_type: typeLabels[type] ?? `type-${type}`, query, data };
}

async function hudChas(args: Record<string, unknown>) {
  const token = extractToken(args);
  const stateCode = args.state_code as string;
  const entityId = args.entity_id as string | undefined;
  const year = args.year as number | undefined;

  let url: string;
  if (entityId) {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    const qs = params.toString();
    url = `${BASE}/chas/data/${encodeURIComponent(entityId)}${qs ? `?${qs}` : ''}`;
  } else {
    url = `${BASE}/chas/statedata/${encodeURIComponent(stateCode)}`;
    if (year) url += `?year=${year}`;
  }

  const data = await hudFetch(url, token);
  return { state: stateCode, entity_id: entityId ?? null, year: year ?? 'latest', data };
}

async function hudListStates(args: Record<string, unknown>) {
  const token = extractToken(args);
  const data = await hudFetch(`${BASE}/fmr/listStates`, token);
  return { states: data };
}

export default { tools, callTool, meter: { credits: 5 } } satisfies McpToolExport;
