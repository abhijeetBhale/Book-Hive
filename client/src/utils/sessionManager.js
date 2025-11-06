// Session management utility for better token handling
class SessionManager {
    constructor() {
        this.TOKEN_KEY = 'token';
        this.REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.refreshTimer = null;
    }

    setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.startTokenRefresh();
    }

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        this.stopTokenRefresh();
    }

    isTokenValid() {
        const token = this.getToken();
        if (!token) return false;

        try {
            // Basic JWT structure check
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            // Decode payload to check expiration
            const payload = JSON.parse(atob(parts[1]));
            const now = Date.now() / 1000;

            // Check if token expires within next 5 minutes
            return payload.exp && payload.exp > (now + 300);
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    startTokenRefresh() {
        this.stopTokenRefresh();

        this.refreshTimer = setInterval(() => {
            if (!this.isTokenValid()) {
                console.log('Token expired or invalid, clearing session');
                this.removeToken();
                // Trigger a custom event for components to listen to
                window.dispatchEvent(new CustomEvent('sessionExpired'));
            }
        }, this.REFRESH_INTERVAL);
    }

    stopTokenRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

export default new SessionManager();