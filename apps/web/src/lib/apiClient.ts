import { v4 as uuidv4 } from 'uuid';

export interface Location {
  id: string;
  name: string;
  type: string;
  capacity?: number;
  createdAt: string;
}

export interface Item {
  id: string;
  sku: string;
  description?: string;
  uom: string;
  createdAt: string;
}

export interface StockEntry {
  locationId: string;
  locationName: string;
  itemId: string;
  itemSku: string;
  quantity: number;
  lastUpdated: string;
}

export interface InboundPayload {
  locationId: string;
  itemId: string;
  quantity: number;
  operatorId?: string;
  metadata?: Record<string, any>;
}

export interface TransferPayload {
  fromLocationId: string;
  toLocationId: string;
  itemId: string;
  quantity: number;
  operatorId?: string;
  metadata?: Record<string, any>;
}

class ApiClient {
  private baseUrl = '/api';

  async request<T>(
    method: string,
    path: string,
    body?: any,
    idempotencyKey?: string,
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  // Metadata endpoints
  async getLocations(): Promise<Location[]> {
    return this.request('GET', '/locations');
  }

  async getItems(): Promise<Item[]> {
    return this.request('GET', '/items');
  }

  async getStock(): Promise<any[]> {
    return this.request('GET', '/stock');
  }

  // Inventory operations
  async inbound(payload: InboundPayload): Promise<any> {
    const idempotencyKey = uuidv4();
    return this.request('POST', '/inventory/inbound', payload, idempotencyKey);
  }

  async transfer(payload: TransferPayload): Promise<any> {
    const idempotencyKey = uuidv4();
    return this.request('POST', '/inventory/transfer', payload, idempotencyKey);
  }

  // Health check
  async health(): Promise<any> {
    return this.request('GET', '/health');
  }
}

export const apiClient = new ApiClient();
