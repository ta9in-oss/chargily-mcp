# Chargily MCP

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [Chargily Pay V2 API](https://dev.chargily.com/pay-v2/introduction), hosted on Cloudflare Workers. Enables AI assistants to interact with Chargily Pay directly — create checkouts, manage customers, products, prices, and payment links.

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

## Setup

### Prerequisites
- [Node.js](https://nodejs.org) ≥ 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- A [Chargily Pay account](https://pay.chargily.com) with API key

### Local Development

```bash
# Install dependencies
npm install

# Set your API key locally
echo "CHARGILY_API_KEY=test_sk_your_key_here" > .dev.vars

# Start dev server
npm run dev
# → MCP endpoint: http://localhost:8788/mcp
```

### Deploy to Cloudflare

```bash
# Set your API key as a secret
npx wrangler secret put CHARGILY_API_KEY

# (Optional) Set mode to 'live' for production
npx wrangler secret put CHARGILY_MODE  # enter: live

# Deploy
npm run deploy
# → https://chargily-mcp.<your-account>.workers.dev/mcp
```

## Connecting to Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chargily": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://chargily-mcp.<your-account>.workers.dev/mcp"
      ]
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CHARGILY_API_KEY` | Yes | Your Chargily Pay secret key (`test_sk_...` or `live_sk_...`) |
| `CHARGILY_MODE` | No | `test` (default) or `live` |

## API Reference

Full Chargily Pay API docs: https://dev.chargily.com/pay-v2/introduction

## License

MIT
