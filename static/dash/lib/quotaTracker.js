const fs = require('fs').promises;
const path = require('path');

/**
 * Tracks API quota status and rate limit information
 * Monitors when APIs will be accessible again if currently rate limited
 */
class QuotaTracker {
  constructor(dataPath = './data/quota-status.json') {
    this.dataPath = dataPath;
    this.quotaStatus = new Map();
    this.resetTimers = new Map();
    this.loadQuotaData();
  }

  async loadQuotaData() {
    try {
      const dir = path.dirname(this.dataPath);
      await fs.mkdir(dir, { recursive: true });
      const data = await fs.readFile(this.dataPath, 'utf8');
      const quotas = JSON.parse(data);

      quotas.forEach(q => {
        this.quotaStatus.set(q.apiId, {
          ...q,
          nextAccessAt: q.nextAccessAt ? new Date(q.nextAccessAt) : null,
          lastCheckedAt: q.lastCheckedAt ? new Date(q.lastCheckedAt) : new Date()
        });
      });
    } catch (error) {
      console.log('Initializing new quota tracking data');
      this.initializeDefaultQuotas();
    }
  }

  initializeDefaultQuotas() {
    const apis = [
      'openai/gpt-5.4',
      'anthropic/claude-sonnet-4-6',
      'google/gemini-2.0-flash',
      'groq/llama-3.3-70b-versatile',
      'minimax/minimax-m2.7-cloud',
      'nvidia/nemotron-4-340b-instruct',
      'ollama/minimax-m2.7:cloud',
      'ollama/qwen2.5:3b',
      'openrouter/meta-llama/llama-3.3-70b-instruct',
      'opencode/big-pickle'
    ];

    apis.forEach(apiId => {
      this.quotaStatus.set(apiId, {
        apiId,
        status: 'active', // active, rate_limited, quota_exceeded
        quotaRemaining: 100,
        quotaUsed: 0,
        quotaTotal: 100,
        nextAccessAt: null,
        lastCheckedAt: new Date(),
        errorMessage: null,
        retryAfter: null,
        color: 'green' // green, yellow, red
      });
    });
  }

  /**
   * Update quota status for an API
   * Called when API calls succeed or fail with rate limit errors
   */
  updateQuotaStatus(apiId, status) {
    const existing = this.quotaStatus.get(apiId) || {};

    const updated = {
      apiId,
      status: status.status || existing.status || 'active',
      quotaRemaining: status.quotaRemaining !== undefined ? status.quotaRemaining : existing.quotaRemaining || 100,
      quotaUsed: status.quotaUsed !== undefined ? status.quotaUsed : existing.quotaUsed || 0,
      quotaTotal: status.quotaTotal !== undefined ? status.quotaTotal : existing.quotaTotal || 100,
      nextAccessAt: status.nextAccessAt || existing.nextAccessAt || null,
      lastCheckedAt: new Date(),
      errorMessage: status.errorMessage || null,
      retryAfter: status.retryAfter || null,
      color: this.determineColor(status)
    };

    this.quotaStatus.set(apiId, updated);
    this.saveQuotaData();

    // Set auto-reset timer if rate limited
    if (status.status === 'rate_limited' && status.nextAccessAt) {
      this.setAutoReset(apiId, new Date(status.nextAccessAt));
    }

    return updated;
  }

  /**
   * Mark an API as quota exceeded with error info
   * Used when API returns 429 or quota exceeded errors
   */
  markQuotaExceeded(apiId, options = {}) {
    const nextAccessAt = options.nextAccessAt || new Date(Date.now() + options.retryAfterMs || 3600000);

    return this.updateQuotaStatus(apiId, {
      status: 'quota_exceeded',
      quotaRemaining: 0,
      nextAccessAt,
      errorMessage: options.errorMessage || 'Quota exceeded',
      retryAfter: options.retryAfterMs,
      color: 'red'
    });
  }

  /**
   * Mark an API as active/working
   */
  markApiActive(apiId, options = {}) {
    return this.updateQuotaStatus(apiId, {
      status: 'active',
      quotaRemaining: options.quotaRemaining || 100,
      quotaUsed: options.quotaUsed || 0,
      color: 'green',
      errorMessage: null
    });
  }

