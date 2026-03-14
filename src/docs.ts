export type DocTopic =
  | "overview"
  | "authentication"
  | "balance"
  | "customers"
  | "products"
  | "prices"
  | "checkouts"
  | "payment-links"
  | "webhooks"
  | "errors";

export const DOCS: Record<DocTopic, string> = {
  overview: `# Chargily Pay V2 API — Overview

Chargily Pay is an Algerian payment gateway that lets you accept online payments via EDAHABIA and CIB cards.

## Base URLs
- **Test mode**: https://pay.chargily.net/test/api/v2
- **Live mode**: https://pay.chargily.net/api/v2

The mode is determined by the secret key you use and the base URL you target.

## Available Resources
- **Balance** — Retrieve your merchant wallet balances
- **Customers** — Create and manage customers
- **Products** — Create and manage products (catalog items)
- **Prices** — Define prices attached to products
- **Checkouts** — Create payment sessions and redirect customers
- **Payment Links** — Shareable URLs that generate checkouts on demand

## Typical Integration Flow
1. (Optional) Create a Customer
2. (Optional) Create a Product + Price
3. Create a Checkout (with items or a direct amount)
4. Redirect the customer to checkout_url
5. Receive webhook events for payment status updates

## Documentation site: https://dev.chargily.com/pay-v2/introduction`,

  authentication: `# Authentication

All API requests must include your secret API key in the Authorization header using Bearer token format.

## Header
\`\`\`
Authorization: Bearer YOUR_SECRET_KEY
\`\`\`

## Getting your API key
1. Sign up / log in at https://pay.chargily.com
2. Go to Developer → API Keys
3. Copy your **Test Secret Key** (starts with \`test_sk_\`) or **Live Secret Key** (starts with \`live_sk_\`)

## Test vs Live mode
- Use test key + \`https://pay.chargily.net/test/api/v2\` for development
- Use live key + \`https://pay.chargily.net/api/v2\` for production
- Test payments never hit real banking networks

## Security
- Never expose your secret key client-side
- Store it as an environment variable / secret
- In this MCP server, set it via: \`wrangler secret put CHARGILY_API_KEY\``,

  balance: `# Balance

Retrieve the current balance of your Chargily Pay merchant account.

## Endpoint
GET /balance

## Response Object
| Field | Type | Description |
|---|---|---|
| entity | string | Always "balance" |
| livemode | boolean | true = live mode, false = test mode |
| wallets | array | List of wallet objects per currency |
| wallets[].currency | string | ISO currency code (e.g. "dzd") |
| wallets[].balance | number | Total balance amount |
| wallets[].ready_for_payout | number | Amount available for payout |
| wallets[].on_hold | number | Amount currently on hold |

## Example Response
\`\`\`json
{
  "entity": "balance",
  "livemode": false,
  "wallets": [
    {
      "currency": "dzd",
      "balance": 50000,
      "ready_for_payout": 45000,
      "on_hold": 5000
    }
  ]
}
\`\`\``,

  customers: `# Customers

Customers represent buyers in your system. Attaching a customer to a checkout lets you track purchase history.

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /customers | Create a customer |
| GET | /customers/:id | Retrieve a customer |
| POST | /customers/:id | Update a customer |
| DELETE | /customers/:id | Delete a customer |
| GET | /customers | List all customers |

## Customer Object
| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| entity | string | Always "customer" |
| livemode | boolean | Mode indicator |
| name | string | Full name of the customer |
| email | string\|null | Email address |
| phone | string\|null | Phone number |
| address | object\|null | Address details |
| address.country | string | Country |
| address.state | string | State / Province |
| address.address | string | Street address line |
| metadata | object | Arbitrary key-value pairs |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## Create Customer — Request Body
| Field | Required | Type | Description |
|---|---|---|---|
| name | Yes | string | Customer's name |
| email | No | string | Customer's email |
| phone | No | string | Customer's phone |
| address | No | object | Address object (country, state, address) |
| metadata | No | object | Custom key-value pairs |

## List Customers — Query Parameters
| Param | Description |
|---|---|
| per_page | Number of results per page (default: 10) |

## Example: Create Customer
\`\`\`json
POST /customers
{
  "name": "Ahmed Benali",
  "email": "ahmed@example.com",
  "phone": "+213555000111",
  "address": {
    "country": "DZ",
    "state": "Alger",
    "address": "123 Rue Didouche Mourad"
  }
}
\`\`\``,

  products: `# Products

Products represent items in your catalog. Each product can have multiple Prices attached.

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /products | Create a product |
| GET | /products/:id | Retrieve a product |
| POST | /products/:id | Update a product |
| DELETE | /products/:id | Delete a product |
| GET | /products | List all products |
| GET | /products/:id/prices | List prices for a product |

## Product Object
| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| entity | string | Always "product" |
| livemode | boolean | Mode indicator |
| name | string | Product name |
| description | string\|null | Product description |
| images | string[] | Array of image URLs |
| metadata | object | Arbitrary key-value pairs |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## Create Product — Request Body
| Field | Required | Type | Description |
|---|---|---|---|
| name | Yes | string | Product name |
| description | No | string | Product description |
| images | No | string[] | Array of image URLs |
| metadata | No | object | Custom key-value pairs |

## Example: Create Product
\`\`\`json
POST /products
{
  "name": "Premium Subscription",
  "description": "Monthly premium plan",
  "images": ["https://example.com/img/premium.png"]
}
\`\`\``,

  prices: `# Prices

Prices define the amount charged for a Product. A product can have multiple prices (e.g. monthly/yearly).

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /prices | Create a price |
| GET | /prices/:id | Retrieve a price |
| POST | /prices/:id | Update a price |
| DELETE | /prices/:id | Delete a price |
| GET | /prices | List all prices |

## Price Object
| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| entity | string | Always "price" |
| livemode | boolean | Mode indicator |
| amount | integer | Amount in smallest currency unit (centimes for DZD) |
| currency | string | Lowercase ISO code — currently only "dzd" |
| product_id | string | ID of the associated product |
| metadata | object | Arbitrary key-value pairs |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## Create Price — Request Body
| Field | Required | Type | Description |
|---|---|---|---|
| amount | Yes | integer | Amount in smallest unit (e.g. 150000 = 1500.00 DZD) |
| currency | Yes | string | Must be "dzd" |
| product_id | Yes | string | ID of the product this price belongs to |
| metadata | No | object | Custom key-value pairs |

## Example: Create Price
\`\`\`json
POST /prices
{
  "amount": 150000,
  "currency": "dzd",
  "product_id": "prod_abc123"
}
\`\`\`

## Note on Amounts
Amounts are expressed in the smallest currency unit.
For DZD: 1 DZD = 100 units, so 1500 DZD = 150000.`,

  checkouts: `# Checkouts

A Checkout creates a hosted payment page. Redirect your customer to \`checkout_url\` to complete payment.

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /checkouts | Create a checkout |
| GET | /checkouts/:id | Retrieve a checkout |
| GET | /checkouts | List all checkouts |
| POST | /checkouts/:id/expire | Expire a checkout |

## Checkout Object
| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| entity | string | Always "checkout" |
| livemode | boolean | Mode indicator |
| amount | integer | Total checkout amount |
| currency | string | 3-letter ISO currency code |
| fees | integer | Total fees |
| fees_on_merchant | integer | Fees paid by merchant |
| fees_on_customer | integer | Fees paid by customer |
| chargily_pay_fees_allocation | string | "customer", "merchant", or "split" |
| status | string | "pending", "processing", "paid", "failed", "canceled" |
| locale | string | Page language: "ar", "en", or "fr" |
| description | string | Optional note |
| success_url | string | Redirect URL on success |
| failure_url | string | Redirect URL on failure/cancel |
| webhook_endpoint | string | URL for webhook events |
| payment_method | string\|null | Payment method used |
| customer_id | string\|null | Associated customer ID |
| invoice_id | string\|null | Associated invoice ID |
| payment_link_id | string\|null | Source payment link ID |
| metadata | object | Arbitrary key-value pairs |
| shipping_address | string | Customer shipping address |
| collect_shipping_address | boolean | Whether to collect shipping address |
| discount | object | Discount applied (type + value) |
| amount_without_discount | integer | Amount before discount |
| checkout_url | string | URL to redirect customer to |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## Create Checkout — Request Body
| Field | Required | Type | Description |
|---|---|---|---|
| amount | Yes* | integer | Amount in smallest unit. *Required if no items |
| currency | Yes | string | Must be "dzd" |
| success_url | Yes | string | Redirect URL after successful payment |
| items | No | array | Array of {price_id, quantity} — if provided, amount is computed |
| failure_url | No | string | Redirect URL after failure |
| webhook_endpoint | No | string | Webhook URL |
| customer_id | No | string | Associate with a customer |
| description | No | string | Checkout note |
| locale | No | string | "ar", "en", or "fr" (default: "ar") |
| pass_fees_to_customer | No | boolean | Deprecated — use chargily_pay_fees_allocation |
| chargily_pay_fees_allocation | No | string | "customer", "merchant", or "split" |
| discount | No | object | {type: "percentage"\|"amount", value: number} |
| metadata | No | object | Custom key-value pairs |
| collect_shipping_address | No | boolean | Collect shipping from customer |

## Example: Simple Checkout
\`\`\`json
POST /checkouts
{
  "amount": 250000,
  "currency": "dzd",
  "success_url": "https://myapp.com/payment/success",
  "failure_url": "https://myapp.com/payment/failed",
  "locale": "ar",
  "description": "Order #1042"
}
\`\`\`

## Example: Checkout with Items
\`\`\`json
POST /checkouts
{
  "items": [
    { "price": "price_abc123", "quantity": 2 }
  ],
  "currency": "dzd",
  "success_url": "https://myapp.com/payment/success",
  "customer_id": "cust_xyz789"
}
\`\`\``,

  "payment-links": `# Payment Links

Payment Links are reusable, shareable URLs that create a checkout automatically when visited.

## Endpoints
| Method | Path | Description |
|---|---|---|
| POST | /payment-links | Create a payment link |
| GET | /payment-links/:id | Retrieve a payment link |
| POST | /payment-links/:id | Update a payment link |
| DELETE | /payment-links/:id | Delete a payment link |
| GET | /payment-links | List all payment links |
| GET | /payment-links/:id/checkouts | List checkouts from a payment link |

## Payment Link Object
| Field | Type | Description |
|---|---|---|
| id | string | Unique identifier |
| entity | string | Always "payment_link" |
| livemode | boolean | Mode indicator |
| name | string | Internal label (not shown to customers) |
| active | boolean | false = customers see a 404 page |
| after_completion_message | string | Message shown after successful payment |
| locale | string | Page language: "ar", "en", or "fr" |
| pass_fees_to_customer | boolean | Whether fees are passed to customer |
| collect_shipping_address | boolean | Whether to collect shipping address |
| metadata | object | Arbitrary key-value pairs |
| url | string | The shareable payment URL |
| created_at | timestamp | Creation time |
| updated_at | timestamp | Last update time |

## Create Payment Link — Request Body
| Field | Required | Type | Description |
|---|---|---|---|
| name | Yes | string | Internal name / label |
| items | Yes | array | Array of {price_id, quantity, adjustable_quantity} |
| after_completion_message | No | string | Post-payment message |
| locale | No | string | "ar", "en", or "fr" |
| pass_fees_to_customer | No | boolean | Pass fees to customer |
| collect_shipping_address | No | boolean | Collect shipping address |
| metadata | No | object | Custom key-value pairs |

## Example: Create Payment Link
\`\`\`json
POST /payment-links
{
  "name": "Premium Plan Checkout",
  "items": [
    { "price": "price_abc123", "quantity": 1 }
  ],
  "locale": "ar",
  "after_completion_message": "Thank you for your purchase!"
}
\`\`\``,

  webhooks: `# Webhooks

Chargily sends webhook events to your endpoint when payment status changes.

## Setup
Set \`webhook_endpoint\` when creating a Checkout, or configure it in your Chargily Pay dashboard.

## Verifying Webhook Signatures
Each webhook request includes a \`Signature\` header. Verify it using your webhook secret:

\`\`\`
HMAC-SHA256(secret, payload_body) == Signature header value
\`\`\`

## Event: checkout.paid
Fired when a checkout is successfully paid.

\`\`\`json
{
  "id": "evt_abc123",
  "type": "checkout.paid",
  "data": {
    "id": "checkout_xyz",
    "status": "paid",
    "amount": 250000,
    "currency": "dzd",
    "customer_id": "cust_123",
    ...
  }
}
\`\`\`

## Event: checkout.failed
Fired when a checkout payment fails.

## Event: checkout.canceled
Fired when a customer cancels.

## Best Practices
- Always verify the signature before processing
- Return HTTP 200 quickly; process asynchronously
- Implement idempotency using \`id\` field
- Retry logic: Chargily retries failed deliveries`,

  errors: `# Error Handling

Chargily Pay uses standard HTTP status codes and returns error details in JSON.

## HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | OK — Request succeeded |
| 201 | Created — Resource created successfully |
| 400 | Bad Request — Invalid parameters |
| 401 | Unauthorized — Invalid or missing API key |
| 403 | Forbidden — Insufficient permissions |
| 404 | Not Found — Resource doesn't exist |
| 422 | Unprocessable Entity — Validation errors |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error — Server-side issue |

## Error Response Format
\`\`\`json
{
  "message": "The given data was invalid.",
  "errors": {
    "amount": ["The amount field is required."],
    "currency": ["The currency must be dzd."]
  }
}
\`\`\`

## Common Errors
- **401 Unauthorized**: Check your API key and Authorization header format
- **422 Validation error**: Check required fields and value formats
- **404 Not Found**: Verify the resource ID exists and belongs to your account
- **amount must be positive**: Amounts must be integers > 0 in smallest currency unit`,
};

export const ALL_TOPICS = Object.keys(DOCS) as DocTopic[];
