# Security Configuration

## API Endpoint Authentication

### Chat Endpoint (`/api/chat`)

The `/api/chat` endpoint provides access to AI-powered workspace capabilities. When Soda Straw MCP integration is enabled, this endpoint can invoke authenticated backend services. To prevent unauthorized access, authentication is required.

#### Configuration

##### Production Deployment (Recommended)

Set a strong API key for the chat endpoint:

```bash
# os/.env.local
FLUID_OS_CHAT_API_KEY=****here
```

Clients must include this key in the Authorization header:

```bash
curl -X POST https://your-domain.com/api/chat \
  -H "Authorization: Bearer ****here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a task list"}'
```

##### Development Environment (Trusted Networks Only)

For local development in trusted environments, you can optionally allow unauthenticated access:

```bash
# os/.env.local
ALLOW_UNAUTHENTICATED_MCP_TOOLS=true
```

**⚠️ WARNING:** Never set `ALLOW_UNAUTHENTICATED_MCP_TOOLS=true` in production or publicly accessible deployments. This bypasses authentication and allows anyone to invoke authenticated backend services.

#### Security Model

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

### Capability Call Endpoint (`/api/capability-call`)

The `/api/capability-call` endpoint provides a proxy to backend capability APIs. This endpoint forwards requests to the backend service and requires authentication to prevent unauthorized access to backend capabilities.

#### Configuration

##### Production Deployment (Recommended)

Set a strong API key for the capability-call endpoint:

```bash
# os/.env.local
FLUID_OS_CAPABILITY_API_KEY=****here
NEXT_PUBLIC_CAPABILITY_API_KEY=****here
FLUID_OS_API_KEY=backend-api-key-here
```

The client-side widgets will automatically include the authentication header when `NEXT_PUBLIC_CAPABILITY_API_KEY` is set. For direct API calls, clients must include this key in the Authorization header:

```bash
curl -X POST https://your-domain.com/api/capability-call \
  -H "Authorization: Bearer ****here" \
  -H "Content-Type: application/json" \
  -d '{"capabilityId": "notes.create", "params": {"content": "Test note"}}'
```

##### Development Environment (Trusted Networks Only)

For local development in trusted environments, you can optionally allow unauthenticated access:

```bash
# os/.env.local
ALLOW_UNAUTHENTICATED_CAPABILITIES=true
FLUID_OS_API_KEY=backend-api-key-here
```

**⚠️ WARNING:** Never set `ALLOW_UNAUTHENTICATED_CAPABILITIES=true` in production or publicly accessible deployments. This bypasses authentication and allows anyone to invoke backend capabilities.

#### Security Model

1. **When `FLUID_OS_CAPABILITY_API_KEY` is set:**
   - All requests to `/api/capability-call` must include a valid Authorization header
   - Backend capabilities are only available to authenticated requests
   - Unauthenticated requests will be rejected with a 401 status
   - Client-side widgets automatically authenticate when `NEXT_PUBLIC_CAPABILITY_API_KEY` is set

2. **When `FLUID_OS_CAPABILITY_API_KEY` is not set:**
   - Backend capabilities are only available if `ALLOW_UNAUTHENTICATED_CAPABILITIES=true`
   - This mode is intended for development only
   - Production deployments must set `FLUID_OS_CAPABILITY_API_KEY`

3. **Backend API Key:**
   - The `FLUID_OS_API_KEY` environment variable must be set to authenticate with the backend
   - This key is used by the Next.js server to forward requests to the backend
   - The backend must be configured with the same `FLUID_OS_API_KEY` value
   - No hardcoded fallback keys are used; the environment variable is required

### Migration Guide

If you have an existing deployment without authentication:

1. Generate secure random API keys:
   ```bash
   openssl rand -base64 32  # For FLUID_OS_CHAT_API_KEY
   openssl rand -base64 32  # For FLUID_OS_CAPABILITY_API_KEY
   openssl rand -base64 32  # For FLUID_OS_API_KEY (backend)
   ```

2. Add them to your environment:
   ```bash
   FLUID_OS_CHAT_API_KEY=<generated-key-1>
   FLUID_OS_CAPABILITY_API_KEY=<generated-key-2>
   NEXT_PUBLIC_CAPABILITY_API_KEY=<generated-key-2>  # Same as FLUID_OS_CAPABILITY_API_KEY
   FLUID_OS_API_KEY=<generated-key-3>
   ```

3. Configure the backend with the same backend API key:
   ```bash
   # backend/.env
   FLUID_OS_API_KEY=<generated-key-3>
   ```

4. Update your frontend to include the Authorization header (if calling APIs directly):
   ```typescript
   // For chat endpoint
   const chatResponse = await fetch("/api/chat", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CHAT_API_KEY}`,
     },
     body: JSON.stringify({ message }),
   });

   // For capability-call endpoint (client-side widgets handle this automatically)
   const capabilityResponse = await fetch("/api/capability-call", {
     method: "POST",
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CAPABILITY_API_KEY}`,
     },
     body: JSON.stringify({ capabilityId, params }),
   });
   ```

5. Remove any `ALLOW_UNAUTHENTICATED_*` settings from production

### Threat Model

This authentication mechanism protects against:

- **Unauthorized MCP Tool Access:** Prevents anonymous users from invoking authenticated Soda Straw MCP tools
- **Unauthorized Capability Access:** Prevents anonymous users from invoking backend capabilities through the proxy
- **Backend Service Abuse:** Prevents unauthorized access to workspace APIs and external services
- **Data Disclosure:** Prevents unauthorized users from receiving tool outputs that may contain sensitive data
- **State Manipulation:** Prevents unauthorized users from modifying shared backend state (e.g., notes, tasks)

### Additional Security Considerations

1. **API Key Storage:** Store all API keys securely in environment variables, never in source code
2. **Key Rotation:** Rotate API keys periodically and after any suspected compromise
3. **Network Security:** Use HTTPS in production to protect API keys in transit
4. **Rate Limiting:** Consider implementing rate limiting for API endpoints
5. **Audit Logging:** Consider logging authentication attempts for security monitoring
6. **Separate Keys:** Use different API keys for different endpoints to limit the blast radius of a compromised key
