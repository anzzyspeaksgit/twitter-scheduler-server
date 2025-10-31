// Analytics and Heat Map for Twitter Repost Assistant
class TweetAnalytics {
  constructor() {
    this.analytics = {
      daily: {},
      hourly: Array(24).fill(0),
      weekday: Array(7).fill(0),
      totalPosts: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      bestTime: null,
      worstTime: null,
      tweetPerformance: []
    };
    this.init();
  }

  async init() {
    await this.loadAnalytics();
    this.setupChart();
  }

  async loadAnalytics() {
    const result = await chrome.storage.local.get(['analytics', 'drafts']);
    if (result.analytics) {
      this.analytics = result.analytics;
    }
    
    // Process drafts to build analytics
    const drafts = result.drafts || [];
    this.processPostedTweets(drafts.filter(d => d.status === 'posted'));
  }

  processPostedTweets(postedTweets) {
    postedTweets.forEach(tweet => {
      if (tweet.postedAt) {
        const date = new Date(tweet.postedAt);
        const hour = date.getHours();
        const day = date.getDay();
        const dateKey = date.toISOString().split('T')[0];
        
        // Update hourly distribution
        this.analytics.hourly[hour]++;
        
        // Update weekday distribution
        this.analytics.weekday[day]++;
        
        // Update daily count
        if (!this.analytics.daily[dateKey]) {
          this.analytics.daily[dateKey] = {
            count: 0,
            impressions: 0,
            engagement: 0
          };
        }
        this.analytics.daily[dateKey].count++;
        
        // Track performance (will be updated with real Twitter API data)
        this.analytics.tweetPerformance.push({
          id: tweet.id,
          text: tweet.text.substring(0, 50),
          postedAt: tweet.postedAt,
          hour: hour,
          day: day,
          impressions: Math.floor(Math.random() * 1000) + 100, // Placeholder
          likes: Math.floor(Math.random() * 50),
          retweets: Math.floor(Math.random() * 20),
          replies: Math.floor(Math.random() * 10)
        });
      }
    });
    
    this.analytics.totalPosts = postedTweets.length;
    this.findBestWorstTimes();
    this.saveAnalytics();
  }

