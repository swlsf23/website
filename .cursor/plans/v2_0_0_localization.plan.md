---
name: v2 i18n localization
overview: v2.0.0 ships locale-prefixed routes, parallel Markdown per locale, and UI chrome strings. v2.1.0 adds SEO (dynamic document lang, hreflang, canonical / site origin). Later, GitHub Actions + Anthropic translation PRs (one PR per target language) for human review before deploy.
todos:
  - id: decide-url-locale
    content: "Portuguese: pt-BR — path /pt-br/; BCP 47 pt-BR for html/hreflang and automation; content/locale/pt-br/"
    status: completed
  - id: routing-lang-param
    content: Add /:lang routes, default redirect, locale-prefixed NavLinks + switcher
    status: pending
  - id: content-folders-generator
    content: EN in content/site/; translations in content/locale/{fr,es,pt-br}; extend generate-site-content + pages
    status: pending
  - id: ui-strings
    content: Per-locale chrome strings (nav, footer, etc.)
    status: pending
  - id: seo-v210
    content: "v2.1.0: documentElement.lang, hreflang alternates, optional title pattern, VITE_SITE_ORIGIN / canonical"
    status: pending
  - id: automation-prs
    content: "GHA on EN path changes: LLM translate per lang matrix; one PR per language"
    status: pending
  - id: llm-translation-contract
    content: Define LLM API inputs, prompts, output validation, and failure handling per changed file
    status: pending
  - id: anthropic-messages-api
    content: Wire Anthropic Messages API in CI (ANTHROPIC_API_KEY); pick Claude model id + pin in workflow
    status: pending
isProject: false
---

# v2.0.0 — Localization plan

