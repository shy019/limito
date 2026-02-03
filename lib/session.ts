// Session management with 5-minute expiration
const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const SESSION_KEY = 'limito_session';
const SESSION_TIMESTAMP_KEY = 'limito_session_timestamp';

interface SessionData {
  id: string;
  timestamp: number;
  userToken?: string;
}

export const sessionManager = {
  // Create new session
  create(userToken?: string): string {
    const sessionId = crypto.randomUUID();
    const timestamp = Date.now();
    
    const sessionData: SessionData = {
      id: sessionId,
      timestamp,
      userToken
    };
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp.toString());
    }
    
    return sessionId;
  },

  // Get current session if valid
  get(): SessionData | null {
    if (typeof window === 'undefined') return null;
    
    const sessionStr = sessionStorage.getItem(SESSION_KEY);
    const timestampStr = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
    
    if (!sessionStr || !timestampStr) return null;
    
    const timestamp = parseInt(timestampStr, 10);
    const now = Date.now();
    
    // Check if session expired (5 minutes)
    if (now - timestamp > SESSION_DURATION) {
      this.destroy();
      return null;
    }
    
    try {
      return JSON.parse(sessionStr);
    } catch {
      this.destroy();
      return null;
    }
  },

  // Update session timestamp (refresh)
  refresh(): void {
    const session = this.get();
    if (session) {
      session.timestamp = Date.now();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        sessionStorage.setItem(SESSION_TIMESTAMP_KEY, session.timestamp.toString());
      }
    }
  },

  // Check if session is valid
  isValid(): boolean {
    return this.get() !== null;
  },

  // Get session ID
  getId(): string | null {
    const session = this.get();
    return session?.id || null;
  },

  // Get remaining time in seconds
  getRemainingTime(): number {
    const session = this.get();
    if (!session) return 0;
    
    const elapsed = Date.now() - session.timestamp;
    const remaining = SESSION_DURATION - elapsed;
    
    return Math.max(0, Math.floor(remaining / 1000));
  },

  // Destroy session and clear all data
  destroy(): void {
    if (typeof window === 'undefined') return;
    
    // Clear sessionStorage
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
    sessionStorage.removeItem('user_token');
    sessionStorage.removeItem('limito_session_id');
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('limito_') || name === 'user_token') {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Clear localStorage cart
    localStorage.removeItem('limito_cart');
  },

  // Auto-destroy on expiration
  startExpirationCheck(): void {
    if (typeof window === 'undefined') return;
    
    // Check every 10 seconds
    const interval = setInterval(() => {
      if (!this.isValid()) {
        clearInterval(interval);
        // Redirect to password page
        window.location.href = '/password';
      }
    }, 10000);
  }
};
