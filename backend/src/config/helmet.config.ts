import { ConfigService } from '@nestjs/config';
import { HelmetOptions } from 'helmet';

/**
 * Configuration for Helmet security headers
 * Provides comprehensive security headers including:
 * - Content Security Policy (CSP)
 * - XSS Protection
 * - HSTS (HTTP Strict Transport Security)
 * - X-Frame-Options
 * - And more...
 */
export function getHelmetConfig(configService: ConfigService): HelmetOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

  return {
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Swagger UI and some inline styles
          'https://fonts.googleapis.com',
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Swagger UI
          "'unsafe-eval'", // Required for Swagger UI
        ],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'], // Allow images from any source
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          frontendUrl,
          apiBaseUrl,
          ...(isProduction ? [] : ['ws://localhost:*', 'http://localhost:*']), // WebSocket for dev
        ],
        frameSrc: ["'self'"], // Allow iframes from same origin
        objectSrc: ["'none'"], // Disallow <object>, <embed>, <applet>
        upgradeInsecureRequests: isProduction ? [] : null, // Upgrade HTTP to HTTPS in production
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"], // X-Frame-Options equivalent
      },
    },
    // XSS Protection
    xssFilter: true, // Enable XSS filter in browsers
    // HSTS (HTTP Strict Transport Security)
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false, // Disable in development
    // X-Frame-Options (also set in CSP frameAncestors)
    frameguard: {
      action: 'sameorigin', // Allow framing from same origin
    },
    // Other security headers
    noSniff: true, // Prevent MIME type sniffing
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // Permissions Policy (formerly Feature Policy)
    permissionsPolicy: {
      features: {
        geolocation: ["'self'"],
        microphone: ["'none'"],
        camera: ["'none'"],
      },
    },
  };
}


