const EventEmitter = require('events');

class UserTracker extends EventEmitter {
  constructor() {
    super();
    this.activeUsers = new Map();
    this.usageByUser = new Map();
    this.deviceMapping = new Map(); // Maps device_id to user
    this.rateLimitWarnings = new Map();
    this.alertThresholds = {
      percentage: 80, // Alert at 80% of limit
      remaining: 10  // Alert when <10 requests left
    };
  }

  // Called when a device makes API calls
  registerDeviceUsage(deviceId, userId, apiProvider, requestsCount = 1, metadata = {}) {
    const timestamp = Date.now();
    
    // Update device-user mapping
    if (!this.deviceMapping.has(deviceId) && userId) {
      this.deviceMapping.set(deviceId, userId);
    }

    const actualUserId = userId || this.deviceMapping.get(deviceId) || deviceId;

    // Update user activity
    this.updateUserActivity(actualUserId, deviceId, apiProvider, requestsCount);

    // Check rate limits and emit alerts
    this.checkRateLimits(actualUserId, apiProvider, requestsCount);

    // Store usage data
    this.recordUsage(actualUserId, deviceId, apiProvider, requestsCount, metadata, timestamp);

    // Emit event for dashboard update
    this.emit('usageUpdate', {
      deviceId,
      userId: actualUserId,
      apiProvider,
      requestsCount,
      timestamp
    });
  }

  updateUserActivity(userId, deviceId, apiProvider, requestsCount) {
    if (!this.activeUsers.has(userId)) {
      this.activeUsers.set(userId, {
        id: userId,
        name: `User-${userId}`,
        devices: new Set(),
        lastActive: Date.now(),
        requestsThisMinute: 0,
        requestsThisHour: 0,
        requestsThisDay: 0,
        apisUsed: new Set(),
        status: 'active'
      });
    }

    const user = this.activeUsers.get(userId);
    user.devices.add(deviceId);
    user.lastActive = Date.now();
    user.apisUsed.add(apiProvider);
    user.requestsThisMinute += requestsCount;
    user.requestsThisHour += requestsCount;
    user.requestsThisDay += requestsCount;

    // Reset counters on interval
    this.resetUserCounters();
  }

  resetUserCounters() {
    const now = Date.now();
    const minuteStart = Math.floor(now / 60000) * 60000;
    const hourStart = Math.floor(now / 3600000) * 3600000;
    const dayStart = Math.floor(now / 86400000) * 86400000;

    for (const [userId, user] of this.activeUsers) {
      if (user.minuteReset !== minuteStart) {
        user.requestsThisMinute = 0;
        user.minuteReset = minuteStart;
      }
      if (user.hourReset !== hourStart) {
        user.requestsThisHour = 0;
        user.hourReset = hourStart;
      }
      if (user.dayReset !== dayStart) {
        user.requestsThisDay = 0;
        user.dayReset = dayStart;
      }
    }
  }

  checkRateLimits(userId, apiProvider, requestsCount) {
    const userUsage = this.getUserUsageByAPI(userId, apiProvider);
    
    // Check if user is approaching limits
    const providerConfigs = {
      'Gemini': { limits: { requestsPerMinute: 60, tokensPerMinute: 60000 } },
      'Groq': { limits: { requestsPerMinute: 30 } },
      'OpenAI': { limits: { requestsPerMinute: 500 } }
    };

    const config = providerConfigs[apiProvider];
    if (!config) return;

    const minuteLimit = config.limits.requestsPerMinute;
    const currentMinuteUsage = this.getCurrentMinuteUsage(userId, apiProvider);
    const percentageUsed = (currentMinuteUsage / minuteLimit) * 100;

    // Emit warnings
    if (percentageUsed >= 90 && currentMinuteUsage > minuteLimit * 0.9) {
      this.emit('rateLimitWarning', {
        userId,
        apiProvider,
        level: 'critical',
        message: `Rate limit approaching: ${currentMinuteUsage}/${minuteLimit} requests this minute`,
        percentageUsed
      });
    } else if (percentageUsed >= this.alertThresholds.percentage) {
      this.emit('rateLimitWarning', {
        userId,
        apiProvider,
        level: 'warning',
        message: `High usage detected: ${Math.round(percentageUsed)}% of limit used`,
        percentageUsed
      });
    } else if (minuteLimit - currentMinuteUsage <= this.alertThresholds.remaining) {
      this.emit('rateLimitWarning', {
        userId,
        apiProvider,
        level: 'warning',
        message: `Low remaining requests: ${minuteLimit - currentMinuteUsage} left`,
        remaining: minuteLimit - currentMinuteUsage
      });
    }
  }

