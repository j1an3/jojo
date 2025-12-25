// Browser Fingerprinting Library
// Generates unique fingerprint for rate limiting

class BrowserFingerprint {
    static async generate() {
        const components = [];

        // 1. Canvas fingerprint
        components.push(this.getCanvasFingerprint());

        // 2. WebGL fingerprint
        components.push(this.getWebGLFingerprint());

        // 3. Screen resolution & color depth
        components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

        // 4. Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

        // 5. Language
        components.push(navigator.language);

        // 6. Platform
        components.push(navigator.platform);

        // 7. User agent (parsed)
        components.push(this.parseUserAgent());

        // 8. Touch support
        components.push(navigator.maxTouchPoints || 0);

        // 9. Hardware concurrency
        components.push(navigator.hardwareConcurrency || 0);

        // 10. Device memory (if available)
        components.push(navigator.deviceMemory || 0);

        // Combine and hash
        const fingerprintString = components.join('|');
        const hash = await this.hashString(fingerprintString);

        return hash;
    }

    static getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return 'no-canvas';

            canvas.width = 200;
            canvas.height = 50;

            // Draw text with specific font
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(0, 0, 100, 50);
            ctx.fillStyle = '#069';
            ctx.fillText('JoJo Vote 🎨', 2, 2);

            // Add some shapes
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillRect(50, 10, 80, 30);

            return canvas.toDataURL();
        } catch (e) {
            return 'canvas-error';
        }
    }

    static getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return 'no-webgl';

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) return 'no-debug-info';

            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

            return `${vendor}~${renderer}`;
        } catch (e) {
            return 'webgl-error';
        }
    }

    static parseUserAgent() {
        const ua = navigator.userAgent;
        // Extract browser and version
        const browserRegex = /(firefox|chrome|safari|opera|edge|msie|trident)/i;
        const match = ua.match(browserRegex);
        return match ? match[0] : 'unknown';
    }

    static async hashString(str) {
        // Use Web Crypto API for hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
}

// Export for use in other scripts
window.BrowserFingerprint = BrowserFingerprint;
