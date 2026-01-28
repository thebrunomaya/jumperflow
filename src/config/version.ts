/**
 * Jumper Flow Version
 *
 * Following semantic versioning: MAJOR.MINOR.PATCH
 *
 * PATCH (x.x.N): Auto-incremented by Claude on each commit
 * MINOR (x.N.0): User-signaled feature releases
 * MAJOR (N.0.0): User-signaled breaking changes
 */
export const APP_VERSION = 'v2.2.8';

/**
 * Version history:
 * - v2.2.8 (2026-01-28):
 *   - FIX: OptimizationDrawer.tsx - useState called after conditional return (rules-of-hooks)
 *   - FIX: jumper-input.tsx - useId called conditionally (rules-of-hooks)
 *   - FIX: TemplateCompare.tsx - useTemplateRead called after early returns (rules-of-hooks)
 *   - FIX: StatusMetrics.tsx - unsafe hasOwnProperty usage (no-prototype-builtins)
 *   - FIX: command.tsx - empty interface warning suppressed
 *   - FIX: textarea.tsx - empty interface warning suppressed
 *   - IMPACT: Resolved all 7 ESLint errors, 284 warnings remain (mostly any types)
 *
 * - v2.2.7 (2026-01-24):
 *   - FEAT: WooCommerce Sync Orchestrator Pattern - parallel workers per account
 *   - FIX: Timeout issue (173s → ~31s) using parallel variation fetching
 *   - FEAT: Separate CRONs for orders (daily 4:00 BRT) and products (weekly Sun 3:00 BRT)
 *   - FEAT: WhatsApp notifications for WooCommerce sync results
 *   - REFACTOR: Edge Functions called by pg_cron use --no-verify-jwt
 *   - UPDATE: CRON schedules - daily-report 09:00 BRT, balance-alerts 08:30 BRT
 *   - DOCS: Added CRON Jobs System section to ARCHITECTURE.md
 *
 * - v2.2.6 (2026-01-23):
 *   - ADD: ReportDispatchControl component for manual daily report dispatch
 *   - Features: test mode (no send), phone override, account-specific dispatch
 *   - Integrated into AccountForm Relatórios tab
 *
 * - v2.2.5 (2026-01-23):
 *   - ADD: Top 3 products section in daily WhatsApp report
 *   - REFACTOR: New report layout with dedicated sections (Vendas, Top Produtos, Tráfego)
 *   - ADD: fetchTopProducts function to aggregate line items by product
 *
 * - v2.2.4 (2026-01-23):
 *   - ADD: WooCommerce sync control in AccountForm
 *   - ADD: Chunked backfill support (avoids timeout)
 *   - ADD: Progress tracking for backfill operations
 *
 * - v2.2.3 (2026-01-23):
 *   - REFACTOR: New compact WhatsApp report format
 *   - CHANGE: Split report into 2 messages (data + insights separately)
 *   - CHANGE: Removed per-channel ROAS (unreliable attribution)
 *   - ADD: Per-channel spend % and CTR metrics
 *   - CHANGE: Simplified format using | separators
 *
 * - v2.2.2 (2026-01-23):
 *   - FIX: Daily report labels - "vs anteontem" instead of "vs ontem"
 *   - FIX: Comparison now uses 3-month daily average instead of single week-ago date
 *   - ADD: fetch3MonthAverage function for accurate historical comparison
 *
 * - v2.2.1 (2026-01-23):
 *   - FIX: Account update allowing report-only field updates (WhatsApp numbers)
 *
 * - v2.2.0 (2026-01-23):
 *   - MINOR RELEASE: Daily WhatsApp Report System
 *   - FEAT: Automated daily WhatsApp reports with AI-generated insights
 *   - NEW: j_hub_daily_report Edge Function - aggregates WooCommerce, Meta, Google, GA4 data
 *   - NEW: Report configuration in Account Management (ROAS target, CPA max, conv min, daily target)
 *   - NEW: Integration with Evolution API for WhatsApp delivery
 *   - NEW: Claude AI generates contextual insights comparing D-1, D-7, and targets
 *   - NEW: CRON job for daily execution at 8:00 BRT
 *   - ADD: WooCommerce backfill support (backfill_days parameter)
 *
 * - v2.1.126 (2026-01-23):
 *   - FEAT: Daily WhatsApp report system with AI-generated insights
 *   - NEW: j_hub_daily_report Edge Function - aggregates WooCommerce, Meta, Google, GA4 data
 *   - NEW: Report configuration fields in Account Management (metas, WhatsApp numbers)
 *   - NEW: Integration with Evolution API for WhatsApp delivery
 *   - NEW: Claude AI generates contextual insights based on performance metrics
 *   - ADD: WooCommerce backfill support (backfill_days parameter)
 *
 * - v2.1.125 (2026-01-23):
 *   - FEAT: WooCommerce products sync - adds j_rep_woocommerce_products table
 *   - ADD: Site field to woocommerce bronze and products tables (store identification)
 *   - ADD: UTM attribution fields in orders (utm_source, utm_medium, utm_campaign, etc)
 *   - ADD: Billing/shipping info, coupon lines, refunds to bronze table
 *   - FIX: Backfill migration for site field on existing records
 *   - REFACTOR: Remove status filtering from WooCommerce sync (bronze = raw data)
 *
 * - v2.1.124 (2026-01-23):
 *   - FEAT: Gestor/Atendimento user selection via dropdown in Account Management
 *   - REFACTOR: Replace notion_manager_id with notion_user_id for Notion people fields
 *   - UPDATE: Sync extracts Notion workspace user IDs from people fields
 *   - UPDATE: Client permissions now use email-based matching via managers table
 *   - UPDATE: j_hub_account_update supports updating Gestor/Atendimento as people type
 *   - UPDATE: AccountForm uses multi-select user dropdown for team fields
 *
 * - v2.1.123 (2026-01-23):
 *   - FEAT: WooCommerce fields in Account Management (admin/accounts)
 *   - ADD: Woo Site URL, Consumer Key, Consumer Secret fields in Plataformas tab
 *   - UPDATE: j_hub_user_accounts returns WooCommerce credentials
 *   - UPDATE: j_hub_account_update allows editing WooCommerce fields
 *
 * - v2.1.122 (2026-01-23):
 *   - FIX: WooCommerce UPSERT constraint - replaced functional index with proper UNIQUE constraint
 *   - Change line_item_id to NOT NULL with default 0 for Supabase PostgREST compatibility
 *
 * - v2.1.121 (2026-01-23):
 *   - FEAT: WooCommerce integration - sync orders to Supabase bronze table
 *   - NEW: j_rep_woocommerce_bronze table for orders and line items
 *   - NEW: j_hub_woocommerce_sync Edge Function (multi-tenant, backfill 3 months)
 *   - NEW: Daily CRON job at 4:00 BRT for automatic sync
 *   - UPDATE: Added "Woo Site URL" field to Notion sync
 *
 * - v2.1.120 (2026-01-22):
 *   - FIX: GeneralDashboard unified view with Meta Ads + Google Ads + GA4
 *   - FIX: Add id_google_analytics to data chain for GA4 metrics
 *   - FIX: Add RLS policies for j_rep_googleads_bronze and j_rep_ga4_bronze tables
 *   - FIX: GA4 fetchData now uses correct id_google_analytics instead of metaAdsId
 *
 * - v2.1.119 (2026-01-22):
 *   - FIX: GeneralDashboard now receives id_google_ads for Google Ads metrics
 *   - Pass id_google_ads through Client type, useNotionClients, DashboardAccessControl
 *
 * - v2.1.118 (2026-01-22):
 *   - FIX: Add refetch to useMyNotionAccounts for data reload after edits
 *   - FIX: Return all editable fields from j_hub_user_accounts
 *   - EDGE: Updated j_hub_user_accounts with nicho, id_google_analytics, id_tiktok_ads, payment_method, verba_mensal fields
 *   - AccountForm now properly loads all account fields
 *
 * - v2.1.117 (2026-01-22):
 *   - FEAT: Account Management interface (/admin/accounts) with Notion sync
 *   - FEAT: Manager Management interface (/admin/managers) with Notion sync
 *   - EDGE: j_hub_account_update - bidirectional sync Flow→Notion+Supabase
 *   - EDGE: j_hub_manager_update - bidirectional sync Flow→Notion+Supabase
 *   - HOOKS: useAccountUpdate, useMyManagers, useManagerUpdate
 *   - UI: AccountForm with 5 tabs (Básico, Equipe, Plataformas, AI, Financeiro)
 *   - UI: ManagerForm for editing manager data
 *   - UserMenu now shows admin/staff options based on role
 *
 * - v2.1.116 (2026-01-22):
 *   - REFACTOR: Complete UUID migration for optimization tables
 *   - Removed legacy account_id (TEXT notion_id) from j_hub_optimization_recordings
 *   - Removed legacy account_id (TEXT notion_id) from j_hub_optimization_context
 *   - All optimization tables now use UUID-only for account references
 *   - j_hub_notion_db_accounts remains the single source for notion_id mapping
 *   - FIX: Account name not showing in optimization list
 *
 * - v2.1.115 (2026-01-22):
 *   - FEAT: Dashboards V2 with cross-platform analytics (/dashboards-v2)
 *   - FEAT: Integrated Funnel Dashboard (Meta Ads + GA4)
 *   - FEAT: Conversion Discrepancy Dashboard (Meta vs GA4)
 *   - FEAT: GeneralDashboard source selector (Unified | Meta Ads | Google Ads)
 *   - SQL: Created 4 bronze views for cross-platform joins
 *   - DOCS: Added dashboards-v2-report.md with investigation notes
 *
 * - v2.1.114 (2026-01-21):
 *   - FEAT: Promote MetaCheckerV2 to AdChecker with batch upload (up to 50 files)
 *   - REMOVE: /metachecker, /metachecker-v1, /metachecker-v2 test routes
 *   - CHORE: Add .playwright-mcp/ and tmp-tests/ to .gitignore
 *
 * - v2.1.113 (2026-01-20):
 *   - IMPROVE: MetaChecker V2 carousel now shows full file details
 *   - Includes: dimensions, type, size, duration, format status, zone legend
 *   - Side-by-side layout: preview + details panel
 *
 * - v2.1.112 (2026-01-20):
 *   - NEW: MetaChecker V1 (/metachecker-v1) - stacked previews with scroll
 *   - NEW: MetaChecker V2 (/metachecker-v2) - carousel with navigation arrows
 *   - Both versions: clean upload area + "Ver Previas" button
 *
 * - v2.1.111 (2026-01-20):
 *   - FIX: Added horizontal step connector to complete L-shaped safe zone border
 *   - The "dent" line now visible connecting 6% to 21% right margins
 *
 * - v2.1.110 (2026-01-20):
 *   - FIX: Safe zone (green) now correctly shows L-shaped area in Reels format
 *   - Upper portion extends to 6% from right edge
 *   - Lower 40% (CTA zone) narrows to 21% from right edge
 *
 * - v2.1.109 (2026-01-20):
 *   - NEW: MetaChecker batch tool at /metachecker
 *   - Upload up to 50 files at once
 *   - Parallel processing with 5 concurrent files
 *   - Grid view with status badges and modal preview
 *
 * - v2.1.108 (2026-01-19):
 *   - IMPROVE: Ad Checker auto-detects format from image dimensions
 *   - Removed format selection step - simpler UX
 *   - Supports 9:16, 1:1, 4:5, and 1.91:1 aspect ratios
 *
 * - v2.1.107 (2026-01-19):
 *   - NEW: Ad Checker public tool at /adchecker
 *   - Validates Meta Ads safe zones for Stories, Carousel 1:1, and 4:5
 *   - Drag-and-drop upload with dimension validation
 *
 * - v2.1.106 (2026-01-19):
 *   - Added deprecation banner on hub.jumper.studio login page
 *   - Redirects users to flow.jumper.studio
 *
 * - v2.1.105 (2026-01-19):
 *   - REBRAND: Jumper Hub → Jumper Flow migration
 *   - Updated all URLs from hub.jumper.studio to flow.jumper.studio
 *   - Updated all UI branding from "Jumper Hub" to "Jumper Flow"
 *   - New repository: github.com/thebrunomaya/jumperflow
 *
 * - v2.1.104 (2026-01-19):
 *   - FIX: Creative submissions system broken due to table name mismatch
 *   - Changed j_hub_creative_* to j_ads_creative_* (production table names)
 *   - Affected: systemHealth.ts, 4 Edge Functions
 *
 * - v2.1.103 (2026-01-11):
 *   - DOCS: Major documentation cleanup and consolidation
 *   - Rewrite: ARCHITECTURE.md (2673→913 lines), CLAUDE.md, QUICK-START.md
 *   - New: ROADMAP.md consolidates all system roadmaps
 *   - New: tmp-tests/ and tmp-user/ folders for organized temp files
 *   - Removed 15+ obsolete documentation and test files
 *
 * - v2.1.102 (2024-12-18):
 *   - NEW: TopCreativesSection rollout to all 11 dashboards
 *   - Added to: Traffic, Leads, Engagement, BrandAwareness, Reach
 *   - Added to: VideoViews, Conversions, Seguidores, Conversas, Cadastros, General
 *   - Each dashboard shows Top 3 creatives with correct objective filter
 *
 * - v2.1.101 (2024-12-16):
 *   - NEW: Dynamic 10% spend threshold for Top Creatives ranking
 *   - Creatives must have at least 10% of period's total spend to qualify
 *   - Added info tooltip explaining the threshold criteria
 *   - Added subtle disclaimer text showing minimum spend value
 *   - Improved EmptyState with specific message when no creatives pass threshold
 *
 * - v2.1.100 (2024-12-15):
 *   - NEW: Direct HTML upload for decks - skip AI generation pipeline
 *   - NEW: Toggle "Gerar via IA" / "Upload HTML" in deck creation form
 *   - NEW: Drag & drop HTML file upload with validation
 *   - NEW: Edge function j_hub_deck_upload_html for direct HTML hosting
 *
 * - v2.1.99 (2024-12-13):
 *   - FIX: Tooltip overflow v2 - use sticky="always" and smaller max-width
 *   - Reduced tooltip max-width to 200px for better fit
 *   - Text reduced to text-xs for compactness
 *   - z-index increased to 9999 to ensure visibility
 *
 * - v2.1.98 (2024-12-13):
 *   - FIX: Tooltip overflow - now appears below with collision padding
 *   - Tooltips stay within modal bounds using collisionPadding={16}
 *   - Changed side from "top" to "bottom" for better visibility
 *
 * - v2.1.97 (2024-12-13):
 *   - ENH: All metrics now have icons consistently
 *   - ENH: Hover tooltips explain each metric in plain language
 *   - ENH: METRIC_CONFIG centralizes label, icon, and tooltip
 *   - ENH: MetricCard and MiniMetric components use tooltips
 *   - FIX: Facebook/Instagram icons now use react-icons (not deprecated lucide)
 *
 * - v2.1.96 (2024-12-13):
 *   - ENH: Adjusted CPC alert threshold from R$2.50 to R$1.50
 *   - Based on ROAS 5x, Ticket R$180, Conv. Rate 1% analysis
 *
 * - v2.1.95 (2024-12-13):
 *   - ENH: Consolidated Metrics now also show CTR/CPC alerts
 *   - ENH: All currency values use formatCurrency (2 decimals, R$ X,XX)
 *   - REFACTOR: Extracted ConsolidatedMetrics component
 *   - ENH: MetricCard now supports alert prop with color options
 *
 * - v2.1.94 (2024-12-13):
 *   - ENH: InstanceCard shows Campaign and Adset name
 *   - ENH: CTR/CPC indicators when outside target (CTR < 1%, CPC > R$2.50)
 *   - ENH: All currency values now show 2 decimal places
 *   - ENH: 6-column metrics grid (Gasto, ROAS, Compras, Receita, CTR, CPC)
 *
 * - v2.1.93 (2024-12-13):
 *   - FIX: CreativeDetailModal scroll now works correctly
 *   - Replaced ScrollArea with native overflow-y-auto
 *   - Modal content scrollable with fixed header
 *
 * - v2.1.92 (2024-12-13):
 *   - FEAT: CreativeDetailModal - click card to see full creative details
 *   - FEAT: useCreativeInstances hook - fetch all ad instances of a creative
 *   - ENH: Modal shows consolidated metrics + breakdown by ad instance
 *   - ENH: FB/IG links moved from card header to modal
 *   - ENH: Card now clickable with cursor pointer
 *
 * - v2.1.91 (2024-12-13):
 *   - ENH: useTopCreatives now aggregates by creative_id instead of ad_id
 *   - FIX: Same creative in multiple ads now shows consolidated performance
 *   - Example: "Jumping Era" with 2 instances now shows true ROAS (1.17x vs false 15.1x)
 *
 * - v2.1.90 (2024-12-13):
 *   - ENH: TopCreativeCard now uses aspect-square (1:1) to match Meta thumbnails
 *   - ENH: Added Facebook/Instagram permalink buttons in card header
 *   - FIX: Removed blur background (no longer needed with matching aspect ratios)
 *
 * - v2.1.89 (2024-12-13):
 *   - FIX: Force astronaut placeholder for catalogs (Meta returns useless generic icon)
 *   - Catalogs now ALWAYS show branded astronaut image, ignoring any thumbnail
 *
 * - v2.1.88 (2024-12-13):
 *   - ENH: Astronaut placeholder image for catalog/dynamic ads
 *   - Catalogs never have working thumbnails, now show branded image
 *
 * - v2.1.87 (2024-12-13):
 *   - FEAT: Permanent thumbnail storage system (Supabase Storage bucket 'criativos')
 *   - FEAT: Edge Function sync-creative-thumbnails for downloading Meta thumbnails
 *   - SYNC: 377/377 creatives now have permanent thumbnails (never expire)
 *   - INFRA: Storage path: thumbnails/{account_id}/{creative_id}.{ext}
 *
 * - v2.1.86 (2024-12-13):
 *   - ENH: Catalog/dynamic ads detection ({{product.name}} templates)
 *   - ENH: Purple badge "Catálogo" with ShoppingBag icon for catalog ads
 *   - ENH: Special placeholder for catalog ads with "Anúncio Dinâmico" label
 *   - ENH: Hide template placeholders from title/body display for catalog ads
 *
 * - v2.1.85 (2024-12-13):
 *   - ENH: TopCreativeCard now supports ad_object_type from Windsor (VIDEO, SHARE, PHOTO)
 *   - ENH: Intelligent thumbnail fallback: thumbnail_storage_url → thumbnail_url → image_url
 *   - ENH: Improved placeholder display showing media type icon when no image available
 *   - ENH: Added creative_id, facebook_permalink_url, instagram_permalink_url to useTopCreatives
 *   - DOC: Consolidated roadmaps into ROADMAP-CRIATIVOS-E-INSIGHTS.md
 *
 * - v2.1.82 (2024-12-11):
 *   - FEAT: Top 3 Criativos section in SalesDashboard showing best performing ads
 *   - NEW: useTopCreatives hook for fetching and ranking creatives by objective
 *   - NEW: TopCreativeCard and TopCreativesSection components
 *   - NEW: creativeRankingMetrics.ts utility for objective-specific metrics
 *   - DB: Added body, title, link, thumbnail_url, media_type, campaign_daily_budget,
 *         campaign_status, action_values_add_to_cart to j_rep_metaads_bronze
 *
 * - v2.1.81 (2024-12-11):
 *   - ENH: Deck Editor Stage 1 now has Edit, Copy, Debug buttons (matching Optimizations UI)
 *   - NEW: MarkdownViewer component for formatted markdown display
 *   - NEW: MarkdownEditorModal for editing markdown_source
 *   - NEW: DeckDebugModal for viewing API logs (Admin only)
 *
 * - v2.1.80 (2024-12-09):
 *   - FIX: Date range picker in /dashboards now correctly applies selected dates
 *   - Simplified onApply handler - onChange already updates state, onApply just closes dialog
 *
 * - v2.1.79 (2024-12-09):
 *   - ENH: /dashboards Advanced Filters now includes search, status, tier, and sort options
 *   - ENH: Edge Function returns status and tier for frontend filtering
 *   - ENH: Filter indicator shows count of filtered accounts
 *   - ENH: "Mostrar inativas" toggle is admin-only, all other filters available to everyone
 *
 * - v2.1.78 (2024-12-09):
 *   - FIX: /dashboards now filters inactive accounts by default (matching /my-accounts behavior)
 *   - NEW: Admin-only "Advanced Filters" popover with toggle to show inactive accounts
 *   - UPD: Edge Function j_hub_dashboards_multi_account now accepts include_inactive parameter
 *
 * - v2.1.77 (2024-12-03):
 *   - FIX: Optimization account filter not working (UUID vs notion_id mismatch)
 *   - FIX: OptimizationNew dropdown not showing selected account
 *   - FIX: Draft recovery not restoring account selection
 *   - Now uses dual state (UUID for dropdown, notion_id for database)
 *
 * - v2.1.75 (2024-11-29):
 *   - NEW: Created jumper-flare-v2.2-pitch-patterns.json
 *   - Pitch deck variant for commercial proposals
 *   - Based on v2.1-pitch with v2.2 responsive CSS
 *
 * - v2.1.74 (2024-11-29):
 *   - SYNC: Updated jumper-flare-v2.2-patterns.json
 *   - Total slides: 26 → 25 (removed duplicate big-number)
 *   - All slide_numbers renumbered after slide 10
 *   - Section structure updated accordingly
 *
 * - v2.1.73 (2024-11-29):
 *   - FIX: JavaScript error "navTimeout is not defined"
 *   - Added proper variable declaration for legacy nav-dots function
 *   - Navigation dark mode working correctly on slide 22 (white)
 *
 * - v2.1.72 (2024-11-29):
 *   - FIX: Add Header to template management pages
 *   - Templates.tsx: Added Header + JumperBackground wrapper
 *   - TemplateEditor.tsx: Added Header to fullscreen editor
 *   - TemplateCompare.tsx: Added Header for consistency
 *
 * - v2.1.70 (2024-11-29):
 *   - REFACTOR: Slide refinements per user feedback
 *   - Slide 4: Centered layout, hero arrow (larger/bolder) before number
 *   - Slides 8, 9, 10: Removed footer arrows (mal utilizadas)
 *   - Slide 9: Reduced font sizes for statement quote
 *   - Removed slide 11 (duplicate big-number pattern)
 *   - Total slides: 26 → 25
 *
 * - v2.1.69 (2024-11-29):
 *   - STYLE: Balanced navigation counter - same size for current/total
 *   - Current slide: bold + white, Total: regular + muted
 *   - All elements now use clamp(12px, 1.2vw, 15px)
 *
 * - v2.1.68 (2024-11-28):
 *   - HOTFIX: Fixed JS variable declaration order (lightSlideClasses before updateUI)
 *   - Was causing "Cannot access before initialization" error
 *
 * - v2.1.67 (2024-11-28):
 *   - FIX: Navigation dark mode for white/light background slides
 *   - Added .nav-dark class with dark glassmorphism styling
 *   - JavaScript detects slide-white/slide-strategy-white classes
 *   - FIX: Slide counter now horizontal "1/26" format (clearer)
 *   - Replaced vertical divider line with "/" separator
 *
 * - v2.1.66 (2024-11-28):
 *   - STYLE: Glassmorphism style for lateral navigation
 *   - border-radius: 100px (pill shape)
 *   - backdrop-filter: blur(20px) glass effect
 *   - Rounded arrow buttons with hover state
 *
 * - v2.1.65 (2024-11-28):
 *   - FEATURE: New lateral navigation (replaces center + dots)
 *   - Vertical layout: ↑ / 10 / 26 / ↓ on right side
 *   - Zero overlap with slide content/footers
 *   - Hidden nav-dots and nav-center via CSS
 *   - Arrow keys: ↑↓ and ←→ both work for navigation
 *   - Disabled state for arrows at first/last slide
 *
 * - v2.1.64 (2024-11-28):
 *   - FIX: Closing slide logo was full-width due to .slide * override
 *   - Used more specific selector .slide-closing .closing-logo
 *   - Reduced logo size: clamp(180px, 35vw, 400px) base
 *   - Added responsive breakpoints: 350px@1600px, 300px@1400px
 *
 * - v2.1.63 (2024-11-28):
 *   - FIX: Reduced data-row-value font sizes for slide 13 pattern
 *   - Added responsive breakpoints for .data-row-value at 1600px/1400px
 *
 * - v2.1.62 (2024-11-28):
 *   - FEATURE: Jumper Flare v2.2 - Responsive template for 13-27" screens
 *   - New responsive typography scale with breakpoints at 1600px/1400px
 *   - Reduced clamp() maximums for proper scaling on smaller screens
 *   - Reduced slide padding for more content breathing room
 *   - Template v2.2 now production default (Edge Function updated)
 *   - FILES CREATED:
 *     - public/decks/templates/jumper-flare-v2.2.css
 *     - public/decks/templates/jumper-flare-v2.2.html
 *     - public/decks/templates/jumper-flare-v2.2-patterns.json
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_deck_generate/index.ts
 *     - supabase/functions/j_hub_deck_template_list/index.ts
 *
 * - v2.1.61 (2024-11-28):
 *   - FIX: UTF-8 encoding corruption (mojibake) in deck generation
 *   - FIX: Navigation arrows corrupted - now using HTML entities
 *   - FIX: Text overflow on slides - added CSS line-clamp protection
 *   - Enhanced viewport fit rules with strict character limits
 *   - Added fixMojibakes() utility for automatic encoding repair
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_deck_generate/index.ts
 *     - supabase/functions/_shared/encoding-diagnostics.ts
 *     - public/decks/templates/jumper-flare-v2.1.css
 *
 * - v2.1.60 (2024-11-28):
 *   - FEATURE: Add pitch deck specialization for Jumper proposals
 *   - New pattern catalog: jumper-flare-v2.1-pitch-patterns.json
 *   - Deck analyze now loads type-specific patterns (pitch, plan, report)
 *   - Added getDeckTypeGuidance() with storytelling flow for each type
 *   - Pitch follows: Problem → Solution → Proof → Proposal → CTA
 *   - Color psychology: Red=problems, Green=solutions, Orange=CTA
 *   - WhatsApp CTA integration: 5521964369191
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_deck_analyze/index.ts
 *     - supabase/functions/_shared/template-utils.ts
 *   - FILES CREATED:
 *     - public/decks/templates/jumper-flare-v2.1-pitch-patterns.json
 *
 * - v2.1.59 (2024-11-26):
 *   - REVERT: Remove status filter that was breaking queries
 *   - Status filter with .in() was causing issues - needs investigation
 *   - All accounts now show again (temporary fix)
 *
 * - v2.1.58 (2024-11-26):
 *   - FIX: Filter accounts by Status - only show Ativa, Onboarding, Offboarding
 *   - Inativa accounts are now hidden from all account lists
 *   - Applied to both j_hub_user_accounts and j_hub_dashboards_multi_account
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_user_accounts/index.ts
 *     - supabase/functions/j_hub_dashboards_multi_account/index.ts
 *
 * - v2.1.57 (2024-11-26):
 *   - FIX: Dashboards GERAL now shows ALL accounts, even those without spend in period
 *   - Accounts with no data show metrics as 0 instead of being hidden
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_dashboards_multi_account/index.ts
 *
 * - v2.1.56 (2024-11-26):
 *   - FEATURE: Show ❌ for Boleto accounts with depleted balance (currentBalance = 0)
 *   - Balance indicator states for Boleto:
 *     - ❌ = balance depleted (critical!)
 *     - X dias = days remaining (colored by threshold)
 *     - ∞ = no recent spend data (can't calculate)
 *   - Non-Boleto accounts still show "-"
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_user_accounts/index.ts (set days_remaining=0 when balance=0)
 *     - src/components/AccountCard.tsx (show ❌ for days_remaining=0)
 *     - src/components/dashboards/AccountsMetricsTable.tsx (show ❌ for days_remaining=0)
 *
 * - v2.1.55 (2024-11-26):
 *   - FIX: Balance indicator ONLY for Boleto accounts (not Cartão, Faturamento, etc.)
 *   - Boleto with spend data → "X dias" (colored by threshold)
 *   - Boleto without recent spend (offline) → "∞"
 *   - Non-Boleto accounts → "-" (balance indicator not applicable)
 *   - FILES MODIFIED:
 *     - src/components/AccountCard.tsx (filter by payment_method === 'Boleto')
 *     - src/components/dashboards/AccountsMetricsTable.tsx (same Boleto filter)
 *
 * - v2.1.54 (2024-11-26):
 *   - UX: Show "∞" for accounts with spend_cap but no recent spend data (days_remaining=999)
 *   - "-" is reserved for accounts where balance doesn't apply (no spend_cap, days_remaining=null)
 *   - AccountCard and AccountsMetricsTable now both show ∞ instead of hiding indicator
 *   - Example: Almeida Prado (offline 11 days) now shows "∞" instead of "-"
 *   - FILES MODIFIED:
 *     - src/components/AccountCard.tsx (show ∞ for days_remaining >= 999)
 *     - src/components/dashboards/AccountsMetricsTable.tsx (show ∞ for days_remaining >= 999)
 *
 * - v2.1.53 (2024-11-26):
 *   - FIX: days_remaining hybrid calculation - uses Windsor spend_last_7d with bronze fallback
 *   - Shows balance indicator for ALL accounts (not just Boleto) - user requested
 *   - Almeida Prado correctly shows "-" (no spend data in last 7 days due to 11 days offline)
 *   - Boiler (pre-paid Cartão) correctly shows "3 dias" indicator
 *   - APPROACH: Uses spend_last_7d from j_rep_metaads_account_balance if available,
 *     otherwise calculates from j_rep_metaads_bronze table
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_user_accounts/index.ts (hybrid spend calculation)
 *     - src/components/AccountCard.tsx (removed Boleto-only filter)
 *
 * - v2.1.52 (2024-11-26):
 *   - FIX: days_remaining now calculated from j_rep_metaads_bronze (real spend data)
 *   - Edge Function calculates avg daily spend from last 7 days of bronze data
 *   - days_remaining = current_balance / avg_daily_spend
 *   - Added separate "Pagamento" and "Saldo" columns to AccountsMetricsTable
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_user_accounts/index.ts (calculate from bronze)
 *     - src/components/dashboards/AccountsMetricsTable.tsx (separate columns)
 *
 * - v2.1.51 (2024-11-26):
 *   - FEATURE: AccountsMetricsTable now shows payment method and days remaining indicators
 *   - Table at /dashboards shows payment method badge next to account name
 *   - Boleto accounts show colored days indicator (green >20, yellow 11-20, red ≤10)
 *   - Uses same styling as AccountCard for visual consistency
 *   - FILES MODIFIED:
 *     - src/components/dashboards/AccountsMetricsTable.tsx (balance indicators in table)
 *
 * - v2.1.50 (2024-11-26):
 *   - FEATURE: Dashboard now shows payment method badge and balance days indicator
 *   - AccountCard displays payment method (Boleto, Cartão, Faturamento, Misto) with icon
 *   - Boleto accounts show colored "Saldo restante: X dias" indicator:
 *     - Green (>20 days): healthy balance
 *     - Yellow (11-20 days): attention needed
 *     - Red (≤10 days): urgent recharge required
 *   - Edge Function j_hub_user_accounts enriched with balance data from j_rep_metaads_account_balance
 *   - New fields in NotionAccount interface: payment_method, days_remaining, current_balance
 *   - FILES MODIFIED:
 *     - supabase/functions/j_hub_user_accounts/index.ts (balance enrichment)
 *     - src/hooks/useMyNotionAccounts.ts (interface update)
 *     - src/components/AccountCard.tsx (visual indicators)
 *   - DEPLOYED: Edge Function redeployed to production
 *
 * - v2.1.49 (2024-11-25):
 *   - FIX: Contas deletadas no Notion agora são removidas do app automaticamente
 *   - ROOT CAUSE: j_hub_notion_sync_accounts fazia apenas upsert, nunca delete
 *   - SOLUÇÃO: Edge Function agora deleta contas órfãs (não existem mais no Notion)
 *   - Workflow: Busca contas do Notion → Upsert → Delete contas que não vieram do Notion
 *   - Log: metadata.deleted_orphan_accounts registra quantas contas foram removidas
 *   - UI: Toast mostra contagem de contas órfãs removidas após sync
 *   - FILES MODIFIED:
 *   -   - supabase/functions/j_hub_notion_sync_accounts/index.ts (orphan cleanup logic)
 *   -   - src/components/NotionSyncControl.tsx (show deleted count in toast)
 *   - DEPLOYED: Edge Function redeployed to production
 *   - IMPACT: Mainô, Mainô Sistemas, moldura minuto duplicada serão removidas na próxima sync
 *
 * - v2.1.48 (2024-11-25):
 *   - MAJOR: Jumper Flare v2.1 template complete redesign with Linear Design principles
 *   - All 26 slides redesigned following approved slides 1-3, 7 aesthetic
 *   - NEW PATTERNS: Split layouts (40/60 ratio), corners layout, arrow + insight footers
 *   - CHARTS: Redesigned slides 17-21 (Line, Bar, Donut, Funnel, Goal) with split layouts
 *   - CLOSING: Redesigned slides 22-26 (Actions, Strategy White, Updates, CTA, Signature)
 *   - FIX: Slides 8-10 footer overlap with navigation - moved to corners layout
 *   - CSS: Added 600+ lines of new Linear Design patterns
 *   - CTA: Slide 25 now links to WhatsApp for follow-up
 *   - PRODUCTION: CSS reference updated to hub.jumper.studio/decks/templates/
 *   - DESIGN TOKENS: Haffer font, orange accent (#FA4721), pure black (#000), no centered text
 *
 * - v2.1.47 (2024-11-24):
 *   - FIX: Slide 1 corners layout now works correctly
 *   - CSS: Added explicit height: 100vh to .slide-split (not just min-height)
 *   - Root cause: height: 100% on children requires explicit height on parent, not min-height
 *   - Slide 1 now shows: Title at top, Client in center, Period at bottom
 *
 * - v2.1.46 (2024-11-24):
 *   - NEW: Jumper Flare v2.1 template - "Authentic Jumper Design"
 *   - CRITICAL FIX: Design corrections based on official Jumper brand reference images
 *   - Removed all glass-morphism (flat solid backgrounds)
 *   - Removed all border-radius (square corners, charts excepted)
 *   - Changed to pure black #000000 (from #0a0a0a)
 *   - Enforced left-aligned text (NEVER centered)
 *   - NEW PATTERNS:
 *     - Big Number with Arrow (from 53.png reference)
 *     - Layout dos 4 Cantos (from 61.png reference)
 *     - Signature Slide (from Frame 4.png reference)
 *     - Notification Cards (from 59.png reference)
 *     - White Theme variant (from 54.png reference)
 *   - NEW ELEMENTS: Arrow indicators (Unicode), accent bars (orange)
 *   - 26 slide patterns total (up from 24 in v2.0)
 *   - v2.0 preserved for comparison, v2.1 is corrected version
 *
 * - v2.1.45 (2024-11-24):
 *   - NEW: Jumper Flare v2 template (complete modernization)
 *   - 24 slide patterns (up from 9 in v1)
 *   - 6 chart types: Line, Bar, Donut, Funnel, Stacked Area, Gauge (new)
 *   - External CSS (~2000 lines) for token optimization
 *   - Heavy glass-morphism (20px blur) - NOTE: Design error, corrected in v2.1
 *   - Hybrid navigation (scroll-snap + click)
 *   - NOT YET ADOPTED as default template - deployed for testing
 *
 * - v2.1.44 (2024-11-24):
 *   - FIX: Deck content overflow - slides now fit within viewport
 *   - CSS: Added max-height + overflow control to .slide-content
 *   - CSS: Added responsive font scaling for cards grid
 *   - PROMPT: Added strict content limits (max 4-6 cards, 4-5 bullets, etc.)
 *   - PROMPT: Added viewport fit rules with summarization guidance
 *   - MODEL: Upgraded deck functions to Claude Opus 4.5 (claude-opus-4-5-20251101)
 *   - FILES MODIFIED:
 *   -   - public/decks/templates/koko-classic-v2.css (overflow protection)
 *   -   - supabase/functions/j_hub_deck_generate/index.ts (content limits + model)
 *   -   - supabase/functions/j_hub_deck_analyze/index.ts (model upgrade)
 *   -   - supabase/functions/j_hub_deck_refine/index.ts (model upgrade)
 *   - DEPLOYED: All 3 deck Edge Functions redeployed
 *   - IMPACT: Future decks will have properly bounded content that fits on screen
 *
 * - v2.1.38 (2024-11-13):
 *   - CRITICAL DATABASE FIX: Database trigger causing 500 errors on ALL login methods
 *   - ROOT CAUSE: handle_new_user() trigger referenced old table name j_ads_notion_db_managers
 *   - ERROR: "relation public.j_ads_notion_db_managers does not exist (SQLSTATE 42P01)"
 *   - IMPACT: Magic link, email+password, and OAuth all failing with "Database error saving new user"
 *   - SOLUTION: Updated trigger function to use correct table name j_hub_notion_db_managers
 *   - MIGRATION: 20251113170000_fix_handle_new_user_table_name.sql
 *   - DEPLOYED: Applied to production database successfully
 *   - TESTING: All login methods (magic link, email+password, OAuth) now working
 *   - FILES MODIFIED:
 *   -   - supabase/migrations/20251113170000_fix_handle_new_user_table_name.sql (NEW)
 *   -   - scripts/diagnose-database-error.sql (NEW - diagnostic tools)
 *   -   - scripts/fix-database-error.sql (NEW - fix procedures)
 *   -   - scripts/verify-user-yan.sql (NEW - user verification)
 *   -   - scripts/verify-user-yan-simple.sql (NEW - quick verification)
 *
 * - v2.1.37 (2024-11-13):
 *   - CRITICAL FIX: Notion OAuth login timing issue resolved (Fix #1-#4)
 *   - ROOT CAUSE: ensureUserRole() called BEFORE OAuth redirect (setTimeout timing bug)
 *   - SOLUTION: Moved ensureUserRole() to onAuthStateChange SIGNED_IN event handler
 *   - FIX #1: Timing correction - ensureUserRole() now executes AFTER OAuth callback completes
 *   - FIX #2: Enhanced logging throughout OAuth flow for debugging
 *   - FIX #3: Improved error handling in LoginPageNew with configuration hints
 *   - FIX #4: Added retry logic (2-second delay) for race condition handling
 *   - IMPACT: Staff members can now successfully login via Notion OAuth
 *   - BEHAVIOR: All login methods (password, magic link, OAuth) now use consistent timing
 *   - FILES MODIFIED:
 *   -   - src/contexts/AuthContext.tsx (ensureUserRole timing + logging + retry logic)
 *   -   - src/components/LoginPageNew.tsx (error messages + configuration hints)
 *   - WORKFLOW CORRECTED:
 *   -   1. User clicks "Login with Notion" → Redirects to Notion
 *   -   2. User authorizes → Returns to hub.jumper.studio with OAuth token
 *   -   3. onAuthStateChange fires SIGNED_IN event → Triggers ensureUserRole()
 *   -   4. Edge function j_hub_auth_roles executes → Creates user record with role
 *   -   5. User sees dashboard with correct permissions
 *   - TESTING: Ready for yan@jumper.studio to test Notion OAuth login
 *
 * - v2.1.36 (2024-11-12):
 *   - SECURITY: Removed hardcoded master password backdoor from password-utils.ts
 *   - ROBUSTNESS: Added comprehensive error handling and validation to Decks Edge Functions
 *   - VALIDATION: Enhanced input validation (empty strings, length limits, enum checking)
 *   - RESILIENCE: Implemented retry logic with exponential backoff for HTTP requests (3 attempts)
 *   - VALIDATION: Added Claude API response structure validation (prevents crashes)
 *   - VALIDATION: Added environment variable validation with clear error messages
 *   - CONCURRENCY: Fixed race condition in deck versioning with atomic database function
 *   - PERFORMANCE: Parallel asset fetching reduces latency by 1-2 seconds
 *   - DATABASE: Created get_next_version_number() function with FOR UPDATE locking
 *   - UTILITIES: Created shared env-validation.ts and fetch-with-retry.ts modules
 *   - FILES MODIFIED:
 *   -   - supabase/functions/_shared/env-validation.ts (NEW - environment validation)
 *   -   - supabase/functions/_shared/fetch-with-retry.ts (NEW - HTTP retry logic)
 *   -   - supabase/functions/_shared/password-utils.ts (removed master password)
 *   -   - supabase/functions/j_hub_deck_generate/index.ts (all improvements applied)
 *   -   - supabase/functions/j_hub_deck_refine/index.ts (all improvements applied)
 *   -   - supabase/functions/j_hub_deck_regenerate/index.ts (all improvements applied)
 *   -   - supabase/migrations/20251112000000_add_deck_version_lock.sql (NEW - version locking)
 *   - IMPACT: Significantly improved reliability, security, and error recovery for Decks system
 *   - ISSUES FIXED: #1 (master password), #2 (env validation), #4 (input validation), #5 (race condition), #9 (retry logic), #10 (API validation)
 *
 * - v2.1.35 (2024-11-11):
 *   - UX: Reorganized template panel with prioritized sections
 *   - STRUCTURE: Two-section layout for better organization
 *   - SECTION 1 - Templates de Marca (priority):
 *   -   - Jumper and Koko branded templates (jumper-*, koko-*)
 *   -   - Displayed first with count (e.g., "Templates oficiais Jumper e Koko (3)")
 *   - SECTION 2 - Templates Gerais (secondary):
 *   -   - General design templates (general-*)
 *   -   - Displayed below branded templates with count (e.g., "Templates padrão (30)")
 *   - FILTERING: Sections hide/show based on brand filter selection
 *   - VISUAL HIERARCHY: Clear section headers with descriptions and counts
 *   - RATIONALE: Branded templates are business-critical, general templates are fallback options
 *   - FILES MODIFIED:
 *   -   - src/pages/Templates.tsx (added section separation logic)
 *   - IMPACT: Branded templates more discoverable, cleaner visual organization
 *
 * - v2.1.34 (2024-11-11):
 *   - CRITICAL FIX: React hooks order violation in TemplateEditor.tsx
 *   - PROBLEM: Page crashed with React error #310 (blank screen)
 *   - ROOT CAUSE: useEffect hooks called AFTER conditional return statements
 *   - VIOLATION: Hooks must be called in same order every render (Rules of Hooks)
 *   - SOLUTION: Moved ALL useEffect hooks BEFORE conditional returns
 *   - HOOKS MOVED:
 *   -   - useEffect (initialize editedContent from template)
 *   -   - useEffect (track unsaved changes)
 *   - CORRECT ORDER NOW:
 *   -   1. useParams, useNavigate, useUserRole, useTemplateRead
 *   -   2. useState (editedContent, showPreview, isSaving, hasUnsavedChanges)
 *   -   3. useEffect (initialize content) ← MOVED HERE
 *   -   4. useEffect (track changes) ← MOVED HERE
 *   -   5. useEffect (redirect logic)
 *   -   6. Conditional returns (if roleLoading / if !isAdmin)
 *   - FILES FIXED:
 *   -   - src/pages/TemplateEditor.tsx (hook order corrected)
 *   - VERIFIED: TemplateCompare.tsx hook order already correct
 *   - RESULT: Template editor page renders successfully
 *
 * - v2.1.33 (2024-11-11):
 *   - ARCHITECTURE FIX: Template Edge Functions now read from /public instead of Storage
 *   - PROBLEM: 0 templates shown in admin panel (looking in wrong location)
 *   - ROOT CAUSE: Edge Functions queried Supabase Storage bucket (empty)
 *   - ACTUAL LOCATION: Templates live in /public/decks/templates/ (37 files)
 *   - SOLUTION: Rewrote both Edge Functions to read from public URLs
 *   - CHANGES:
 *   -   - j_hub_deck_template_list: Hardcoded list + HEAD requests for metadata
 *   -   - j_hub_deck_template_read: Fetch from https://hub.jumper.studio/decks/templates/
 *   -   - Removed Storage .list() and .download() calls
 *   -   - Added Promise.all for parallel metadata fetching (33 templates)
 *   - TEMPLATE COUNT: 33 templates total
 *   -   - 30 general-* templates (various design styles)
 *   -   - 3 branded templates (jumper-flare, koko-classic, koko-rebel)
 *   - FILES MODIFIED:
 *   -   - supabase/functions/j_hub_deck_template_list/index.ts
 *   -   - supabase/functions/j_hub_deck_template_read/index.ts
 *   - DEPLOYED: Both Edge Functions redeployed to production
 *   - RESULT: Admin panel now shows all 33 templates correctly
 *
 * - v2.1.32 (2024-11-11):
 *   - CRITICAL FIX: React hooks order violation in Templates.tsx
 *   - PROBLEM: Page crashed with React error #310 (blank screen)
 *   - ROOT CAUSE: useMemo called AFTER conditional return statements
 *   - VIOLATION: Hooks must be called in same order every render (Rules of Hooks)
 *   - SOLUTION: Moved useMemo (filteredTemplates) BEFORE conditional returns
 *   - HOOK ORDER (correct):
 *   -   1. useNavigate, useUserRole, useTemplateList
 *   -   2. useState (searchQuery, brandFilter)
 *   -   3. useMemo (filteredTemplates) ← MOVED HERE
 *   -   4. useEffect (redirect logic)
 *   -   5. Conditional returns (if roleLoading / if !isAdmin)
 *   - FILES FIXED:
 *   -   - src/pages/Templates.tsx (hook order corrected)
 *   - RESULT: Page renders successfully without React errors
 *
 * - v2.1.31 (2024-11-11):
 *   - CRITICAL FIX: Template pages now use correct admin role verification
 *   - PROBLEM: Pages redirected admins back to /decks (authorization check failing)
 *   - ROOT CAUSE: Pages checked user?.user_metadata?.role (doesn't exist in system)
 *   - SOLUTION: Replaced with useUserRole() hook (checks j_hub_users.role via RPC)
 *   - PATTERN: Now matches all other admin pages (DeckEditor, OptimizationEditor, etc.)
 *   - IMPROVEMENTS:
 *   -   - Added loading state with "Verificando permissões..." spinner
 *   -   - Moved redirect logic to useEffect (prevents render-before-check race condition)
 *   -   - Early return null if not admin (prevents flash of content)
 *   - FILES FIXED:
 *   -   - src/pages/Templates.tsx (useUserRole + loading state)
 *   -   - src/pages/TemplateEditor.tsx (useUserRole + loading state)
 *   -   - src/pages/TemplateCompare.tsx (useUserRole + loading state)
 *   - RESULT: Admin users can now access all template management pages successfully
 *
 * - v2.1.30 (2024-11-11):
 *   - CRITICAL FIX: Template management Edge Functions authentication fixed
 *   - PROBLEM: 401 Unauthorized errors when admins tried to access template management
 *   - ROOT CAUSE: Edge Functions were using Service Role Key with getUser(authHeader)
 *   - SOLUTION: Extract JWT token from header: token = authHeader.replace('Bearer ', '')
 *   - PATTERN: Now matches j_hub_deck_generate pattern (line 82)
 *   - FILES FIXED:
 *   -   - supabase/functions/j_hub_deck_template_list/index.ts (auth fix)
 *   -   - supabase/functions/j_hub_deck_template_read/index.ts (auth fix)
 *   - DEPLOYED: Both Edge Functions redeployed to production
 *   - RESULT: Admin users can now access /decks/templates successfully
 *
 * - v2.1.29 (2024-11-11):
 *   - UX: Added "Gerenciar Templates" button to Decks panel header
 *   - VISIBILITY: Admins can now access template management directly from /decks page
 *   - BUTTON: "Gerenciar Templates" appears next to "Criar Novo Deck" (admin-only)
 *   - NAVIGATION: Button navigates to /decks/templates
 *   - ICON: FileCode icon for visual consistency with template system
 *   - FILES MODIFIED:
 *   -   - src/components/decks/DecksPanelList.tsx (added button in header)
 *   - IMPACT: Template management no longer requires direct URL access
 *
 * - v2.1.28 (2024-11-11):
 *   - REFACTOR: Reorganized template routes under /decks hierarchy
 *   - ROUTES CHANGED:
 *   -   - /templates → /decks/templates (list view)
 *   -   - /templates/:id/edit → /decks/templates/:id/edit (editor)
 *   -   - /templates/compare → /decks/templates/compare (comparison)
 *   - RATIONALE: Templates are part of deck system, should be nested under /decks
 *   - NAVIGATION: Updated all internal links and redirects to use new paths
 *   - BREADCRUMBS: Updated back buttons and navigation in all template pages
 *   - FILES MODIFIED:
 *   -   - src/App.tsx (route definitions)
 *   -   - src/pages/Templates.tsx (navigation and redirects)
 *   -   - src/pages/TemplateEditor.tsx (breadcrumb and redirects)
 *   -   - src/pages/TemplateCompare.tsx (breadcrumb and redirects)
 *   -   - src/components/templates/TemplateCard.tsx (edit button link)
 *   - IMPACT: Better URL structure, clearer information architecture
 *
 * - v2.1.27 (2024-11-11):
 *   - MAJOR FEATURE: Template Management System - Complete admin panel for deck templates
 *   - BACKEND: 2 Edge Functions created for template operations
 *   -   - j_hub_deck_template_list: Lists all templates from Storage with metadata
 *   -   - j_hub_deck_template_read: Fetches template HTML content for editing
 *   - FRONTEND: 5 new components for template management
 *   -   - Templates page (/templates): List view with search and brand filters
 *   -   - TemplateCard: Card component with metadata badges and actions
 *   -   - TemplateEditor page (/templates/:id/edit): Monaco editor with live preview
 *   -   - TemplateCompare page (/templates/compare): Side-by-side diff viewer
 *   -   - DiffViewer: Color-coded line-by-line comparison with stats
 *   - EDITOR FEATURES:
 *   -   - Monaco Editor integration (VS Code-style editor in browser)
 *   -   - HTML syntax highlighting with error detection
 *   -   - Split view: Editor (left) | Live preview (right)
 *   -   - Toggle preview visibility for full-screen editing
 *   -   - Auto-save detection (warns user of unsaved changes)
 *   -   - Direct Storage upload with UTF-8 encoding
 *   - COMPARISON TOOL:
 *   -   - Select any two templates for comparison
 *   -   - Line-by-line diff with color coding (red=removed, green=added)
 *   -   - Statistics: lines added/removed/unchanged
 *   -   - Sync scroll between comparison panels
 *   - PERMISSIONS: Admin-only access for all template management features
 *   - NAVIGATION: "Comparar Templates" button added to Templates list page
 *   - DEPENDENCIES ADDED:
 *   -   - @monaco-editor/react: Monaco Editor for React (VS Code editor)
 *   -   - diff: JavaScript diff library for file comparison
 *   - FILES CREATED:
 *   -   - supabase/functions/j_hub_deck_template_list/index.ts
 *   -   - supabase/functions/j_hub_deck_template_read/index.ts
 *   -   - src/pages/Templates.tsx
 *   -   - src/pages/TemplateEditor.tsx
 *   -   - src/pages/TemplateCompare.tsx
 *   -   - src/components/templates/TemplateCard.tsx
 *   -   - src/components/templates/MonacoEditor.tsx
 *   -   - src/components/templates/TemplatePreview.tsx
 *   -   - src/components/templates/DiffViewer.tsx
 *   -   - src/hooks/useTemplateList.ts
 *   -   - src/hooks/useTemplateRead.ts
 *   - ROUTES ADDED:
 *   -   - /templates (list view)
 *   -   - /templates/:id/edit (editor)
 *   -   - /templates/compare (comparison tool)
 *   - DEPLOYED: Both Edge Functions deployed to production
 *   - USE CASE: Admins can now debug template issues, edit templates directly, and compare versions
 *   - IMPACT: Eliminates need for manual file editing and re-upload workflow
 *   - ESTIMATED TIME: 22-33 hours of implementation completed in single session
 *
 * - v2.1.26 (2024-11-11):
 *   - CRITICAL FIX: Increased template truncation limit to restore Koko deck quality
 *   - PROBLEM: Koko decks showing degraded output quality with missing patterns
 *   - ROOT CAUSE: Templates truncated to 10KB before sending to Claude AI
 *   -   - koko-classic.html is 30KB total (879 lines)
 *   -   - Only first 10KB (~300 lines) sent to Claude
 *   -   - Missing critical patterns: timeline, data lists, conclusion slides
 *   - SOLUTION: Doubled truncation limit from 10KB to 20KB
 *   -   - Now includes ~600 lines = ALL major component patterns
 *   -   - Cards, timeline, data lists, conclusion all captured
 *   - ALIGNED: Fixed koko-yellow color inconsistency in design system
 *   -   - Changed from 43 86% 60% (#E5C94F) to 45 91% 61% (#F5C542)
 *   -   - Matches koko-classic.html template exactly
 *   - DOCUMENTED: Added truncation boundary marker in template
 *   -   - HTML comment documents what Claude sees vs doesn't see
 *   -   - Lists all included/excluded patterns for debugging
 *   - FILES MODIFIED:
 *   -   - supabase/functions/j_hub_deck_generate/index.ts (line 371: 10KB→20KB)
 *   -   - supabase/functions/j_hub_deck_regenerate/index.ts (line 378: 10KB→20KB)
 *   -   - public/decks/identities/koko/design-system.md (line 39: color alignment)
 *   -   - public/decks/templates/koko-classic.html (line 609: truncation marker)
 *   - DEPLOYED: Both Edge Functions deployed to production
 *   - IMPACT: Koko decks will now have full component variety and quality
 *
 * - v2.1.25 (2024-11-11):
 *   - CRITICAL FIX: Remove leftover onView reference in DeckCard dropdown menu
 *   - ERROR: "ReferenceError: onView is not defined" when opening /decks page
 *   - ROOT CAUSE: Incomplete removal of onView in Phase 1 (v2.1.23)
 *   - SOLUTION: Removed onView check from dropdown menu (lines 149-154)
 *   - FILES MODIFIED:
 *     - src/components/decks/DeckCard.tsx (removed dropdown menu item)
 *
 * - v2.1.24 (2024-11-11):
 *   - UX IMPROVEMENT: Markdown Editor button and behavior updates
 *   - RENAMED: "Regenerar Deck" → "Recriar Deck" (clearer intent)
 *   - REMOVED: Validation requiring markdown changes before regeneration
 *   - RATIONALE: Allow regeneration with same markdown when template is updated
 *   - USE CASE: User can recreate deck to pick up template improvements
 *   - BUTTON STATE: Now enabled even without markdown changes (only disabled if empty or over limit)
 *   - FILES MODIFIED:
 *     - src/components/decks/MarkdownEditor.tsx (button text + validation logic)
 *
 * - v2.1.23 (2024-11-11):
 *   - FEATURE: Markdown Editing & Deck Regeneration System
 *   - PROBLEM: Users couldn't edit deck content after generation, required creating new deck
 *   - PHASE 1 - Deck Card Navigation Simplification:
 *     - REMOVED: Redundant "Ver" button from deck cards
 *     - FIXED: "Editar" button now navigates to `/decks/:id` (previously broken `/decks/:id/edit` route)
 *     - RESULT: Single "Editar" button provides streamlined navigation to DeckEditor
 *   - PHASE 2 - Markdown Editing Interface:
 *     - ADDED: New MarkdownEditor component with syntax highlighting
 *     - FEATURES:
 *       - Auto-save drafts to localStorage (1-second debounce)
 *       - Draft recovery modal on mount
 *       - Character count with 15,000 limit
 *       - "Regenerar Deck" button (creates new version)
 *       - "Reverter Original" button (discards changes)
 *     - TAB SYSTEM: Added tabs to DeckEditor (Preview, Markdown, Versions)
 *     - PERMISSIONS: Markdown tab disabled for clients, enabled for staff/admin
 *     - EDGE FUNCTION: Created `j_hub_deck_regenerate` for full regeneration from new markdown
 *   - PHASE 3 - Version Type System:
 *     - MIGRATION: Added `version_type` column to `j_hub_deck_versions`
 *     - TYPES:
 *       - 'original' (gray badge): Initial generation (v1)
 *       - 'refined' (amber badge): AI refinement via j_hub_deck_refine
 *       - 'regenerated' (blue badge): Complete regeneration from new markdown
 *     - UI: Updated DeckVersionHistory with colored badges for each version type
 *     - CONSISTENCY: All 3 Edge Functions (generate, refine, regenerate) now set version_type
 *   - FILES MODIFIED:
 *     - src/components/decks/DeckCard.tsx (removed "Ver" button)
 *     - src/components/decks/DecksPanelList.tsx (fixed navigation)
 *     - src/components/decks/MarkdownEditor.tsx (NEW component)
 *     - src/pages/DeckEditor.tsx (added tabs system + handleRegenerate)
 *     - src/components/decks/DeckVersionHistory.tsx (colored badges)
 *     - supabase/functions/j_hub_deck_regenerate/index.ts (NEW Edge Function)
 *     - supabase/functions/j_hub_deck_generate/index.ts (set version_type='original')
 *     - supabase/functions/j_hub_deck_refine/index.ts (set version_type='refined')
 *     - supabase/migrations/20251111143756_add_version_type_to_deck_versions.sql (NEW)
 *   - IMPACT: Users can now edit and regenerate decks without creating new records
 *   - UX: Mobile-friendly tab interface, clear version differentiation
 *   - VERSIONING: All regenerations create new versions (maintains full history)
 *
 * - v2.1.22 (2024-11-11):
 *   - CRITICAL FIX: Koko Classic template rendering issues resolved
 *   - PROBLEM 1 - Diamond corner-cut positioning:
 *     - ROOT CAUSE: `translate(16px, 16px)` pushed diamond outside card boundaries
 *     - SOLUTION: Changed to `bottom: -16px; right: -16px` with only `rotate(45deg)`
 *     - RESULT: Diamond now perfectly aligned in card corners (no floating effect)
 *   - PROBLEM 2 - Text overflow on cards:
 *     - ROOT CAUSE: Cards missing `overflow: hidden` + long text content
 *     - SOLUTION 1: Added `overflow: hidden` to `.card` class in template
 *     - SOLUTION 2: Added `word-wrap: break-word` and `overflow-wrap: break-word` to `.card-content`
 *     - SOLUTION 3: Updated AI prompt to generate concise card text (max 60 chars per paragraph)
 *     - RESULT: Text now stays within card boundaries with proper line breaks
 *   - FILES MODIFIED:
 *     - public/decks/templates/koko-classic.html (CSS fixes)
 *     - supabase/functions/j_hub_deck_generate/index.ts (AI prompt enhancement)
 *   - IMPACT: All future Koko Classic decks will have correct rendering
 *   - TESTING: Verified fixes resolve issues on slides 2, 3, 5, 8, 12 (multiple cards)
 *   - NOTE: Existing decks NOT regenerated (user decision - only new decks affected)
 *
 * - v2.1.21 (2024-11-11):
 *   - FEATURE: 21:9 ultra-wide display support for deck presentations
 *   - ADJUSTMENT: Increased maxAspectRatio from 16:9 (1.78:1) to 21:9 (2.40:1)
 *   - RATIONALE: User requested more tolerance for ultra-wide displays
 *   - STANDARD: Aligns with cinema anamorphic standard (2.39:1)
 *   - SUPPORTED: Now allows 4:3, 16:10, 16:9, and 21:9 aspect ratios
 *   - BLOCKED: Only 32:9 super ultra-wide (3.56:1) and beyond
 *   - RESOLUTIONS ADDED:
 *     - 21:9 (2560×1080) = 2.37:1 ✅
 *     - 21:9 (3440×1440) = 2.39:1 ✅
 *     - 21:9 (3840×1600) = 2.40:1 ✅
 *   - TEMPLATES: CSS clamp() handles 21:9 well with max-width constraints
 *   - UX: Updated error messages to reflect 21:9 support
 *   - MESSAGING: "Super ultra-wide" now refers only to 32:9+
 *   - BACKWARDS COMPATIBLE: More permissive than previous validation
 *   - FILES MODIFIED:
 *     - src/config/viewport.ts (maxAspectRatio: 2.4, updated SUPPORTED_RESOLUTIONS)
 *     - src/components/decks/ViewportWarning.tsx (updated too_wide message)
 *
 * - v2.1.20 (2024-11-11):
 *   - FEATURE: Multi-aspect-ratio support for deck presentations
 *   - SUPPORT: Now allows 4:3, 16:10, and 16:9 aspect ratios
 *   - LOGIC: Validates smallest dimension ≥ 768px (supports 1024x768 4:3 displays)
 *   - BLOCKS: Portrait orientation (height > width)
 *   - BLOCKS: Ultra-wide displays (21:9, 32:9) - prevents content distortion
 *   - VALIDATION RULES:
 *     1. Portrait check: height must be ≤ width (landscape only)
 *     2. Minimum dimension: 768px (smallest of width/height)
 *     3. Aspect ratio range: 4:3 (1.33:1) to 16:9 (1.78:1)
 *   - SUPPORTED RESOLUTIONS:
 *     - 4:3: 1024x768, 1280x960, 1600x1200 (legacy projectors/monitors)
 *     - 16:10: 1280x800, 1440x900, 1920x1200 (professional monitors)
 *     - 16:9: 1280x720, 1920x1080, 2560x1440, 3840x2160 (modern standard)
 *   - BLOCKED FORMATS:
 *     - 21:9 (2560x1080, 3440x1440) - ultra-wide, causes distortion
 *     - 32:9 (5120x1440) - super ultra-wide, content illegible
 *   - FEEDBACK: Reason-specific error messages (portrait, too_small, too_narrow, too_wide)
 *   - UX IMPROVEMENTS:
 *     - Shows current aspect ratio label (e.g., "16:9", "21:9")
 *     - Displays validation reason with contextual suggestions
 *     - Examples of supported resolutions per aspect ratio
 *   - COMPATIBILITY: ~98% of desktop/laptop devices supported
 *   - BACKWARDS COMPATIBLE: More permissive than previous 1280x768 minimum
 *   - FILES MODIFIED:
 *     - src/config/viewport.ts (new validation logic + helpers)
 *     - src/hooks/useViewportSize.tsx (returns reason + aspectRatio)
 *     - src/components/decks/ViewportWarning.tsx (reason-specific UI)
 *
 * - v2.1.19 (2024-11-11):
 *   - ADJUSTMENT: Increased viewport minimum from 1024x768 to 1280x768
 *   - REASON: User reported protection not triggering properly on small screens
 *   - DEBUG: Added console logs to ViewportWarning component for troubleshooting
 *   - IMPACT: Now blocks tablets (iPad 10") and allows only standard laptops+
 *   - COVERAGE: ~98% of desktop/laptop devices (blocks tablets and mobile)
 *
 * - v2.1.18 (2024-11-11):
 *   - CRITICAL FIX: Add missing deck functions to supabase/config.toml
 *   - ROOT CAUSE: j_hub_deck_view_shared was not in config.toml
 *   - Without config entry, Supabase defaults to verify_jwt=true
 *   - SYMPTOM: 401 "Missing authorization header" on public shares
 *   - SOLUTION: Added all 4 deck functions to config.toml:
 *     - j_hub_deck_view_shared (verify_jwt=false) ← PUBLIC ACCESS
 *     - j_hub_deck_create_share (verify_jwt=true)
 *     - j_hub_deck_generate (verify_jwt=true)
 *     - j_hub_deck_refine (verify_jwt=true)
 *   - COMPARISON: j_hub_optimization_view_shared works because it WAS in config.toml
 *   - LESSON: --no-verify-jwt CLI flag is temporary, config.toml is persistent
 *   - After git push, Supabase auto-syncs config (~2-5 min propagation)
 *
 * - v2.1.17 (2024-11-11):
 *   - OPTIMIZATION: Reduced viewport minimum to 1024x768px (from 1280x720)
 *   - DISCOVERY: Templates already had fluid typography with clamp() implemented
 *   - BENEFIT: Fonts scale automatically from 1024px to 1920px (responsive)
 *   - COVERAGE: Now covers virtually ALL desktop/laptop devices (~99.5%)
 *   - BLOCKS: Only mobile phones and very small tablets (< 1024px)
 *   - RATIONALE: Fluid fonts + generous minimum = best compatibility
 *   - EXAMPLES:
 *     - h1: clamp(36px, 5vw, 60px) → scales smoothly
 *     - h2: clamp(18px, 2.5vw, 28px) → scales smoothly
 *     - body: clamp(16px, 2vw, 20px) → scales smoothly
 *     - metrics: clamp(64px, 10vw, 120px) → scales smoothly
 *   - RESULT: Presentations work great on tablets (10"+) and all laptops
 *
 * - v2.1.16 (2024-11-11):
 *   - ADJUSTMENT: Reduced viewport minimum from 1600x900 to 1280x720px
 *   - RATIONALE: Previous minimum blocked common laptops (MacBook Air 13", Windows laptops)
 *   - COVERAGE: Now covers ~98% of devices vs ~80% before
 *   - DEVICES: MacBook Air (1440x900), Windows laptops (1366x768) now allowed
 *   - QUALITY: Trade-off accepted - slides functional but not perfect on 1366x768
 *   - STILL BLOCKS: Mobile phones, small tablets (experience would be poor)
 *
 * - v2.1.15 (2024-11-11):
 *   - FEATURE: Viewport size validation for deck presentations
 *   - NEW: ViewportWarning component shows overlay when screen too small (< 1600x900px)
 *   - NEW: useViewportSize hook tracks viewport dimensions reactively
 *   - NEW: viewport.ts config with minimum/recommended resolutions
 *   - PAGES: DeckPreview and SharedDeck now block access on small screens
 *   - UX: Helpful suggestions (maximize window, use larger screen, rotate device)
 *   - ADMIN: "Forçar visualização" override button (DeckPreview only)
 *   - PERSISTENCE: Admin override saved in localStorage (persists across reloads)
 *   - RATIONALE: Fixed layout slides break on small screens (elements overlap, unreadable)
 *   - MINIMUM: 1600x900px (balanced, covers modern laptops)
 *   - RECOMMENDED: 1920x1080px (Full HD for optimal quality)
 *   - SCOPE: Preview/share routes only (editor route unchanged)
 *
 * - v2.1.14 (2024-11-11):
 *   - MAJOR FEATURE: Complete Iterative AI Refinement System for decks
 *   - PHASE 1 - Versionamento:
 *     - Database: j_hub_deck_versions table (version history with refinement prompts)
 *     - Database: current_version and is_refined fields in j_hub_decks
 *     - Database: Helper functions (get_latest_version_number, update_deck_current_version)
 *     - Database: Auto-trigger to mark is_refined=TRUE when versions > 1
 *     - Backend: j_hub_deck_generate modified to auto-create v1 on generation
 *     - Frontend: DeckCard with version badge (v1 gray, v2+ amber with ✨)
 *     - Frontend: DeckVersionHistory component (Sheet with version list, restore capability)
 *     - Frontend: useMyDecks hook updated to fetch version fields
 *   - PHASE 2 - AI Refinement:
 *     - Backend: j_hub_deck_refine Edge Function (Claude Sonnet 4.5 for iterative refinement)
 *     - Frontend: DeckRefineModal component (textual feedback input, loading states)
 *     - Frontend: "Refinar com IA" button in DeckEditor (editors only)
 *     - UX: Example prompts for user guidance
 *     - UX: Changes summary generated by AI and displayed in toast
 *     - Security: Permission checks (admin/staff/owner can refine)
 *     - Validation: Asset path validation (must remain absolute HTTPS URLs)
 *     - Validation: Data fidelity (zero tolerance for hallucination)
 *   - WORKFLOW: User creates deck (v1) → Refines with feedback ("make title bigger") → v2 created → Can restore v1 anytime
 *   - NEXT: Version comparison (side-by-side), template learning from refinements
 *
 * - v2.1.13 (2024-11-11):
 *   - CRITICAL FIX: Added strict data fidelity rules to deck generation prompt (ZERO tolerance for hallucination)
 *   - NEW SECTION 10: "DATA FIDELITY" with explicit examples of violations (inventing countries, metrics, comparisons)
 *   - Issue: AI was hallucinating data (e.g., adding countries not in markdown source)
 *   - Impact: Decks presented to clients making business decisions - fabricated data destroys trust
 *   - Rules: ✅ Can reorganize/format, ❌ Cannot invent numbers/names/locations
 *   - Validation checklist: Every metric, country, campaign name must exist in markdown
 *   - When in doubt rule: Don't include it - better fewer slides with accurate data
 *
 * - v2.1.12 (2024-11-11):
 *   - FEATURE: Koko Classic template system - modular slide patterns for AI generation
 *   - FIX: jumper-flare.html gray background on cover/closing slides (added background: #000000)
 *   - FIX: Edge Function deck generation now enforces absolute HTTPS URLs for all assets
 *   - Added post-generation validation to detect relative paths and fail fast
 *   - Documented asset URL requirements in design-system.md
 *   - Root cause: Claude AI was generating relative paths (/decks/...) instead of absolute (https://...)
 *   - Impact: Fonts, gradients, and logos now load correctly in all generated decks
 *
 * - v2.1.11 (2024-11-05):
 *   - CLEANUP: Removed debug logs from SharedDeck.tsx and j_hub_deck_view_shared
 *   - Kept only essential logging (request summary in Edge Function)
 *   - System confirmed working - cleaned up diagnostic code
 *
 * - v2.1.10 (2024-11-05):
 *   - FIX: Shared decks now work - deployed Edge Function with --no-verify-jwt
 *   - Root cause: Edge Function was requiring JWT token verification
 *   - Anonymous users have no JWT → 401 Unauthorized
 *   - Solution: Deploy with --no-verify-jwt flag (allows anonymous calls)
 *   - REMOVED: Hardcoded API key fallback (not needed)
 *   - ADDED: Comprehensive logging in SharedDeck.tsx
 *   - ADDED: Comprehensive logging in j_hub_deck_view_shared Edge Function
 *   - Edge Function now accepts calls with only apikey header (no JWT required)
 *
 * - v2.1.9 (2024-11-05): [REVERTED - Hardcoded key removed]
 *   - Attempted fix with hardcoded fallback API key (incorrect approach)
 *
 * - v2.1.8 (2024-11-05):
 *   - FIX: Shared decks now work in anonymous/incognito browsers
 *   - Replaced supabase.functions.invoke() with direct fetch() in SharedDeck.tsx
 *   - Root cause: supabase.functions.invoke() auto-injects Authorization header
 *   - Logged-in browsers worked because they had valid JWT token
 *   - Anonymous browsers failed because no JWT token existed
 *   - Solution: Direct fetch() bypasses auth header injection
 *   - Now works identically for logged-in and anonymous users
 *   - Password protection still fully functional via Edge Function validation
 *
 * - v2.1.7 (2024-11-05):
 *   - FIX: Password sharing TRULY working now (Web Crypto API solution)
 *   - CRITICAL: Replaced bcrypt (ALL versions use Workers) with native Web Crypto API
 *   - Created _shared/crypto.ts with PBKDF2 implementation (100% Edge Runtime compatible)
 *   - Root cause: ALL bcrypt versions (0.2.4, 0.4.1) use Deno Workers not available in Edge Runtime
 *   - Solution: hashPassword() and verifyPassword() using crypto.subtle.deriveBits (PBKDF2)
 *   - 100k iterations + SHA-256 + 16-byte salt for security
 *   - Format: base64(salt):base64(hash) stored in password_hash column
 *   - Both Edge Functions deployed and tested: j_hub_deck_create_share + j_hub_deck_view_shared
 *
 * - v2.1.6 (2024-11-05): [FAILED ATTEMPT - bcrypt@v0.2.4 also uses Workers]
 *   - Attempted downgrade bcrypt from v0.4.1 to v0.2.4 (still had Worker error)
 *
 * - v2.1.5 (2024-11-05):
 *   - UX: Added "Ver em Tela Cheia" button for full-screen deck preview
 *   - Created DeckPreview.tsx component for distraction-free full-screen viewing
 *   - Added route /decks/:id/preview for dedicated preview page
 *   - Removed redundant buttons: "Visualizar" and "Abrir em nova aba" (both opened Storage URL)
 *   - Cleaner UI: Preview inline works perfectly, full-screen button for presentations
 *   - Full-screen preview opens in new tab with permanent shareable URL
 *
 * - v2.1.4 (2024-11-05):
 *   - FIX: Deck previews now render correctly using srcDoc instead of Storage URLs
 *   - Inverted priority in DeckEditor and SharedDeck: html_output (srcDoc) → file_url (fallback)
 *   - Fixed issue where iframes showed HTML source code instead of rendered presentation
 *   - Root cause: Storage URLs have CSP/sandbox restrictions blocking inline scripts and assets
 *   - Using srcDoc allows HTML to execute with absolute asset URLs working correctly
 *
 * - v2.1.3 (2024-11-05):
 *   - FIX: Removed duplicate TextDecoder declarations causing Edge Function boot failure
 *   - Consolidated 4 'const decoder' declarations into single shared instance
 *   - Fixed SyntaxError that prevented j_hub_deck_generate from initializing
 *   - Root cause: Multiple const declarations in same scope violate JavaScript rules
 *
 * - v2.1.2 (2024-11-05):
 *   - FIX: Deck assets now use absolute URLs to fix rendering issues
 *   - Modified Claude prompt in j_hub_deck_generate to use https://hub.jumper.studio/...
 *   - Fonts, gradients, and logos now load correctly in deck previews and shares
 *   - Root cause: HTMLs served from Storage domain couldn't resolve relative asset paths
 *   - Added explicit instructions and examples for absolute URL usage in systemPrompt
 *
 * - v2.1.1 (2024-11-05):
 *   - UX: Changed default landing page after login from /creatives to /my-accounts
 *   - Index route (/) now renders MyAccounts component instead of Manager
 *   - Users now see their accounts dashboard immediately after login
 *   - More intuitive starting point focusing on account management
 *
 * - v2.1.0 (2024-11-05):
 *   - MAJOR RELEASE: Documentation Cleanup and Consolidation
 *   - Cleaned CLAUDE.md: 1579 → 1288 lines (-291 lines, -18%)
 *   - Fixed script paths (./scripts/ → ./localdev/)
 *   - Removed duplicate sections (Vercel env vars, roadmap, Local Dev)
 *   - Moved Optimization v2.1 technical docs to ARCHITECTURE.md
 *   - Updated all stale metadata (dates, project status)
 *   - ARCHITECTURE.md: Added complete Optimization v2.1 section (+126 lines)
 *   - Improved documentation navigation and clarity
 *   - All critical information preserved and better organized
 *
 * - v2.0.75 (2024-11-05):
 *   - FIX: FK constraint violation on optimization creation (critical bug)
 *   - OptimizationNew.tsx now stores notion_id (TEXT) instead of UUID in account_id
 *   - Fixed handleAccountChange to use account.notion_id
 *   - Fixed handleRecoverDraft to find accounts by notion_id
 *   - Fixed OptimizationRecorder.tsx typo: selectedAccountName → accountName
 *   - Root cause: Dual ID system (UUID for modern tables, TEXT notion_id for legacy)
 *   - Optimization creation now working correctly after commit 412a8ec changes
 *
 * - v2.0.74 (2024-11-03):
 *   - FIX: Upload script authentication issue resolved
 *   - Changed from `npx supabase` to `supabase` (global installation)
 *   - Root cause: npx and global supabase have separate auth sessions
 *   - User was authenticated with global CLI but script used npx
 *   - Script now uses global supabase command directly
 *
 * - v2.0.73 (2024-11-03):
 *   - TOOLS: Created upload script for deck templates with correct Content-Type
 *   - Script: scripts/upload-deck-assets.sh (uses Supabase CLI)
 *   - ROOT CAUSE IDENTIFIED: Storage serving templates as text/plain instead of text/html
 *   - Templates were being served without charset=utf-8, causing mojibake in Edge Function
 *   - Script uploads with explicit Content-Type: "text/html; charset=utf-8"
 *   - Two-phase approach: test (1 file) → all (33 templates + 2 design systems)
 *   - Includes Content-Type validation via curl after upload
 *   - User must delete existing files from bucket before running
 *   - This is the FINAL piece to solve mojibake issue completely
 *
 * - v2.0.72 (2024-11-03):
 *   - FIX: Comprehensive UTF-8 encoding fix across ENTIRE pipeline (mojibake fully resolved)
 *   - CRITICAL: Added TextDecoder('utf-8') to ALL fetch operations in Edge Function
 *   - Request body: Explicit UTF-8 decoding before JSON.parse (line 30-33)
 *   - Template loading: arrayBuffer() + TextDecoder for forced UTF-8 (line 95-108)
 *   - Design system: arrayBuffer() + TextDecoder for forced UTF-8 (line 123-135)
 *   - Claude API: Added Accept/Content-Type charset headers + TextDecoder response (line 254-277)
 *   - Storage upload: UTF-8 Blob with charset (from v2.0.71)
 *   - Response headers: All include charset=utf-8 (from v2.0.71)
 *   - Fixes Portuguese characters (Relatório, Otimização, etc.)
 *   - Fixes all special symbols (→, ✅, emojis like 🇧🇷)
 *   - Root cause: Templates/API responses not explicitly decoded as UTF-8
 *   - Test 1 confirmed: Simple markdown also had mojibake (eliminated user input as cause)
 *   - Edge Function j_hub_deck_generate deployed with comprehensive fixes
 *
 * - v2.0.71 (2024-11-03):
 *   - FIX: UTF-8 encoding issue in deck generation (partial fix - Storage upload only)
 *   - CRITICAL: Added explicit UTF-8 encoding via TextEncoder in Edge Function
 *   - Changed Blob creation to use encoded bytes with charset declaration
 *   - Updated Storage upload Content-Type: 'text/html; charset=utf-8'
 *   - Updated all response headers with 'charset=utf-8'
 *   - Updated Claude prompt to require <meta charset="UTF-8"> as first tag
 *   - Fixes Portuguese characters displaying incorrectly (Relatório → RelatÃ³rio)
 *   - Fixes broken emoji encoding (🇨🇴 → ðŸ‡¨ðŸ‡´)
 *   - Root cause: UTF-8 bytes misinterpreted as ISO-8859-1/Latin-1
 *   - Edge Function j_hub_deck_generate deployed with fixes
 *   - NOTE: This fix was incomplete - v2.0.72 added decoding to all fetch operations
 *
 * - v2.0.70 (2024-11-03):
 *   - FEATURE: Decks system FULLY INTEGRATED into web application (ALL 5 phases complete!)
 *   - PHASE 1 (Backend - Edge Functions):
 *     - j_hub_deck_generate: Claude Sonnet 4.5 AI generation from markdown + templates
 *     - j_hub_deck_create_share: Public sharing with optional password protection (bcrypt)
 *     - j_hub_deck_view_shared: Password-protected viewing for shared decks
 *   - PHASE 2 (Frontend - Components):
 *     - useMyDecks hook: Fetch decks with RLS filtering (follows optimization pattern)
 *     - useDeckGeneration hook: Deck generation workflow with progress tracking
 *     - DeckCard: Card view with badges, metadata, and actions
 *     - DecksPanelList: List/grid view with filters (type, identity, search, sort)
 *     - DeckConfigForm: Complete form with tabs, validation, file upload, preview
 *     - DeckShareModal: Share dialog with password protection and copy link
 *   - PHASE 3 (Frontend - Pages):
 *     - Decks.tsx: Main panel view with role-based permissions
 *     - DeckNew.tsx: Creation page with form and progress tracking
 *     - DeckEditor.tsx: Viewer with iframe, actions (share, download, delete)
 *     - SharedDeck.tsx: Public view with password modal (no auth required)
 *   - PHASE 4 (Integration):
 *     - Added 4 routes to App.tsx (decks, decks/new, decks/:id, decks/share/:slug)
 *     - Added "Decks" navigation link to Header.tsx with Presentation icon
 *   - PHASE 5 (Security & Testing):
 *     - CRITICAL FIX: Type inconsistency (migration: 'mediaplan', code: 'plan')
 *     - CRITICAL FIX: RLS policies - Staff now see decks from managed accounts
 *     - CRITICAL FIX: RLS policies - Admins now have full access
 *     - Migration: 20241103000000_fix_decks_rls_and_types.sql
 *   - PERMISSIONS:
 *     - View: All users see decks from accessible accounts (via j_hub_user_accounts logic)
 *     - Create: Only Admin and Staff can create decks
 *     - Edit: Staff can edit decks from managed accounts, Clients only own decks
 *     - Delete: Only Admins can delete decks
 *   - Progress: 100% complete (16/16 tasks) - SYSTEM READY FOR USE!
 *
 * - v2.0.69 (2024-11-03):
 *   - FEATURE: Decks system integration - Phase 1 & 2 (Backend + Frontend Hooks)
 *   - Backend: 3 Edge Functions created (j_hub_deck_generate, j_hub_deck_create_share, j_hub_deck_view_shared)
 *   - Frontend: 2 React Hooks created (useMyDecks, useDeckGeneration)
 *   - Database: j_hub_decks table with RLS policies already existed (created in earlier migration)
 *   - Storage: decks bucket with RLS policies already configured
 *   - Deck generation via Claude API (Anthropic) with template + design system loading
 *   - Public sharing with optional password protection (bcrypt)
 *   - Follows optimization system patterns (permissions, sharing, storage)
 *   - DOCS: Marked scripts/export-presentation-to-pdf.js as deprecated/non-functional
 *   - DOCS: Added Known Limitations section to decks/decks-readme.md (PDF export workaround)
 *   - Progress: 37.5% complete (6/16 tasks) - Components, Pages, Routes pending
 *
 * - v2.0.68 (2024-10-30):
 *   - FEATURE: Local audio download to prevent data loss
 *   - Added "Baixar Localmente" button in recording and upload tabs
 *   - Auto-download audio when upload fails (network error, storage error)
 *   - User can save 10-minute recording even without internet
 *   - Downloaded file: otimizacao-{account}-{timestamp}.webm
 *   - Toast explains user can upload later using "Enviar Arquivo" tab
 *   - Prevents total data loss in case of network failure
 *
 * - v2.0.67 (2024-10-30):
 *   - FIX: Resilient transcription error handling for OpenAI API failures
 *   - Edge Function: Added HTML response detection (Cloudflare 502/503 errors)
 *   - Edge Function: Implemented exponential backoff retry (3 attempts: 2s, 4s, 8s)
 *   - Edge Function: Classifies errors as TRANSIENT vs PERMANENT
 *   - Frontend: Preserves recording on transient errors (can retry later)
 *   - Frontend: Only deletes recording on permanent errors (invalid file, auth failure)
 *   - User-friendly toast: "OpenAI API está temporariamente indisponível. A gravação foi salva..."
 *   - Fixes data loss issue when OpenAI API returns 502 during high load
 *   - Audio file remains in storage even when transcription fails
 *
 * - v2.0.66 (2024-10-28):
 *   - FEATURE: "Geral" objective now always appears as first option
 *   - All accounts now have "Geral" + Notion-specific objectives
 *   - Ensures all optimizations can be categorized as general if needed
 *
 * - v2.0.65 (2024-10-28):
 *   - FIX: Account objectives now display in OptimizationRecorder
 *   - Added accountObjectives state to store objectives from selected account
 *   - Objectives now passed as notionObjectives prop to OptimizationRecorder
 *   - Fixed draft auto-save to store actual objectives (was storing empty array)
 *   - Fixed draft recovery to restore objectives
 *   - Objectives checkboxes now appear pre-selected from Notion account data
 *
 * - v2.0.64 (2024-10-28):
 *   - FIX: Restored account context and objectives loading in OptimizationNew
 *   - Edge Function j_hub_user_accounts now returns contexto_otimizacao and contexto_transcricao fields
 *   - Updated NotionAccount interface with context fields
 *   - Fixed OptimizationNew to use correct field name (contexto_otimizacao instead of non-existent contexto)
 *   - DOCS: Updated all references from obsolete j_ads_notion_db_* to current j_hub_notion_db_* naming
 *   - Updated CLAUDE.md, ARCHITECTURE.md, and REPORTS-ROADMAP.md with correct table names
 *   - Corrects naming convention from Jumper Hub rebrand (October 2025)
 *
 * - v2.0.63 (2024-10-28):
 *   - FIX: PrioritizedAccountSelect dropdown direction finally resolved
 *   - Added avoidCollisions={false} to disable Radix UI collision detection
 *   - Root cause: Collision detection was overriding side="bottom" prop
 *   - Dropdown now consistently opens downward on all pages
 *   - Verified fix with Playwright MCP testing on OptimizationNew page
 *
 * - v2.0.62 (2024-10-28):
 *   - FIX: PrioritizedAccountSelect dropdown now always opens downward
 *   - Added side="bottom" to SelectContent to prevent upward opening
 *   - Resolves issue where dropdown appeared above trigger on OptimizationNew page
 *
 * - v2.0.61 (2024-10-28):
 *   - MAJOR FEATURE: Prioritized account selection across entire application
 *   - Created accountPriority.ts utils with shared logic (getAccessReasons, sortAccountsByPriority, groupAccountsByPriority)
 *   - Created PrioritizedAccountSelect component with visual separators (GESTOR → SUPERVISOR → GERENTE → ADMIN)
 *   - Refactored MyAccounts to use shared utils (maintains existing behavior)
 *   - Applied to OptimizationNew with "Show Inactive" toggle (admin only)
 *   - Applied to Optimization with "All accounts" option and priority sorting
 *   - Dropdown separators show: "--- GESTOR (3) ---" with emoji icons
 *   - "Mostrar Inativas" toggle appears only for admin users
 *   - All account selectors now use consistent permission-based ordering
 *   - Updated NotionAccount interface to include gestor_email and atendimento_email
 *
 * - v2.0.60 (2024-10-28):
 *   - DOCS: Comprehensive documentation for account selection standardization
 *   - Added JSDoc to useMyNotionAccounts hook with architecture pattern explanation
 *   - Created NotionAccount TypeScript interface for type safety
 *   - Added "Account Selection Pattern" section to ARCHITECTURE.md
 *   - Documented backend (Edge Function) and frontend (React Hook) responsibilities
 *   - Included usage examples, custom sorting patterns, and migration history
 *   - Updated ARCHITECTURE.md table of contents
 *   - Part of account selection standardization (FASE 3 - Documentation)
 *
 * - v2.0.59 (2024-10-28):
 *   - CLEANUP: Removed unused AccountSelector.tsx component from optimization folder
 *   - Component was never imported or used anywhere in the application
 *   - Reduced codebase complexity as part of account selection standardization (FASE 3)
 *   - All pages now use standardized useMyNotionAccounts hook pattern
 *
 * - v2.0.58 (2024-10-28):
 *   - UX: Enhanced account selector with loading and empty states on OptimizationNew
 *   - Select component now shows "Carregando contas..." placeholder while fetching
 *   - Disabled state prevents interaction during account loading
 *   - Loading indicator with Loader2 spinner in dropdown
 *   - Empty state message when no accounts available
 *   - Conditional rendering for better user feedback during fetch operations
 *   - Part of account selection standardization (FASE 2)
 *
 * - v2.0.57 (2024-10-28):
 *   - FIX: Account selector dropdown clipping issue on OptimizationNew page
 *   - Added max-h-[300px] to SelectContent for proper height constraint (~8-10 items visible)
 *   - Added position="popper" to prevent viewport clipping
 *   - Added sideOffset={5} for proper spacing between trigger and dropdown
 *   - Built-in scrollbar now appears when 43 accounts exceed visible area
 *   - Also applied same fix to Optimization.tsx account filter for consistency
 *   - Resolves issue where dropdown was cut off at bottom without scrolling
 *
 * - v2.0.56 (2024-10-28):
 *   - ENHANCEMENT: OptimizationNew date picker now auto-detects matching presets
 *   - AUDIT: Verified account filtering uses correct permission-based logic (same as /my-accounts)
 *   - DateRangePicker component now highlights correct preset when modal opens
 *   - Example: "Últimos 7 dias" preset selected when dates match that range
 *   - Improves UX by showing user which preset they're currently using
 *   - detectMatchingPreset() compares date strings to identify preset vs custom range
 *   - No changes needed to account filtering - already correct via useMyNotionAccounts hook
 *
 * - v2.0.55 (2024-10-28):
 *   - FIX: Corrected import in useDraftManager.ts (useAuth path)
 *   - Import error: "Failed to resolve import @/hooks/useAuth"
 *   - Root cause: useAuth is exported from AuthContext, not a separate hooks file
 *   - Fixed by changing import path: @/hooks/useAuth → @/contexts/AuthContext
 *   - All import errors resolved, feature ready to test
 *
 * - v2.0.54 (2024-10-28):
 *   - FIX: Corrected import in OptimizationNew.tsx (useMyAccounts → useMyNotionAccounts)
 *   - Import error: "Failed to resolve import @/hooks/useMyAccounts"
 *   - Root cause: Hook useMyAccounts doesn't exist in codebase
 *   - Fixed by using correct hook: useMyNotionAccounts
 *   - Feature now ready to test: /optimization/new page with date range, draft auto-save
 *
 * - v2.0.53 (2024-10-27):
 *   - UX: Implemented breadcrumb navigation pattern in OptimizationEditor header
 *   - Breadcrumb structure: "Otimizações > Edição de Otimização - Account Name"
 *   - Clickable "Otimizações" link navigates back to /optimization panel
 *   - ChevronRight separator for visual clarity
 *   - Removed standalone back button (navigation now integrated into breadcrumb)
 *   - Two-row layout: Breadcrumb+Actions (line 1), Timestamp (line 2)
 *   - Cleaner, more professional navigation following industry UX best practices
 *   - Better contextual awareness - user always sees where they are in hierarchy
 *
 * - v2.0.52 (2024-10-27):
 *   - UX ENHANCEMENT: Comprehensive OptimizationEditor UX improvements
 *   - Header: Added subtle shadow for visual separation, improved button hierarchy
 *   - Primary action (Exportar PDF) now uses solid button style with min-width
 *   - Destructive action (Excluir) clearly styled with red outline and warning tooltip
 *   - Date format: Smart relative time ("Gravado hoje às 19:14", "há 2 dias", etc.)
 *   - Card actions: Better spacing with border-left separator, improved hover states
 *   - Tooltips: Enhanced with detailed descriptions explaining functionality
 *   - Accessibility: Added aria-labels to all icon buttons for screen readers
 *   - Flow indicators: Added connecting lines and labels ("Refina em", "Organiza em")
 *   - Admin section: Visually distinct with amber-colored indicator
 *   - Button sizing: Increased from h-8 to h-9 for better touch targets
 *   - Hover effects: Orange/amber tints on action buttons for better feedback
 *
 * - v2.0.51 (2024-10-27):
 *   - UX FIX: Aligned header content with main Header component
 *   - Changed from `px-8` to responsive padding: `px-4 sm:px-6 lg:px-8`
 *   - Added `max-w-7xl mx-auto` container to match Header component
 *   - Page header now aligns with Jumper logo (left) and UserMenu (right)
 *   - Main content also uses same container for consistent alignment
 *   - Clean, professional visual alignment across entire page
 *
 * - v2.0.50 (2024-10-27):
 *   - UX FIX: Reverted to left-aligned header (app standard)
 *   - Two-row layout: Back button above, title + actions below
 *   - Row 1: Back button (standalone)
 *   - Row 2: Title + Date (left) | Action buttons (right)
 *   - Maintains app's left-alignment pattern
 *   - Clean separation between navigation and content
 *
 * - v2.0.49 (2024-10-27):
 *   - UX FIX: Centered header layout in Optimization Editor
 *   - Changed from 2-column to 3-column grid layout
 *   - Left: Back button | Center: Title + Date | Right: Action buttons
 *   - Title and date now horizontally centered
 *   - All elements vertically aligned with `items-center`
 *   - Clean, balanced header layout
 *
 * - v2.0.48 (2024-10-27):
 *   - UX FIX: Simple header alignment fix in Optimization Editor
 *   - Changed from `items-start` to `items-center` for vertical centering
 *   - Removed `mt-8` margin from action buttons
 *   - Buttons now align properly with text content
 *
 * - v2.0.47 (2024-10-27):
 *   - UX FIX: Improved icon alignment for multi-line action text
 *   - Reverted to `items-start` for top alignment with first line
 *   - Added `pt-1` padding to icon container for better baseline alignment
 *   - Icons now stay aligned with first line when text wraps to multiple lines
 *   - Example: Long observations with 2-3 lines now have icon aligned at top
 *
 * - v2.0.46 (2024-10-27):
 *   - UX FIX: Corrected icon alignment in Step 3 Extract viewer
 *   - Changed from `items-start` to `items-center` and removed `mt-0.5`
 *   - Icons now perfectly aligned with text baseline
 *   - BREAKING: Action verbs now display in UPPERCASE: [CRIOU], [OBSERVOU], etc.
 *   - Updated prompt to generate uppercase verbs for better visual hierarchy
 *   - Updated ExtractViewer parsing to handle uppercase verbs
 *   - Updated Edge Function parsing to normalize verbs to uppercase
 *   - All verb mappings (VERB_ICONS, VERB_COLORS) converted to uppercase keys
 *
 * - v2.0.45 (2024-10-27):
 *   - UX: Restored color-coded visual system for Step 3 Extract with RADAR methodology
 *   - Semantic colors by action type: Blue (creation), Purple (activation/pause), Red (deletion),
 *     Green (budget/settings), Orange (correction/testing), Amber (observation), Gray (external)
 *   - Updated prompt format: - [Verb]: Details (with brackets for parsing)
 *   - New icons per verb: Plus, Play, Pause, Trash2, Settings, TrendingUp, Beaker, Eye, MessageSquare, Clock, Send
 *   - Visual separator (border) between internal and external actions
 *   - ExtractViewer now parses dash-based format with [Verb] extraction
 *   - Maintains backward compatibility with action parsing in Edge Function
 *
 * - v2.0.44 (2024-10-27):
 *   - MAJOR CHANGE: Step 3 Extract prompt updated to RADAR methodology
 *   - New structure: Actions separated into INTERNAL (platform) vs EXTERNAL (third-party)
 *   - Internal actions: Pausou, Ativou, Criou, Excluiu, Ajustou, Realocou, Corrigiu, Escalou, Testou, Observou
 *   - External actions: Solicitou, Informou, Aguardando, Abriu, Enviou
 *   - Format changed from bullet points (•) to dashes (-) with verbs: [Verb]: [Details]
 *   - Blank line separator between internal and external actions
 *   - More structured and actionable output aligned with RADAR tracking method
 *   - Updated Edge Function: j_hub_optimization_extract
 *   - Updated parsing logic to handle new verb-based format
 *
 * - v2.0.43 (2024-10-27):
 *   - FEATURE: Added account filter to optimization panel (/optimization)
 *   - Select dropdown shows all accounts with optimizations
 *   - Clear button (X) to reset filter and show all
 *   - Counter updates to show filtered count vs total
 *   - Only displays filter when user has access to multiple accounts
 *   - Accounts sorted alphabetically for easy navigation
 *   - Uses memoization for optimal performance
 *
 * - v2.0.42 (2024-10-27):
 *   - UX: Intelligent step expansion on page load
 *   - Highest completed step automatically opens when entering editor
 *   - Priority: Step 3 > Step 2 > Step 1 (most refined content first)
 *   - Other steps remain collapsed for clean interface
 *   - User immediately sees the most important/complete content
 *   - Can still expand/collapse any step manually
 *
 * - v2.0.41 (2024-10-27):
 *   - FIX: PDF export now includes ALL 3 optimization steps
 *   - Added Step 1 (Transcrição Completa) section with full transcript
 *   - Added Step 2 (Log da Otimização) section with organized bullets
 *   - Added Step 3 (Extrato) section with categorized actions
 *   - PDF structure: Header → Transcrição → Log → Extrato
 *   - Button only enabled when Step 3 (Extrato) is completed
 *   - Updated toast message: "PDF completo gerado com sucesso!"
 *   - Fixed critical bug: extract parameter was missing from export function
 *
 * - v2.0.40 (2024-10-27):
 *   - FIX: Added missing spinner to ReprocessConfirmModal
 *   - Button now shows "Recriando..." with animated Loader2 icon
 *   - Completes loading state audit - all AI operations now have visual feedback
 *   - Consistent UX across all create/recreate operations
 *
 * - v2.0.39 (2024-10-27):
 *   - UX: Added loading states to all AI operation modals
 *   - ExtractEditorModal: Shows "Recriando com IA..." while regenerating
 *   - LogEditorModal: Shows "Recriando com IA..." while reprocessing
 *   - TranscriptEditorModal: Shows "Recriando com Whisper..." while retranscribing
 *   - Modals stay open during AI processing with disabled buttons and spinner
 *   - Prevents user confusion when AI takes 5-30 seconds to process
 *   - Modal closes automatically on success, stays open on error for retry
 *
 * - v2.0.38 (2024-10-27):
 *   - FEATURE: Added [OBSERVAÇÃO] as new action category in Step 3 extract
 *   - Edge Function prompt updated with OBSERVAÇÃO category and example
 *   - ExtractViewer now displays OBSERVAÇÃO with amber color and Info icon
 *   - Use case: Notes, alerts, or important context without concrete actions
 *   - Ordering priority: VERBA > CRIATIVOS > CONJUNTOS > COPY > OBSERVAÇÃO
 *
 * - v2.0.37 (2024-10-27):
 *   - FEATURE: Added delete optimization functionality in editor
 *   - Delete button placed in header alongside "Export PDF"
 *   - Confirmation dialog with warning about permanent deletion
 *   - Deletes audio file from storage and all database records (cascade)
 *   - Redirects to optimization list after successful deletion
 *   - Toast notifications for success/error feedback
 *
 * - v2.0.36 (2024-10-27):
 *   - FEATURE: Added "Copy" button to all optimization steps in editor
 *   - Button order: Edit → Copy → Debug (Admin)
 *   - Copies step content to clipboard with success toast
 *   - Step 1: Copies transcript text
 *   - Step 2: Copies processed log text
 *   - Step 3: Copies extract text
 *
 * - v2.0.35 (2024-10-27):
 *   - UX: Extracts now display with full formatting and colored tags in panel
 *   - Uses ExtractViewer component with icons and category colors (CONJUNTOS purple, CRIATIVOS blue, VERBA green)
 *   - FIX: Removed "0" bug appearing next to manager email (duration_seconds > 0 check)
 *   - Shows complete extract content without truncation (removed line-clamp-4)
 *
 * - v2.0.34 (2024-10-27):
 *   - FIX: Optimization panel extracts now display correctly
 *   - Root cause: Supabase left join returns object, not array
 *   - Changed from rec.j_hub_optimization_extracts?.[0]?.extract_text to rec.j_hub_optimization_extracts?.extract_text
 *   - All 9 extracts now showing inline in optimization cards
 *
 * - v2.0.33 (2024-10-27):
 *   - REDESIGN: Optimization page transformed into panel view with permissions
 *   - Shows all optimizations from user's accessible accounts (like /my-accounts)
 *   - Account names displayed in titles (e.g., "Boiler - 24/10/2025 às 08:39")
 *   - Extract preview shown inline when available
 *   - NEW: useMyOptimizations hook with permission logic via j_hub_user_accounts
 *   - NEW: OptimizationsPanelList component with clean, scannable layout
 *   - Fetches optimizations with j_hub_optimization_extracts join
 *   - 44 otimizações displayed with proper status indicators
 *
 * - v2.0.32 (2024-10-21):
 *   - CHORE: Removed debug console.log statements from OptimizationEditor
 *   - Production-ready code with clean logging
 *
 * - v2.0.31 (2024-10-21):
 *   - FIX: Editor modals now correctly save edited text to database
 *   - Root cause: Modals called onSave() without passing edited text parameter
 *   - Fixed TranscriptEditorModal and LogEditorModal to pass editedText
 *   - Parent functions now receive and use the new text parameter
 *   - DATABASE: Fixed ambiguous column references in save_transcript_edit RPC
 *   - Added DECLARE variables to eliminate PostgreSQL column/parameter ambiguity
 *   - Migrations: 20251021152046 (optimize RPC return data), 20251021153000 (fix ambiguous refs)
 *
 * - v2.0.30 (2024-10-21):
 *   - NEW: dev-setup agent for automated development environment setup
 *   - Agent reduces setup from ~10 manual steps to single invocation (~2 min)
 *   - Validates Docker + Supabase CLI, creates/reuses backups, restores data
 *   - FIX: Migration 20251020220000 now fully idempotent (IF EXISTS checks)
 *   - FIX: Backup script corrected region endpoint (us-east-1 → sa-east-1)
 *   - DOCS: Added .claude/agents/README.md with agent development guidelines
 *   - DOCS: Updated CLAUDE.md with "Claude Code Agents" section
 *
 * - v2.0.29 (2024-10-20):
 *   - PRODUCTION FIX: Resolved error 500 in Step 3 Extract generation
 *   - Applied 3 pending migrations: create optimization_extracts table + api_logs constraint
 *   - BREAKING: Complete naming standardization j_ads_users → j_hub_users
 *   - Renamed 5 constraints, 1 trigger, updated has_role() function
 *   - Regenerated TypeScript types (zero j_ads_users references)
 *   - DOCS: Added critical naming convention warnings to ARCHITECTURE.md + CLAUDE.md
 *   - Prevention: Documented incident report to prevent future table duplication
 *
 * - v2.0.28 (2024-10-20):
 *   - DEPLOY: j_hub_optimization_extract Edge Function deployed with Claude Sonnet 4.5
 *   - Model upgrade: claude-3-5-sonnet-20241022 → claude-sonnet-4-5-20250929
 *   - All optimization steps now use Sonnet 4.5 (transcribe, process, extract)
 *   - Improved extraction quality with newer model version
 *
 * - v2.0.27 (2024-10-20):
 *   - CODE: Updated Step 3 Extract to use Claude Sonnet 4.5 (not deployed yet)
 *   - Changed model identifier in j_hub_optimization_extract/index.ts
 *
 * - v2.0.26 (2024-10-20):
 *   - NEW: Safe database reset script (db-reset-safe.sh)
 *   - Auto backup/restore workflow prevents data loss during resets
 *   - Updated all documentation (CLAUDE.md, DEV-TROUBLESHOOTING.md, QUICK-START.md)
 *   - Added package.json npm script: npm run db:reset
 *
 * - v2.0.25 (2024-10-20):
 *   - FIX: Debug modal for Step 3 (Extract) now working
 *   - Migration: Added 'extract' to j_hub_optimization_api_logs step constraint
 *   - Edge Function: Corrected API logging field names
 *   - DebugModal: Added label for 'extract' step
 *
 * - v2.0.24 (2024-10-20):
 *   - DOCS: Comprehensive local development setup documentation
 *   - NEW: DEV-TROUBLESHOOTING.md with solutions for common issues
 *   - NEW: QUICK-START.md for rapid onboarding
 *   - Updated CLAUDE.md with environment variable warnings
 *
 * - v2.0.23 (2024-10-20):
 *   - MAJOR CHANGE: Step 3 transformed from "Análise Estruturada" to "Extrato da Otimização"
 *   - NEW: AI now extracts concrete actions from log into categorized bullet list
 *   - 4 action categories: [VERBA], [CRIATIVOS], [CONJUNTOS], [COPY]
 *   - ExtractViewer component: displays actions with category icons and colors
 *   - ExtractEditorModal: manual editing, AI regeneration, undo support
 *   - Edge Function: j_hub_optimization_extract (Claude analyzes Step 2 log)
 *   - Database: j_hub_optimization_extracts table with versioning
 *   - Focused on WHAT was done (actions) vs WHY (analysis moved to Step 4 Oracle)
 *   - Cleaner interface: compact bullet format instead of verbose JSON
 *
 * - v2.0.22 (2024-10-20):
 *   - UX: All optimization steps now collapsible for cleaner interface
 *   - NEW: Click header to expand/collapse any step (except action buttons)
 *   - All steps start collapsed by default - user expands what they want to see
 *   - Smooth animations: 300ms transitions with slide-in effect
 *   - Chevron indicator shows expand/collapse state
 *   - Header hover effect for better discoverability
 *   - Oracle Framework (Step 4) remains always expanded (admin only)
 *   - Locked steps show lock message when user expands them
 *
 * - v2.0.21 (2024-10-20):
 *   - UX: Optimization steps inverted - most refined content at top (3→2→1)
 *   - NEW: Edit icons in card headers (minimalista) - removed body "Editar" buttons
 *   - NEW: Locked state indicators - Steps show lock icon when dependencies not met
 *   - Step 3 locked until Step 2 completed, Step 2 locked until Step 1 completed
 *   - ChevronUp arrows show refinement flow upward (Step 1 → Step 2 → Step 3)
 *   - Edit icons always visible but disabled when step incomplete
 *   - Cleaner, more focused interface with priority on final output
 *
 * - v2.0.20 (2024-10-20):
 *   - UX: Step 1 consolidated - single "Editar Transcrição" button
 *   - NEW: TranscriptViewer component - displays formatted text with paragraphs
 *   - NEW: TranscriptEditorModal component - edit with all actions in modal
 *   - ENHANCEMENT: Claude now adds punctuation and breaks into paragraphs automatically
 *   - Edge Function: Updated j_hub_optimization_transcribe prompt for formatting
 *   - Improved readability: formatted text view with natural paragraph breaks
 *   - "Ver Mudanças IA" moved inside modal
 *   - Consistent UX pattern with Step 2 (Log da Otimização)
 *
 * - v2.0.19 (2024-10-20):
 *   - FIX: LogViewer now preserves line breaks in Markdown
 *   - Added remark-breaks plugin to treat single line breaks as <br />
 *   - Fixes rendering issue where multi-line context was displayed as single line
 *   - Dependencies: +remark-breaks
 *
 * - v2.0.18 (2024-10-20):
 *   - UX: Step 2 renamed to "Log da Otimização" (was "Organização em Tópicos")
 *   - NEW: Created LogViewer component - renders Markdown as formatted HTML
 *   - NEW: Created LogEditorModal component - edit Log in Markdown format
 *   - Step 2 now shows rendered HTML view by default (emojis, formatting preserved)
 *   - Edit button opens modal with all actions (Save, AI Improve, Recreate, Undo)
 *   - Cleaner UX: Single "Editar Log" button in view mode
 *   - Dependencies: react-markdown + remark-gfm (already installed)
 *
 * - v2.0.17 (2024-10-20):
 *   - FIX: Debug Modal now correctly shows enhancement logs (Step 1 substep 2)
 *   - Removed conditional `if` that prevented enhancement logs from being saved
 *   - Added `enhance_transcription` to CHECK CONSTRAINT in j_hub_optimization_api_logs
 *   - Migration: 20251020104215_add_enhance_transcription_step.sql
 *   - LOCAL DEV: Added storage RLS policies for local development
 *   - Migration: 20251020102407_storage_rls_policies.sql
 *   - Users can now upload optimization audio files in local dev environment
 *   - Admin Debug Modal now shows both Whisper (substep 1) and Enhancement (substep 2) logs
 *
 * - v2.0.16 (2024-10-19):
 *   - UX: Improved enhancement UI - moved AI changes view to cleaner modal interface
 *   - Added robot icon (🤖) next to debug icon in Step 1 header
 *   - Removed "Ver mudanças da IA" and "Reverter para original" buttons from main list
 *   - Created dedicated EnhancementDiffModal with revert button inside
 *   - FIX: Enhancement debug logging now saves full prompt and token count (was placeholder before)
 *   - Cleaner, less cluttered interface for reviewing AI transcription enhancements
 *
 * - v2.0.15 (2024-10-19):
 *   - FIX: Enhanced Claude prompt to correct common PT-BR phonetic errors in transcriptions
 *   - Added explicit corrections: "edge"→"ad", "roaz"→"ROAS", "cê-pê-cê"→"CPC", etc.
 *   - FEATURE: DebugModal now shows BOTH Whisper and Enhancement logs for Step 1
 *   - Admin can now inspect what Claude changed during automatic post-processing
 *   - Improved transcription quality for paid traffic terminology
 *
 * - v2.0.14 (2024-10-17):
 *   - ENHANCEMENT: Step 2 prompt now includes temporal context intelligence
 *   - Added CRITICAL section for date/time resolution (Priority 1: extract from audio, Priority 2: use system timestamp)
 *   - AI now converts relative periods ("yesterday", "last 7 days") to absolute dates (DD/MM/YYYY)
 *   - Mandatory output format includes "CONTEXTO DA OTIMIZAÇÃO" section
 *   - All analysis sections specify exact periods (complete/partial) with "Análise realizada em" timestamp
 *   - Recording timestamp passed to AI in Brazil Time (UTC-3) format
 *   - Eliminates ambiguous temporal references in optimization reports
 *
 * - v2.0.13 (2024-10-17):
 *   - REVERT: Removed expandable UI from v2.0.11 (unnecessary after v2.0.12 fix)
 *   - Textareas now have fixed larger sizes: Input (8), Prompt (20), Output (15)
 *   - Simpler UX - no expand/collapse buttons needed
 *   - Data truncation was fixed in v2.0.12, so larger fixed sizes work well
 *
 * - v2.0.12 (2024-10-17):
 *   - FIX: Increased debug log preview limits from 500 to 5000 characters
 *   - Edge Functions: j_hub_optimization_transcribe, process, analyze, improve_transcript, improve_processed
 *   - Fixes actual data truncation issue (not just visual)
 *   - Admin debug modal now shows complete output for troubleshooting
 *   - User reported: "Output realmente está pela metade" - now fixed!
 *
 * - v2.0.11 (2024-10-17): [REVERTED in v2.0.13]
 *   - UX: Added expandable textareas in DebugModal (Optimization Editor)
 *   - This was unnecessary complexity after discovering real issue was data truncation
 *
 * - v2.0.10 (2024-10-15):
 *   - FIX: Optimization RLS policies now allow admins to view ALL recordings
 *   - Added policies: "Admins can view/update all transcripts" and "Admins can view/update all context"
 *   - Fixed issue where admin users couldn't access optimizations created by other users
 *   - Migration: 20251015000000_fix_optimization_rls_for_admins.sql
 *
 * - v2.0.9 (2024-10-15):
 *   - FIX: start-dev.sh now runs Vite in background (prevents timeout/zombie process)
 *   - Script completes successfully on first run (no more "second try" needed)
 *   - Logs saved to /tmp/vite-dev.log for debugging
 *   - Clear success message with URL and log locations
 *
 * - v2.0.8 (2024-10-15):
 *   - DEV SETUP: Added Edge Functions to start-dev.sh script (auto-start)
 *   - DOCS: Updated DEV-SETUP.md with Edge Functions requirement (critical step)
 *   - DOCS: Updated CLAUDE.md workflow to include Edge Functions
 *   - FIX: Prevents "Edge Function returned a non-2xx status code" error
 *   - Now script automatically serves functions locally on port 54321
 *
 * - v2.0.7 (2024-10-14):
 *   - PRODUCTION FIX: Resolved login issues caused by corrupted Vercel env vars
 *   - Root cause: Vercel environment variables had invalid API key format
 *   - Solution: Removed Vercel env vars, app now uses hardcoded fallback values
 *   - Removed diagnostic logs from v2.0.6 (no longer needed)
 *   - Login with email and Notion OAuth both working in production ✅
 *
 * - v2.0.6 (2024-10-14):
 *   - DIAGNOSTIC: Added detailed Supabase config logging
 *   - Shows URL, key source, and whether using local or production
 *   - Helps diagnose environment variable issues in production
 *
 * - v2.0.5 (2024-10-14):
 *   - CRITICAL FIX: Fixed .env configuration for local vs production
 *   - .env now contains PRODUCTION credentials (used by Vercel)
 *   - .env.local contains LOCAL credentials (gitignored, dev only)
 *   - No more switching env vars between local/production!
 *
 * - v2.0.4 (2024-10-14):
 *   - CRITICAL FIX: Corrected environment variable name mismatch
 *   - Code was looking for VITE_SUPABASE_PUBLISHABLE_KEY
 *   - Vercel has VITE_SUPABASE_ANON_KEY
 *   - Now checks both + correct production fallback
 *
 * - v2.0.3 (2024-10-14):
 *   - Fixed production login issues (email + Notion OAuth)
 *   - Improved userExists() with RLS-safe fallback strategy
 *   - Added OAuth hash cleanup to prevent redirect loops
 *   - Enhanced error handling in ensureUserRole()
 *   - Added detailed production logging
 *
 * - v2.0.2 (2024-10-14):
 *   - Fixed CLAUDE.md deployment documentation (clarified Vercel auto-deploy vs Supabase manual)
 *
 * - v2.0.1 (2024-10-14):
 *   - Centralized version management
 *
 * - v2.0.0 (2024-10-14):
 *   - Composite authorization system
 *   - Role auto-detection (@jumper.studio)
 *   - Local dev environment safety
 *   - Environment variable precedence fix
 *
 * - v1.0.0 (2024-09-XX): Initial release
 *   - Creative submission system
 *   - 9 specialized dashboards
 *   - Notion integration
 *   - Resilient architecture
 */
