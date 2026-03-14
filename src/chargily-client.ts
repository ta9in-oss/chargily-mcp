const TEST_BASE_URL = "https://pay.chargily.net/test/api/v2";
const LIVE_BASE_URL = "https://pay.chargily.net/api/v2";

export interface ChargilyClientOptions {
  apiKey: string;
  mode?: "test" | "live";
}

export interface PaginatedResponse<T> {
  livemode: boolean;
  current_page: number;
  data: T[];
  first_page_url: string;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface Address {
  country?: string;
  state?: string;
  address?: string;
}

export interface Customer {
  id: string;
  entity: string;
  livemode: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  address: Address | null;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface CreateCustomerParams {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, unknown>;
}

export interface Product {
  id: string;
  entity: string;
  livemode: boolean;
  name: string;
  description: string | null;
  images: string[];
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface CreateProductParams {
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, unknown>;
}

export interface Price {
  id: string;
  entity: string;
  livemode: boolean;
  amount: number;
  currency: string;
  product_id: string;
  metadata: Record<string, unknown>;
  created_at: number;
  updated_at: number;
}

export interface CreatePriceParams {
  amount: number;
  currency: string;
  product_id: string;
  metadata?: Record<string, unknown>;
}

export interface CheckoutItem {
  price: string;
  quantity: number;
  adjustable_quantity?: boolean;
}

export interface Discount {
  type: "percentage" | "amount";
  value: number;
}

export interface Checkout {
  id: string;
  entity: string;
  livemode: boolean;
  amount: number;
  currency: string;
  fees: number;
  fees_on_merchant: number;
  fees_on_customer: number;
  chargily_pay_fees_allocation: string;
  status: "pending" | "processing" | "paid" | "failed" | "canceled";
  locale: string;
  description: string | null;
  success_url: string;
  failure_url: string | null;
  webhook_endpoint: string | null;
  payment_method: string | null;
  customer_id: string | null;
  invoice_id: string | null;
  payment_link_id: string | null;
  metadata: Record<string, unknown>;
  shipping_address: string | null;
  collect_shipping_address: boolean;
  discount: Discount | null;
  amount_without_discount: number | null;
  checkout_url: string;
  created_at: number;
  updated_at: number;
}

export interface CreateCheckoutParams {
  amount?: number;
  currency: string;
  success_url: string;
  items?: CheckoutItem[];
  failure_url?: string;
  webhook_endpoint?: string;
  customer_id?: string;
  description?: string;
  locale?: "ar" | "en" | "fr";
  chargily_pay_fees_allocation?: "customer" | "merchant" | "split";
  discount?: Discount;
  metadata?: Record<string, unknown>;
  collect_shipping_address?: boolean;
}

export interface PaymentLink {
  id: string;
  entity: string;
  livemode: boolean;
  name: string;
  active: boolean;
  after_completion_message: string | null;
  locale: string;
  pass_fees_to_customer: boolean;
  collect_shipping_address: boolean;
  metadata: Record<string, unknown>;
  url: string;
  created_at: number;
  updated_at: number;
}

export interface PaymentLinkItem {
  price: string;
  quantity: number;
  adjustable_quantity?: boolean;
}

export interface CreatePaymentLinkParams {
  name: string;
  items: PaymentLinkItem[];
  after_completion_message?: string;
  locale?: "ar" | "en" | "fr";
  pass_fees_to_customer?: boolean;
  collect_shipping_address?: boolean;
  metadata?: Record<string, unknown>;
}

export interface Balance {
  entity: string;
  livemode: boolean;
  wallets: Array<{
    currency: string;
    balance: number;
    ready_for_payout: number;
    on_hold: number;
  }>;
}

export class ChargilyClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor({ apiKey, mode = "test" }: ChargilyClientOptions) {
    this.apiKey = apiKey;
    this.baseUrl = mode === "live" ? LIVE_BASE_URL : TEST_BASE_URL;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await response.json() as T;

