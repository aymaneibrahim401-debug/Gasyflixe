import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = Record<string, string>;

const DEFAULTS: SiteSettings = {
  home_title: "",
  home_subtitle: "",
  home_hero_image: "",
  about_text: "",
  contact_phone: "",
  contact_email: "",
  contact_address: "Antananarivo, Madagascar",
  contact_facebook: "",
  contact_text: "",
  payment_number: "",
  payment_holder: "BOODJI PROD",
  pay_yas_number: "",
  pay_yas_holder: "",
  pay_yas_logo: "",
  pay_orange_number: "",
  pay_orange_holder: "",
  pay_orange_logo: "",
  pay_airtel_number: "",
  pay_airtel_holder: "",
  pay_airtel_logo: "",
  // legacy
  pay_telma_number: "",
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("site_settings").select("key,value");
    const map: SiteSettings = { ...DEFAULTS };
    (data || []).forEach((row: any) => { map[row.key] = row.value; });
    setSettings(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { settings, loading, reload: load };
};
