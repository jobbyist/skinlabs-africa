# SkinLabs MCP Server

Exposes SkinLabs' skincare intelligence — the AI Formulator, Review Engine,
Newsroom, Podcast and practitioner directory — as MCP tools, so it can be
called from other agents/apps, not just skinlabs.co.za.

## Deploying

Deploy like any other function in this repo:

```
supabase functions deploy mcp-server --no-verify-jwt
```

The connector endpoint is then:

```
https://<project-ref>.supabase.co/functions/v1/mcp-server
```

Requires the `LOVABLE_API_KEY` secret (already configured for
`skincare-ai`) for the `analyze_skin_profile` tool, and the standard
`SUPABASE_URL`/`SUPABASE_ANON_KEY` function env vars (present by default)
for `search_product_reviews`.

## Registering as a connector

Add the deployed URL above wherever you register a streamable-HTTP MCP
server (Claude, ChatGPT, or any MCP-compatible client/agent framework).
This server answers every request as a single JSON response (no session
id, no SSE stream) — the simplest spec-legal mode of the Streamable HTTP
transport, chosen because it needs no server-side session state.

## Example requests

List available tools:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/mcp-server \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Call a tool:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/mcp-server \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"find_practitioners",
      "arguments":{"city":"Cape Town"}
    }
  }'
```

## Tools

| Tool | Purpose |
| --- | --- |
| `get_skin_assessment_questions` | Returns the AI Formulator quiz question set |
| `analyze_skin_profile` | Generates a personalized routine from quiz answers (calls the Lovable AI gateway, same model as the website) |
| `search_product_reviews` | Queries the live Review Engine (`products` table) by category/skin type |
| `search_newsroom` | Keyword search over Daily Skinny briefings |
| `get_podcast_episodes` | Lists Skin Deep Podcast episodes |
| `find_practitioners` | Finds SA practitioners by city/speciality for consultations |

`search_newsroom`/`get_podcast_episodes`/`find_practitioners` currently
read from small static arrays embedded in `index.ts` (Newsroom/Podcast
aren't in Supabase yet, unlike Reviews — see the `products_and_retailers`
migration). Once they are, swap those arrays for real queries the same way
`search_product_reviews` already works.
