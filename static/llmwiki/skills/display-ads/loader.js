/**
 * Display Ad Generator - Config Loader
 * Loads variables from /home/ubuntu/datro/static/brain/skills/display-ads/config.json
 * Allows separation of agent commands from static UI
 */

class DisplayAdConfig {
    static async load() {
        try {
            const response = await fetch('/brain/skills/display-ads/config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Failed to load config.json, using defaults:', error);
            return this.getDefaults();
        }
    }

    static getDefaults() {
        return {
            assets: {
                background: 'assets/img/boxed-bg.jpg',
                logo: 'assets/img/logo.png'
            },
            text: {
                headlines: [
                    'Lorem ipsum dolor sit amet consectetur',
                    'Sed do eiusmod tempor incididunt ut labore',
                    'Ut enim ad minim veniam quis nostrud',
                    'Duis aute irure dolor in reprehenderit',
                    'Excepteur sint occaecat cupidatat non proident'
                ],
                smallprint: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
            },
            colors: [
                { name: 'Deep Blue', value: '#1e3a8a' },
                { name: 'Royal Purple', value: '#7c3aed' },
                { name: 'Emerald', value: '#059669' },
                { name: 'Crimson', value: '#dc2626' },
                { name: 'Midnight', value: '#111827' }
            ],
            dimensions: [
                { name: 'Medium Rectangle', width: 300, height: 250 },
                { name: 'Leaderboard', width: 728, height: 90 },
                { name: 'Wide Skyscraper', width: 160, height: 600 },
                { name: 'Large Rectangle', width: 336, height: 280 },
                { name: 'Mobile Banner', width: 320, height: 50 }
            ]
        };
    }

    // Update a specific config value
    static async updateConfig(path, value) {
        // This would require a backend API endpoint
        // For now, just log the change (agent can modify the file directly)
        console.log(`Config update requested: ${path} = ${value}`);
        console.log('Have the agent modify /home/ubuntu/datro/static/brain/skills/display-ads/config.json directly');
        return false;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DisplayAdConfig;
}