# HUD — Housing and Urban Development

The U.S. Department of Housing and Urban Development's data. Fair Market Rents (FMR), Income Limits, USPS Vacancy Data, public housing characteristics, Continuum of Care (homelessness data), Comprehensive Housing Affordability Strategy (CHAS) data. Free, no auth.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Why this matters for AI agents

For housing-affordability analysis, federal benefit thresholds, or homeless services research, HUD is the source. Pair with [Census](/docs/reference/census) (housing characteristics), [Altos](/docs/reference/altos) (live market data), [ATTOM](/docs/reference/attom) (property-level data), and [FRED](/docs/reference/fred) (mortgage/macro context).

Common flows:

- **Fair Market Rent.** "What's HUD's FMR for a 2-bedroom in Denver?" — FMR data drives Section 8 voucher amounts.
- **Income Limits.** "Median income for a family of 4 in Boston?" — drives eligibility for housing programs.
- **USPS Vacancy.** "What % of housing units are vacant in this ZIP?" — quarterly USPS-derived vacancy rates by tract.
- **Homelessness.** Point-in-Time count, demographic breakdowns, Continuum of Care reports.
- **Public Housing.** Authority listings, unit counts, demographic served.

## Auth

Most HUD APIs are free, no auth. A few require registering for a free token. Pipeworx supports `_apiKey` passthrough where applicable.

## Datasets worth knowing

| Dataset | Cadence | Use |
|---|---|---|
| Fair Market Rents (FMR) | Annual (Oct 1 effective) | Voucher subsidy levels, rental affordability |
| Income Limits | Annual (Apr) | Section 8 eligibility, LIHTC qualification |
| USPS Vacancy | Quarterly | Vacancy rates by tract |
| AHAR (Annual Homelessness) | Annual | Homelessness counts, demographics |
| CHAS | 5-year | Detailed housing-cost-burden tabulations |
| PIH (Public Housing) | Continuous | Public-housing authority data |

## Common pitfalls

- **FMR vs. market rent.** Fair Market Rent is HUD's policy number used for voucher reimbursement. It's NOT what the market actually charges — typically lags real market rents by 6-18 months. For market reality, use [Altos](/docs/reference/altos) or rental aggregator data.
- **AMI varies by household size.** "80% of AMI" depends on whether the household has 1, 2, 3, 4+ people. The "Median Income" headline doesn't capture this.
- **Vacancy rates from USPS.** USPS vacancy isn't true vacancy — it counts units the postal carrier marks as vacant for 90+ days. May undercount short-term vacancies and overcount foreclosures.
- **Homeless point-in-time counts undercount.** Most jurisdictions do their PIT count one night in late January. Methodology varies by Continuum of Care, and unsheltered counts especially miss people. Treat as a lower bound.
- **CHAS data is 5-year smoothed.** Like ACS 5-year data — current as of 5 years rolling. For real-time housing affordability changes, layer in faster signals.
- **CBSA vs. county FMRs.** HUD publishes FMRs at the CBSA (metropolitan/micropolitan area) level. Specific counties may have very different actual rents from their CBSA's FMR average.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "hud": {
      "url": "https://gateway.pipeworx.io/hud/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Hud data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
