import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Sends a push notification to one user's stored subscription. Clears the
 * subscription on 404/410 (the browser unsubscribed or it expired) so future
 * reminder runs don't keep retrying a dead endpoint.
 */
export async function sendPushToUser(
  userId: string,
  subscription: PushSubscriptionJSON,
  payload: PushPayload
): Promise<boolean> {
  ensureConfigured();

  try {
    await webPush.sendNotification(
      subscription as unknown as webPush.PushSubscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      const admin = createAdminClient();
      await admin.from("profiles").update({ push_subscription: null }).eq("id", userId);
    }
    return false;
  }
}
