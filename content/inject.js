// Content script for injecting save buttons on Twitter posts
class TwitterRepostInjector {
  constructor() {
    console.log('🐦 TwitterRepostInjector: Initializing...');
    this.observer = null;
    this.processedTweets = new Set();
    this.init();
  }

  init() {
    console.log('🐦 TwitterRepostInjector: init() called, document.readyState:', document.readyState);
    // Wait for page to load
    if (document.readyState === 'loading') {
      console.log('🐦 TwitterRepostInjector: Document still loading, waiting for DOMContentLoaded');
      document.addEventListener('DOMContentLoaded', () => this.startObserving());
    } else {
      console.log('🐦 TwitterRepostInjector: Document ready, starting observer immediately');
      this.startObserving();
    }
  }

  startObserving() {
    console.log('🐦 TwitterRepostInjector: Starting mutation observer...');
    // Create mutation observer to watch for new tweets
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processNewTweets(node);
            }
          });
        }
      });
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('🐦 TwitterRepostInjector: Observer started, processing existing tweets...');

    // Process existing tweets
    this.processNewTweets(document.body);
  }

  processNewTweets(container) {
    // Find all tweet containers
    const tweetSelectors = [
      '[data-testid="tweet"]',
      'article[role="article"]'
    ];

    tweetSelectors.forEach(selector => {
      const tweets = container.querySelectorAll(selector);
      tweets.forEach(tweet => {
        if (!this.processedTweets.has(tweet) && this.isValidTweet(tweet)) {
          this.addSaveButton(tweet);
          this.processedTweets.add(tweet);
        }
      });
    });
  }

  isValidTweet(tweetElement) {
    // Check if this is a valid tweet (not a retweet, not already processed, not a quoted tweet)
    const hasText = tweetElement.querySelector('[data-testid="tweetText"]') || 
                   tweetElement.querySelector('[lang]');
    const isNotRetweet = !tweetElement.querySelector('[data-testid="socialContext"]');
    const isNotQuotedTweet = !tweetElement.querySelector('[data-testid="quoteTweet"]');
    const hasNoSaveButton = !tweetElement.querySelector('.twitter-repost-save-btn');
    
    // Additional check: make sure this is the main tweet, not a nested quoted tweet
    const isMainTweet = !tweetElement.closest('[data-testid="quoteTweet"]');
    
    return hasText && isNotRetweet && isNotQuotedTweet && hasNoSaveButton && isMainTweet;
  }

  addSaveButton(tweetElement) {
    // Find the action bar (where like, retweet, etc. buttons are)
    const actionBar = tweetElement.querySelector('[role="group"]') || 
                     tweetElement.querySelector('[data-testid="reply"]')?.parentElement;
    
    if (!actionBar) {
      return;
    }

    // Create save button
    const saveButton = document.createElement('div');
    saveButton.className = 'twitter-repost-save-btn';
    saveButton.innerHTML = `
      <div class="save-button-content">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
        <span class="save-text">Save</span>
      </div>
    `;

    // Add click handler
    saveButton.addEventListener('click', (e) => {
      console.log('🐦 Save button clicked!');
      e.preventDefault();
      e.stopPropagation();
      this.saveTweet(tweetElement);
    });

    // Insert button
    actionBar.appendChild(saveButton);

    // Add hover effects
    saveButton.addEventListener('mouseenter', () => {
      saveButton.classList.add('hover');
    });

    saveButton.addEventListener('mouseleave', () => {
      saveButton.classList.remove('hover');
    });
  }

  async saveTweet(tweetElement) {
    try {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.error('Extension context invalidated. Please refresh the page.');
        this.showNotification('Extension reloaded. Please refresh the page.', 'error');
        return;
      }

      // Extract tweet data
      const tweetData = await this.extractTweetData(tweetElement);
      console.log('🐦 Saving tweet:', tweetData.text.substring(0, 50) + '...');
      
      // Show loading state
      const saveButton = tweetElement.querySelector('.twitter-repost-save-btn');
      if (saveButton) {
        saveButton.classList.add('saving');
        saveButton.querySelector('.save-text').textContent = 'Saving...';
      }

      // Send to background script
      const response = await chrome.runtime.sendMessage({
        action: 'saveTweet',
        data: tweetData
      });

      if (response && response.success) {
        console.log('✅ Tweet saved successfully!');
        // Show success state
        if (saveButton) {
          saveButton.classList.add('saved');
          saveButton.querySelector('.save-text').textContent = 'Saved!';
          setTimeout(() => {
            saveButton.classList.remove('saved');
            saveButton.querySelector('.save-text').textContent = 'Save';
          }, 2000);
        }

        // Show notification
        this.showNotification('Tweet saved to drafts!');
      } else {
        throw new Error(response?.error || 'Failed to save tweet');
      }

    } catch (error) {
      if (error.message.includes('Extension context invalidated')) {
        console.error('Extension reloaded. Please refresh the page.');
        this.showNotification('Extension reloaded. Please refresh the page.', 'error');
      } else {
        console.error('Error saving tweet:', error.message);
        this.showNotification('Error saving tweet: ' + error.message, 'error');
      }
      
      // Reset button state
      const saveButton = tweetElement.querySelector('.twitter-repost-save-btn');
      if (saveButton) {
        saveButton.classList.remove('saving');
        saveButton.querySelector('.save-text').textContent = 'Save';
      }
    }
  }

  async extractTweetData(tweetElement) {
    // First, check if there's a "Show more" button and click it to expand truncated tweets
    const showMoreButton = tweetElement.querySelector('[data-testid="tweet-text-show-more-link"]') || 
                          tweetElement.querySelector('[data-testid="tweet-text-show-more-button"]') ||
                          tweetElement.querySelector('span[role="button"]') ||
                          tweetElement.querySelector('a[href*="show_more"]') ||
                          Array.from(tweetElement.querySelectorAll('span')).find(span => 
                            span.textContent.includes('Show more') || 
                            span.textContent.includes('Show this thread') ||
                            span.textContent.includes('Show this Tweet')
                          );
    
    if (showMoreButton) {
      console.log('📖 Clicking "Show more" to expand tweet content...');
      try {
        showMoreButton.click();
        // Wait for content to expand
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('✅ Tweet content expanded');
      } catch (error) {
        console.log('⚠️ Could not click "Show more":', error.message);
      }
    }
    
    // Extract text content - try multiple strategies for long tweets
    let text = '';
    
    // Strategy 1: Look for tweet text element (should now have full expanded text)
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    if (textElement) {
      text = textElement.textContent.trim();
    }
    
    // Strategy 2: If no text found or it's too short, try to get all text content from the article
    if (!text || text.length < 10) {
      // Get all lang elements (Twitter uses these for text spans)
      const langElements = tweetElement.querySelectorAll('[lang]');
      const allTextParts = Array.from(langElements)
        .map(el => el.textContent.trim())
        .filter(content => content.length > 0 && !content.match(/^\d+[a-z]?$/)); // Filter out timestamps
      
      if (allTextParts.length > 0) {
        text = allTextParts.join(' ');
      }
    }
    
    // Strategy 3: Last resort - get all direct text but EXCLUDE quoted tweets
    if (!text || text.length < 10) {
      // Remove quoted tweets, media, metadata, and other non-content elements
      const clone = tweetElement.cloneNode(true);
      clone.querySelectorAll('[data-testid="quoteTweet"], [data-testid="tweetPhoto"], [data-testid="tweetVideo"], time, a[href*="status/"], [data-testid="socialContext"], [data-testid="card.wrapper"]').forEach(el => el.remove());
      text = clone.textContent.trim();
    }
    
    // Clean up the text - PRESERVE LINE BREAKS
    // Only replace multiple spaces/tabs with single spaces, but keep line breaks
    text = text.replace(/[ \t]+/g, ' ').trim();
    
    console.log(`📊 Extracted tweet text (length: ${text.length} chars):`, text.substring(0, 100));
    console.log(`📊 Line breaks in extracted text: ${(text.match(/\n/g) || []).length}`);

    // Extract images and videos
    const images = [];
    
    // Extract regular images
    const imageElements = tweetElement.querySelectorAll('img[src*="media"], img[src*="pbs.twimg.com"]');
    imageElements.forEach(img => {
      if (img.src && !img.src.includes('profile_images') && !img.src.includes('emoji')) {
        // Get the highest quality version of the image
        let highQualityUrl = img.src;
        if (highQualityUrl.includes('name=')) {
          // Replace with large version for better quality
          highQualityUrl = highQualityUrl.replace(/name=\w+/, 'name=large');
        }
        
        images.push({
          url: highQualityUrl,
          alt: img.alt || '',
          type: 'image'
        });
      }
    });
    
    // Extract videos (Twitter videos are in video tags)
    const videoElements = tweetElement.querySelectorAll('video');
    videoElements.forEach(video => {
      // Get video poster (thumbnail)
      if (video.poster) {
        images.push({
          url: video.poster,
          alt: 'Video thumbnail',
          type: 'video_thumbnail',
          videoUrl: video.src || video.querySelector('source')?.src
        });
      }
    });
    
    // Also check for GIFs (they're often in video tags on Twitter)
    const gifElements = tweetElement.querySelectorAll('[data-testid="tweetPhoto"] video, [aria-label*="GIF"]');
    gifElements.forEach(gif => {
      const source = gif.querySelector('source');
      if (source && source.src) {
        images.push({
          url: source.src,
          alt: 'GIF',
          type: 'gif'
        });
      }
    });

    // Extract author info
    const authorElement = tweetElement.querySelector('[data-testid="User-Name"]');
    const author = authorElement ? authorElement.textContent.trim() : '';

    // Extract timestamp
    const timeElement = tweetElement.querySelector('time');
    const timestamp = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();

    // Extract tweet URL (if available)
    const linkElement = tweetElement.querySelector('a[href*="/status/"]');
    const tweetUrl = linkElement ? linkElement.href : '';

    return {
      text,
      images,
      author,
      timestamp,
      url: tweetUrl,
      savedAt: new Date().toISOString(),
      id: this.generateId()
    };
  }

  generateId() {
    return 'tweet_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `twitter-repost-notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'error' ? '#ff4444' : '#1d9bf0',
      color: 'white',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '10000',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease'
    });

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize the injector
new TwitterRepostInjector();
