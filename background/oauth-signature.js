// OAuth 1.0a signature generation for Twitter API
class OAuth1 {
  static async generateSignature(method, url, params, credentials) {
    const oauthParams = {
      oauth_consumer_key: credentials.apiKey,
      oauth_token: credentials.accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_nonce: this.generateNonce(),
      oauth_version: '1.0'
    };

    // Combine OAuth params with request params
    const allParams = { ...params, ...oauthParams };
    
    // Sort and encode parameters
    const sortedParams = Object.keys(allParams)
      .sort()
      .map(key => {
        const value = allParams[key];
        if (Array.isArray(value)) {
          return value.map(v => `${this.percentEncode(key)}=${this.percentEncode(v)}`).join('&');
        }
        return `${this.percentEncode(key)}=${this.percentEncode(value)}`;
      })
      .join('&');

    // Create signature base string
    const signatureBase = [
      method.toUpperCase(),
      this.percentEncode(url),
      this.percentEncode(sortedParams)
    ].join('&');

    // Create signing key
    const signingKey = [
      this.percentEncode(credentials.apiSecret),
      this.percentEncode(credentials.accessTokenSecret)
    ].join('&');

    // Generate HMAC-SHA1 signature
    const signature = await this.hmacSha1(signingKey, signatureBase);
    
    // Add signature to OAuth params
    oauthParams.oauth_signature = signature;

    return oauthParams;
  }

  static async hmacSha1(key, data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const dataData = encoder.encode(data);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  static generateNonce() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
      nonce += chars[Math.floor(Math.random() * chars.length)];
    }
    return nonce;
  }

  static percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  }

  static buildAuthHeader(oauthParams) {
    const headerParams = Object.keys(oauthParams)
      .sort()
      .map(key => `${key}="${this.percentEncode(oauthParams[key])}"`)
      .join(', ');
    
    return `OAuth ${headerParams}`;
  }
}

// Export for use in service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OAuth1;
}
