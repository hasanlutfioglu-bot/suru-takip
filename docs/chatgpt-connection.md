# Sürü Takip / ChatGPT connection

Implemented first slice: a user-authenticated MCP resource server in `supabase/functions/flock-mcp`, plus the Turkish consent page `oauth-consent.html`. This is a direct ChatGPT tool connection, not an embedded imitation chat UI or a Responses API integration. It needs no inference API key at this stage.

## Tools

- `list_my_farms`: only memberships belonging to the verified user.
- `read_farm`: summary, stock, tasks, animals, paginated records, animal history and monthly TRY finance.
- `preview_farm_record`: validates a proposal without changing stored data.
- `commit_farm_record`: appends birth (with lamb creation), weight, health, expense, income, sale or note. The user must approve the preview. No delete or arbitrary replacement tool is exposed.

RLS and the explicit membership/role check both apply. No service role is used. Writes use an updated_at compare-and-swap, deterministic record IDs for retry safety, and the existing server-side Free plan limits. Out-of-order weights recalculate chronological gain and keep the newest weight. The application layout and animal records are untouched by deployment.

## Activation gates — not yet a connected public ChatGPT plugin

1. Enable Supabase Auth OAuth server for the existing project, with explicit user consent; register the actual ChatGPT OAuth client (copy its exact redirect URI from the plugin builder). Do not enable unrestricted dynamic registration just to skip this step.
2. Configure the authorization path for the deployed consent page. The path is combined with the current Supabase Site URL; inspect that URL first. Allow the exact Google login callback URL with its authorization_id query. Do not break the main app login redirects.
3. The issued access token must have verified issuer `https://nqbfyahiijdkrroojlct.supabase.co/auth/v1`, the MCP resource audience or trusted `resource` claim `https://nqbfyahiijdkrroojlct.supabase.co/functions/v1/flock-mcp`, `openid` scope, and the registered `client_id`. Supabase's generic `authenticated` audience alone is deliberately rejected. Confirm resource parameter handling and claim propagation using an actual OAuth exchange; use a narrowly scoped token hook only if needed. Do not change normal app token audiences.
4. Set the edge secret `FLOCK_MCP_CLIENT_IDS` to the registered ChatGPT client IDs, comma-separated. With no allowlist the data tools return `oauth_not_configured`. Never put user sessions or secret keys in links, prompts or static HTML.
5. Deploy `flock-mcp` with platform JWT verification disabled so anonymous MCP discovery works. The function verifies JWT signatures via getClaims, issuer, audience, expiry, client ID and scope, then validates the live user with getUser on EVERY data call. Metadata is at the advertised nested `/.well-known/oauth-protected-resource` path.
6. Connect and verify read-only tools in ChatGPT. Then test a user-approved write with disposable test accounts, a second farm, a viewer, revoked membership, conflicting phone writes, duplicate retries, and Free plan enforcement. Do not test writes on the owner's production herd without explicit recording intent.
7. Public use by all users requires the applicable OpenAI plugin distribution/publication process and supported accounts. A generic link to ChatGPT is NOT a connection. Add the application's launch button only when its verified plugin URL and actual connection flow are available.

## Current limitations

Live check on 6 October 2026: `flock-mcp` is ACTIVE (version 2), protected-resource metadata responds, and Supabase Auth returns `feature_disabled` / `OAuth server is disabled`. The pilot is restricted to Hasan's verified user ID. All current `npm test` suites pass locally. Turkish activation instructions and live-account acceptance checks are in `chatgpt-yarin-kurulum-tr.md`.

OAuth configuration and real ChatGPT connection have not been verified. No new button falsely implying active connection was added. Record editing/deletion, stock changes, task mutation, voice recording and automatic notifications are not implemented in this slice. Existing stock/tasks can be read. Preview/confirmation is an interaction requirement and not a separate server-stored approval token. Supabase consent authorizes access to all of this user's member farms under their existing roles; per-farm grant narrowing can be added before broader distribution.

## Sources

- https://developers.openai.com/plugins/build/auth
- https://developers.openai.com/plugins/build/mcp-server
- https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication
- https://supabase.com/docs/guides/auth/oauth-server/getting-started

## Verification

`node tests/flock-mcp.mjs` tests domain validation, birth children, retry safety, invalid dates, foreign animal IDs, weight chronology, finance, sale linkage, token restrictions, membership isolation, viewer protection, preview, confirmation and stale versions. `npm test` includes this suite and the pre-existing application suites.
