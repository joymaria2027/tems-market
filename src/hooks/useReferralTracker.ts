import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const REF_KEY = "temsmarket_ref_code";

export const getStoredRefCode = () => localStorage.getItem(REF_KEY);
export const clearStoredRefCode = () => localStorage.removeItem(REF_KEY);

export const useReferralTracker = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && ref.trim()) {
      localStorage.setItem(REF_KEY, ref.trim());
      // Increment click count via security definer function
      supabase.rpc("increment_affiliate_clicks", { affiliate_code: ref.trim() }).then();
    }
  }, [searchParams]);
};
