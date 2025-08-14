# Social Media Metadata Fix - Portfolio Site

**Date:** August 14, 2025  
**Issue:** Generic Quartz branding appearing in social media link previews  
**Status:** ✅ Resolved  

## Problem

When sharing the portfolio site URL, social media platforms (LinkedIn, Twitter, Facebook) were showing generic Quartz branding instead of custom Lucas Draney portfolio branding. User reported that link cards showed "quartz" rather than representative content.

## Root Cause Analysis

Investigation revealed the issue was in `quartz.config.ts`:

```typescript
// INCORRECT - Wrong GitHub username
baseUrl: "lucasdraney.github.io/portfolio"

// CORRECT - Actual GitHub Pages URL  
baseUrl: "ldraney.github.io/portfolio"
```

### What Was Happening

1. **Incorrect baseUrl**: Configuration pointed to non-existent `lucasdraney.github.io`
2. **Fallback to Quartz default**: Social media platforms fell back to `quartz.jzhao.xyz` domain
3. **Wrong Open Graph URLs**: All social metadata pointed to incorrect URLs:
   - `<meta property="og:url" content="https://quartz.jzhao.xyz/index"/>`
   - `<meta property="og:image" content="https://quartz.jzhao.xyz/index-og-image.webp"/>`
   - `<meta property="twitter:domain" content="quartz.jzhao.xyz"/>`

## Solution Applied

### 1. Configuration Fix
```typescript
// File: quartz.config.ts
baseUrl: "ldraney.github.io/portfolio", // Updated to correct username
```

### 2. Site Rebuild
```bash
npx quartz build
```

### 3. Deploy Changes
```bash
git add .
git commit -m "Fix social media metadata URLs for proper link preview"
git push
```

## Verification

Post-fix verification shows correct metadata:
- ✅ `<meta property="twitter:domain" content="ldraney.github.io/portfolio"/>`
- ✅ `<meta property="og:url" content="https://ldraney.github.io/portfolio/index"/>`
- ✅ `<meta property="og:image" content="https://ldraney.github.io/portfolio/index-og-image.webp"/>`

## Current Site Configuration

The portfolio site properly configured with:

- **Custom title**: "Lucas Draney - AI Automation & Business Process Expert"
- **Custom description**: Professional expertise in AI agents, Monday.com automation, etc.
- **Custom Open Graph images**: Lucas Draney branded social preview cards
- **Proper meta tags**: All social media metadata pointing to correct domain

## Next Steps

1. **Clear social media cache** using platform debugging tools:
   - LinkedIn Post Inspector
   - Twitter Card Validator  
   - Facebook Sharing Debugger

2. **Share correct URL**: Always use `https://ldraney.github.io/portfolio/` (not GitHub repo URL)

## Lessons Learned

- Always verify `baseUrl` matches actual deployment URL
- Social media platforms cache link previews aggressively
- Quartz falls back to creator's domain when baseUrl is incorrect
- Open Graph metadata is critical for professional link sharing

## Technical Notes

- **Quartz version**: v4.5.1
- **CustomOgImages plugin**: Enabled and working correctly
- **GitHub Pages**: Auto-deploys from master branch
- **Domain**: Using GitHub's default `github.io` subdomain

---

*Session completed successfully. Social media link previews will now display proper Lucas Draney portfolio branding.*