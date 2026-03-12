"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingConnectCompletePage() {
  const router = useRouter();

  useEffect(() => {
    async function finish() {
      try {
        const supabase = createClient();
        await supabase.auth.updateUser({ data: { onboarding_complete: true } });
        await fetch("/api/users/me"); // ensure users row exists and can be updated
      } catch {
        // no-op
      }
      router.replace("/app/home");
      router.refresh();
    }
    finish();
  }, [router]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-jacq-bg px-6">
      <p className="text-[16px] text-jacq-t2">Finishing setup…</p>
    </div>
  );
}
