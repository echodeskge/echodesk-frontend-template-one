import { redirect } from "next/navigation";

export default function SalePage() {
  redirect("/products?on_sale=true");
}
