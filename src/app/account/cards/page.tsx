"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StoreLayout } from "@/components/layout/store-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ecommerceClientCardsRetrieve,
  ecommerceClientCardsAddCreate,
  ecommerceClientCardsDeleteDestroy,
  ecommerceClientCardsSetDefaultCreate,
} from "@/api/generated/api";
import { toast } from "sonner";
import {
  CreditCard,
  ChevronLeft,
  Plus,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";

interface PaymentCard {
  id: number;
  card_number: string;
  card_holder?: string;
  expiry_date?: string;
  card_type?: string;
  is_default: boolean;
  created_at?: string;
}

export default function CardsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();

  const [deleteCardId, setDeleteCardId] = useState<number | null>(null);

  // Fetch cards
  const { data: cardsData, isLoading: isCardsLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => ecommerceClientCardsRetrieve(),
    enabled: isAuthenticated,
  });

  // Add card mutation
  const addMutation = useMutation({
    mutationFn: ecommerceClientCardsAddCreate,
    onSuccess: (data) => {
      // API returns redirect URL for card registration
      if (data.redirect_url || data.url) {
        window.location.href = data.redirect_url || data.url;
      } else {
        queryClient.invalidateQueries({ queryKey: ["cards"] });
        toast.success(t("cards.cardAdded") || "Card addition initiated");
      }
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("cards.addFailed") || "Failed to add card";
      toast.error(message);
    },
  });

  // Delete card mutation
  const deleteMutation = useMutation({
    mutationFn: ecommerceClientCardsDeleteDestroy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success(t("cards.cardDeleted") || "Card deleted successfully");
      setDeleteCardId(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("cards.deleteFailed") || "Failed to delete card";
      toast.error(message);
    },
  });

  // Set default card mutation
  const setDefaultMutation = useMutation({
    mutationFn: ecommerceClientCardsSetDefaultCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      toast.success(t("cards.defaultSet") || "Default card updated");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || t("cards.setDefaultFailed") || "Failed to set default card";
      toast.error(message);
    },
  });

  const handleAddCard = () => {
    addMutation.mutate();
  };

  const handleDeleteCard = () => {
    if (deleteCardId) {
      deleteMutation.mutate(deleteCardId);
    }
  };

  const handleSetDefault = (cardId: number) => {
    setDefaultMutation.mutate(cardId);
  };

  // Mask card number for display
  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return "****";
    const last4 = cardNumber.slice(-4);
    return `**** **** **** ${last4}`;
  };

  // Get card brand icon/name
  const getCardBrand = (cardType?: string) => {
    if (!cardType) return "Card";
    const type = cardType.toLowerCase();
    if (type.includes("visa")) return "Visa";
    if (type.includes("master")) return "Mastercard";
    if (type.includes("amex")) return "Amex";
    return cardType;
  };

  if (isAuthLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const cards: PaymentCard[] = cardsData?.results || cardsData?.cards || cardsData || [];

  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/account">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("common.account") || "Back to Account"}
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <CreditCard className="h-8 w-8" />
                {t("cards.title") || "Payment Methods"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {cards.length} {t("cards.savedCards") || "saved cards"}
              </p>
            </div>
            <Button onClick={handleAddCard} disabled={addMutation.isPending}>
              {addMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {t("cards.addNew") || "Add New Card"}
            </Button>
          </div>
        </div>

        {/* Cards List */}
        {isCardsLoading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t("cards.noCards") || "No payment methods saved"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {t("cards.noCardsDesc") || "Add a payment method for faster checkout"}
              </p>
              <Button onClick={handleAddCard} disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {t("cards.addFirst") || "Add Your First Card"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cards.map((card) => (
              <Card key={card.id} className={card.is_default ? "border-primary" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {getCardBrand(card.card_type)}
                      {card.is_default && (
                        <Badge variant="default" className="ml-2">
                          {t("cards.default") || "Default"}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex gap-2">
                      {!card.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(card.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          <Star className="mr-1 h-4 w-4" />
                          {t("cards.setDefault") || "Set Default"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteCardId(card.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-mono text-lg">
                      {maskCardNumber(card.card_number)}
                    </p>
                    {card.card_holder && (
                      <p className="text-sm text-muted-foreground">
                        {card.card_holder}
                      </p>
                    )}
                    {card.expiry_date && (
                      <p className="text-sm text-muted-foreground">
                        {t("cards.expires") || "Expires"}: {card.expiry_date}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteCardId !== null}
          onOpenChange={(open) => !open && setDeleteCardId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("cards.deleteTitle") || "Delete Card?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("cards.deleteDesc") ||
                  "This action cannot be undone. This will permanently delete the payment method from your account."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                {t("common.cancel") || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCard}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.deleting") || "Deleting..."}
                  </>
                ) : (
                  t("common.delete") || "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </StoreLayout>
  );
}
