# Chargily MCP

A public [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [Chargily Pay V2 API](https://dev.chargily.com/pay-v2/introduction), hosted on Cloudflare Workers. Anyone can connect with their own Chargily API key — no shared secrets, no server-side configuration needed.

## MCP Endpoint

```
https://mcp.ta9in.com/chargily-mcp/mcp
```

## Quick Start

1. Get your Chargily API key from [pay.chargily.com](https://pay.chargily.com) → Developer → API Keys

2. Set it in your project's `.env` file:
   ```env
   CHARGILY_API_KEY=test_sk_your_key_here
   ```

3. Add to your MCP client config (e.g. `claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "chargily": {
         "command": "npx",
         "args": [
           "mcp-remote",
           "https://mcp.ta9in.com/chargily-mcp/mcp",
           "--header",
           "Authorization: Bearer ${CHARGILY_API_KEY}"
         ]
       }
     }
   }
   ```

4. Restart your MCP client. The server auto-detects test vs live mode from your key prefix (`test_sk_` / `live_sk_`).

> **Your key is never stored on the server** — it's sent per-request and kept only in your MCP session.

## Tools

| Tool | Description |
|---|---|
| `get_documentation` | Get API docs for a specific topic |
| `list_documentation_topics` | List all available doc topics |
| `get_balance` | Retrieve merchant wallet balance |
| `create_customer` | Create a new customer |
| `get_customer` | Get customer by ID |
| `update_customer` | Update customer details |
| `delete_customer` | Delete a customer |
| `list_customers` | List all customers |
| `create_product` | Create a product |
| `get_product` | Get product by ID |
| `update_product` | Update product details |
| `delete_product` | Delete a product |
| `list_products` | List all products |
| `create_price` | Create a price for a product |
| `get_price` | Get price by ID |
| `update_price` | Update price metadata |
| `delete_price` | Delete a price |
| `list_prices` | List all prices |
| `create_checkout` | Create a payment session (returns checkout URL) |
| `get_checkout` | Get checkout by ID |
| `list_checkouts` | List all checkouts |
| `expire_checkout` | Expire a pending checkout |
| `create_payment_link` | Create a reusable payment link |
| `get_payment_link` | Get payment link by ID |
| `update_payment_link` | Update a payment link |
| `delete_payment_link` | Delete a payment link |
| `list_payment_links` | List all payment links |
| `list_payment_link_checkouts` | List checkouts from a payment link |

## How Authentication Works

Your Chargily API key is passed as an HTTP header with each request:

```
Authorization: Bearer <your_key>
```

or alternatively:

```
X-Chargily-Api-Key: <your_key>
```

The server reads it from the header, uses it for that session's API calls, and automatically selects **test mode** (`test_sk_...`) or **live mode** (`live_sk_...`) based on the key prefix.

## Self-Hosting

```bash
git clone https://github.com/ta9in-oss/chargily-mcp
cd chargily-mcp
npm install

# Local dev
npm run dev
# → http://localhost:8788/chargily-mcp/mcp

# Deploy to your own Cloudflare account
npm run deploy
```

No secrets to configure — the Worker has no server-side API keys. Each user brings their own.

## API Reference

Full Chargily Pay API docs: https://dev.chargily.com/pay-v2/introduction

## License

MIT
