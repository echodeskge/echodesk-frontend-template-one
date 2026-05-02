import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Store tenant API URL set by TenantProvider
let _tenantApiUrl: string | null = null;

// Module-scoped flags used by the response interceptor to avoid
// concurrent / recursive refresh attempts and double-redirect storms.
// `refreshPromise` lets many in-flight 401'd requests share a single
// refresh call. `signedOutOnce` ensures the terminal-failure cleanup
// (clear tokens + signOut + redirect) runs at most once per page.
let refreshPromise: Promise<string> | null = null;
let signedOutOnce = false;

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
    // No tenant API URL set for custom domain — TenantProvider should handle this
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

      // API request logging removed for production safety

      // Get JWT token from localStorage (ecommerce client uses Bearer JWT)
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('ecommerce_access_token')
        : null;

      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Note: `Origin` is a browser-controlled header — manually setting
      // it triggers a "Refused to set unsafe header" warning and is a
      // no-op. The browser already sends it automatically based on the
      // page's URL. The backend reads request.META["HTTP_ORIGIN"] which
      // works fine without us touching it.

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

  // Response interceptor for error handling and token refresh.
  //
  // Refresh-loop safety:
  //   `_retry` flag prevents the same original request from triggering
  //   another refresh attempt after one has already happened on it.
  //   `isRefreshing` (module-scoped below) prevents *concurrent* refresh
  //   attempts from many in-flight requests landing 401 at once. The
  //   refresh-token URL is also skipped explicitly so a 401 on the
  //   refresh call itself can't re-enter this branch.
  //
  // On terminal refresh failure we have to wipe BOTH layers of session
  // state — localStorage *and* the NextAuth session cookie. Wiping
  // only localStorage left the cookie as a "phantom logged-in" signal
  // that the middleware would honour, redirecting /login → / on every
  // load and bouncing the visitor in an infinite loop.
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      const isRefreshCall = (originalRequest?.url || '').includes(
        '/refresh-token/',
      );

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isRefreshCall
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = typeof window !== 'undefined'
            ? localStorage.getItem('ecommerce_refresh_token')
            : null;

          if (!refreshToken) {
            // No refresh token at all → don't try to refresh, don't
            // wipe state (visitor was already a guest), just propagate
            // the 401 so the caller can decide what to do.
            return Promise.reject(error);
          }

          // Dedupe concurrent refreshes — many in-flight requests will
          // 401 simultaneously after a token expires; wait for one
          // shared refresh promise instead of firing N parallel ones.
          if (!refreshPromise) {
            refreshPromise = axios
              .post(
                `${getApiUrl()}/api/ecommerce/clients/refresh-token/`,
                { refresh: refreshToken },
              )
              .then((res) => res.data.access as string)
              .finally(() => {
                refreshPromise = null;
              });
          }
          const access = await refreshPromise;

          if (typeof window !== 'undefined') {
            localStorage.setItem('ecommerce_access_token', access);
          }

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed terminally — wipe both layers of session
          // state and bounce to /login exactly once. The flag stops
          // any other in-flight 401 handlers from also redirecting.
          if (typeof window !== 'undefined' && !signedOutOnce) {
            signedOutOnce = true;
            localStorage.removeItem('ecommerce_access_token');
            localStorage.removeItem('ecommerce_refresh_token');
            localStorage.removeItem('ecommerce_user');
            // Kill the NextAuth session cookie too — otherwise the
            // edge middleware reads it as "authenticated" and
            // redirects /login → / in a loop.
            try {
              const { signOut } = await import('next-auth/react');
              await signOut({ redirect: false });
            } catch {
              /* signOut import / call failed — non-fatal */
            }
            if (!window.location.pathname.includes('/login')) {
              window.location.replace('/login');
            }
          }
          return Promise.reject(refreshError);
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