  /**
   * Get status for a single API
   */
  getApiStatus(apiId) {
    return this.quotaStatus.get(apiId) || this.initializeApi(apiId);
  }

  /**
   * Get all API statuses
   */
  getAllStatuses() {
    return Array.from(this.quotaStatus.values());
  }

  /**
   * Get statuses grouped by status
   */
  getStatusesByGroup() {
    const statuses = Array.from(this.quotaStatus.values());
    return {
      active: statuses.filter(s => s.status === 'active'),
      rateLimited: statuses.filter(s => s.status === 'rate_limited'),
      quotaExceeded: statuses.filter(s => s.status === 'quota_exceeded')
    };
  }

  /**
   * Determine color based on quota status
   */
  determineColor(status) {
    if (status.status === 'quota_exceeded' || status.status === 'rate_limited') {
      return 'red';
    }

    const percentageUsed = (status.quotaUsed || 0) / (status.quotaTotal || 1) * 100;

    if (percentageUsed >= 90) return 'red';
    if (percentageUsed >= 70) return 'yellow';
    return 'green';
  }

  /**
   * Get formatted time until API is accessible again
   */
  getTimeUntilAccessible(apiId) {
    const status = this.quotaStatus.get(apiId);
    if (!status || !status.nextAccessAt) return null;

    const now = new Date();
    const accessAt = new Date(status.nextAccessAt);

    if (accessAt <= now) return null; // Already accessible

    const diffMs = accessAt - now;
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins < 1) return '< 1 min';
    if (diffMins < 60) return `${diffMins} mins`;
    if (diffMins < 1440) return `${Math.ceil(diffMins / 60)} hours`;
    return `${Math.ceil(diffMins / 1440)} days`;
  }

  /**
   * Set auto-reset timer for when API becomes available again
   */
  setAutoReset(apiId, resetTime) {
    if (this.resetTimers.has(apiId)) {
      clearTimeout(this.resetTimers.get(apiId));
    }

    const now = new Date();
    const delayMs = Math.max(0, resetTime - now);

    if (delayMs > 0 && delayMs < 86400000) { // Max 24 hours
      const timer = setTimeout(() => {
        this.markApiActive(apiId, { quotaRemaining: 100 });
        this.resetTimers.delete(apiId);
      }, delayMs);

      this.resetTimers.set(apiId, timer);
    }
  }

  /**
   * Format status for display in dashboard
   */
  getDisplayStatus(apiId) {
    const status = this.getApiStatus(apiId);
    const timeUntilAccessible = this.getTimeUntilAccessible(apiId);

    return {
      ...status,
      displayText: this.getDisplayText(status),
      displayColor: status.color,
      timeUntilAccessible,
      isAccessible: status.nextAccessAt ? new Date(status.nextAccessAt) <= new Date() : true,
      quotaPercentage: Math.round((status.quotaUsed || 0) / (status.quotaTotal || 1) * 100)
    };
  }

  /**
   * Get formatted display text for UI
   */
  getDisplayText(status) {
    if (status.status === 'quota_exceeded') {
      return `Quota Exceeded ${status.nextAccessAt ? `- Available in ${this.getTimeUntilAccessible(status.apiId)}` : ''}`;
    }

    if (status.status === 'rate_limited') {
      return `Rate Limited ${status.nextAccessAt ? `- Retry in ${this.getTimeUntilAccessible(status.apiId)}` : ''}`;
    }

    const remaining = Math.round((status.quotaRemaining || 0) / (status.quotaTotal || 1) * 100);
    return `${remaining}% Quota Remaining`;
  }

  initializeApi(apiId) {
    const quota = {
      apiId,
      status: 'active',
      quotaRemaining: 100,
      quotaUsed: 0,
      quotaTotal: 100,
      nextAccessAt: null,
      lastCheckedAt: new Date(),
      errorMessage: null,
      color: 'green'
    };
    this.quotaStatus.set(apiId, quota);
    return quota;
  }

  async saveQuotaData() {
    try {
      const dir = path.dirname(this.dataPath);
      await fs.mkdir(dir, { recursive: true });

      const data = Array.from(this.quotaStatus.values());
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving quota data:', error);
    }
  }
}

module.exports = QuotaTracker;
