# LLM Provider Token Usage - Bubble Visualization

## Overview
A stunning dashboard displaying LLM provider token usage with square bubbles. Each large square represents a company (OpenAI, Google, Microsoft, etc.) and contains smaller squares representing their LLM models. The smaller squares expand to fill the larger square based on the percentage of tokens/quota used.

## Features

### 🎯 Core Functionality
- **Square Company Bubbles**: Each provider is a large, elegant square bubble
- **Dynamic Model Squares**: Smaller squares inside expand based on usage
- **Color Coding**: Automated color-coding by usage level (0-100%)
- **Star Ratings**: Each model gets 1-5 stars based on quality
- **Real-time Updates**: Live updates every 2 seconds
- **No Scrolling**: Designed for laptop and TV primary displays
- **Zero-Scroll Layout**: Everything fits on one screen

### 🎨 Visual Design
- **Dark Theme**: Professional dark background with vibrant accents
- **Smooth Animations**: Cubic-bezier transitions for fluid movement
- **Hover Effects**: Tooltip information on hover
- **Usage Legend**: Clear color-coded legend for usage levels
- **Responsive**: Adapts from laptops to 4K displays

### 📊 Layout & Ordering
- **Automatic Sorting**: Companies ordered by average usage percentage (highest first)
- **Model Prioritization**: Within each company, models sorted by usage
- **Grid Layout**: Responsive grid that fills available space
- **Consistent Height**: All company bubbles maintain similar heights

## Usage Levels & Colors

```
🚲 Very Low (0-20%)   → Blue (#2196F3)
🚗 Low (21-50%)       → Green (#4CAF50)
🚙 Medium (51-75%)    → Orange (#FF9800)
✈️ High (76-90%)      → Red (#F44336)
🚀 Extreme (91-100%) → Purple (#9C27B0)
```

## API Endpoints

### `/api/llm-usage` 
Returns JSON data formatted for bubble visualization:
```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "color": "#00A86B",
      "models": [
        {
          "id": "openai-gpt-4",
          "name": "GPT-4",
          "provider": "OpenAI", 
          "used": 15000,
          "limit": 20000,
          "usage": 75,
          "stars": 5,
          "description": "GPT-4 model",
          "status": "ok"
        }
      ]
    }
  ]
}
```

### `/api/active`
Returns users and devices currently active.

## How to Use

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Open the dashboard**:
   ```bash
   open http://localhost:3000/index-bubble.html
   ```

3. **Default view**: Bubble visualization loads automatically

## Configuration

### Custom Providers/Colors
Modify the `companyColors` object in `index-bubble.html`:

```javascript
this.companyColors = {
    'OpenAI': '#00A86B',
    'Google': '#4285F4',
    'Microsoft': '#00BCF2',
    // Add your custom providers
};
```

### Update Frequency
Change the update interval in the dashboard:
```javascript
this.updateInterval = 2000; // 2 seconds
```

### Screen Layout
The dashboard is optimized for:
- **Primary**: Laptops (13" - 17") 
- **Secondary**: TVs/monitors (24"+)
- Avoids: Mobile phones (UI too complex for phone screens)

## Bubble Behavior

- **Expansion Animation**: Squares expand from 30% to 100% based on usage
- **Z-index Management**: Highest usage squares appear on top
- **Smooth Transitions**: 0.8s cubic-bezier easing for natural movement
- **Real-time Updates**: Live data refreshes every 2 seconds

## Star Rating System

Models are rated 1-5 stars based on:
- **Performance**: Token processing speed
- **Accuracy**: Output quality
- **Reliability**: Uptime and consistency
- **Cost Efficiency**: Tokens per dollar

To customize ratings, modify the `model.quality` data in your backend API.

## Troubleshooting

### "Failed to load data" Error
1. Ensure server is running: `npm start`
2. Check API endpoint: `curl http://localhost:3000/api/llm-usage`
3. Verify no port conflicts (default: 3000)

### Bubbles Not Animating
1. Check JavaScript console for errors
2. Verify CSS transitions are supported in your browser
3. Ensure WebSocket connections aren't blocked by firewall

### Interface Too Small/Large
The interface scales to available viewport space. Add viewport meta tags if needed:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

## Deployment

Ready for production deployment:
- No private configuration required
- Works with any hosting (Heroku, AWS, DigitalOcean, etc.)
- Configurable for public/private networks
- Self-contained - no external dependencies at runtime

Enjoy your beautiful token usage visualization! 🚀