import { useCurrency, Currency } from "@/hooks/useCurrency";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const CurrencySelector = () => {
  const { currency, setCurrency, currencies, symbols } = useCurrency();

  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
      <SelectTrigger className="w-[80px] h-8 text-xs border-border">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c} value={c} className="text-xs">
            {symbols[c]} {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CurrencySelector;
