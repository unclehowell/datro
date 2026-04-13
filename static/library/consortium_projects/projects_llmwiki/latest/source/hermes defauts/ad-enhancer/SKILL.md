---
title: Ad Enhancer
description: Automatically enhances the first display ad when ads are generated on the canvas
---

# Ad Enhancer

This skill enhances display ads by analyzing their layout and making adjustments for optimal legibility, positioning, and preventing text overlap.

## How it works

1. When ads are generated on the canvas, the first ad is automatically enhanced
2. The enhancement process:
   - Captures the ad canvas via browser snapshot
   - Analyzes text sizes and positioning
   - Checks for overlap issues
   - Generates specific adjustments
   - Applies adjustments via JavaScript
3. Shows "A.I auto enhancing" badge during process
4. Displays enhancement score and completion status

## Integration with canvas

The canvas HTML automatically calls this enhancement when ads are generated.

## Browser-side features

- Auto-enhance first ad after generation
- "A.I auto enhancing..." animated badge
- "A.I Auto Enhance All" button to enhance all ads
- Real-time application of adjustments
- Enhancement score feedback

## Technical details

The enhancement uses a simple rules-based approach:
- For ads smaller than 200x100: reduce headline font size
- Ensure smallprint is at least 8px for legibility
- Add proportional padding for logo placement
- Calculate overall quality score (0-10)

## Files

- `/home/ubuntu/datro/static/canvas/index.html` - Canvas with enhancement integration
- `/home/ubuntu/datro/static/canvas/scripts/ad_enhance.py` - Enhancement script
- `/home/ubuntu/datro/static/canvas/api/enhance.php` - PHP bridge for browser calls