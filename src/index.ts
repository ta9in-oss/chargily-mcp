import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ChargilyClient } from "./chargily-client";
import { DOCS, ALL_TOPICS, type DocTopic } from "./docs";

export interface Env {
  CHARGILY_API_KEY: string;
  CHARGILY_MODE?: "test" | "live";
  MCP_OBJECT: DurableObjectNamespace;
}

export class ChargilyMCP extends McpAgent<Env> {
  server = new McpServer({ name: "chargily-mcp", version: "1.0.0" });

  private getClient(): ChargilyClient {
    return new ChargilyClient({
      apiKey: this.env.CHARGILY_API_KEY,
      mode: (this.env.CHARGILY_MODE as "test" | "live") ?? "test",
    });
  }

  async init() {

    this.server.tool(
      "get_documentation",
      "Get Chargily Pay API documentation for a specific topic. Use this to understand available endpoints, request parameters, response fields, and integration patterns before making API calls.",
      {
        topic: z
          .enum([
            "overview",
            "authentication",
            "balance",
            "customers",
            "products",
            "prices",
            "checkouts",
            "payment-links",
            "webhooks",
            "errors",
          ])
          .describe(
            "The documentation topic to retrieve. Use 'overview' for a general introduction, or a specific resource name."
          ),
      },
      async ({ topic }) => {
        const content = DOCS[topic as DocTopic];
        return {
          content: [{ type: "text", text: content }],
        };
      }
    );

    this.server.tool(
      "list_documentation_topics",
      "List all available Chargily Pay documentation topics you can query with get_documentation.",
      {},
      async () => {
        const topicDescriptions: Record<DocTopic, string> = {
          overview: "General introduction, base URLs, and integration flow",
          authentication: "API keys, Bearer token setup, test vs live mode",
          balance: "Retrieve merchant wallet balances",
          customers: "Create and manage customer records",
          products: "Manage product catalog items",
          prices: "Define prices attached to products",
          checkouts: "Create payment sessions and redirect customers",
          "payment-links": "Shareable URLs that auto-generate checkouts",
          webhooks: "Payment event notifications and signature verification",
          errors: "HTTP status codes and error response formats",
        };

        const lines = ALL_TOPICS.map(
          (t) => `- **${t}**: ${topicDescriptions[t]}`
        ).join("\n");

        return {
          content: [
            {
              type: "text",
              text: `# Available Documentation Topics\n\n${lines}\n\nUse \`get_documentation\` with any of these topic names.`,
            },
          ],
        };
      }
    );

    // ─── Balance ──────────────────────────────────────────────────────────────

    this.server.tool(
      "get_balance",
      "Retrieve your Chargily Pay merchant wallet balance, including total balance, ready-for-payout, and on-hold amounts.",
      {},
      async () => {
        const client = this.getClient();
        const balance = await client.getBalance();
        return { content: [{ type: "text", text: JSON.stringify(balance, null, 2) }] };
      }
    );

    // ─── Customers ────────────────────────────────────────────────────────────

    this.server.tool(
      "create_customer",
      "Create a new customer in Chargily Pay.",
      {
        name: z.string().describe("Customer's full name"),
        email: z.string().email().optional().describe("Customer's email address"),
        phone: z.string().optional().describe("Customer's phone number"),
        address_country: z.string().optional().describe("Country code (e.g. DZ)"),
        address_state: z.string().optional().describe("State or province"),
        address_line: z.string().optional().describe("Street address"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ name, email, phone, address_country, address_state, address_line, metadata }) => {
        const client = this.getClient();
        const address =
          address_country || address_state || address_line
            ? { country: address_country, state: address_state, address: address_line }
            : undefined;
        const customer = await client.createCustomer({ name, email, phone, address, metadata });
        return { content: [{ type: "text", text: JSON.stringify(customer, null, 2) }] };
      }
    );

    this.server.tool(
      "get_customer",
      "Retrieve a Chargily Pay customer by ID.",
      { id: z.string().describe("Customer ID") },
      async ({ id }) => {
        const client = this.getClient();
        const customer = await client.getCustomer(id);
        return { content: [{ type: "text", text: JSON.stringify(customer, null, 2) }] };
      }
    );

    this.server.tool(
      "update_customer",
      "Update an existing Chargily Pay customer.",
      {
        id: z.string().describe("Customer ID"),
        name: z.string().optional().describe("Customer's full name"),
        email: z.string().email().optional().describe("Customer's email address"),
        phone: z.string().optional().describe("Customer's phone number"),
        address_country: z.string().optional().describe("Country code"),
        address_state: z.string().optional().describe("State or province"),
        address_line: z.string().optional().describe("Street address"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ id, name, email, phone, address_country, address_state, address_line, metadata }) => {
        const client = this.getClient();
        const address =
          address_country || address_state || address_line
            ? { country: address_country, state: address_state, address: address_line }
            : undefined;
        const customer = await client.updateCustomer(id, { name, email, phone, address, metadata });
        return { content: [{ type: "text", text: JSON.stringify(customer, null, 2) }] };
      }
    );

    this.server.tool(
      "delete_customer",
      "Delete a Chargily Pay customer by ID.",
      { id: z.string().describe("Customer ID") },
      async ({ id }) => {
        const client = this.getClient();
        const result = await client.deleteCustomer(id);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "list_customers",
      "List all customers in your Chargily Pay account.",
      { per_page: z.number().int().min(1).max(100).optional().describe("Results per page (default: 10)") },
      async ({ per_page }) => {
        const client = this.getClient();
        const customers = await client.listCustomers(per_page);
        return { content: [{ type: "text", text: JSON.stringify(customers, null, 2) }] };
      }
    );

    // ─── Products ─────────────────────────────────────────────────────────────

    this.server.tool(
      "create_product",
      "Create a new product in Chargily Pay.",
      {
        name: z.string().describe("Product name"),
        description: z.string().optional().describe("Product description"),
        images: z.array(z.string().url()).optional().describe("Array of image URLs"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ name, description, images, metadata }) => {
        const client = this.getClient();
        const product = await client.createProduct({ name, description, images, metadata });
        return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
      }
    );

    this.server.tool(
      "get_product",
      "Retrieve a Chargily Pay product by ID.",
      { id: z.string().describe("Product ID") },
      async ({ id }) => {
        const client = this.getClient();
        const product = await client.getProduct(id);
        return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
      }
    );

    this.server.tool(
      "update_product",
      "Update an existing Chargily Pay product.",
      {
        id: z.string().describe("Product ID"),
        name: z.string().optional().describe("Product name"),
        description: z.string().optional().describe("Product description"),
        images: z.array(z.string().url()).optional().describe("Array of image URLs"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ id, name, description, images, metadata }) => {
        const client = this.getClient();
        const product = await client.updateProduct(id, { name, description, images, metadata });
        return { content: [{ type: "text", text: JSON.stringify(product, null, 2) }] };
      }
    );

    this.server.tool(
      "delete_product",
      "Delete a Chargily Pay product by ID.",
      { id: z.string().describe("Product ID") },
      async ({ id }) => {
        const client = this.getClient();
        const result = await client.deleteProduct(id);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "list_products",
      "List all products in your Chargily Pay account.",
      { per_page: z.number().int().min(1).max(100).optional().describe("Results per page (default: 10)") },
      async ({ per_page }) => {
        const client = this.getClient();
        const products = await client.listProducts(per_page);
        return { content: [{ type: "text", text: JSON.stringify(products, null, 2) }] };
      }
    );

    // ─── Prices ───────────────────────────────────────────────────────────────

    this.server.tool(
      "create_price",
      "Create a price for a product in Chargily Pay. Amount is in smallest currency unit (e.g. centimes for DZD: 1500 DZD = 150000).",
      {
        amount: z.number().int().positive().describe("Amount in smallest unit (centimes). Example: 150000 = 1500.00 DZD"),
        currency: z.literal("dzd").describe("Currency code — only 'dzd' is supported"),
        product_id: z.string().describe("ID of the product this price belongs to"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ amount, currency, product_id, metadata }) => {
        const client = this.getClient();
        const price = await client.createPrice({ amount, currency, product_id, metadata });
        return { content: [{ type: "text", text: JSON.stringify(price, null, 2) }] };
      }
    );

    this.server.tool(
      "get_price",
      "Retrieve a Chargily Pay price by ID.",
      { id: z.string().describe("Price ID") },
      async ({ id }) => {
        const client = this.getClient();
        const price = await client.getPrice(id);
        return { content: [{ type: "text", text: JSON.stringify(price, null, 2) }] };
      }
    );

    this.server.tool(
      "update_price",
      "Update metadata on an existing Chargily Pay price.",
      {
        id: z.string().describe("Price ID"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ id, metadata }) => {
        const client = this.getClient();
        const price = await client.updatePrice(id, { metadata });
        return { content: [{ type: "text", text: JSON.stringify(price, null, 2) }] };
      }
    );

    this.server.tool(
      "delete_price",
      "Delete a Chargily Pay price by ID.",
      { id: z.string().describe("Price ID") },
      async ({ id }) => {
        const client = this.getClient();
        const result = await client.deletePrice(id);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "list_prices",
      "List all prices in your Chargily Pay account.",
      { per_page: z.number().int().min(1).max(100).optional().describe("Results per page (default: 10)") },
      async ({ per_page }) => {
        const client = this.getClient();
        const prices = await client.listPrices(per_page);
        return { content: [{ type: "text", text: JSON.stringify(prices, null, 2) }] };
      }
    );

    // ─── Checkouts ────────────────────────────────────────────────────────────

    this.server.tool(
      "create_checkout",
      "Create a Chargily Pay checkout session. Returns a checkout_url to redirect the customer to. Provide either 'amount' directly or 'items' (price_id + quantity pairs).",
      {
        currency: z.literal("dzd").describe("Currency — only 'dzd' supported"),
        success_url: z.string().url().describe("URL to redirect after successful payment"),
        amount: z.number().int().positive().optional().describe("Amount in centimes (e.g. 150000 = 1500 DZD). Required if items not provided."),
        items: z
          .array(z.object({ price: z.string(), quantity: z.number().int().positive() }))
          .optional()
          .describe("Cart items as [{price: 'price_id', quantity: 1}]. Use instead of amount."),
        failure_url: z.string().url().optional().describe("URL to redirect after failure or cancellation"),
        webhook_endpoint: z.string().url().optional().describe("URL to receive payment webhook events"),
        customer_id: z.string().optional().describe("Associate checkout with an existing customer"),
        description: z.string().optional().describe("Internal note about this checkout"),
        locale: z.enum(["ar", "en", "fr"]).optional().describe("Checkout page language (default: ar)"),
        chargily_pay_fees_allocation: z
          .enum(["customer", "merchant", "split"])
          .optional()
          .describe("Who pays Chargily fees: 'customer', 'merchant', or 'split'"),
        discount_type: z.enum(["percentage", "amount"]).optional().describe("Discount type"),
        discount_value: z.number().positive().optional().describe("Discount value (% or amount)"),
        collect_shipping_address: z.boolean().optional().describe("Collect shipping address from customer"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({
        currency,
        success_url,
        amount,
        items,
        failure_url,
        webhook_endpoint,
        customer_id,
        description,
        locale,
        chargily_pay_fees_allocation,
        discount_type,
        discount_value,
        collect_shipping_address,
        metadata,
      }) => {
        const client = this.getClient();
        const discount =
          discount_type && discount_value !== undefined
            ? { type: discount_type, value: discount_value }
            : undefined;
        const checkout = await client.createCheckout({
          currency,
          success_url,
          amount,
          items,
          failure_url,
          webhook_endpoint,
          customer_id,
          description,
          locale,
          chargily_pay_fees_allocation,
          discount,
          collect_shipping_address,
          metadata,
        });
        return { content: [{ type: "text", text: JSON.stringify(checkout, null, 2) }] };
      }
    );

    this.server.tool(
      "get_checkout",
      "Retrieve a Chargily Pay checkout by ID.",
      { id: z.string().describe("Checkout ID") },
      async ({ id }) => {
        const client = this.getClient();
        const checkout = await client.getCheckout(id);
        return { content: [{ type: "text", text: JSON.stringify(checkout, null, 2) }] };
      }
    );

    this.server.tool(
      "list_checkouts",
      "List all checkouts in your Chargily Pay account.",
      { per_page: z.number().int().min(1).max(100).optional().describe("Results per page (default: 10)") },
      async ({ per_page }) => {
        const client = this.getClient();
        const checkouts = await client.listCheckouts(per_page);
        return { content: [{ type: "text", text: JSON.stringify(checkouts, null, 2) }] };
      }
    );

    this.server.tool(
      "expire_checkout",
      "Expire a pending Chargily Pay checkout, preventing further payment.",
      { id: z.string().describe("Checkout ID to expire") },
      async ({ id }) => {
        const client = this.getClient();
        const checkout = await client.expireCheckout(id);
        return { content: [{ type: "text", text: JSON.stringify(checkout, null, 2) }] };
      }
    );

    // ─── Payment Links ────────────────────────────────────────────────────────

    this.server.tool(
      "create_payment_link",
      "Create a reusable Chargily Pay payment link. Returns a shareable URL that generates a checkout when visited.",
      {
        name: z.string().describe("Internal label for this payment link (not shown to customers)"),
        items: z
          .array(
            z.object({
              price: z.string().describe("Price ID"),
              quantity: z.number().int().positive().describe("Quantity"),
              adjustable_quantity: z.boolean().optional().describe("Allow customer to adjust quantity"),
            })
          )
          .describe("Items to include in the payment link"),
        after_completion_message: z.string().optional().describe("Message shown to customer after payment"),
        locale: z.enum(["ar", "en", "fr"]).optional().describe("Page language"),
        pass_fees_to_customer: z.boolean().optional().describe("Pass Chargily fees to customer"),
        collect_shipping_address: z.boolean().optional().describe("Collect shipping address"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ name, items, after_completion_message, locale, pass_fees_to_customer, collect_shipping_address, metadata }) => {
        const client = this.getClient();
        const link = await client.createPaymentLink({
          name,
          items,
          after_completion_message,
          locale,
          pass_fees_to_customer,
          collect_shipping_address,
          metadata,
        });
        return { content: [{ type: "text", text: JSON.stringify(link, null, 2) }] };
      }
    );

    this.server.tool(
      "get_payment_link",
      "Retrieve a Chargily Pay payment link by ID.",
      { id: z.string().describe("Payment link ID") },
      async ({ id }) => {
        const client = this.getClient();
        const link = await client.getPaymentLink(id);
        return { content: [{ type: "text", text: JSON.stringify(link, null, 2) }] };
      }
    );

    this.server.tool(
      "update_payment_link",
      "Update an existing Chargily Pay payment link.",
      {
        id: z.string().describe("Payment link ID"),
        name: z.string().optional().describe("Internal label"),
        items: z
          .array(z.object({ price: z.string(), quantity: z.number().int().positive(), adjustable_quantity: z.boolean().optional() }))
          .optional()
          .describe("Updated items"),
        after_completion_message: z.string().optional().describe("Post-payment message"),
        locale: z.enum(["ar", "en", "fr"]).optional().describe("Page language"),
        pass_fees_to_customer: z.boolean().optional().describe("Pass fees to customer"),
        collect_shipping_address: z.boolean().optional().describe("Collect shipping address"),
        metadata: z.record(z.unknown()).optional().describe("Custom key-value pairs"),
      },
      async ({ id, ...params }) => {
        const client = this.getClient();
        const link = await client.updatePaymentLink(id, params);
        return { content: [{ type: "text", text: JSON.stringify(link, null, 2) }] };
      }
    );

    this.server.tool(
      "delete_payment_link",
      "Delete a Chargily Pay payment link by ID.",
      { id: z.string().describe("Payment link ID") },
      async ({ id }) => {
        const client = this.getClient();
        const result = await client.deletePaymentLink(id);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "list_payment_links",
      "List all payment links in your Chargily Pay account.",
      { per_page: z.number().int().min(1).max(100).optional().describe("Results per page (default: 10)") },
      async ({ per_page }) => {
        const client = this.getClient();
        const links = await client.listPaymentLinks(per_page);
        return { content: [{ type: "text", text: JSON.stringify(links, null, 2) }] };
      }
    );

    this.server.tool(
      "list_payment_link_checkouts",
      "List all checkouts generated from a specific payment link.",
      { id: z.string().describe("Payment link ID") },
      async ({ id }) => {
        const client = this.getClient();
        const checkouts = await client.listPaymentLinkCheckouts(id);
        return { content: [{ type: "text", text: JSON.stringify(checkouts, null, 2) }] };
      }
    );
  }
}

const mcpHandler = ChargilyMCP.serve("/chargily-mcp/mcp");

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/chargily-mcp/health") {
      return new Response(JSON.stringify({ status: "ok", service: "chargily-mcp" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (mcpHandler as any).fetch(request, env, ctx) as Promise<Response>;
  },
};
