import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

/**
 * Read-only inbox for every public form that writes to its own table. Each had an
 * admin SELECT policy but no screen, so leads were invisible outside SQL.
 * Admin-only by RLS; a non-admin simply gets zero rows.
 */
type Column = { key: string; label: string };
type Source = { table: string; label: string; title: string; subtitle: string[]; detail: Column[]; /** Read through an admin-gated RPC instead of the table (the table only holds user ids). */ rpc?: { name: string; args: Record<string, unknown> } };

const SOURCES: Source[] = [
  {
    table: "practice_suite_waitlist",
    label: "Practice Suite",
    title: "full_name",
    subtitle: ["email", "role", "practice_type"],
    detail: [
      { key: "practitioner_count", label: "Practitioners" },
      { key: "province", label: "Province" },
      { key: "admin_pain", label: "Biggest admin pain" },
      { key: "contact_consent", label: "Consent to contact" },
    ],
  },
  {
    table: "business_enquiries",
    label: "Business",
    title: "company_name",
    subtitle: ["contact_name", "contact_email", "contact_phone"],
    detail: [
      { key: "country", label: "Country" },
      { key: "services_interested", label: "Services" },
      { key: "budget_range", label: "Budget" },
      { key: "timeline", label: "Timeline" },
      { key: "project_brief", label: "Brief" },
      { key: "status", label: "Status" },
    ],
  },
  {
    table: "partner_enquiries",
    label: "Partners",
    title: "business_name",
    subtitle: ["full_name", "work_email", "country"],
    detail: [
      { key: "business_type", label: "Type" },
      { key: "partnership_model", label: "Model" },
      { key: "audience_size", label: "Audience" },
      { key: "website", label: "Website" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status" },
    ],
  },
  {
    table: "spotlight_brand_requests",
    label: "Brand requests",
    title: "brand_name",
    subtitle: ["request_type", "contact_name", "contact_email"],
    detail: [
      { key: "role_at_brand", label: "Role" },
      { key: "official_website", label: "Website" },
      { key: "contact_phone", label: "Phone" },
      { key: "message", label: "Message" },
      { key: "status", label: "Status" },
    ],
  },
  {
    table: "feature_waitlist",
    label: "Messaging waitlist",
    title: "full_name",
    subtitle: ["email", "feature_key"],
    detail: [],
    rpc: { name: "admin_list_feature_waitlist", args: { p_feature: "dermatologist_messaging", p_limit: 200 } },
  },
  {
    table: "notify_me_requests",
    label: "Notify me",
    title: "feature_key",
    subtitle: ["contact_method", "email", "phone"],
    detail: [],
  },
  {
    table: "custom_formula_requests",
    label: "Custom formula",
    title: "contact_name",
    subtitle: ["contact_email", "contact_phone", "product_type"],
    detail: [
      { key: "skin_goals", label: "Goals" },
      { key: "key_ingredients", label: "Ingredients" },
      { key: "allergens", label: "Allergens" },
      { key: "notes", label: "Notes" },
      { key: "status", label: "Status" },
    ],
  },
];

type Row = Record<string, unknown> & { id?: string; user_id?: string; created_at: string };

const show = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
};

const LeadsTab = () => {
  const [active, setActive] = useState(SOURCES[0].table);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const source = SOURCES.find((s) => s.table === active) ?? SOURCES[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Tables are chosen from the fixed SOURCES list; the generated types don't cover a dynamic name.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;
    const src = SOURCES.find((x) => x.table === active) ?? SOURCES[0];
    const { data, error: err } = src.rpc
      ? await client.rpc(src.rpc.name, src.rpc.args)
      : await client.from(active).select("*").order("created_at", { ascending: false }).limit(200);
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data as Row[]) ?? []);
    }
    setLoading(false);
  }, [active]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={active} onValueChange={setActive}>
          <TabsList className="h-auto flex-wrap gap-1">
            {SOURCES.map((s) => (
              <TabsTrigger key={s.table} value={s.table}>{s.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={"h-3.5 w-3.5 " + (loading ? "animate-spin" : "")} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : error ? (
        <Card><CardContent className="p-6 text-sm text-destructive" role="alert">Couldn’t load {source.label}: {error}</CardContent></Card>
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No {source.label.toLowerCase()} submissions yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Showing the latest {rows.length} (max 200).</p>
          {rows.map((row) => (
            <Card key={String(row.id ?? row.user_id)}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-card-foreground">{show(row[source.title]) || "—"}</span>
                  <Badge variant="outline" className="text-xs">{new Date(row.created_at).toLocaleString("en-ZA")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{source.subtitle.map((k) => show(row[k])).filter(Boolean).join(" • ")}</p>
                {source.detail.length > 0 && (
                  <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {source.detail.map((d) => {
                      const v = show(row[d.key]);
                      return v ? (
                        <div key={d.key} className="min-w-0">
                          <dt className="text-xs text-muted-foreground">{d.label}</dt>
                          <dd className="break-words">{v}</dd>
                        </div>
                      ) : null;
                    })}
                  </dl>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadsTab;
