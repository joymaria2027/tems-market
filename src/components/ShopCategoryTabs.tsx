import { cn } from "@/lib/utils";

interface ShopCategoryTabsProps {
  categories: { id: string; name: string; slug: string }[];
  active: string;
  onChange: (slug: string) => void;
}

const ShopCategoryTabs = ({ categories, active, onChange }: ShopCategoryTabsProps) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
    <button
      onClick={() => onChange("all")}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
        active === "all"
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
      )}
    >
      All
    </button>
    {categories.map((cat) => (
      <button
        key={cat.id}
        onClick={() => onChange(cat.slug)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
          active === cat.slug
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
        )}
      >
        {cat.name}
      </button>
    ))}
  </div>
);

export default ShopCategoryTabs;
