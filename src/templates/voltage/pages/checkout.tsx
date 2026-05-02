"use client";

/*
 * Voltage checkout — three-step flow:
 *
 *   1. Address  (contact for guests + delivery address with map picker)
 *   2. Shipping (live Quickshipper courier quote — required for both auth + guest)
 *   3. Payment  (cash / card + notes + Place Order)
 *
 * The same component handles authenticated and guest visitors. The
 * difference is the data source for cart + addresses + the order
 * placement endpoint:
 *
 *   - Auth:  useCart / useCartItems / useAddresses / useCreateOrder
 *            POST /api/ecommerce/client/shipping/quote/ (cart_id, address_id)
 *   - Guest: useHydratedGuestCart  +  ecommerceClientGuestCheckoutCreate
 *            POST /api/ecommerce/client/shipping/quote-guest/ (items, lat/lng)
 *
 * Quickshipper requires lat/lng on the drop-off address, so the
 * checkout *always* shows the map picker (auth visitors who already
 * have lat/lng on a saved address skip it). Without a pin we can't
 * compute a real shipping price, so Step 2 stays disabled until the
 * pin is dropped.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Loader2,
  Truck,
  ShieldCheck,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCart, useCartItems } from "@/hooks/use-cart";
import { useAddresses, useCreateAddress } from "@/hooks/use-addresses";
import { useCreateOrder } from "@/hooks/use-orders";
import {
  useHydratedGuestCart,
  useGuestCartMutations,
} from "@/hooks/use-guest-cart";
import { ecommerceClientGuestCheckoutCreate, getStoreTheme } from "@/api/generated/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Btn, Pill } from "../components";
import { useTranslate } from "../use-translate";
import { AddressMapPicker } from "@/components/checkout/address-map-picker";
import { useStorefrontConfig } from "@/contexts/storefront-config-context";

interface NormalizedItem {
  id: string;
  product_id: number;
  product_name: unknown;
  product_image: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

interface CourierOption {
  provider_id: number;
  provider_name: string;
  provider_logo_url?: string | null;
  provider_fee_id: string | number;
  parcel_dimensions_id?: number;
  price: number;
  currency: string;
  display_name?: string | null;
  estimated_minutes?: number | null;
}

interface QuoteResponse {
  options?: CourierOption[];
  default_provider_fee_id?: string | number;
  price: number;
  provider_id?: number;
  provider_name: string;
  provider_fee_id?: string | number;
  parcel_dimensions_id?: number;
  display_name?: string | null;
}

const splitImage = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  return (
    raw
      .split(",")
      .map((s) => s.trim())
      .find((s) => s.startsWith("http://") || s.startsWith("https://")) || null
  );
};

type Step = 1 | 2 | 3;

interface SavedAddress {
  id: number;
  label?: string;
  address: string;
  city: string;
  is_default?: boolean;
  latitude?: string | null;
  longitude?: string | null;
}

export function VoltageCheckoutPage() {
  const router = useRouter();
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Auth-mode data
  const { data: cart } = useCart();
  const { data: cartData, isLoading: backendLoading } = useCartItems();
  const { data: addressesData } = useAddresses();
  const createOrder = useCreateOrder();
  const createAddress = useCreateAddress();

  // Guest-mode data
  const guestCart = useHydratedGuestCart();
  const guestMutations = useGuestCartMutations();

  // Theme/Quickshipper config
  const { data: themeData } = useQuery({
    queryKey: ["theme"],
    queryFn: () => getStoreTheme(),
    staleTime: 5 * 60 * 1000,
  });
  const quickshipperEnabled = Boolean(
    (themeData as { shipping?: { quickshipper_enabled?: boolean } } | undefined)
      ?.shipping?.quickshipper_enabled,
  );
  const paymentConfig = (themeData as { payment?: { enable_card_payment?: boolean; enable_cash_on_delivery?: boolean } } | undefined)?.payment;
  const showCard = paymentConfig?.enable_card_payment ?? true;
  const showCodTenant = paymentConfig?.enable_cash_on_delivery ?? true;

  // Pickup config from server-decided storefront config (set by the
  // SSR pass on the layout). Non-null = tenant offers pickup.
  const { pickup: pickupConfig } = useStorefrontConfig();

  // Step state
  const [step, setStep] = useState<Step>(1);

  // Delivery method — courier vs pickup. Default to courier when the
  // tenant has Quickshipper, pickup when only pickup is configured.
  const [deliveryMethod, setDeliveryMethod] = useState<"courier" | "pickup">(
    quickshipperEnabled ? "courier" : pickupConfig ? "pickup" : "courier",
  );

  // Step 1 state
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  // Auth: optional saved-address selection
  const [addressId, setAddressId] = useState<number | null>(null);
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Step 2 state
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);

  // Step 3 state — payment options gated on delivery method.
  // Pickup always allows cash (customer hands the cash over at the
  // shop counter). Courier always forbids cash. The tenant-level
  // `enable_cash_on_delivery` flag is now overridden by delivery
  // method since the cash-on-courier scenario it used to gate is
  // already rejected by the backend rule.
  const showCod = deliveryMethod === "pickup";
  void showCodTenant;
  const initialPay: "cod" | "card" = showCod ? "cod" : showCard ? "card" : "cod";
  const [pay, setPay] = useState<"cod" | "card">(initialPay);
  // If the visitor switches delivery method and their currently-selected
  // payment is no longer allowed, snap to the first allowed option.
  useEffect(() => {
    if (deliveryMethod === "courier" && pay === "cod") {
      setPay("card");
    }
  }, [deliveryMethod, pay]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addresses = (addressesData?.results || []) as SavedAddress[];
  useEffect(() => {
    if (isAuthenticated && addresses.length > 0 && addressId === null && !useNewAddress) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setAddressId(def.id);
    }
  }, [isAuthenticated, addresses, addressId, useNewAddress]);

  const items: NormalizedItem[] = useMemo(() => {
    if (isAuthenticated) {
      return (cartData?.results ?? []).map((it) => ({
        id: String(it.id),
        product_id: it.product?.id ?? 0,
        product_name: it.product?.name,
        product_image: it.product?.image ?? null,
        quantity: it.quantity || 0,
        price: Number(it.price_at_add || 0),
        subtotal: Number(it.price_at_add || 0) * (it.quantity || 0),
      }));
    }
    return guestCart.items.map((it) => ({
      id: it.id,
      product_id: it.product_id,
      product_name: it.name,
      product_image: it.image,
      quantity: it.quantity,
      price: it.price,
      subtotal: it.subtotal,
    }));
  }, [isAuthenticated, cartData, guestCart.items]);

  const isItemsLoading = isAuthenticated ? backendLoading : guestCart.isLoading;
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);

  // Bounce empty carts back to /cart, but only after hydration so we
  // don't redirect on the empty first render.
  useEffect(() => {
    if (!authLoading && !isItemsLoading && items.length === 0) {
      router.push("/cart");
    }
  }, [authLoading, isItemsLoading, items.length, router]);

  const localized = (val: unknown): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object")
      return getLocalizedValue(val as Record<string, string>);
    return "";
  };

  // Effective lat/lng — either from the picker (new address) or from a
  // saved address row (auth flow). We need both to know whether Step 2
  // can fetch a quote.
  const selectedSavedAddress = addresses.find((a) => a.id === addressId) || null;
  const effectiveLat = useNewAddress || !isAuthenticated
    ? pinLat
    : selectedSavedAddress?.latitude
    ? Number(selectedSavedAddress.latitude)
    : null;
  const effectiveLng = useNewAddress || !isAuthenticated
    ? pinLng
    : selectedSavedAddress?.longitude
    ? Number(selectedSavedAddress.longitude)
    : null;
  const effectiveStreet = useNewAddress || !isAuthenticated
    ? address
    : selectedSavedAddress?.address || "";
  const effectiveCity = useNewAddress || !isAuthenticated
    ? city
    : selectedSavedAddress?.city || "";

  // ---------- Step 2 — Quickshipper quote ----------
  // Pickup orders skip the courier quote entirely — there's no
  // courier to price and shipping is free.

  const quoteEnabled =
    step >= 2 &&
    deliveryMethod === "courier" &&
    quickshipperEnabled &&
    items.length > 0 &&
    typeof effectiveLat === "number" &&
    typeof effectiveLng === "number" &&
    !!effectiveStreet &&
    !!effectiveCity;

  const {
    data: quote,
    isLoading: quoteLoading,
    isError: quoteIsError,
    error: quoteError,
    refetch: refetchQuote,
  } = useQuery<QuoteResponse, { response?: { data?: { error?: string } } }>({
    queryKey: [
      "voltage-quote",
      isAuthenticated ? "auth" : "guest",
      isAuthenticated ? cart?.id : null,
      isAuthenticated ? addressId : null,
      effectiveLat,
      effectiveLng,
      effectiveStreet,
      effectiveCity,
      items.map((it) => `${it.product_id}:${it.quantity}`).join(","),
    ],
    queryFn: async () => {
      const { default: axios } = await import("@/api/axios");
      if (isAuthenticated && cart?.id && addressId && !useNewAddress) {
        const res = await axios.post("/api/ecommerce/client/shipping/quote/", {
          cart_id: cart.id,
          delivery_address_id: addressId,
        });
        return res.data;
      }
      // Guest path — also auth path when the visitor is filling a new
      // address that isn't saved as a ClientAddress yet.
      const res = await axios.post(
        "/api/ecommerce/client/shipping/quote-guest/",
        {
          items: items.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
          })),
          to_lat: effectiveLat,
          to_lng: effectiveLng,
          to_street: effectiveStreet,
          to_city: effectiveCity,
        },
      );
      return res.data;
    },
    enabled: quoteEnabled,
    retry: false,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (!quote || !quote.options || quote.options.length === 0) {
      setSelectedFeeId(null);
      return;
    }
    setSelectedFeeId((prev) => {
      if (prev && quote.options!.some((o) => String(o.provider_fee_id) === prev)) {
        return prev;
      }
      const def = quote.default_provider_fee_id ?? quote.options![0].provider_fee_id;
      return String(def);
    });
  }, [quote]);

  const selectedOption: CourierOption | null =
    (quote?.options || []).find(
      (o) => String(o.provider_fee_id) === selectedFeeId,
    ) || null;

  const shippingCost = deliveryMethod === "pickup"
    ? 0
    : (selectedOption ? selectedOption.price : 0);
  const total = subtotal + shippingCost;

  // ---------- step gating ----------

  const step1Valid = (() => {
    if (items.length === 0) return false;
    // Pickup needs only contact info (guest only); no address, no map.
    if (deliveryMethod === "pickup") {
      if (!isAuthenticated && (!first || !last || !email)) return false;
      return true;
    }
    if (!quickshipperEnabled) {
      // Courier without Quickshipper: still need a deliverable address text.
      if (isAuthenticated && addressId && !useNewAddress) return true;
      return !!first && !!last && !!email && !!address && !!city;
    }
    // Quickshipper courier requires lat/lng.
    if (typeof effectiveLat !== "number" || typeof effectiveLng !== "number") return false;
    if (!effectiveStreet || !effectiveCity) return false;
    if (!isAuthenticated) {
      if (!first || !last || !email) return false;
    }
    return true;
  })();

  // Pickup needs no shipping decision — step 2 auto-validates.
  const step2Valid = deliveryMethod === "pickup"
    ? true
    : !quickshipperEnabled || (!!quote && !!selectedOption);

  // ---------- handlers ----------

  const goToStep2 = async () => {
    if (!step1Valid) {
      toast.error(
        t("checkout.fillStep1", "Please fill in your contact details and drop a pin on the map."),
      );
      return;
    }
    // Auth + new-address path on courier delivery: persist the new
    // address before quoting, since /shipping/quote/ needs a saved-address
    // row. Pickup orders don't need a saved address.
    if (deliveryMethod === "courier" && isAuthenticated && useNewAddress) {
      try {
        const result = await createAddress.mutateAsync({
          label: "Delivery",
          address,
          city,
          country: "",
          extra_instructions: "",
          is_default: addresses.length === 0,
          ...(pinLat != null && { latitude: pinLat.toFixed(6) }),
          ...(pinLng != null && { longitude: pinLng.toFixed(6) }),
        });
        setAddressId(result.id);
        setUseNewAddress(false);
      } catch {
        toast.error(t("checkout.addressSaveFailed", "Could not save the address. Try again."));
        return;
      }
    }
    // Pickup skips step 2 (no courier to pick) and jumps straight to
    // payment.
    setStep(deliveryMethod === "pickup" ? 3 : 2);
  };

  const goToStep3 = () => {
    if (!step2Valid) {
      toast.error(t("checkout.pickCourier", "Please select a courier first."));
      return;
    }
    setStep(3);
  };

  const placeOrder = async () => {
    if (!step1Valid || !step2Valid) return;
    setSubmitting(true);
    try {
      if (isAuthenticated) {
        if (!cart?.id) {
          toast.error(t("checkout.cartMissing", "Your cart is empty."));
          return;
        }
        // Pickup orders still need a delivery_address_id on the auth
        // flow because the Order model requires it. Reuse the
        // tenant's pickup address by sending no address — the
        // backend stamps delivery_method='pickup' so the booking
        // task ignores the address entirely.
        if (deliveryMethod === "courier" && !addressId) {
          toast.error(t("checkout.selectAddress", "Please select a delivery address."));
          return;
        }
        await createOrder.mutateAsync({
          cart_id: cart.id,
          delivery_address_id: addressId || addresses[0]?.id || 0,
          payment_method: pay === "card" ? "card" : "cash_on_delivery",
          notes,
          delivery_method: deliveryMethod,
          ...(deliveryMethod === "courier" && selectedOption && {
            quickshipper_provider_id: selectedOption.provider_id,
            quickshipper_provider_fee_id: String(selectedOption.provider_fee_id),
            quickshipper_provider_name: selectedOption.provider_name,
            quickshipper_parcel_dimensions_id: selectedOption.parcel_dimensions_id,
            quickshipper_price: selectedOption.price,
          }),
        } as Parameters<typeof createOrder.mutateAsync>[0]);
        return;
      }

      // Guest flow.
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(email)) {
        toast.error(t("checkout.invalidEmail", "Please enter a valid email."));
        return;
      }
      // Pickup orders use the store's pickup address as the delivery
      // address (the order needs *some* address but the courier won't
      // use it). Courier orders use what the visitor entered.
      const addressBlock = deliveryMethod === "pickup"
        ? {
            address: pickupConfig?.address || "Store pickup",
            city: pickupConfig?.city || "",
            label: "Pickup",
          }
        : {
            address,
            city,
            label: "Delivery",
            ...(pinLat != null && { latitude: pinLat.toFixed(6) }),
            ...(pinLng != null && { longitude: pinLng.toFixed(6) }),
          };
      const result = (await ecommerceClientGuestCheckoutCreate({
        email,
        first_name: first,
        last_name: last,
        phone: phone || "",
        address: addressBlock,
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
        payment_method: pay === "card" ? "card" : "cash_on_delivery",
        notes: notes || undefined,
        delivery_method: deliveryMethod,
        ...(deliveryMethod === "courier" && selectedOption && {
          quickshipper_provider_id: selectedOption.provider_id,
          quickshipper_provider_fee_id: String(selectedOption.provider_fee_id),
          quickshipper_provider_name: selectedOption.provider_name,
          quickshipper_parcel_dimensions_id: selectedOption.parcel_dimensions_id,
          quickshipper_price: selectedOption.price,
        }),
      } as Parameters<typeof ecommerceClientGuestCheckoutCreate>[0])) as {
        id: number;
        public_token?: string;
        payment_url?: string;
      };

      if (result.payment_url) {
        guestMutations.clear();
        window.location.href = result.payment_url;
        return;
      }
      const tokenParam = result.public_token
        ? `&token=${encodeURIComponent(result.public_token)}`
        : "";
      guestMutations.clear();
      router.push(`/order-confirmation?order_id=${result.id}${tokenParam}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string; error?: string } } };
      toast.error(
        e.response?.data?.detail ||
          e.response?.data?.error ||
          t("checkout.guestCheckoutFailed", "Checkout failed. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- render ----------

  return (
    <div className="page-enter">
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.6 }}>
          <Link href="/cart" style={{ color: "inherit" }}>
            {t("cart.title", "Cart")}
          </Link>{" "}
          / <strong>{t("checkout.title", "Checkout")}</strong>
        </div>
      </div>

      <section
        className="pad-mobile"
        data-resp="split"
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "24px 24px 80px",
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Left — stepped form */}
        <div style={{ display: "grid", gap: 20 }}>
          <h1
            className="display"
            style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              margin: 0,
              lineHeight: 0.95,
            }}
          >
            {isAuthenticated
              ? t("checkout.almostYours", "Almost yours.")
              : t("checkout.hiThere", "Hi there.")}
          </h1>

          <Stepper
            step={step}
            labels={[
              t("checkout.stepAddress", "Address"),
              t("checkout.stepShipping", "Shipping"),
              t("checkout.stepPayment", "Payment"),
            ]}
            onJump={(to) => {
              // Only allow jumping back, not forward without validation.
              if (to <= step) setStep(to);
            }}
          />

          {step === 1 && (
            <>
              {/* Delivery method picker — only renders when both
                  options exist. If only courier (no pickup configured)
                  or only pickup, the choice is implicit. */}
              {pickupConfig && quickshipperEnabled && (
                <Card
                  title={t("checkout.howToReceive", "How would you like to receive it?")}
                  icon={<Truck className="h-4 w-4" />}
                >
                  <div style={{ display: "grid", gap: 10 }}>
                    <PayOption
                      checked={deliveryMethod === "courier"}
                      onClick={() => setDeliveryMethod("courier")}
                      label={t("checkout.courier", "Courier delivery")}
                      hint={t(
                        "checkout.courierHint",
                        "Same-day Tbilisi · price calculated next step",
                      )}
                    />
                    <PayOption
                      checked={deliveryMethod === "pickup"}
                      onClick={() => setDeliveryMethod("pickup")}
                      label={t("checkout.pickup", "Pickup at store — Free")}
                      hint={`${pickupConfig.address}, ${pickupConfig.city}`}
                    />
                  </div>
                </Card>
              )}

              {!isAuthenticated && (
                <Card title={t("checkout.contact", "Contact")}>
                  <Row>
                    <Field
                      label={t("checkout.firstName", "First name")}
                      value={first}
                      onChange={setFirst}
                      required
                    />
                    <Field
                      label={t("checkout.lastName", "Last name")}
                      value={last}
                      onChange={setLast}
                      required
                    />
                  </Row>
                  <Field
                    label={t("checkout.email", "Email")}
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@email.com"
                    required
                  />
                  <Field
                    label={t("checkout.phone", "Phone")}
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+995 555 123 456"
                  />
                </Card>
              )}

              {deliveryMethod === "pickup" && pickupConfig && (
                <Card
                  title={t("checkout.pickupAddress", "Pickup at")}
                  icon={<Truck className="h-4 w-4" />}
                >
                  <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                    {pickupConfig.contactName && (
                      <div style={{ fontWeight: 700 }}>{pickupConfig.contactName}</div>
                    )}
                    <div>{pickupConfig.address}</div>
                    <div>{pickupConfig.city}</div>
                    {pickupConfig.phone && (
                      <div style={{ opacity: 0.7, marginTop: 4 }}>
                        {t("checkout.phone", "Phone")}: {pickupConfig.phone}
                      </div>
                    )}
                    {pickupConfig.extraInstructions && (
                      <div
                        style={{
                          opacity: 0.7,
                          marginTop: 8,
                          fontSize: 12,
                          fontStyle: "italic",
                        }}
                      >
                        {pickupConfig.extraInstructions}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {deliveryMethod === "courier" && (
              <Card
                title={t("checkout.deliveryAddress", "Delivery address")}
                icon={<Truck className="h-4 w-4" />}
              >
                {isAuthenticated && addresses.length > 0 && !useNewAddress ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {addresses.map((a) => {
                      const active = addressId === a.id;
                      const hasPin = a.latitude != null && a.longitude != null;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAddressId(a.id)}
                          style={{
                            textAlign: "left",
                            padding: 14,
                            background: active ? "var(--muted)" : "var(--card)",
                            border: `1.5px solid ${active ? "var(--ink)" : "var(--line)"}`,
                            borderRadius: "var(--radius)",
                            cursor: "pointer",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>{a.label || "Address"}</span>
                            {a.is_default && (
                              <Pill style={{ background: "var(--muted)", fontSize: 10 }}>
                                {t("account.default", "Default")}
                              </Pill>
                            )}
                            {quickshipperEnabled && !hasPin && (
                              <Pill style={{ background: "#ffefa8", fontSize: 10 }}>
                                {t("checkout.pinMissing", "Pin missing")}
                              </Pill>
                            )}
                          </div>
                          <div style={{ fontSize: 13, opacity: 0.75 }}>
                            {a.address}, {a.city}
                          </div>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        setUseNewAddress(true);
                        setAddressId(null);
                      }}
                      style={{
                        textAlign: "left",
                        padding: 14,
                        background: "transparent",
                        border: "1.5px dashed var(--line)",
                        borderRadius: "var(--radius)",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      + {t("checkout.addNewAddress", "Add a new address")}
                    </button>
                  </div>
                ) : (
                  <>
                    <Field
                      label={t("addresses.address", "Address")}
                      value={address}
                      onChange={setAddress}
                      placeholder={t("addresses.addressPlaceholder", "Street, building, apt")}
                      required
                    />
                    <Field
                      label={t("addresses.city", "City")}
                      value={city}
                      onChange={setCity}
                      placeholder={t("addresses.cityPlaceholder", "Tbilisi")}
                      required
                    />
                    {quickshipperEnabled && (
                      <div style={{ marginTop: 4 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            marginBottom: 6,
                          }}
                        >
                          {t("checkout.dropPin", "Drop a pin on the delivery point")}
                          <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>
                        </div>
                        <AddressMapPicker
                          latitude={pinLat}
                          longitude={pinLng}
                          onChange={(lat, lng) => {
                            setPinLat(lat);
                            setPinLng(lng);
                          }}
                          heightPx={280}
                          helperText={
                            pinLat == null
                              ? t(
                                  "checkout.dropPinHelp",
                                  "Click the map to mark exactly where the courier should deliver.",
                                )
                              : t(
                                  "checkout.dropPinSet",
                                  "Click again or drag to refine the spot.",
                                )
                          }
                        />
                      </div>
                    )}
                    {isAuthenticated && addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUseNewAddress(false);
                          const def = addresses.find((a) => a.is_default) || addresses[0];
                          setAddressId(def.id);
                        }}
                        style={{
                          marginTop: 4,
                          padding: 0,
                          background: "transparent",
                          border: 0,
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                          color: "var(--ink)",
                          cursor: "pointer",
                        }}
                      >
                        ← {t("checkout.useSavedAddress", "Use a saved address")}
                      </button>
                    )}
                  </>
                )}
              </Card>
              )}

              <Btn
                variant="ink"
                size="lg"
                iconRight={
                  createAddress.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-5 w-5" />
                  )
                }
                onClick={goToStep2}
                disabled={!step1Valid || createAddress.isPending}
                style={{ alignSelf: "flex-start" }}
              >
                {deliveryMethod === "pickup"
                  ? t("checkout.continueToPayment", "Continue to payment")
                  : t("checkout.continueToShipping", "Continue to shipping")}
              </Btn>
            </>
          )}

          {step === 2 && (
            <>
              <Card
                title={t("checkout.shippingMethod", "Pick a courier")}
                icon={<Truck className="h-4 w-4" />}
              >
                {!quickshipperEnabled && (
                  <div style={{ fontSize: 14, opacity: 0.7 }}>
                    {t(
                      "checkout.shippingNotConfigured",
                      "The store hasn't configured live couriers yet — your order will ship with the merchant's default shipping method.",
                    )}
                  </div>
                )}
                {quickshipperEnabled && quoteLoading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 14,
                      opacity: 0.7,
                    }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("checkout.fetchingQuote", "Fetching live courier prices…")}
                  </div>
                )}
                {quickshipperEnabled && quoteIsError && (
                  <div
                    style={{
                      padding: 14,
                      background: "#fff4f4",
                      border: "1.5px solid #f3b2b2",
                      borderRadius: "var(--radius-sm)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {t("checkout.quoteFailed", "Couldn't get a courier quote")}
                      </div>
                      <div style={{ opacity: 0.7 }}>
                        {quoteError?.response?.data?.error ||
                          t(
                            "checkout.quoteFailedHint",
                            "Try a different address, refine the pin, or try again.",
                          )}
                      </div>
                      <button
                        type="button"
                        onClick={() => refetchQuote()}
                        style={{
                          marginTop: 8,
                          padding: "6px 12px",
                          background: "var(--ink)",
                          color: "var(--bg)",
                          border: 0,
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {t("checkout.retry", "Retry")}
                      </button>
                    </div>
                  </div>
                )}
                {quickshipperEnabled && quote && quote.options && quote.options.length > 0 && (
                  <div style={{ display: "grid", gap: 10 }}>
                    {quote.options.map((o) => {
                      const fid = String(o.provider_fee_id);
                      const active = fid === selectedFeeId;
                      const eta = o.estimated_minutes
                        ? `${o.estimated_minutes} ${t("checkout.minutes", "min")}`
                        : null;
                      return (
                        <button
                          key={fid}
                          type="button"
                          onClick={() => setSelectedFeeId(fid)}
                          style={{
                            textAlign: "left",
                            padding: 14,
                            background: active ? "var(--muted)" : "var(--card)",
                            border: `1.5px solid ${active ? "var(--ink)" : "var(--line)"}`,
                            borderRadius: "var(--radius)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 999,
                              border: "1.5px solid var(--ink)",
                              display: "grid",
                              placeItems: "center",
                              background: "var(--card)",
                              flexShrink: 0,
                            }}
                          >
                            {active && (
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 999,
                                  background: "var(--ink)",
                                }}
                              />
                            )}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>
                              {o.provider_name}
                              {o.display_name ? ` · ${o.display_name}` : ""}
                            </div>
                            {eta && (
                              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                                ~{eta}
                              </div>
                            )}
                          </div>
                          <div className="display" style={{ fontSize: 18 }}>
                            {o.price.toFixed(0)}{o.currency === "GEL" ? "₾" : ` ${o.currency}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              <div style={{ display: "flex", gap: 10 }}>
                <Btn
                  variant="ghost"
                  size="lg"
                  icon={<ArrowLeft className="h-5 w-5" />}
                  onClick={() => setStep(1)}
                >
                  {t("checkout.back", "Back")}
                </Btn>
                <Btn
                  variant="ink"
                  size="lg"
                  iconRight={<ArrowRight className="h-5 w-5" />}
                  onClick={goToStep3}
                  disabled={!step2Valid}
                >
                  {t("checkout.continueToPayment", "Continue to payment")}
                </Btn>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <Card title={t("checkout.payment", "Payment")} icon={<Lock className="h-4 w-4" />}>
                <div style={{ display: "grid", gap: 10 }}>
                  {showCod && (
                    <PayOption
                      checked={pay === "cod"}
                      onClick={() => setPay("cod")}
                      label={t("checkout.cashOnDelivery", "Cash on delivery")}
                      hint={t("checkout.codHint", "Pay the courier in cash on arrival.")}
                    />
                  )}
                  {showCard && (
                    <PayOption
                      checked={pay === "card"}
                      onClick={() => setPay("card")}
                      label={t("checkout.cardPayment", "Card · Bank of Georgia")}
                      hint={t(
                        "checkout.cardHint",
                        "Secure 3-D checkout — you'll be redirected to BOG.",
                      )}
                    />
                  )}
                </div>
              </Card>

              <Card title={t("checkout.notes", "Order notes")}>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("checkout.notesPlaceholder", "Anything we should know?")}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--card)",
                    border: "1.5px solid var(--line)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 14,
                    fontFamily: "inherit",
                    resize: "vertical",
                    outline: "none",
                    color: "var(--ink)",
                  }}
                />
              </Card>

              <div style={{ display: "flex", gap: 10 }}>
                <Btn
                  variant="ghost"
                  size="lg"
                  icon={<ArrowLeft className="h-5 w-5" />}
                  onClick={() => setStep(deliveryMethod === "pickup" ? 1 : 2)}
                >
                  {t("checkout.back", "Back")}
                </Btn>
                <Btn
                  variant="ink"
                  size="lg"
                  iconRight={
                    submitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )
                  }
                  onClick={placeOrder}
                  disabled={submitting || items.length === 0}
                >
                  {submitting
                    ? t("checkout.placingOrder", "Placing order…")
                    : t("checkout.placeOrder", "Place order")}
                </Btn>
              </div>
            </>
          )}
        </div>

        {/* Right — sticky summary */}
        <aside
          style={{
            position: "sticky",
            top: 90,
            padding: 24,
            background: "var(--muted)",
            border: "1.5px solid var(--ink)",
            borderRadius: "var(--radius)",
            display: "grid",
            gap: 20,
          }}
        >
          <div className="display" style={{ fontSize: 28 }}>
            {t("cart.summary", "Summary")}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {items.map((it) => {
              const name = localized(it.product_name);
              const imgSrc = splitImage(it.product_image);
              return (
                <div
                  key={it.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px 1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 56,
                      height: 56,
                      background: "var(--bg)",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      border: "1.5px solid var(--line)",
                    }}
                  >
                    {imgSrc && (
                      <Image
                        src={imgSrc}
                        alt={name}
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {name}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>×{it.quantity}</div>
                  </div>
                  <div className="display" style={{ fontSize: 16 }}>
                    {it.subtotal.toFixed(0)}₾
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: "var(--line)" }} />

          <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
            <SummaryRow
              label={t("cart.subtotal", "Subtotal")}
              value={`${subtotal.toFixed(0)}₾`}
            />
            <SummaryRow
              label={
                deliveryMethod === "pickup"
                  ? t("checkout.pickup", "Pickup at store")
                  : t("cart.shipping", "Shipping")
              }
              value={
                deliveryMethod === "pickup"
                  ? t("cart.free", "FREE")
                  : selectedOption
                    ? `${shippingCost.toFixed(0)}₾`
                    : t("checkout.shippingPending", "Pick a courier")
              }
            />
          </div>

          <div style={{ height: 1.5, background: "var(--ink)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {t("cart.total", "Total")}
            </span>
            <span className="display" style={{ fontSize: 32 }}>
              {total.toFixed(0)}₾
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 8,
              fontSize: 11,
              opacity: 0.7,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <ShieldCheck className="h-3 w-3" /> {t("checkout.secure", "Secure")}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <RefreshCw className="h-3 w-3" /> {t("checkout.thirtyDay", "30-day")}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Truck className="h-3 w-3" /> {t("checkout.sameDay", "Same-day")}
            </span>
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ---------- presentational helpers (kept inline; this file only) ---------- */

function Stepper({
  step,
  labels,
  onJump,
}: {
  step: Step;
  labels: [string, string, string];
  onJump: (to: Step) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 4,
        padding: 4,
        background: "var(--muted)",
        border: "1.5px solid var(--line)",
        borderRadius: 999,
      }}
    >
      {([1, 2, 3] as Step[]).map((n) => {
        const active = n === step;
        const done = n < step;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onJump(n)}
            disabled={n > step}
            style={{
              padding: "8px 12px",
              border: 0,
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--bg)" : done ? "var(--ink)" : "var(--ink)",
              opacity: done || active ? 1 : 0.5,
              cursor: n <= step ? "pointer" : "default",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {done ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{n}.</span>
            )}
            {labels[n - 1]}
          </button>
        );
      })}
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 20,
        background: "var(--card)",
        border: "1.5px solid var(--line)",
        borderRadius: "var(--radius)",
        display: "grid",
        gap: 14,
      }}
    >
      <div
        className="display"
        style={{
          fontSize: 22,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>
        {label}
        {required && <span style={{ color: "var(--accent)", marginLeft: 4 }}>*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          padding: "12px 14px",
          background: "var(--card)",
          border: "1.5px solid var(--line)",
          borderRadius: "var(--radius-sm)",
          fontSize: 14,
          outline: "none",
          color: "var(--ink)",
          fontFamily: "inherit",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ink)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
      />
    </label>
  );
}

function PayOption({
  checked,
  onClick,
  label,
  hint,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: 14,
        background: checked ? "var(--muted)" : "var(--card)",
        border: `1.5px solid ${checked ? "var(--ink)" : "var(--line)"}`,
        borderRadius: "var(--radius)",
        cursor: "pointer",
        display: "grid",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 999,
            border: "1.5px solid var(--ink)",
            display: "grid",
            placeItems: "center",
            background: "var(--card)",
          }}
        >
          {checked && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "var(--ink)",
              }}
            />
          )}
        </span>
        {label}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, paddingLeft: 26 }}>{hint}</div>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
