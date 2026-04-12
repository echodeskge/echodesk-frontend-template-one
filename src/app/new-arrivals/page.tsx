import { redirect } from "next/navigation";

export default function NewArrivalsPage() {
  redirect("/products?ordering=-created_at");
}
