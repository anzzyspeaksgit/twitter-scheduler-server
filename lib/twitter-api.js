// Twitter API integration for posting tweets
class TwitterAPI {
  constructor() {
    this.baseURL = 'https://api.twitter.com/2';
    this.accessToken = null;
    this.refreshToken = null;
    this.clientId = null;
    this.clientSecret = null;
  }

  async init() {
    // Load stored credentials
    const result = await chrome.storage.local.get(['twitterCredentials']);
    if (result.twitterCredentials) {
      const creds = result.twitterCredentials;
      this.accessToken = creds.accessToken;
      this.refreshToken = creds.refreshToken;
      this.clientId = creds.clientId;
      this.clientSecret = creds.clientSecret;
    }
  }

  async authenticate() {
    try {
      // Use Chrome Identity API for OAuth
      const redirectURL = chrome.identity.getRedirectURL();
      const authURL = this.buildAuthURL(redirectURL);
      
      // Launch OAuth flow
      const responseURL = await chrome.identity.launchWebAuthFlow({
        url: authURL,
        interactive: true
      });

      // Extract authorization code from response
      const urlParams = new URLSearchParams(responseURL.split('?')[1]);
      const code = urlParams.get('code');

      if (!code) {
        throw new Error('No authorization code received');
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, redirectURL);
      
      // Store credentials
      await chrome.storage.local.set({
        twitterCredentials: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          clientId: this.clientId,
          clientSecret: this.clientSecret,
          expiresAt: Date.now() + (tokens.expires_in * 1000)
        }
      });

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

      return true;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  buildAuthURL(redirectURL) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectURL,
      scope: 'tweet.read tweet.write users.read offline.access',
      state: this.generateState(),
      code_challenge: this.generateCodeChallenge(),
      code_challenge_method: 'S256'
    });

    return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(code, redirectURL) {
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
      },
      body: new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: this.clientId,
        redirect_uri: redirectURL,
        code_verifier: this.getCodeVerifier()
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return await response.json();
  }

  async postTweet(tweetData) {
    try {
      await this.ensureAuthenticated();

      const payload = {
        text: tweetData.text
      };

      // Add media if present
      if (tweetData.images && tweetData.images.length > 0) {
        const mediaIds = await this.uploadMedia(tweetData.images);
        payload.media = {
          media_ids: mediaIds
        };
      }

      const response = await fetch(`${this.baseURL}/tweets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Tweet posting failed: ${error.detail || 'Unknown error'}`);
      }

      const result = await response.json();
      return {
        success: true,
        tweetId: result.data.id,
        tweetUrl: `https://twitter.com/i/status/${result.data.id}`
      };

    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }

  async uploadMedia(images) {
    const mediaIds = [];

    for (const image of images) {
      try {
        // Convert base64 to blob if needed
        const blob = await this.base64ToBlob(image.data);
        
        const formData = new FormData();
        formData.append('media', blob, 'image.jpg');

        const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Media upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        mediaIds.push(result.media_id_string);

      } catch (error) {
        console.error('Error uploading media:', error);
        // Continue with other images even if one fails
      }
    }

    return mediaIds;
  }

  async ensureAuthenticated() {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please connect your Twitter account.');
    }

    // Check if token is expired and refresh if needed
    const result = await chrome.storage.local.get(['twitterCredentials']);
    if (result.twitterCredentials) {
      const creds = result.twitterCredentials;
      if (Date.now() > creds.expiresAt) {
        await this.refreshAccessToken();
      }
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokens = await response.json();
      
      // Update stored credentials
      await chrome.storage.local.set({
        twitterCredentials: {
          ...await chrome.storage.local.get(['twitterCredentials']).then(r => r.twitterCredentials),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + (tokens.expires_in * 1000)
        }
      });

      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token;

    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear credentials and require re-authentication
      await chrome.storage.local.remove(['twitterCredentials']);
      this.accessToken = null;
      this.refreshToken = null;
      throw new Error('Authentication expired. Please reconnect your account.');
    }
  }

  async getUserInfo() {
    try {
      await this.ensureAuthenticated();

      const response = await fetch(`${this.baseURL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }

  async isAuthenticated() {
    try {
      await this.ensureAuthenticated();
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect() {
    await chrome.storage.local.remove(['twitterCredentials']);
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Utility methods
  generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  generateCodeChallenge() {
    const codeVerifier = this.generateCodeVerifier();
    return this.base64URLEncode(this.sha256(codeVerifier));
  }

  generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  getCodeVerifier() {
    // In a real implementation, you'd store this securely
    return this.generateCodeVerifier();
  }

  base64URLEncode(buffer) {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  async sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash);
  }

  async base64ToBlob(base64Data) {
    const response = await fetch(base64Data);
    return await response.blob();
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TwitterAPI;
}
