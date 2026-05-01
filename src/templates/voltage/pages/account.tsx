"use client";

/*
 * Voltage account page — bold accent header + sidebar nav with tabs:
 * orders / profile / addresses. Ported from the prototype's
 * `templates/echodesk/pages/account.jsx`. Real data via
 * `useOrders` + `useAddresses` + `useAuth`.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, User, MapPin, Heart, ArrowRight, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useOrders } from "@/hooks/use-orders";
import { useAddresses } from "@/hooks/use-addresses";
import { useLanguage } from "@/contexts/language-context";
import { Btn, Pill } from "../components";
import { useTranslate } from "../use-translate";

type TabId = "orders" | "profile" | "addresses";

export function VoltageAccountPage({ defaultTab = "orders" }: { defaultTab?: TabId }) {
  const t = useTranslate();
  const { getLocalizedValue } = useLanguage();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: ordersData, isLoading: ordersLoading } = useOrders();
  const { data: addressesData } = useAddresses();
  const [tab, setTab] = useState<TabId>(defaultTab);

  const orders = ordersData?.results || [];
  const addresses = addressesData?.results || [];
  const orderCount = orders.length;
  const lifetime = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);

  return (
    <div className="page-enter">
      {/* Accent header */}
      <section
        style={{
          background: "var(--accent)",
          color: "var(--accent-ink)",
          borderBottom: "1.5px solid var(--ink)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "32px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            {user?.email && (
              <Pill style={{ background: "var(--bg)", color: "var(--ink)" }}>
                {t("account.member", "Member")}
              </Pill>
            )}
            <h1
              className="display"
              style={{ fontSize: "clamp(48px, 7vw, 88px)", margin: "12px 0 0" }}
            >
              {t("account.hi", "Hi")},{" "}
              {user?.first_name || user?.email?.split("@")[0] || t("account.guest", "there")}.
            </h1>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <Stat n={String(orderCount)} l={t("account.orders", "orders")} />
            <Stat n={`${lifetime.toFixed(0)}₾`} l={t("account.lifetime", "lifetime")} />
            <Stat n={String(addresses.length)} l={t("account.addresses", "addresses")} />
          </div>
        </div>
      </section>

      <section
        className="pad-mobile-sm"
        data-resp="sidebar"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "32px 24px",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 32,
          alignItems: "flex-start",
        }}
      >
        {/* Sidebar nav */}
        <aside
          className="account-aside"
          style={{ position: "sticky", top: 90, display: "grid", gap: 4 }}
        >
          {(
            [
              { id: "orders" as const, label: t("account.orders", "Orders"), icon: <Package className="h-4 w-4" /> },
              { id: "profile" as const, label: t("account.profile", "Profile"), icon: <User className="h-4 w-4" /> },
              { id: "addresses" as const, label: t("account.addresses", "Addresses"), icon: <MapPin className="h-4 w-4" /> },
            ] as const
          ).map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setTab(row.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                border: 0,
                background: tab === row.id ? "var(--ink)" : "transparent",
                color: tab === row.id ? "var(--bg)" : "var(--ink)",
                textAlign: "left",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {row.icon} {row.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => router.push("/wishlist")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: 0,
              background: "transparent",
              color: "var(--ink)",
              textAlign: "left",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Heart className="h-4 w-4" /> {t("account.wishlist", "Wishlist")}
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1.5px solid var(--line)",
              background: "transparent",
              textAlign: "left",
              fontSize: 13,
              color: "var(--ink-soft)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >
            <LogOut className="h-4 w-4" /> {t("account.signOut", "Sign out")}
          </button>
        </aside>

        {/* Main */}
        <div>
          {tab === "orders" && (
            <div style={{ display: "grid", gap: 12 }}>
              {ordersLoading ? (
                <div style={{ padding: 80, textAlign: "center", opacity: 0.6 }}>
                  {t("account.loading", "Loading…")}
                </div>
              ) : orders.length === 0 ? (
                <div
                  style={{
                    padding: 60,
                    textAlign: "center",
                    border: "1.5px dashed var(--line)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <Package className="h-10 w-10 mx-auto" />
                  <div className="display" style={{ fontSize: 28, marginTop: 12 }}>
                    {t("account.noOrders", "No orders yet.")}
                  </div>
                  <Btn
                    variant="primary"
                    size="md"
                    iconRight={<ArrowRight className="h-4 w-4" />}
                    style={{ marginTop: 16 }}
                    onClick={() => router.push("/products")}
                  >
                    {t("account.startShopping", "Start shopping")}
                  </Btn>
                </div>
              ) : (
                orders.map((o) => {
                  const status = String(o.status || "");
                  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                    delivered: { bg: "var(--success)", color: "white", border: "var(--success)" },
                    shipped: { bg: "var(--accent)", color: "var(--accent-ink)", border: "var(--ink)" },
                    cancelled: { bg: "var(--muted)", color: "var(--ink)", border: "var(--ink)" },
                  };
                  const sc = statusColors[status] || { bg: "var(--accent)", color: "var(--accent-ink)", border: "var(--ink)" };
                  return (
                    <div
                      key={o.id}
                      style={{
                        background: "var(--card)",
                        border: "1.5px solid var(--line)",
                        borderRadius: "var(--radius)",
                        padding: 20,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 16,
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div className="mono" style={{ fontSize: 11, opacity: 0.6 }}>
                            #{o.order_number}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
                            {Number(o.total_amount || 0).toFixed(0)}₾ · {o.created_at?.split("T")[0]}
                          </div>
                        </div>
                        <Pill
                          style={{
                            background: sc.bg,
                            color: sc.color,
                            borderColor: sc.border,
                          }}
                        >
                          {status || t("account.statusPending", "Pending")}
                        </Pill>
                      </div>
                      {o.tracking_number && (
                        <div className="mono" style={{ fontSize: 12, opacity: 0.7 }}>
                          {t("account.tracking", "Tracking")}: {o.tracking_number}
                        </div>
                      )}
                      <div style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          onClick={() => router.push(`/order-confirmation?order_id=${o.id}`)}
                          style={{
                            background: "transparent",
                            border: 0,
                            color: "var(--ink)",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {t("account.viewOrder", "View order")} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "profile" && (
            <div
              style={{
                background: "var(--card)",
                border: "1.5px solid var(--line)",
                borderRadius: "var(--radius)",
                padding: 24,
              }}
            >
              <div className="display" style={{ fontSize: 28, marginBottom: 24 }}>
                {t("account.profileTitle", "Profile")}
              </div>
              <div style={{ display: "grid", gap: 16 }}>
                <ProfileRow label={t("account.firstName", "First name")} value={user?.first_name || "—"} />
                <ProfileRow label={t("account.lastName", "Last name")} value={user?.last_name || "—"} />
                <ProfileRow label={t("account.email", "Email")} value={user?.email || "—"} />
              </div>
              <div style={{ marginTop: 24 }}>
                <Btn variant="outline" size="md" onClick={() => router.push("/account/profile")}>
                  {t("account.edit", "Edit profile")}
                </Btn>
              </div>
            </div>
          )}

          {tab === "addresses" && (
            <div style={{ display: "grid", gap: 12 }}>
              {addresses.length === 0 ? (
                <div
                  style={{
                    padding: 60,
                    textAlign: "center",
                    border: "1.5px dashed var(--line)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  <MapPin className="h-10 w-10 mx-auto" />
                  <div className="display" style={{ fontSize: 28, marginTop: 12 }}>
                    {t("account.noAddresses", "No addresses yet.")}
                  </div>
                  <p style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>
                    {t("account.addressHint", "Add one at checkout — we'll save it for next time.")}
                  </p>
                </div>
              ) : (
                addresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      background: "var(--card)",
                      border: "1.5px solid var(--line)",
                      borderRadius: "var(--radius)",
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{a.label}</div>
                      {a.is_default && (
                        <Pill style={{ background: "var(--accent)" }}>
                          {t("account.default", "Default")}
                        </Pill>
                      )}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>
                      {a.address}, {a.city}
                      {a.country ? `, ${a.country}` : ""}
                    </div>
                    {a.extra_instructions && (
                      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                        {a.extra_instructions}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="display" style={{ fontSize: 32 }}>
        {n}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{l}</div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid var(--line)",
        fontSize: 14,
      }}
    >
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
