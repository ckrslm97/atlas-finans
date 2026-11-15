# Unified Atlas workspace — 2026-11-14

## Regional release update — 2026-11-15

The US/Europe limitations below describe the earlier release. They now have
dedicated **ABD Atlas** (`us.html`) and **Avrupa Atlas** (`europe.html`) pages
derived from the BIST layout by `scripts/build-equity-pages.cjs`. Run the generator
after shared BIST UI changes. Both contain market, intelligence, comparison,
simulation and guide sections. Prices/history cover 16 selected companies each;
Yahoo Finance is the single price source. SEC annual statement coverage is 15/16
US and 3/16 Europe, with unsupported fields explicitly absent. Native USD/EUR
accounts and research archives are separate; Global shows all four portfolios
without adding unlike currencies. Regional automatic price/news/filing refreshes
are installed. LIFE OS links directly to these pages. Daily and per-code score
histories are persisted, starting when observations were actually made.

The release passed 42 backend and seven frontend tests. Desktop/mobile checks
covered all five regional sections, filter, details and comparison. Both repositories
preserve `before-us-eu-markets-20261114` for rollback. This update supersedes the
earlier statements about missing regional price support; it does not imply full
fundamental coverage or a proven profitable trading model.

Global Atlas now uses the same styles, typography, top navigation and market switcher as BIST / ETF. Shared switcher order: Global, BIST, US stocks, Europe stocks, ETF. US and Europe preserve market/type in the URL and open the screener first. Global opens the combined result summary first.

## Live data and boundaries

- GET global: sourced instrument registry and official-source health.
- GET portfolio for bist/etf: independent account totals, positions and trades. Combined KPI adds these two TRY accounts only. A missing valuation prevents a fabricated complete total. Return is profit / contributed capital, not a time-weighted return.
- GET signals: separate approval-driven paper account; never added to the two-account total. 15/30 calendar-day results come directly from stored marks.
- GET research-runs: authenticated, read-only, 50 reports/page, frozen upper timestamp and stable ordering. Original saved reports shown in a native dialog; inputs are not exposed by this endpoint. Latest loaded result per market/code/model supplies the descriptive test summary. No statistical significance or portfolio backtest is inferred from MAE comparison.
- Refresh re-reads account and test snapshots and refreshes official SEC/ECB sources. It does not generate trades, send email or retrain models. Market-price refresh remains in the market workspaces.
- US price source and Europe stock coverage remain incomplete. CSPX is classified as an ETF, not a European stock. Missing prices/scores remain unknown.

## Validation

7 unit regressions: exact-cent aggregation, missing quote/account, currency mismatch, zero capital, latest-run deduplication, unavailable forecasts, separate market identities. Existing 34 backend tests pass. Live API responses for global, both portfolios, signals, test list and ETF test filter return 200; invalid offset returns 400, unauthenticated access returns 401. Browser rendering exercised against captured real API responses (requests mocked only in a separate test browser), with no JS errors and no document overflow at 320/390/768/1024/1440px. Test dialog, refresh action, market switcher, test filter, US selection and Europe stock/ETF distinction checked. No production trades or portfolio state changed.

## Rollback

Both repos tagged `before-unified-atlas-20261114`. Previous API v47; new archive endpoint deployed in v49. Revert frontend commit or publish the tagged tree to restore the previous screens. No schema/data migration required.
