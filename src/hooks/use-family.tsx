import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { getDailyContent, todayISO } from "@/lib/content";

export interface ProfileRow {
  id: string;
  family_id: string | null;
  display_name: string;
  avatar_url: string | null;
  reminder_time: string | null;
  notifications_enabled: boolean;
}

export interface FamilyRow {
  id: string;
  name: string | null;
  invite_code: string;
}

export interface RoleRow {
  user_id: string;
  family_id: string;
  role: "parent" | "child";
}

export function useFamily() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [family, setFamily] = useState<FamilyRow | null>(null);
  const [role, setRole] = useState<"parent" | "child" | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setFamily(null);
      setRole(null);
      setPartnerProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(prof as ProfileRow | null);

    if (prof?.family_id) {
      const [{ data: fam }, { data: roles }, { data: members }] = await Promise.all([
        supabase.from("families").select("*").eq("id", prof.family_id).maybeSingle(),
        supabase.from("user_roles").select("*").eq("family_id", prof.family_id),
        supabase.from("profiles").select("*").eq("family_id", prof.family_id),
      ]);
      setFamily(fam as FamilyRow | null);
      const myRole = (roles as RoleRow[] | null)?.find((r) => r.user_id === user.id);
      setRole(myRole?.role ?? null);
      const partner = (members as ProfileRow[] | null)?.find((m) => m.id !== user.id) ?? null;
      setPartnerProfile(partner);
    } else {
      setFamily(null);
      setRole(null);
      setPartnerProfile(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  return { profile, family, role, partnerProfile, loading: loading || authLoading, refresh };
}

// ضمان وجود كبسولة لليوم — تنشأ تلقائياً لو مش موجودة
export async function ensureTodayCapsule(familyId: string) {
  const date = todayISO();
  const { data: existing } = await supabase
    .from("daily_capsules")
    .select("*")
    .eq("family_id", familyId)
    .eq("capsule_date", date)
    .maybeSingle();

  if (existing) return existing;

  const { question, challenge } = getDailyContent(familyId, date);
  const { data, error } = await supabase
    .from("daily_capsules")
    .insert({ family_id: familyId, capsule_date: date, question, challenge })
    .select()
    .single();
  if (error) throw error;
  return data;
}
