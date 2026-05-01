import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Cache resolve-domain results for the lifetime of the worker. The
// hostname → api_url mapping rarely changes; a tiny in-process map
// keeps the public resolver out of the hot login path.
const _customDomainApiUrlCache = new Map<string, string>();

const RESOLVE_BASE_URL =
  process.env.NEXT_PUBLIC_RESOLVE_API || "https://api.echodesk.ge";

async function resolveCustomDomainApiUrl(hostname: string): Promise<string | null> {
  if (!hostname) return null;
  const cached = _customDomainApiUrlCache.get(hostname);
  if (cached) return cached;
  try {
    const res = await fetch(
      `${RESOLVE_BASE_URL}/api/public/resolve-domain/?domain=${encodeURIComponent(hostname)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { api_url?: string };
    if (data.api_url) {
      _customDomainApiUrlCache.set(hostname, data.api_url);
      return data.api_url;
    }
  } catch {
    // network / CORS / abort — fall through to the env-var default
  }
  return null;
}

// Get API URL from request hostname or env var. Async because custom
// domains have to be resolved through the public domain resolver
// (the same one middleware uses) — there's no pattern to derive
// `groot.api.echodesk.ge` from `refurb.ge` locally.
async function getApiUrl(request?: Request): Promise<string> {
  if (request) {
    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      // Pattern: {schema}.ecommerce.echodesk.ge → {schema}.api.echodesk.ge
      if (hostname.includes(".ecommerce.echodesk.ge")) {
        const schema = hostname.split(".")[0];
        return `https://${schema}.api.echodesk.ge`;
      }
      // Referer header as backup (NextAuth signs you in via /api/auth/...
      // so request.url's hostname is the host of the auth route, but the
      // referer carries the actual storefront origin).
      const referer = request.headers.get("referer");
      if (referer) {
        const refererUrl = new URL(referer);
        const refHost = refererUrl.hostname;
        if (refHost.includes(".ecommerce.echodesk.ge")) {
          const schema = refHost.split(".")[0];
          return `https://${schema}.api.echodesk.ge`;
        }
        // Custom-domain referer (e.g. refurb.ge) — resolve through the
        // public domain endpoint so login works on every tenant's own
        // domain, not just *.ecommerce.echodesk.ge.
        if (refHost && refHost !== "localhost" && !refHost.endsWith(".vercel.app")) {
          const resolved = await resolveCustomDomainApiUrl(refHost);
          if (resolved) return resolved;
        }
      }
      // No referer? Try the request hostname itself as a custom domain.
      if (hostname && hostname !== "localhost" && !hostname.endsWith(".vercel.app")) {
        const resolved = await resolveCustomDomainApiUrl(hostname);
        if (resolved) return resolved;
      }
    } catch {}
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  return "https://demo.api.echodesk.ge";
}

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone?: string;
    };
    accessToken: string;
    refreshToken: string;
  }

  interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    accessToken: string;
    refreshToken: string;
    apiUrl?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires?: number;
    apiUrl?: string;
  }
}

const config: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call the backend login API — derive API URL from request hostname
          const apiUrl = await getApiUrl(request as Request | undefined);

          const response = await fetch(`${apiUrl}/api/ecommerce/clients/login/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();

          if (data.access && data.client) {
            // Return user object that will be saved in JWT
            const user = {
              id: String(data.client.id),
              email: data.client.email,
              first_name: data.client.first_name,
              last_name: data.client.last_name,
              phone: data.client.phone,
              accessToken: data.access,
              refreshToken: data.refresh,
              apiUrl: apiUrl,
            };
            return user;
          }

          return null;
        } catch (error) {
          console.error("[NextAuth] Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.phone = user.phone;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.apiUrl = user.apiUrl;
        // Set token expiration (JWT tokens typically expire in 1 hour)
        token.accessTokenExpires = Date.now() + 60 * 60 * 1000;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Send properties to the client
      // Module augmentation merges with AdapterUser which requires extra fields;
      // at runtime only our custom fields are needed on the client
      session.user = {
        id: token.id,
        email: token.email,
        first_name: token.first_name,
        last_name: token.last_name,
        phone: token.phone,
      } as typeof session.user;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function refreshAccessToken(token: any) {
  try {
    // `token.apiUrl` was captured at sign-in and pinned to the right
    // tenant; only fall through to the resolver if for some reason
    // the token was minted before that field existed (legacy session).
    const apiUrl = token.apiUrl || (await getApiUrl());
    const response = await fetch(`${apiUrl}/api/ecommerce/clients/refresh-token/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh: token.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const refreshedTokens = await response.json();

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 60 * 60 * 1000, // 1 hour
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);

    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(config);
