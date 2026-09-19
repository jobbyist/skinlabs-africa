import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthedUser {
  userId: string;
  email: string;
}

/**
 * Same authenticated-caller resolution every checkout-initiating gateway
 * function needs: verify the bearer JWT, never trust a client-supplied
 * user id. Returns null (caller should respond 401) on any failure.
 */
export async function resolveAuthedUser(req: Request, supabaseUrl: string): Promise<AuthedUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error } = await supabaseUser.auth.getClaims(token);
  if (error || !claimsData?.claims?.sub) return null;

  return {
    userId: claimsData.claims.sub as string,
    email: (claimsData.claims.email as string | undefined) ?? "",
  };
}
