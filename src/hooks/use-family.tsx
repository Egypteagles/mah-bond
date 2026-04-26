import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { getDailyContent, todayISO } from "@/lib/content";

export interface ProfileRow {
  id: string;
  family_id: string | null;
  active_family_id: string | null;
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

export type FamilyRole =
  | "parent"
  | "child"
  | "mother"
  | "father"
  | "sibling"
  | "grandparent"
  | "other";

export interface MembershipRow {
  id: string;
  user_id: string;
  family_id: string;
  role: FamilyRole;
  nickname: string | null;
  joined_at: string;
}

export interface FamilyWithMembership extends FamilyRow {
  role: FamilyRole;
  member_count: number;
}

export function useFamily() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [families, setFamilies] = useState<FamilyWithMembership[]>([]);
  const [family, setFamily] = useState<FamilyRow | null>(null);
  const [role, setRole] = useState<FamilyRole | null>(null);
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [partnerProfile, setPartnerProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setFamilies([]);
      setFamily(null);
      setRole(null);
      setMembers([]);
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

    // كل عائلات المستخدم
    const { data: memberships } = await supabase
      .from("family_members")
      .select("family_id, role, families!inner(id, name, invite_code)")
      .eq("user_id", user.id);

    const famList: FamilyWithMembership[] = ((memberships ?? []) as Array<{
      family_id: string;
      role: FamilyRole;
      families: FamilyRow;
    }>).map((m) => ({
      ...m.families,
      role: m.role,
      member_count: 0,
    }));

    // عدّ الأعضاء لكل عائلة
    if (famList.length > 0) {
      const { data: counts } = await supabase
        .from("family_members")
        .select("family_id")
        .in(
          "family_id",
          famList.map((f) => f.id),
        );
      const map = new Map<string, number>();
      (counts ?? []).forEach((row) => {
        map.set(row.family_id, (map.get(row.family_id) ?? 0) + 1);
      });
      famList.forEach((f) => (f.member_count = map.get(f.id) ?? 1));
    }
    setFamilies(famList);

    // العائلة النشطة
    const activeId =
      (prof as ProfileRow | null)?.active_family_id ??
      (prof as ProfileRow | null)?.family_id ??
      famList[0]?.id ??
      null;
    const activeFam = famList.find((f) => f.id === activeId) ?? famList[0] ?? null;

    if (activeFam) {
      setFamily({
        id: activeFam.id,
        name: activeFam.name,
        invite_code: activeFam.invite_code,
      });
      setRole(activeFam.role);
      const { data: memberProfiles } = await supabase
        .from("profiles")
        .select("*")
        .in(
          "id",
          (
            await supabase
              .from("family_members")
              .select("user_id")
              .eq("family_id", activeFam.id)
          ).data?.map((r) => r.user_id) ?? [],
        );
      const memberList = (memberProfiles ?? []) as ProfileRow[];
      setMembers(memberList);
      setPartnerProfile(memberList.find((m) => m.id !== user.id) ?? null);
    } else {
      setFamily(null);
      setRole(null);
      setMembers([]);
      setPartnerProfile(null);
    }
    setLoading(false);
  }, [user]);

  const switchFamily = useCallback(
    async (familyId: string) => {
      if (!user) return;
      await supabase
        .from("profiles")
        .update({ active_family_id: familyId, family_id: familyId })
        .eq("id", user.id);
      await refresh();
      // إعلام أي مكوّن مشترك على بيانات العائلة بإعادة التحميل
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("family:changed", { detail: { familyId } }),
        );
      }
    },
    [user, refresh],
  );

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  return {
    profile,
    family,
    families,
    role,
    members,
    partnerProfile,
    loading: loading || authLoading,
    refresh,
    switchFamily,
  };
}

// ضمان وجود كبسولة لليوم — تنشأ تلقائياً لو مش موجودة
export async function ensureTodayCapsule(familyId: string) {
  // تحقق صريح أن المستخدم الحالي عضو في العائلة (يحمي الـ UI من بيانات قديمة)
  const { data: sessionData } = await supabase.auth.getUser();
  const uid = sessionData.user?.id;
  if (uid) {
    const { data: membership } = await supabase
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", uid)
      .maybeSingle();
    if (!membership) {
      throw new Error("not_a_member");
    }
  }
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
