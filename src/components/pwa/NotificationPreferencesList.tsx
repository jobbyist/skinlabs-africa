import { Switch } from "@/components/ui/switch";
import { PREFERENCE_CATEGORIES, PREFERENCE_LABELS, type NotificationPreferences, type PreferenceCategory } from "@/lib/pwa/notificationManager";

interface Props {
  value: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Which categories to show (default: all ten). */
  categories?: readonly PreferenceCategory[];
  /** Show a plain-language example and "On by default" under each switch. */
  detailed?: boolean;
}

/** One labelled switch per notification category. Marketing ("promotional") is a plain, off-by-default opt-in. */
const NotificationPreferencesList = ({ value, onChange, disabled, idPrefix = "notif", categories = PREFERENCE_CATEGORIES, detailed = false }: Props) => (
  <ul className="divide-y divide-border rounded-xl border border-border">
    {categories.map((key) => {
      const id = `${idPrefix}-${key}`;
      const meta = PREFERENCE_LABELS[key];
      return (
        <li key={key} className="flex items-center justify-between gap-4 px-4 py-3">
          <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
            <span className="block text-sm font-medium">
              {meta.label}
              {detailed && meta.defaultOn && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 align-middle text-[10px] font-medium text-muted-foreground">On by default</span>}
            </span>
            <span className="block text-xs text-muted-foreground">{meta.description}</span>
            {detailed && <span className="mt-0.5 block text-xs italic text-muted-foreground">{meta.example}</span>}
          </label>
          <Switch id={id} checked={value[key]} disabled={disabled} onCheckedChange={(checked) => onChange({ ...value, [key]: checked })} />
        </li>
      );
    })}
  </ul>
);

export default NotificationPreferencesList;
