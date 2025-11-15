export interface StoreConfig {
  tenant: {
    id: string;
    schema: string;
  };
  api: {
    url: string;
  };
  store: {
    name: string;
    description: string;
    logo: string;
  };
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  locale: {
    currency: string;
    currencySymbol: string;
    locale: string;
  };
  features: {
    wishlist: boolean;
    reviews: boolean;
    compare: boolean;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
}

// Get store configuration from environment variables
export function getStoreConfig(): StoreConfig {
  return {
    tenant: {
      id: process.env.NEXT_PUBLIC_TENANT_ID || "artlighthouse",
      schema: process.env.NEXT_PUBLIC_TENANT_SCHEMA || "artlighthouse",
    },
    api: {
      url: process.env.NEXT_PUBLIC_API_URL || "https://api.echodesk.ge",
    },
    store: {
      name: process.env.NEXT_PUBLIC_STORE_NAME || "My Store",
      description:
        process.env.NEXT_PUBLIC_STORE_DESCRIPTION || "Welcome to our store",
      logo: process.env.NEXT_PUBLIC_STORE_LOGO || "/logo.png",
    },
    theme: {
      primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "221 83% 53%",
      secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || "215 16% 47%",
      accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "221 83% 53%",
    },
    locale: {
      currency: process.env.NEXT_PUBLIC_CURRENCY || "GEL",
      currencySymbol: getCurrencySymbol(
        process.env.NEXT_PUBLIC_CURRENCY || "GEL"
      ),
      locale: process.env.NEXT_PUBLIC_LOCALE || "en",
    },
    features: {
      wishlist: process.env.NEXT_PUBLIC_ENABLE_WISHLIST === "true",
      reviews: process.env.NEXT_PUBLIC_ENABLE_REVIEWS === "true",
      compare: process.env.NEXT_PUBLIC_ENABLE_COMPARE === "true",
    },
    social: {
      facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
      instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
      twitter: process.env.NEXT_PUBLIC_TWITTER_URL || "",
    },
    contact: {
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
      phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
      address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "",
    },
  };
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    GEL: "₾",
    USD: "$",
    EUR: "€",
    GBP: "£",
    RUB: "₽",
  };
  return symbols[currency] || currency;
}

// Format price with currency
export function formatPrice(
  amount: number,
  currency: string = "GEL",
  locale: string = "en"
): string {
  const symbol = getCurrencySymbol(currency);

  // Format number based on locale
  const formattedNumber = new Intl.NumberFormat(
    locale === "ka" ? "ka-GE" : locale,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(amount);

  // Different currency placement based on locale
  if (locale === "ka" || locale === "ka-GE") {
    return `${formattedNumber} ${symbol}`;
  }

  return `${symbol}${formattedNumber}`;
}
