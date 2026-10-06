import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SA_CITIES } from "@/lib/skinWeather/cities";
import { PLATFORMS, TIERS, type AudienceForm } from "@/lib/notificationAdmin";

interface Props {
  value: AudienceForm;
  onChange: (next: AudienceForm) => void;
  idPrefix?: string;
}

const toggle = (list: string[], item: string): string[] => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

const Tri = ({ id, label, value, onChange }: { id: string; label: string; value: AudienceForm["pushEnabled"]; onChange: (v: AudienceForm["pushEnabled"]) => void }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs">
      {label}
    </Label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as AudienceForm["pushEnabled"])} className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm">
      <option value="any">Any</option>
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  </div>
);

const Checks = ({ legend, items, selected, onToggle, idPrefix }: { legend: string; items: readonly { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void; idPrefix: string }) => (
  <fieldset className="space-y-1.5">
    <legend className="text-xs font-medium">{legend}</legend>
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <label key={item.value} className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
          <input type="checkbox" id={`${idPrefix}-${item.value}`} checked={selected.includes(item.value)} onChange={() => onToggle(item.value)} className="h-4 w-4" />
          {item.label}
        </label>
      ))}
    </div>
  </fieldset>
);

/** Every filter notification_audience_user_ids() understands. Leave all empty for every active member. */
const AudienceBuilder = ({ value, onChange, idPrefix = "aud" }: Props) => {
  const set = <K extends keyof AudienceForm>(key: K, v: AudienceForm[K]) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Checks legend="Plan" items={TIERS} selected={value.tiers} onToggle={(v) => set("tiers", toggle(value.tiers, v))} idPrefix={`${idPrefix}-tier`} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Tri id={`${idPrefix}-push`} label="Has a push device" value={value.pushEnabled} onChange={(v) => set("pushEnabled", v)} />
        <Tri id={`${idPrefix}-installed`} label="Installed the app" value={value.installed} onChange={(v) => set("installed", v)} />
        <Tri id={`${idPrefix}-founding`} label="Founding member" value={value.foundingMember} onChange={(v) => set("foundingMember", v)} />
      </div>
      <Checks
        legend="Device platform"
        items={PLATFORMS.map((p) => ({ value: p, label: p }))}
        selected={value.platforms}
        onToggle={(v) => set("platforms", toggle(value.platforms, v))}
        idPrefix={`${idPrefix}-platform`}
      />
      <Checks legend="Skin-weather city" items={SA_CITIES.map((c) => ({ value: c.key, label: c.label }))} selected={value.cities} onToggle={(v) => set("cities", toggle(value.cities, v))} idPrefix={`${idPrefix}-city`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-after`} className="text-xs">
            Signed up from
          </Label>
          <Input id={`${idPrefix}-after`} type="date" value={value.signedUpAfter} onChange={(e) => set("signedUpAfter", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-before`} className="text-xs">
            Signed up before
          </Label>
          <Input id={`${idPrefix}-before`} type="date" value={value.signedUpBefore} onChange={(e) => set("signedUpBefore", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-active`} className="text-xs">
            Active in last (days)
          </Label>
          <Input id={`${idPrefix}-active`} inputMode="numeric" value={value.activeWithinDays} onChange={(e) => set("activeWithinDays", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-inactive`} className="text-xs">
            Inactive for (days)
          </Label>
          <Input id={`${idPrefix}-inactive`} inputMode="numeric" value={value.inactiveForDays} onChange={(e) => set("inactiveForDays", e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-trial`} className="text-xs">
            Trial ends within (days)
          </Label>
          <Input id={`${idPrefix}-trial`} inputMode="numeric" value={value.trialEndsWithinDays} onChange={(e) => set("trialEndsWithinDays", e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>
    </div>
  );
};

export default AudienceBuilder;
