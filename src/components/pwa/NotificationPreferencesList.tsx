import { Switch } from "@/components/ui/switch";
import { NOTIFICATION_CATEGORIES } from "@/lib/pwa/pushPayload";
import { PREFERENCE_LABELS, type NotificationPreferences } from "@/lib/pwa/notificationManager";

interface Props {
  value: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
  disabled?: boolean;
  idPrefix?: string;
}

/** One labelled switch per notification category. Marketing ("promotional") is a plain, off-by-default opt-in. */
const NotificationPreferencesList = ({ value, onChange, disabled, idPrefix = "notif" }: Props) => (
  <ul className="divide-y divide-border rounded-xl border border-border">
    {NOTIFICATION_CATEGORIES.map((key) => {
      const id = `${idPrefix}-${key}`;
      const meta = PREFERENCE_LABELS[key];
      return (
        <li key={key} className="flex items-center justify-between gap-4 px-4 py-3">
          <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
            <span className="block text-sm font-medium">{meta.label}</span>
            <span className="block text-xs text-muted-foreground">{meta.description}</span>
          </label>
          <Switch id={id} checked={value[key]} disabled={disabled} onCheckedChange={(checked) => onChange({ ...value, [key]: checked })} />
        </li>
      );
    })}
  </ul>
);

export default NotificationPreferencesList;