**SEO scope:** Dynamic per-route `html lang`, `hreflang` alternates, and canonical / Open Graph–style wiring are **deferred to [v2.1.0 SEO](#v210-seo)**. v2.0.0 may keep the static `[index.html](apps/web/index.html)` shell as today.

## Current baseline (relevant to design)

- Routes live in `[apps/web/src/App.tsx](apps/web/src/App.tsx)` as nested routes under a single `[Layout](apps/web/src/components/Layout.tsx)`; there is no locale segment today.
- Page copy is built from `[content/site/*.md](content/site/)` via `[scripts/generate-site-content.mjs](scripts/generate-site-content.mjs)` into a single `[apps/web/src/generated/sitePages.ts](apps/web/src/generated/sitePages.ts)` consumed at build time.
- `[index.html](apps/web/index.html)` is fixed `lang="en"`.

---

## 1. URL and locale conventions (industry practice)

**Recommended URL shape:** **locale prefix in the path** — e.g. `/en/`, `/fr/`, `/es/`, `/pt-br/`.

**Decided — Portuguese:** **Brazilian Portuguese** (`pt-BR`). Use path prefix `**/pt-br/`** (route segment `pt-br`). For `html lang`, `hreflang`, and LLM `target_locale`, use `**pt-BR`** consistently.


| Practice                 | What to do                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Stable URLs per language | Every public page lives under `/:lang/...` (same path segments after the locale).                                                                                  |
| Default entry            | Redirect `/` → `/en/` (or detect `Accept-Language` with a safe fallback to `en`).                                                                                  |
| BCP 47 tags              | Use `en`, `fr`, `es`, `pt-BR` for the `/pt-br/` locale (router allowlist includes `pt-br`).                                                                        |
| `html lang`              | Set per-route (e.g. small effect on `document.documentElement.lang`). **Planned for v2.1.0** together with `hreflang` (see [§v2.1.0](#v210-seo)).                  |
| `hreflang`               | Emit `<link rel="alternate" hreflang="..." href="...">` for the same page across locales. **v2.1.0** (see [§v2.1.0](#v210-seo)).                                  |
| Language switcher        | In `Layout`, links to **same path** in another locale (e.g. from `/fr/resume` → `/es/resume`), not only to home.                                                   |


**React Router shape (conceptual):** a parent route `/:lang` (valid `lang` allowlist) wrapping existing `resume`, `projects`, `contact`, and index; `NavLink` targets become `/${lang}/resume`, etc.

---

## 2. Content model and build pipeline

**Directory layout — English separate from translations (search / review ergonomics):**

- **English only (source of truth):** `**content/site/`** — keep the current flat layout (`home.md`, `resume.md`, `projects.md`, `contact.md`, …). Scoped search (`rg`, IDE) under `content/site/` hits **only** English, not FR/ES/PT.
- **Translated Markdown:** separate root, **mirrored filenames**, e.g. `**content/locale/fr/`**, `**content/locale/es/`**, `**content/locale/pt-br/**` with the same stems as EN. This avoids mixing locales (or future `.po`/gettext-style files) alongside EN in one tree, which pollutes “find in English source” workflows.

**First step on the v2 branch:** create `**content/locale/fr`**, `**es`**, `**pt-br**` (add stub `.md` files or empty placeholders as needed) before wiring the generator and routes.

**Generator (`[scripts/generate-site-content.mjs](scripts/generate-site-content.mjs)`):**

- **English:** read from `content/site/` (existing skip rules and `resume`/`contact` merge behavior stay here; `contact.md` path remains `content/site/contact.md`).
- **fr / es / pt:** read from `content/locale/<lang>/` for each supported locale.
- Emit **either** one module per locale or a single `Record<Locale, SitePageData>` keyed by slug.
- **Resume contact merge:** today EN `resume.md` merges `content/site/contact.md` via `<!-- resume-contact -->`. For each non-EN locale, merge `**content/locale/<lang>/contact.md`** into that locale’s `resume.md` the same way.

**Runtime:** pages (`[HomePage.tsx](apps/web/src/pages/HomePage.tsx)`, etc.) read `useParams().lang` and call `getSitePage(lang, 'home')` (or equivalent) instead of a single global `getSitePage('home')`.

**UI chrome (nav labels, footer strings):** not in Markdown today; use **small JSON dictionaries** per locale (`apps/web/src/locales/en.json`, …) or a minimal i18n helper—avoid pulling a heavy framework unless you need pluralization.

---

## 3. Scope decisions to lock before coding

- **Portuguese:** **Decided** — not `pt-BR`; path `**/pt/`** + tag `**pt-PT`** for `hreflang` and automation (see §1).
- **PDFs:** Keep **English-only** PDFs in v2, or add a second phase for locale-specific PDFs (Playwright per language)? Resume pipeline is non-trivial (`[ResumePage](apps/web/src/pages/ResumePage.tsx)` + `[splitResumeMarkdown](apps/web/src/utils/splitResumeMarkdown.ts)`).
- **Deploy:** Static hosting already serves `index.html` for unknown paths; locale-prefixed client routes **should work** once the router matches `/fr/`* the same as `/`. No CloudFront change strictly required unless you add server-only redirects for `/` → `/en/`.

---

## 4. Automated translation PRs (post–content-ready)

**Goal:** When **English** source Markdown under `**content/site/`** changes, **three separate PRs** (one per target language) each updating `**content/locale/fr/`**, `**es/`**, or `**pt/**` as appropriate, for human review.

**Trigger:** GitHub Actions `on.push` to `main` (or `pull_request` only if you prefer not to translate on every direct push) with `**paths`** filtered to `**content/site/`**** (EN only).

**Job per target language (matrix: `fr`, `es`, `pt`):**

1. Checkout branch, optionally **create a branch** `i18n/auto-<lang>-<short-sha>` from `main`.
2. **Diff or identify** which EN files changed (git diff against previous commit or merge-base).
3. For each changed file, run the **LLM translation contract** below (one API call per file per language, unless you later batch small files).
4. Write outputs to `**content/locale/<lang>/`** (same filename as `content/site/<file>.md`).
5. **Open one PR per language** (e.g. `gh pr create` or GitHub REST API): title like `[i18n] Sync fr from EN <sha>`, body listing files touched, link to EN commit.

**Secrets:** The API key **never** appears in the repository: not in Markdown, not in workflow YAML as a literal, not in committed `.env`. Store `**ANTHROPIC_API_KEY`** only as a **GitHub Actions repository secret** (or **environment** secret with optional protection rules). The workflow reads it as `secrets.ANTHROPIC_API_KEY` and passes it into the step environment. Local dev uses a **gitignored** `.env` or shell env—never commit those files. `GITHUB_TOKEN` is provided by Actions for PR creation (not your Anthropic key).

**Human review:** As you specified—merge when satisfied; your existing deploy (e.g. `build:site` + S3) then picks up that locale’s generated bundle.

**Optional guardrails:** only run if EN files changed; skip if PR already exists for same batch; max file size; **fail closed** if LLM output fails validation (frontmatter parse, required slugs).

---

### 4.1 LLM translation contract (main design area)

This is the piece to resolve before implementation: **what exactly** each API call sends and **what** the model must return.

**Request inputs (every call should include):**


| Input                             | Purpose                                                                                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `target_locale`                   | BCP 47 tag (e.g. `fr`, `es`, `pt-PT`) and short natural-language name for the prompt.                                                                                                                                                          |
| `source_path`                     | Repo-relative path e.g. `content/site/resume.md` (EN only under `content/site/`).                                                                                                                                                              |
| `source_text`                     | Full **current** English file as UTF-8 (the single source of truth for this run).                                                                                                                                                              |
| `previous_translation` (optional) | If `content/locale/<lang>/<same-file>.md` exists, pass its **previous** contents so the model can preserve unchanged paragraphs and only translate deltas—or re-translate fully from EN; **pick one strategy** (minimal-diff vs full replace). |
| `glossary` (optional)             | Small fixed terms (e.g. product names, “MuleSoft”, your name) that must stay untranslated or follow a fixed spelling.                                                                                                                          |


**System / developer instructions (must be fixed strings in code, versioned):**

- Output **only** the translated Markdown file body: **no** surrounding commentary, no markdown fences unless the source legitimately contains them.
- **Preserve** YAML frontmatter: `slug` and `title` values must remain **identical** to the English file (titles are often left in English for nav consistency, or **decide** whether `title` is localized—if localized, still keep `slug` stable).
- **Preserve** Markdown structure: heading levels (`##`, `###`), list markers, link URLs, bare `mailto:`/`tel:` targets, and **literal** HTML comments such as `<!-- resume-contact -->` (do not translate inside comments).
- **Do not** add or remove sections in `resume.md` relative to EN (section headings drive parsing); translate heading text only if the parser keys off `##` titles—see risk: may need **stable section IDs** in EN or a convention that translated headings still match `splitResumeMarkdown` expectations (this may require a **pre-v2** audit of `splitResumeMarkdown`).

**User prompt (per file):**

- A single block: “Translate the following Markdown from English to language. Follow the rules above.” plus `source_text` (and optional `previous_translation` / glossary).

**Output validation (before writing to disk):**

1. Parse frontmatter if present; **fail** if `slug` missing or differs from EN source.
2. **Fail** if required markers (e.g. `<!-- resume-contact -->`) are missing when EN had them.
3. Optional: run the same **generator** or a small parser on the output in CI to ensure it does not break `generate-site-content` / resume splitting.
4. **Encoding:** UTF-8 only; normalize newlines to LF.

**Operational concerns:**

- **Token limits:** For `resume.md`, if the file is large, either chunk by section (harder) or use a model with a large context window; **or** translate section-by-section with a shared glossary (more complex).
- **Idempotency:** Re-running on the same EN commit should produce the same PR content (or skip if no diff).
- **Vendor (decided):** **Anthropic only**—Messages API, `ANTHROPIC_API_KEY`, Claude model id pinned in workflow/script. **Account:** you need an Anthropic Console account with **billing enabled** (usage-based charges; not usually a fixed monthly “subscription,” but a payment method and a key allowed for CI). At portfolio volume, cost stays tiny; optional **usage limits/alerts** in the console for safety. **store** model name and prompt version in the workflow or script for reproducibility.

**Open decisions to record in the plan when you choose:**

- Whether `title` in frontmatter is **localized** or **English-only** across locales.
- **Full-file retranslate** vs **minimal edit** when `previous_translation` exists.
- Whether **one PR per language per push** always runs or only when a label / manual `workflow_dispatch` is used (noise control).

### 4.2 Anthropic: subscribe / billing (prerequisite)

Before the translation workflow can call the API from GitHub Actions, **subscribe** in the sense of **enabling API access with billing** on [Anthropic’s console](https://console.anthropic.com): create a workspace, add a payment method if required, generate an `**ANTHROPIC_API_KEY`**, and store it only as described in **Secrets** above. Local testing uses the same key from a **gitignored** `.env`. Pricing is per token—confirm current rates on Anthropic’s pricing page; rare small-file runs stay in the **cents** range for this POC.

### 4.3 Rate limits, spend controls, and leaked keys

- **Rate limits:** Anthropic applies **request and token rate limits** (they scale with your **usage/spend tier**). Heavy traffic gets **429** responses until the window resets—normal for APIs. For this repo’s **rare, small** translation runs, you are unlikely to hit limits unless something is wrong or misconfigured.
- **Bill shock / stolen key:** There is **no substitute** for **console controls + habits**: use **[Limits](https://console.anthropic.com/settings/limits)** and **[Cost](https://console.anthropic.com/settings/cost)** in the Claude Console to see what Anthropic offers today (usage alerts, monthly spend caps if available—features evolve, verify in-product). **Rotate the key** immediately if it leaks; **revoke** the old key in the console, add a **new** key, update **only** the GitHub secret. Prefer a **dedicated API key** for CI (label it `github-actions-translate`) so you can revoke one key without touching other uses. Enable **GitHub secret scanning** on the repo (default on public repos) so accidentally committed keys trigger alerts.
- **Defense in depth:** Restrict **who can run** the translation workflow (e.g. `workflow_dispatch` only, or **environment** protection rules requiring approval) if you want to cap how often the key is used from CI, independent of Anthropic’s limits.

---

## v2.1.0 SEO

Ship after v2.0.0 localization is stable. Intended work:

- **`document.documentElement.lang`** (or equivalent) aligned with the active locale route (`en`, `fr`, `es`, `pt-br` → BCP 47 tags as in §1).
- **`hreflang`** `<link rel="alternate">` for the current path across all published locales; absolute URLs from **`VITE_SITE_ORIGIN`** (or env-driven canonical base).
- **Optional:** per-page `<title>` / meta description pattern; lightweight head helper (e.g. small component + `useEffect`, or `react-helmet-async` if you prefer).
- **Not in v2.0.0:** no requirement to land this before tagging v2.0.0.

---

## 5. Implementation order (suggested)

1. **Feature branch** — e.g. `feature/v2-i18n` (or your naming); do v2 work there until ready to merge.
2. **Locale directories** — `content/locale/fr`, `es`, `pt` with mirrored filenames (stubs OK) so layout exists before wiring.
3. **Content pipeline** — extend `generate-site-content.mjs` for EN + `content/locale/<lang>`; `getSitePage(lang, …)`; EN stays in `content/site/` (no migration of EN unless you choose otherwise).
4. **Routing + allowlist** — `/:lang` routes, redirect `/` → `/en/`, `NavLink`/`Link` with locale prefix; language switcher (FR / ES / PT).
5. **Locale-aware UI strings** — nav, footer; optional document title pattern can wait for **v2.1.0** if you want titles + SEO in one pass.
6. **Automation** — workflow + Anthropic script + PR template; `paths: content/site/`**; writes to `content/locale/<lang>/`.

**v2.1.0 (after v2.0.0):** SEO — `html lang`, `hreflang`, canonical base, optional meta (see [§v2.1.0](#v210-seo)).

---

## 6. Risks (short)

- **Resume structure:** Translations must not break `splitResumeMarkdown` / section IDs; consider validating against a schema or golden tests.
- **Cost/latency:** LLM per file per push; batching and idempotency help.
- **Drift:** If EN changes often, three PRs can be noisy—tune triggers (e.g. weekly batch) if needed.

