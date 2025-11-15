"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  ecommerceClientAddressesList,
  ecommerceClientAddressesCreate,
  ecommerceClientAddressesUpdate,
  ecommerceClientAddressesDestroy,
  ecommerceClientAddressesSetDefaultCreate,
} from "@/api/generated/api";
import type {
  ClientAddress,
  ClientAddressRequest,
} from "@/api/generated/interfaces";
import { toast } from "sonner";
import {
  MapPin,
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  Star,
  Loader2,
} from "lucide-react";

export default function AddressesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { t } = useLanguage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ClientAddress | null>(
    null
  );
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ClientAddressRequest>({
    label: "",
    address: "",
    city: "",
    extra_instructions: "",
    is_default: false,
  });

  // Fetch addresses
  const { data: addressesData, isLoading: isAddressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => ecommerceClientAddressesList(),
    enabled: isAuthenticated,
  });

  // Create address mutation
  const createMutation = useMutation({
    mutationFn: ecommerceClientAddressesCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success(t("addresses.addressAdded") || "Address added successfully");
      closeDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to add address";
      toast.error(message);
    },
  });

  // Update address mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientAddressRequest }) =>
      ecommerceClientAddressesUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success(
        t("addresses.addressUpdated") || "Address updated successfully"
      );
      closeDialog();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to update address";
      toast.error(message);
    },
  });

  // Delete address mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ecommerceClientAddressesDestroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success(
        t("addresses.addressDeleted") || "Address deleted successfully"
      );
      setDeleteAddressId(null);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to delete address";
      toast.error(message);
    },
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: (address: ClientAddress) =>
      ecommerceClientAddressesSetDefaultCreate(String(address.id), {
        label: address.label,
        address: address.address,
        city: address.city,
        extra_instructions: address.extra_instructions,
        is_default: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success(
        t("addresses.defaultSet") || "Default address updated"
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.detail || "Failed to set default address";
      toast.error(message);
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const openAddDialog = () => {
    setEditingAddress(null);
    setFormData({
      label: "",
      address: "",
      city: "",
      extra_instructions: "",
      is_default: false,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: ClientAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city,
      extra_instructions: address.extra_instructions || "",
      is_default: address.is_default || false,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setFormData({
      label: "",
      address: "",
      city: "",
      extra_instructions: "",
      is_default: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAddress) {
      updateMutation.mutate({
        id: String(editingAddress.id),
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isAuthLoading) {
    return (
      <StoreLayout>
        <div className="container py-8">
          <Skeleton className="mb-8 h-10 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <StoreLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/account">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("common.myAccount")}
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {t("addresses.title") || "My Addresses"}
              </h1>
              <p className="mt-1 text-muted-foreground">
                {addressesData?.count || 0}{" "}
                {t("addresses.savedAddresses") || "saved addresses"}
              </p>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addresses.addNew") || "Add New"}
            </Button>
          </div>
        </div>

        {/* Addresses Grid */}
        {isAddressesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : !addressesData?.results?.length ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-semibold">
                {t("addresses.noAddresses") || "No addresses saved"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {t("addresses.noAddressesDesc") ||
                  "Add your delivery addresses for faster checkout"}
              </p>
              <Button onClick={openAddDialog} className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                {t("addresses.addFirst") || "Add Your First Address"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {addressesData.results.map((address) => (
              <Card
                key={address.id}
                className={`relative ${
                  address.is_default ? "ring-2 ring-primary" : ""
                }`}
              >
                {address.is_default && (
                  <Badge className="absolute right-4 top-4 bg-primary">
                    <Star className="mr-1 h-3 w-3" />
                    {t("addresses.default") || "Default"}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    {address.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>{address.address}</p>
                    <p className="font-medium">{address.city}</p>
                    {address.extra_instructions && (
                      <p className="text-muted-foreground">
                        {address.extra_instructions}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(address)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      {t("common.edit") || "Edit"}
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(address)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        {t("addresses.setDefault") || "Set Default"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteAddressId(address.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress
                ? t("addresses.editAddress") || "Edit Address"
                : t("addresses.addAddress") || "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingAddress
                ? t("addresses.editAddressDesc") ||
                  "Update your delivery address details"
                : t("addresses.addAddressDesc") ||
                  "Add a new delivery address for your orders"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">
                  {t("addresses.label") || "Label"}
                </Label>
                <Input
                  id="label"
                  placeholder={
                    t("addresses.labelPlaceholder") || "e.g., Home, Office"
                  }
                  value={formData.label}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, label: e.target.value }))
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  {t("checkout.address") || "Address"}
                </Label>
                <Textarea
                  id="address"
                  placeholder={
                    t("addresses.addressPlaceholder") ||
                    "Full street address"
                  }
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">{t("checkout.city") || "City"}</Label>
                <Input
                  id="city"
                  placeholder={t("addresses.cityPlaceholder") || "City name"}
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="extra_instructions">
                  {t("addresses.extraInstructions") || "Extra Instructions"}
                </Label>
                <Textarea
                  id="extra_instructions"
                  placeholder={
                    t("addresses.extraInstructionsPlaceholder") ||
                    "Delivery instructions, landmarks, etc."
                  }
                  value={formData.extra_instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      extra_instructions: e.target.value,
                    }))
                  }
                  disabled={isSubmitting}
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_default: checked === true,
                    }))
                  }
                  disabled={isSubmitting}
                />
                <label htmlFor="is_default" className="text-sm">
                  {t("addresses.setAsDefault") || "Set as default address"}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                {t("common.cancel") || "Cancel"}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving") || "Saving..."}
                  </>
                ) : editingAddress ? (
                  t("common.save") || "Save Changes"
                ) : (
                  t("addresses.addAddress") || "Add Address"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteAddressId}
        onOpenChange={(open) => !open && setDeleteAddressId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("addresses.deleteTitle") || "Delete Address?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("addresses.deleteDesc") ||
                "This action cannot be undone. This will permanently delete the address from your account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("common.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteAddressId &&
                deleteMutation.mutate(String(deleteAddressId))
              }
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </StoreLayout>
  );
}