  findBestWorstTimes() {
    // Find best performing hour
    let maxCount = 0;
    let minCount = Infinity;
    let bestHour = 0;
    let worstHour = 0;
    
    this.analytics.hourly.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        bestHour = hour;
      }
      if (count > 0 && count < minCount) {
        minCount = count;
        worstHour = hour;
      }
    });
    
    this.analytics.bestTime = `${bestHour}:00`;
    this.analytics.worstTime = `${worstHour}:00`;
  }

  async saveAnalytics() {
    await chrome.storage.local.set({ analytics: this.analytics });
  }

  setupChart() {
    // This will be called from the analytics tab in popup
    return {
      hourlyData: this.analytics.hourly,
      weekdayData: this.analytics.weekday,
      dailyData: this.analytics.daily,
      performance: this.analytics.tweetPerformance
    };
  }

  renderHeatMap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Create heat map grid (7 days x 24 hours)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({length: 24}, (_, i) => i);
    
    let heatMapHTML = `
      <div class="heat-map">
        <h3>📊 Tweet Activity Heat Map</h3>
        <div class="heat-map-grid">
          <div class="heat-map-labels-y">
            ${days.map(day => `<div class="day-label">${day}</div>`).join('')}
          </div>
          <div class="heat-map-content">
            <div class="heat-map-labels-x">
              ${hours.map(h => `<div class="hour-label">${h}</div>`).join('')}
            </div>
            <div class="heat-map-cells">
    `;
    
    // Create cells for each day/hour combination
    days.forEach((_, dayIndex) => {
      heatMapHTML += '<div class="heat-map-row">';
      hours.forEach(hour => {
        const value = this.getHeatMapValue(dayIndex, hour);
        const intensity = this.getIntensity(value);
        heatMapHTML += `
          <div class="heat-cell" 
               data-day="${dayIndex}" 
               data-hour="${hour}"
               data-value="${value}"
               style="background: rgba(29, 155, 240, ${intensity});"
               title="${days[dayIndex]} ${hour}:00 - ${value} tweets">
          </div>
        `;
      });
      heatMapHTML += '</div>';
    });
    
    heatMapHTML += `
            </div>
          </div>
        </div>
        <div class="heat-map-legend">
          <span>Less</span>
          <div class="legend-gradient"></div>
          <span>More</span>
        </div>
      </div>
    `;
    
    container.innerHTML = heatMapHTML;
    
    // Add performance metrics
    this.renderMetrics(container);
  }

  renderMetrics(container) {
    const metricsHTML = `
      <div class="analytics-metrics">
        <div class="metric-card">
          <div class="metric-value">${this.analytics.totalPosts}</div>
          <div class="metric-label">Total Posts</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.formatNumber(this.analytics.totalImpressions)}</div>
          <div class="metric-label">Impressions</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.analytics.bestTime || 'N/A'}</div>
          <div class="metric-label">Best Time</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.getEngagementRate()}%</div>
          <div class="metric-label">Engagement Rate</div>
        </div>
      </div>
      
      <div class="performance-chart">
        <h3>📈 Tweet Performance</h3>
        <canvas id="performanceChart"></canvas>
      </div>
      
      <div class="top-tweets">
        <h3>🔥 Top Performing Tweets</h3>
        ${this.getTopTweets()}
      </div>
    `;
    
    container.innerHTML += metricsHTML;
    
    // Draw performance chart
    this.drawPerformanceChart();
  }

  getHeatMapValue(day, hour) {
    // Calculate activity for specific day/hour combination
    let count = 0;
    this.analytics.tweetPerformance.forEach(tweet => {
      const date = new Date(tweet.postedAt);
      if (date.getDay() === day && date.getHours() === hour) {
        count++;
      }
    });
    return count;
  }

  getIntensity(value) {
    const max = Math.max(...this.analytics.hourly);
    return max > 0 ? value / max : 0;
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  getEngagementRate() {
    if (this.analytics.totalImpressions === 0) return 0;
    return ((this.analytics.totalEngagement / this.analytics.totalImpressions) * 100).toFixed(2);
  }

  getTopTweets() {
    const sorted = [...this.analytics.tweetPerformance]
      .sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets))
      .slice(0, 5);
    
    return sorted.map(tweet => `
      <div class="top-tweet-item">
        <div class="tweet-preview">${tweet.text}...</div>
        <div class="tweet-stats">
          <span>❤️ ${tweet.likes}</span>
          <span>🔁 ${tweet.retweets}</span>
          <span>💬 ${tweet.replies}</span>
        </div>
      </div>
    `).join('');
  }

  drawPerformanceChart() {
    const canvas = document.getElementById('performanceChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = 600;
    const height = canvas.height = 200;
    
    // Simple line chart for hourly distribution
    const data = this.analytics.hourly;
    const maxValue = Math.max(...data);
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#1d9bf0';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    data.forEach((value, index) => {
      const x = padding + (index / 23) * chartWidth;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw axes
    ctx.strokeStyle = '#536471';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
  }

  // Track new tweet posting
  async trackPost(tweetData, response) {
    if (response && response.id) {
      // Update analytics with real data
      const performance = {
        ...tweetData,
        twitterId: response.id,
        postedAt: new Date().toISOString(),
        impressions: 0, // Will be updated later via Twitter API
        likes: 0,
        retweets: 0,
        replies: 0
      };
      
      this.analytics.tweetPerformance.push(performance);
      this.analytics.totalPosts++;
      
      await this.saveAnalytics();
    }
  }

  // Get recommendations based on analytics
  getRecommendations() {
    const recommendations = [];
    
    // Best time recommendation
    if (this.analytics.bestTime) {
      recommendations.push(`📅 Best posting time: ${this.analytics.bestTime} based on your history`);
    }
    
    // Frequency recommendation
    const avgDaily = this.analytics.totalPosts / Object.keys(this.analytics.daily).length;
    if (avgDaily < 3) {
      recommendations.push('📈 Try posting 3-5 times daily for better engagement');
    }
    
    // Engagement patterns
    const highEngagementHours = this.analytics.hourly
      .map((count, hour) => ({hour, count}))
      .filter(h => h.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);
    
    if (highEngagementHours.length > 0) {
      recommendations.push(`⏰ Peak hours: ${highEngagementHours.join(', ')}`);
    }
    
    return recommendations;
  }
}

// Export for use in popup
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TweetAnalytics;
}
