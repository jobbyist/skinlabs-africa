import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { academyRpc } from "@/lib/academy/rpc";
import { isAcademyStaff, NO_ACADEMY_ROLES, parseAcademyRoles, type AcademyRoles } from "@/lib/academy/access";

/**
 * The signed-in account's Academy roles (academy_my_roles()). Presentation only: it decides whether Studio
 * navigation is shown, never what a person may do — every studio/admin RPC re-checks on the server.
 */
export const useAcademyRoles = () => {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["academy-roles", user?.id ?? "anon"],
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AcademyRoles> => {
      const { data, error } = await academyRpc("academy_my_roles");
      return error ? NO_ACADEMY_ROLES : parseAcademyRoles(data);
    },
  });
  const roles = user ? (query.data ?? NO_ACADEMY_ROLES) : NO_ACADEMY_ROLES;
  return { roles, isStaff: isAcademyStaff(roles), loading: Boolean(user) && query.isLoading };
};
