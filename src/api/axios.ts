import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Store tenant API URL set by TenantProvider
let _tenantApiUrl: string | null = null;

/**
 * Set the tenant API URL (called by TenantProvider on client-side)
 * This allows axios to use the correct API URL for the current tenant
 */
export function setTenantApiUrl(url: string): void {
  _tenantApiUrl = url;
}

/**
 * Get API URL - prioritizes tenant context, then env var, then hostname detection
 */
const getApiUrl = (): string => {
  // 1. Use tenant API URL if set by TenantProvider
  if (_tenantApiUrl) {
    return _tenantApiUrl;
  }

  // 2. Use environment variable
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    return apiUrl;
  }

  // 3. Fallback: derive from hostname (client-side only)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // On localhost, use demo as default tenant
    if (hostname.includes('localhost')) {
      return 'https://demo.api.echodesk.ge';
    }

    // For production ecommerce sites, derive from hostname
    // e.g., store.ecommerce.echodesk.ge -> store.api.echodesk.ge
    if (hostname.includes('.ecommerce.echodesk.ge')) {
      const subdomain = hostname.split('.')[0];
      return `https://${subdomain}.api.echodesk.ge`;
    }

    // For custom domains, we can't derive API URL from hostname
    // The tenant context should have been set by TenantProvider
    console.warn('[Axios] No tenant API URL set for custom domain:', hostname);
  }

  // Default fallback to demo
  return 'https://demo.api.echodesk.ge';
};

// Create axios instance for ecommerce client
const createAxiosInstance = (baseURL?: string): AxiosInstance => {
  const instance = axios.create({
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Request interceptor to add JWT auth token and dynamic base URL
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Set dynamic base URL if not provided
      if (!config.baseURL && !baseURL) {
        config.baseURL = getApiUrl();
      } else if (baseURL) {
        config.baseURL = baseURL;
      }

      // Log API calls in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      }

      // Get JWT token from localStorage (ecommerce client uses Bearer JWT)
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('ecommerce_access_token')
        : null;

      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Add origin header for CORS
      if (typeof window !== 'undefined' && config.headers) {
        config.headers.Origin = window.location.origin;
      }

      // Remove default Content-Type for FormData requests
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type'];
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = typeof window !== 'undefined'
            ? localStorage.getItem('ecommerce_refresh_token')
            : null;

          if (refreshToken) {
            const response = await axios.post(
              `${getApiUrl()}/api/ecommerce/client/token/refresh/`,
              { refresh: refreshToken }
            );

            const { access } = response.data;

            if (typeof window !== 'undefined') {
              localStorage.setItem('ecommerce_access_token', access);
            }

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('ecommerce_access_token');
            localStorage.removeItem('ecommerce_refresh_token');
            localStorage.removeItem('ecommerce_user');

            // Redirect to login
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Default instance
const axiosInstance = createAxiosInstance();

export default axiosInstance;
export { createAxiosInstance, getApiUrl };
