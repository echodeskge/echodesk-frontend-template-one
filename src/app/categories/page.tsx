import { StoreLayout } from "@/components/layout/store-layout";
import { fetchItemLists } from "@/lib/fetch-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const itemLists = await fetchItemLists(undefined, 60).catch(() => []);

  return (
    <StoreLayout>
      <div className="container py-16">
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
        {itemLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {itemLists.map((item) => (
              <Link
                key={item.id}
                href={`/products?item_list=${item.id}`}
                className="group block rounded-lg border bg-card p-6 text-card-foreground shadow-sm transition-colors hover:bg-accent"
              >
                {item.image && (
                  <div className="mb-4 aspect-square overflow-hidden rounded-md">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <h2 className="text-lg font-semibold">{item.name}</h2>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No categories available at the moment.
          </p>
        )}
      </div>
    </StoreLayout>
  );
}