  recordUsage(userId, deviceId, apiProvider, requestsCount, metadata, timestamp) {
    const key = `${userId}-${apiProvider}`;
    
    if (!this.usageByUser.has(key)) {
      this.usageByUser.set(key, {
        userId,
        apiProvider,
        firstSeen: timestamp,
        lastSeen: timestamp,
        totalRequests: 0,
        dailyUsage: new Map(), // date -> requests count
        deviceHistory: new Map(), // device_id -> usage count
        peakUsage: { requests: 0, timestamp: null }
      });
    }

    const usageData = this.usageByUser.get(key);
    usageData.totalRequests += requestsCount;
    usageData.lastSeen = timestamp;
    usageData.deviceHistory.set(deviceId, (usageData.deviceHistory.get(deviceId) || 0) + requestsCount);

    // Record daily usage
    const today = new Date().toISOString().split('T')[0];
    usageData.dailyUsage.set(today, (usageData.dailyUsage.get(today) || 0) + requestsCount);

    // Update peak usage
    if (requestsCount > usageData.peakUsage.requests) {
      usageData.peakUsage = { requests: requestsCount, timestamp };
    }
  }

  // Helper methods
  getActiveUsers(limit = 100) {
    return Array.from(this.activeUsers.values())
      .sort((a, b) => b.lastActive - a.lastActive)
      .slice(0, limit)
      .map(user => ({
        ...user,
        devicesUsed: user.devices.size,
        apiCount: user.apisUsed.size,
        isOnline: Date.now() - user.lastActive < 30000 // Active within 30s
      }));
  }

  getCurrentMinuteUsage(userId, apiProvider) {
    // This would integrate with your API rate limiting system
    // For now, return estimated usage
    const user = this.activeUsers.get(userId);
    return user ? user.requestsThisMinute : 0;
  }

  getUserUsageByAPI(userId, apiProvider) {
    const key = `${userId}-${apiProvider}`;
    return this.usageByUser.get(key);
  }

  getUsageStats() {
    const stats = {
      totalUsers: this.activeUsers.size,
      totalDevices: this.deviceMapping.size,
      activeInLastMinute: 0,
      activeInLastHour: 0,
      rateLimitWarnings: 0
    };

    // Count recent activity
    const now = Date.now();
    const minuteAgo = now - 60000;
    const hourAgo = now - 3600000;

    for (const user of this.activeUsers.values()) {
      if (user.lastActive > minuteAgo) stats.activeInLastMinute++;
      if (user.lastActive > hourAgo) stats.activeInLastHour++;
    }

    return stats;
  }

  cleanupInactiveUsers() {
    const now = Date.now();
    const inactiveTimeout = 24 * 60 * 60 * 1000; // 24 hours

    for (const [userId, user] of this.activeUsers) {
      if (now - user.lastActive > inactiveTimeout) {
        this.activeUsers.delete(userId);
        // Clean up associated device mappings
        for (const [deviceId, owner] of this.deviceMapping) {
          if (owner === userId) this.deviceMapping.delete(deviceId);
        }
      }
    }
  }

  // Event handlers
  onRateLimit(callback) {
    this.on('rateLimitWarning', callback);
  }

  onUsageUpdate(callback) {
    this.on('usageUpdate', callback);
  }
}

module.exports = UserTracker;