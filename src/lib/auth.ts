import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

// Get API URL - needs to work on server-side
const getApiUrl = (): string => {
  // Use environment variable (works on both client and server)
  return process.env.NEXT_PUBLIC_API_URL || "https://demo.api.echodesk.ge";
};

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
      async authorize(credentials) {
        console.log("[NextAuth] authorize() called with:", {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
        });

        if (!credentials?.email || !credentials?.password) {
          console.error("[NextAuth] Missing credentials");
          return null;
        }

        try {
          // Call the backend login API using fetch (works on server-side)
          const apiUrl = getApiUrl();
          console.log("[NextAuth] Calling API:", `${apiUrl}/api/ecommerce/clients/login/`);

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

          console.log("[NextAuth] API response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("[NextAuth] Login failed:", response.status, response.statusText, errorText);
            return null;
          }

          const data = await response.json();
          console.log("[NextAuth] API response data:", {
            hasAccess: !!data.access,
            hasClient: !!data.client,
          });

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
            };
            console.log("[NextAuth] Returning user:", { ...user, accessToken: "[REDACTED]", refreshToken: "[REDACTED]" });
            return user;
          }

          console.error("[NextAuth] No access token or client in response");
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
      session.user = {
        id: token.id,
        email: token.email,
        first_name: token.first_name,
        last_name: token.last_name,
        phone: token.phone,
      } as any;
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
    const apiUrl = getApiUrl();
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
