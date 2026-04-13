---
title: Ad Optimization Agent
description: AI agent for optimizing display ad layouts - ensures text legibility, proper positioning, and no overlap
dependencies:
  - browser_vision
  - browser_snapshot
---

# Ad Optimization Agent

## Purpose
Optimizes display ad layouts by analyzing visual elements and suggesting improvements for legibility, positioning, and text overlap.

## Activation
Call this agent with an ad canvas element ID and target dimensions.

## Process

### 1. Capture current state
```javascript
// In browser console context
const canvas = document.getElementById('ad-{id}');
const rect = canvas.getBoundingClientRect();
```

### 2. Analyze with vision
Use browser_vision() to analyze the ad for:
- Text legibility (contrast, size, font weight)
- Text overlap or overflow
- Logo positioning adequacy
- White space balance

### 3. Generate optimization recommendations
The agent returns a JSON object with adjustments:
```json
{
  "adjustments": [
    {
      "element": "headline",
      "property": "fontSize",
      "current": "24px",
      "suggested": "20px",
      "reason": "Too large, causing overflow on 728x90 ad"
    },
    {
      "element": "smallprint",
      "property": "fontSize",
      "current": "9px",
      "suggested": "7px",
      "reason": "Too small for legibility at this ad size"
    },
    {
      "element": "logo",
      "property": "top",
      "current": "10px",
      "suggested": "5px",
      "reason": "Too close to edge, needs more padding"
    }
  ],
  "overall_score": 7.5,
  "issues_found": ["headline_overflow", "smallprint_too_small", "logo_too_close_to_edge"]
}
```

### 4. Apply adjustments
The agent uses JavaScript to apply these changes directly to the DOM.

## Usage

```javascript
// Call from canvas: enhanceAd('ad-{id}', adData)
// Returns: Promise with optimization results
```

## Prompt Template

**System Prompt:**
```
You are an expert display ad designer specializing in small banner ad optimization. Analyze the provided ad image and suggest specific numeric adjustments to improve legibility and layout.

Focus areas:
- Font sizes (in pixels)
- Element positioning (top, left, right values in pixels)
- Padding/margins
- Overall balance and readability

For each suggested change, provide:
1. Element name (headline, smallprint, logo)
2. CSS property to change
3. Current value
4. Suggested value
5. Brief reason

Be specific and technical. Return ONLY valid JSON with adjustments array.
```

**User Prompt:**
```
Analyze this {width}x{height} display ad and suggest optimizations. Focus on:
- Headline text: "{headline}"
- Smallprint text: Is it readable?
- Logo position and size
- Any text overflow or overlap
- Legibility improvements

Return JSON with specific pixel values.
```
