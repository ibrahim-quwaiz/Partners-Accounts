import { useApp } from "@/lib/appContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function PeriodSelector() {
  const { activePeriod, setActivePeriod, periods } = useApp();

  if (!activePeriod) return null;

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">الفترة</Label>
      <Select
        value={activePeriod.id}
        onValueChange={(val) => {
          const per = periods.find((p) => p.id === val);
          if (per) setActivePeriod(per);
        }}
      >
        <SelectTrigger className="w-full bg-background font-medium text-start">
          <SelectValue placeholder="اختر الفترة" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((per) => (
            <SelectItem key={per.id} value={per.id}>
              {per.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
