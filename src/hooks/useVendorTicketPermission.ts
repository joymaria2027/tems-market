import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Checks whether the current vendor has superadmin-granted permission
 * to create ticket products and access the ticket management dashboard.
 *
 * Returns { canCreateTickets, isLoading, isError }
 */
export function useVendorTicketPermission() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor-ticket-permission", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("can_create_tickets")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data?.can_create_tickets ?? false;
    },
    staleTime: 30_000, // re-check every 30s
  });

  return {
    canCreateTickets: data ?? false,
    isLoading,
    isError,
  };
}
