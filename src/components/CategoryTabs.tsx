import { cn } from "@/lib/utils";
import { categories } from "@/data/mockProducts";

interface CategoryTabsProps {
  active: string;
  onChange: (cat: string) => void;
}

const CategoryTabs = ({ active, onChange }: CategoryTabsProps) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: "none" }}>
    {categories.map((cat) => (
      <button
        key={cat}
        onClick={() => onChange(cat)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
          active === cat
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
        )}
      >
        {cat}
      </button>
    ))}
  </div>
);

export default CategoryTabs;
