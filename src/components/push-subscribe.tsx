"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveSubscription } from "@/app/discover/actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type SubscribeStatus = "unknown" | "unsupported" | "subscribed" | "available";

function initialStatus(): SubscribeStatus {
  if (typeof window === "undefined") return "unknown";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  return "unknown";
}

export function PushSubscribe() {
  const [status, setStatus] = useState<SubscribeStatus>(initialStatus);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (status !== "unknown") return;
    navigator.serviceWorker.ready.then(async (registration) => {
      const existing = await registration.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "available");
    });
  }, [status]);

  async function handleEnable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      toast.error("Push notifications are not configured yet");
      return;
    }

    setIsPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const result = await saveSubscription(subscription.toJSON());
      if (result.error) {
        toast.error("Couldn't save", { description: result.error });
        return;
      }

      setStatus("subscribed");
      toast.success("Reminders enabled");
    } finally {
      setIsPending(false);
    }
  }

  if (status !== "available") return null;

  return (
    <Button variant="outline" size="sm" onClick={handleEnable} disabled={isPending} className="gap-1.5">
      <Bell className="size-4" />
      Enable reminders
    </Button>
  );
}
