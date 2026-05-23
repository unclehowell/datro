/**
 * PCP Web App - Enhanced CORS/CSP compatible version
 * Fixes cross-origin iframe and API communication issues
 */

(function() {
    'use strict';
    
    // Configuration for different environments
    const ENVIRONMENTS = {
        production: {
            apiBase: 'https://ai.carfinancecheque.uk',
            corsOrigins: ['https://financecheque.uk', 'https://carfinancecheque.uk'],
            websocketBase: 'wss://ai.carfinancecheque.uk'
        },
        staging: {
            apiBase: 'https://ai.financecheque.uk',
            corsOrigins: ['https://financecheque.uk', 'https://carfinancecheque.uk'],
            websocketBase: 'wss://ai.financecheque.uk'
        }
    };
    
    const CURRENT_ENV = window.location.host.includes('ai.') ? 'production' : 'staging';
    const CONFIG = ENVIRONMENTS[CURRENT_ENV];
    
    // Enhanced CORS headers function
    function getCorsHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Custom-Header': 'PCP-WEBAPP-' + Date.now()
        };
        
        // Add proper origin header
        try {
            headers['Origin'] = window.location.origin;
        } catch (e) {
            // Fallback for edge cases
            headers['Origin'] = '*';
        }
        
        return headers;
    }
    
    // Enhanced API communication with proper CORS handling
    function makeCorsRequest(url, data = null, method = 'GET') {
        const options = {
            method: method,
            mode: 'cors',
            credentials: 'include',
            headers: getCorsHeaders()
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        return fetch(url, options);
    }
    
    // OpenClaw drawer initialization with CORS fixes
    document.addEventListener('DOMContentLoaded', () => {
        const ocTab = document.getElementById('ocTab');
        const ocDrawer = document.getElementById('ocDrawer');
        const guacFrame = document.getElementById('guac-frame');
        const userQuery = document.getElementById('user-query');
        const sendBtn = document.getElementById('send-btn');
        
        // Enhanced configuration for cross-origin support
        const USER_NUM = getLocalStorageItem('user_num', '1');
        const USER_PWD = getLocalStorageItem('user_pwd', '');
        const hasRemoteLogin = USER_PWD.trim().length > 0;
        
        const REMOTE_HOST_PRIMARY = CONFIG.apiBase;
        const REMOTE_HOST_FALLBACK = CONFIG.apiBase.replace('ai.', '');
        
        const GATEWAY_URL = `${REMOTE_HOST_PRIMARY}/command${USER_NUM}/support`;
        const GATEWAY_TOKEN = '9533263d7ff39819800754b970748ddf';
        
        // Override the default sendMessage function with CORS fixes
        if (sendBtn && userQuery && hasRemoteLogin) {
            sendBtn.addEventListener('click', async function() {
                const message = userQuery.value.trim();
                if (!message) return;
                
                try {
                    const response = await makeCorsRequest(GATEWAY_URL, {
                        message: message,
                        channel: 'web_ui',
                        user_num: USER_NUM,
                        origin: window.location.origin
                    }, 'POST');
                    
                    if (response.ok) {
                        userQuery.value = '';
                        showFeedback('✓ Command sent successfully');
                    } else {
                        showFeedback(`Error sending command: ${response.status}`);
                    }
                } catch (error) {
                    console.error('Command send error:', error);
                    showFeedback('Connection error - check network');
                }
            });
        }
        
        // Enhanced Guacamole iframe handling
        if (ocTab) {
            ocTab.addEventListener('click', () => {
                if (guacFrame && guacFrame.src === 'about:blank') {
                    // Set proper src with CORS parameters
                    const guacUrl = `${REMOTE_HOST_PRIMARY}/guacamole/#/?username=user2514853${USER_NUM}&password=${USER_PWD}`;
                    guacFrame.src = guacUrl;
                    
                    // Wait for iframe to load
                    guacFrame.onload = () => {
                        showFeedback('Guacamole session connected');
                    };
                    
                    guacFrame.onerror = () => {
                        showFeedback('Failed to connect Guacamole - check configuration');
                    };
                }
            });
        }
    });
    
    // Utility functions
    function getLocalStorageItem(key, fallback = '') {
        try {
            return localStorage.getItem(key) || fallback;
        } catch {
            return fallback;
        }
    }
    
    function showFeedback(message) {
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = message;
            setTimeout(() => feedback.textContent = '', 5000);
        } else {
        }
    }
    
    // Export for global compatibility
    window.PCP_CONFIG = CONFIG;
    window.makeCorsRequest = makeCorsRequest;
    window.getCorsHeaders = getCorsHeaders;
})();
