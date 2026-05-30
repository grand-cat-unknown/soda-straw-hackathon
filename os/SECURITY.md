# Security Configuration

## API Chat Endpoint Authentication

The `/api/chat` endpoint provides access to AI-powered workspace capabilities. When Soda Straw MCP integration is enabled, this endpoint can invoke authenticated backend services. To prevent unauthorized access, authentication is required.

### Configuration

#### Production Deployment (Recommended)

Set a strong API key for the chat endpoint:

```bash
# os/.env.local
FLUID_OS_CHAT_API_KEY=your-secure-random-key-here
```

Clients must include this key in the Authorization header:

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Authorization: Bearer your-secure-random-key-here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a task list"}'
```

#### Development Environment (Trusted Networks Only)

For local development in trusted environments, you can optionally allow unauthenticated access:

```bash
# os/.env.local
ALLOW_UNAUTHENTICATED_MCP_TOOLS=true
```

**⚠️ WARNING:** Never set `ALLOW_UNAUTHENTICATED_MCP_TOOLS=true` in production or publicly accessible deployments. This bypasses authentication and allows anyone to invoke authenticated backend services.

### Security Model

1. **When `FLUID_OS_CHAT_API_KEY` is set:**
   - All requests to `/api/chat` must include a valid Authorization header
   - MCP tools are only available to authenticated requests
   - Unauthenticated requests will not have access to Soda Straw MCP tools

2. **When `FLUID_OS_CHAT_API_KEY` is not set:**
   - MCP tools are only available if `ALLOW_UNAUTHENTICATED_MCP_TOOLS=true`
   - This mode is intended for development only
   - Canvas tools (non-MCP) remain available without authentication

3. **Canvas Tools:**
   - Local canvas manipulation tools are always available
   - These tools operate on the client-side workspace state
   - They do not access authenticated backend services

### Migration Guide

If you have an existing deployment without authentication:

1. Generate a secure random API key:
   ```bash
   openssl rand -base64 32
   ```

2. Add it to your environment:
   ```bash
   FLUID_OS_CHAT_API_KEY=<generated-key>
   ```

3. Update your frontend to include the Authorization header:
   ```typescript
   const response = await fetch("/api/chat", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CHAT_API_KEY}`,
     },
     body: JSON.stringify({ message }),
   });
   ```

4. Remove any `ALLOW_UNAUTHENTICATED_MCP_TOOLS` setting from production

### Threat Model

This authentication mechanism protects against:

- **Unauthorized MCP Tool Access:** Prevents anonymous users from invoking authenticated Soda Straw MCP tools
- **Backend Service Abuse:** Prevents unauthorized access to workspace APIs and external services
- **Data Disclosure:** Prevents unauthorized users from receiving tool outputs that may contain sensitive data

### Additional Security Considerations

1. **API Key Storage:** Store `FLUID_OS_CHAT_API_KEY` securely in environment variables, never in source code
2. **Key Rotation:** Rotate API keys periodically and after any suspected compromise
3. **Network Security:** Use HTTPS in production to protect API keys in transit
4. **Rate Limiting:** Consider implementing rate limiting for the `/api/chat` endpoint
5. **Audit Logging:** Consider logging authentication attempts for security monitoring