    if (!response.ok) {
      const err = data as { message?: string };
      throw new Error(err.message ?? `HTTP ${response.status}`);
    }

    return data;
  }

  // Balance
  getBalance() {
    return this.request<Balance>("GET", "/balance");
  }

  // Customers
  createCustomer(params: CreateCustomerParams) {
    return this.request<Customer>("POST", "/customers", params);
  }

  getCustomer(id: string) {
    return this.request<Customer>("GET", `/customers/${id}`);
  }

  updateCustomer(id: string, params: Partial<CreateCustomerParams>) {
    return this.request<Customer>("POST", `/customers/${id}`, params);
  }

  deleteCustomer(id: string) {
    return this.request<{ message: string }>("DELETE", `/customers/${id}`);
  }

  listCustomers(perPage?: number) {
    const qs = perPage ? `?per_page=${perPage}` : "";
    return this.request<PaginatedResponse<Customer>>("GET", `/customers${qs}`);
  }

  // Products
  createProduct(params: CreateProductParams) {
    return this.request<Product>("POST", "/products", params);
  }

  getProduct(id: string) {
    return this.request<Product>("GET", `/products/${id}`);
  }

  updateProduct(id: string, params: Partial<CreateProductParams>) {
    return this.request<Product>("POST", `/products/${id}`, params);
  }

  deleteProduct(id: string) {
    return this.request<{ message: string }>("DELETE", `/products/${id}`);
  }

  listProducts(perPage?: number) {
    const qs = perPage ? `?per_page=${perPage}` : "";
    return this.request<PaginatedResponse<Product>>("GET", `/products${qs}`);
  }

  // Prices
  createPrice(params: CreatePriceParams) {
    return this.request<Price>("POST", "/prices", params);
  }

  getPrice(id: string) {
    return this.request<Price>("GET", `/prices/${id}`);
  }

  updatePrice(id: string, params: Partial<Omit<CreatePriceParams, "product_id">>) {
    return this.request<Price>("POST", `/prices/${id}`, params);
  }

  deletePrice(id: string) {
    return this.request<{ message: string }>("DELETE", `/prices/${id}`);
  }

  listPrices(perPage?: number) {
    const qs = perPage ? `?per_page=${perPage}` : "";
    return this.request<PaginatedResponse<Price>>("GET", `/prices${qs}`);
  }

  // Checkouts
  createCheckout(params: CreateCheckoutParams) {
    return this.request<Checkout>("POST", "/checkouts", params);
  }

  getCheckout(id: string) {
    return this.request<Checkout>("GET", `/checkouts/${id}`);
  }

  listCheckouts(perPage?: number) {
    const qs = perPage ? `?per_page=${perPage}` : "";
    return this.request<PaginatedResponse<Checkout>>("GET", `/checkouts${qs}`);
  }

  expireCheckout(id: string) {
    return this.request<Checkout>("POST", `/checkouts/${id}/expire`);
  }

  // Payment Links
  createPaymentLink(params: CreatePaymentLinkParams) {
    return this.request<PaymentLink>("POST", "/payment-links", params);
  }

  getPaymentLink(id: string) {
    return this.request<PaymentLink>("GET", `/payment-links/${id}`);
  }

  updatePaymentLink(id: string, params: Partial<CreatePaymentLinkParams>) {
    return this.request<PaymentLink>("POST", `/payment-links/${id}`, params);
  }

  deletePaymentLink(id: string) {
    return this.request<{ message: string }>("DELETE", `/payment-links/${id}`);
  }

  listPaymentLinks(perPage?: number) {
    const qs = perPage ? `?per_page=${perPage}` : "";
    return this.request<PaginatedResponse<PaymentLink>>(
      "GET",
      `/payment-links${qs}`
    );
  }

  listPaymentLinkCheckouts(id: string) {
    return this.request<PaginatedResponse<Checkout>>(
      "GET",
      `/payment-links/${id}/checkouts`
    );
  }
}
