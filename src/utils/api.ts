import { logger } from './logger';

interface RequestConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClient {
  private baseUrl: string;
  private defaultConfig: RequestConfig;

  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api'
      : '/api';
    
    this.defaultConfig = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      retries: 3,
      retryDelay: 1000,
    };
  }

  private async handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error: ApiError = new Error(data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  private async retryRequest(
    url: string,
    config: RequestConfig,
    retries: number
  ): Promise<any> {
    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        logger.warn(`API request failed, retrying... (${retries} attempts left)`, { url, error });
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
        return this.retryRequest(url, config, retries - 1);
      }
      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    if (!error.status) return true; // Network error
    return error.status >= 500 && error.status < 600;
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }

  public async request(endpoint: string, config: RequestConfig = {}): Promise<any> {
    const url = this.buildUrl(endpoint);
    const finalConfig = {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...this.defaultConfig.headers,
        ...config.headers,
      },
    };

    try {
      logger.debug('API request', { url, method: config.method || 'GET' });
      const response = await this.retryRequest(
        url,
        finalConfig,
        finalConfig.retries || 0
      );
      logger.debug('API response', { url, method: config.method || 'GET', response });
      return response;
    } catch (error: any) {
      logger.error('API request failed', {
        url,
        method: config.method || 'GET',
        error: error.message,
        status: error.status,
        data: error.data,
      });
      throw error;
    }
  }

  public async get(endpoint: string, config: RequestConfig = {}) {
    return this.request(endpoint, { ...config, method: 'GET' });
  }

  public async post(endpoint: string, data?: any, config: RequestConfig = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async put(endpoint: string, data?: any, config: RequestConfig = {}) {
    return this.request(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async delete(endpoint: string, config: RequestConfig = {}) {
    return this.request(endpoint, { ...config, method: 'DELETE' });
  }
}

export const api = new ApiClient(); 