import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Settings › Billing: past pre-orders. Loaded here (not on Home) because only Billing needs it; renders nothing without any. */
const PreOrdersCard = () => {
  const { user } = useAuth();
  const { data: preorders = [] } = useQuery({
    queryKey: ["preorders", user?.id ?? "anon"],
    enabled: Boolean(user),
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("preorders")
        .select("id, product_type, amount, status, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  if (preorders.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Your Pre-Orders</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-3">
          {preorders.map((order) => (
            <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium text-foreground capitalize">{order.product_type.replace("_", " ")}</p>
                <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">R{order.amount}</p>
                <Badge variant={order.status === "complete" ? "default" : "secondary"} className="text-xs">{order.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PreOrdersCard;
