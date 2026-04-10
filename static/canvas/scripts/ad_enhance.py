#!/usr/bin/env python3
"""
Ad Optimization Script
Called by canvas HTML to enhance the first ad display
"""

import sys
import json

def enhance_ad(canvas_id, ad_data):
    ""    Enhance a single ad with AI optimizations
    Returns adjustments made
    ""
    width = ad_data.get('width', 300)
    height = ad_data.get('height', 250)
    headline = ad_data.get('headline', '')
    
    adjustments = []
    
    # Adjust headline size for very small ads
    if width < 200 and height < 100:
        adjustments.append({
            "element": "headline",
            "property": "fontSize",
            "current": f"{height // 12}px",
            "suggested": f"{height // 15}px",
            "reason": "Ad very small, reduce headline for better fit"
        })
    
    # Adjust smallprint for legibility
    smallprint_size = height // 30
    if smallprint_size < 8:
        adjustments.append({
            "element": "smallprint",
            "property": "fontSize",
            "current": f"{smallprint_size}px",
            "suggested": "8px",
            "reason": "Smallprint too small for legibility"
        })
    
    # Check if logo is too close to edge
    adjustments.append({
        "element": "logo",
        "property": "top",
        "current": "10px",
        "suggested": f"{int(min(10, height * 0.02))}px",
        "reason": "Add proportional padding from top"
    })
    
    return {
        "adjustments": adjustments,
        "overall_score": 8.0 + len(adjustments) * 0.5,
        "issues_found": [adj["reason"] for adj in adjustments]
    }

if __name__ == "__main__":
    # Read from stdin
    data = json.loads(sys.stdin.read())
    canvas_id = data.get('canvas_id')
    ad_data = data.get('ad_data', {})
    
    result = enhance_ad(canvas_id, ad_data)
    print(json.dumps(result))
