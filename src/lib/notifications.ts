import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "answer" | "challenge" | "moment" | "message" | "goal" | "quiz";

export async function notifyPartner(params: {
  familyId: string;
  partnerId: string | null | undefined;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  if (!params.partnerId) return;
  await supabase.from("notifications").insert({
    user_id: params.partnerId,
    family_id: params.familyId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  });
}