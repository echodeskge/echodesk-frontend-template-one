"use client";

/*
 * Voltage checkout — single-page form with sticky summary, ported from
 * the prototype's bold layout. Handles both authenticated and guest
 * flows in one component:
 *
 *  - Authenticated: useCart() / useCartItems() + useCreateOrder().
 *  - Guest: localStorage `guest_cart` + ecommerceClientGuestCheckoutCreate.
 *
 * The single-page approach trades the prototype's 4-step accordion for
 * a faster path to checkout — visitors see all required fields at once
 * and can scan a glance whether they have everything filled in. The
 * Voltage typography + primitives carry the design language; the
 * functional fields are minimal so we keep the bundle small.
 */

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Loader2, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCart, useCartItems } from "@/hooks/use-cart";
import { useAddresses } from "@/hooks/use-addresses";
import { useCreateOrder } from "@/hooks/use-orders";
import { useHydratedGuestCart, useGuestCartMutations } from "@/hooks/use-guest-cart";
import { ecommerceClientGuestCheckoutCreate } from "@/api/generated/api";
import { toast } from "sonner";
import { Btn, Pill } from "../components";
import { useTranslate } from "../use-translate";

interface NormalizedItem {
  id: string;
  product_id: number;
  product_name: unknown;
  product_image: string | null;
  quantity: number;
  price: number;
  subtotal: number;
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

  // Guest-mode data
  const guestCart = useHydratedGuestCart();
  const guestMutations = useGuestCartMutations();

  // Form state
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [pay, setPay] = useState<"cod" | "card">("cod");
  const [submitting, setSubmitting] = useState(false);
  const [addressId, setAddressId] = useState<number | null>(null);

  // Default to the first saved address for authenticated visitors.
  const addresses = addressesData?.results || [];
  useEffect(() => {
    if (isAuthenticated && addresses.length > 0 && addressId === null) {
      const def = addresses.find((a: { is_default?: boolean }) => a.is_default) || addresses[0];
      setAddressId(def.id);
    }
  }, [isAuthenticated, addresses, addressId]);

  // Normalise items from either source so the rest of the page reads
  // one shape.
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
  const ship = subtotal > 99 ? 0 : 9;
  const total = subtotal + ship;

  // Bounce empty carts back to /cart so the guest doesn't sit on a
  // dead-end form.
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

  const handleSubmit = async () => {
    if (items.length === 0) return;

    if (isAuthenticated) {
      // Authenticated flow uses the saved-address + cart pipeline.
      if (!addressId) {
        toast.error(t("checkout.selectAddress", "Please select a delivery address."));
        return;
      }
      if (!cart?.id) return;
      setSubmitting(true);
      try {
        await createOrder.mutateAsync({
          cart_id: cart.id,
          delivery_address_id: addressId,
          payment_method: pay === "card" ? "card" : "cash_on_delivery",
          notes,
        } as Parameters<typeof createOrder.mutateAsync>[0]);
        // useCreateOrder's onSuccess invalidates cart + handles
        // payment_url redirect; falls through to the order page on its
        // own.
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Guest flow.
    if (!first || !last || !email || !address || !city) {
      toast.error(t("checkout.guestFieldsRequired", "Please fill in all required fields."));
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      toast.error(t("checkout.invalidEmail", "Please enter a valid email."));
      return;
    }

    setSubmitting(true);
    try {
      const result = (await ecommerceClientGuestCheckoutCreate({
        email,
        first_name: first,
        last_name: last,
        phone: phone || "",
        address: { address, city, label: "Delivery" },
        items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
        payment_method: pay === "card" ? "card" : "cash_on_delivery",
        notes: notes || undefined,
      })) as { id: number; public_token?: string; payment_url?: string };

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
        {/* Left — form */}
        <div style={{ display: "grid", gap: 20 }}>
          <h1
            className="display"
            style={{
              fontSize: "clamp(48px, 7vw, 96px)",
              margin: 0,
              lineHeight: 0.95,
            }}
          >
            {isAuthenticated
              ? t("checkout.almostYours", "Almost yours.")
              : t("checkout.hiThere", "Hi there.")}
          </h1>

          {/* Contact (guest only) */}
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

          {/* Delivery address */}
          <Card
            title={t("checkout.deliveryAddress", "Delivery address")}
            icon={<Truck className="h-4 w-4" />}
          >
            {isAuthenticated && addresses.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {addresses.map((a: { id: number; label?: string; address: string; city: string; is_default?: boolean }) => {
                  const active = addressId === a.id;
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
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.75 }}>
                        {a.address}, {a.city}
                      </div>
                    </button>
                  );
                })}
                <Link
                  href="/account/addresses"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    color: "var(--ink)",
                    marginTop: 4,
                  }}
                >
                  {t("checkout.manageAddresses", "Manage addresses")}
                </Link>
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
              </>
            )}
          </Card>

          {/* Payment */}
          <Card title={t("checkout.payment", "Payment")} icon={<Lock className="h-4 w-4" />}>
            <div style={{ display: "grid", gap: 10 }}>
              <PayOption
                checked={pay === "cod"}
                onClick={() => setPay("cod")}
                label={t("checkout.cashOnDelivery", "Cash on delivery")}
                hint={t("checkout.codHint", "Pay the courier in cash on arrival.")}
              />
              <PayOption
                checked={pay === "card"}
                onClick={() => setPay("card")}
                label={t("checkout.cardPayment", "Card · Bank of Georgia")}
                hint={t("checkout.cardHint", "Secure 3-D checkout — you'll be redirected to BOG.")}
              />
            </div>
          </Card>

          {/* Notes */}
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
                    <div style={{ fontSize: 11, opacity: 0.6 }}>
                      ×{it.quantity}
                    </div>
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
              label={t("cart.shipping", "Shipping")}
              value={ship === 0 ? t("cart.free", "FREE") : `${ship}₾`}
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

          <Btn
            variant="ink"
            size="lg"
            iconRight={
              submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )
            }
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            style={{ width: "100%" }}
          >
            {submitting
              ? t("checkout.placingOrder", "Placing order…")
              : t("checkout.placeOrder", "Place order")}
          </Btn>

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
              <ShieldCheck className="h-3 w-3" /> Secure
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <RefreshCw className="h-3 w-3" /> 30-day
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Truck className="h-3 w-3" /> Same-day
            </span>
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ---------- presentational helpers (kept inline; this file only) ---------- */

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
