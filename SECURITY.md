# Security Configuration & Fixes

This document outlines the security fixes applied to Kilovault and how to configure them for your deployment.

## Fixed Vulnerabilities

### 1. No Token Expiration (CVE-Level: High)

**Issue:** Tokens issued by `auth.getToken` previously had no expiration, meaning compromised tokens were valid indefinitely.

**Fix:** Added optional `expiresIn` parameter to token generation.

**Configuration:**
- Clients requesting short-lived tokens (e.g., frontend apps, VM provisioning jobs) should include `expiresIn` in seconds:
  ```json
  {
    "method": "auth.getToken",
    "params": {
      "secret": "your-auth-secret",
      "userId": "app-id",
      "expiresIn": 3600  // 1 hour
    }
  }
  ```

- Backend services needing long-lived tokens can omit `expiresIn`:
  ```json
  {
    "method": "auth.getToken",
    "params": {
      "secret": "your-auth-secret",
      "userId": "backend-service"
    }
  }
  ```

**Recommendation:** Use 15-60 minute expiration for user-facing clients, no expiration only for trusted backend services.

---

### 2. Wildcard CORS Headers (CVE-Level: High)

**Issue:** API previously returned `Access-Control-Allow-Origin: *`, allowing any website to make cross-origin requests and potentially exfiltrate secrets.

**Fix:** Made CORS origins configurable via `ALLOWED_ORIGINS` environment variable. Default behavior unchanged for backward compatibility, but configuration is available.

**Configuration via environment variable:**

```bash
# Production: Restrict to specific origins (comma-separated)
ALLOWED_ORIGINS="https://app.example.com,https://provisioning.example.com"

# Development: Allow all origins (not recommended for production)
ALLOWED_ORIGINS="*"

# Default (if not set): Falls back to wildcard (*)
```

**Example deployment with restricted CORS:**

```bash
# bunny.net edge script environment variables
ALLOWED_ORIGINS="https://myapp.bunny.net"
```

**Security note:** Never use wildcard (`*`) in production. Restrict to known, trusted origins only.

---

### 3. Timing Attack on AUTH_SECRET (CVE-Level: Medium)

**Issue:** Secret comparison was not constant-time, allowing attackers to determine correct characters through timing analysis.

**Fix:** Implemented constant-time comparison using Node.js crypto module's `timingSafeEqual`.

**Impact:** Eliminates timing-based information leakage when verifying AUTH_SECRET during token generation.

---

## Deployment Checklist

### Minimum Security Requirements

- [ ] Set `ALLOWED_ORIGINS` to specific trusted origins (not `*`)
- [ ] Use `expiresIn` for all user-facing/frontend tokens (15-60 minute range)
- [ ] Rotate `AUTH_SECRET` regularly
- [ ] Rotate `JWT_SECRET` regularly
- [ ] Enforce HTTPS/TLS for all connections
- [ ] Monitor audit logs for suspicious access patterns

### Recommended for High-Security Environments

- [ ] Implement rate limiting on `auth.getToken` endpoint
- [ ] Add request signing to detect tampering
- [ ] Store tokens in secure, same-origin cookies (not localStorage)
- [ ] Implement token refresh mechanism (short-lived access + refresh tokens)
- [ ] Add certificate pinning in client applications
- [ ] Regular key rotation (monthly minimum)

---

## Configuration Examples

### Example 1: Multi-Cloud VM Provisioning

```bash
# .env.production for bunny.net edge deployment
ALLOWED_ORIGINS="https://provision.internal.company.com"
JWT_SECRET="<long-random-secret>"
AUTH_SECRET="<long-random-secret>"
DB_URL="libsql://..."
DB_TOKEN="..."
```

VM provisioning script:
```bash
curl -X POST https://kilovault.bunny.net/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "auth.getToken",
    "params": {
      "secret": "'"$AUTH_SECRET"'",
      "userId": "provisioning-system",
      "expiresIn": 1800  // 30 minutes
    }
  }'
```

### Example 2: Backend Service with Non-Expiring Token

```bash
curl -X POST https://kilovault.bunny.net/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "auth.getToken",
    "params": {
      "secret": "'"$AUTH_SECRET"'",
      "userId": "backend-config-service",
      "permissions": {"vault.get": true, "vault.set": true}
    }
  }'
# Token never expires - suitable for long-running services
```

---

## Testing Your Configuration

### Verify CORS Configuration

```bash
# Test CORS headers with your configured origin
curl -X OPTIONS https://kilovault.bunny.net/rpc \
  -H "Origin: https://myapp.example.com" \
  -v

# Should see: Access-Control-Allow-Origin: https://myapp.example.com
# (if configured) or * (if using default)
```

### Test Token Expiration

```bash
# Request token with expiration
TOKEN=$(curl -s -X POST https://kilovault.bunny.net/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "auth.getToken",
    "params": {
      "secret": "your-secret",
      "userId": "test-user",
      "expiresIn": 10
    }
  }' | jq -r '.result.token')

# Decode token to verify exp claim
node -e "console.log(JSON.parse(Buffer.from('$TOKEN'.split('.')[1], 'base64').toString()))"
# Should show: { sub: 'test-user', exp: 1234567890, ... }

# Wait 11 seconds and verify token is now expired
```

---

## Troubleshooting

### "CORS error: Access-Control-Allow-Origin"

- Verify `ALLOWED_ORIGINS` includes your domain
- Check exact origin spelling (including protocol and port)
- If using wildcard, consider if production needs such permissive settings

### Token Returns "exp: undefined"

- This is expected if `expiresIn` was not provided
- Token will never expire
- Suitable for backend services only

### "Invalid secret" errors on timing-critical systems

- Timing attacks are now prevented, but comparison may be slightly slower
- This is negligible and doesn't affect normal operation

---

## Security Timeline

| Date | Issue | Status |
|------|-------|--------|
| 2026-08-19 | No JWT expiration | ✅ Fixed |
| 2026-08-19 | Wildcard CORS | ✅ Fixed (configurable) |
| 2026-08-19 | Timing attack on secret | ✅ Fixed |

---

## Additional Resources

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP CORS Misconfiguration](https://owasp.org/www-community/CORS_misconfiguration)
- [Constant-Time Comparison](https://codahale.com/a-lesson-in-timing-attacks/)
