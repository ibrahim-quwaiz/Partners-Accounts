import { useApp, MOCK_PROJECTS, MOCK_PERIODS } from "@/lib/appContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function ProjectSelector() {
  const { activeProject, setActiveProject } = useApp();

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Project</Label>
      <Select
        value={activeProject.id}
        onValueChange={(val) => {
          const proj = MOCK_PROJECTS.find((p) => p.id === val);
          if (proj) setActiveProject(proj);
        }}
      >
        <SelectTrigger className="w-full bg-background font-medium">
          <SelectValue placeholder="Select Project" />
        </SelectTrigger>
        <SelectContent>
          {MOCK_PROJECTS.map((proj) => (
            <SelectItem key={proj.id} value={proj.id}>
              {proj.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PeriodSelector() {
  const { activePeriod, setActivePeriod } = useApp();

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Period</Label>
      <Select
        value={activePeriod.id}
        onValueChange={(val) => {
          const per = MOCK_PERIODS.find((p) => p.id === val);
          if (per) setActivePeriod(per);
        }}
      >
        <SelectTrigger className="w-full bg-background font-medium">
          <SelectValue placeholder="Select Period" />
        </SelectTrigger>
        <SelectContent>
          {MOCK_PERIODS.map((per) => (
            <SelectItem key={per.id} value={per.id}>
              {per.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
