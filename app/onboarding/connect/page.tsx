"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JacqLogo } from "@/components/ui/jacq-logo";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingConnectPage() {
  const router = useRouter();
  const [oauthError, setOauthError] = useState<string | null>(null);

  async function connectGoogle() {
    setOauthError(null);
    try {
      const supabase = createClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar",
          redirectTo: `${origin}/auth/callback?next=/onboarding/connect/complete`,
        },
      });
      if (error) {
        setOauthError(error.message ?? "Could not start Google sign-in");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setOauthError("No redirect URL received");
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function skip() {
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { integration_deferred: true, onboarding_complete: true } });
    } catch {
      // no-op
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-jacq-bg">
      <div className="py-2.5 px-[18px] border-b border-jacq-bord flex items-center flex-shrink-0">
        <JacqLogo size={26} />
        <span className="ml-auto text-[11px] text-jacq-t3">Almost there</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pt-1" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.25rem)" }}>
        <div className="py-[18px] px-[22px] space-y-4">
          <p
            className="text-[20px] text-jacq-t1 leading-[1.35] max-w-[90%]"
            style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
          >
            Last step. I need access to your Google account — email, calendar, and contacts. It&apos;s one approval that covers everything.
          </p>
          <p
            className="text-[20px] text-jacq-t1 leading-[1.35] max-w-[90%]"
            style={{ fontFamily: '"Gilda Display", Georgia, serif' }}
          >
            I&apos;ll open a browser. Just sign in and tap Allow on the Google screen, then come straight back here.
          </p>
        </div>

        <div className="mx-4 my-2 p-3.5 bg-jacq-surf rounded-[14px] border border-jacq-bord space-y-2">
          <div className="flex gap-3 py-2.5 px-3.5 items-center">
            <div className="w-8 h-8 rounded-[10px] bg-[#EA4335]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-[#EA4335] font-semibold">G</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-jacq-t1">Gmail</div>
              <div className="text-[11px] text-jacq-t2 mt-0.5">Inbox, drafts, send on your behalf (with approval)</div>
            </div>
          </div>
          <div className="h-px bg-jacq-bord2 mx-3.5" />
          <div className="flex gap-3 py-2.5 px-3.5 items-center">
            <div className="w-8 h-8 rounded-[10px] bg-[#4285F4]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-[#4285F4] font-semibold">Cal</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-jacq-t1">Calendar</div>
              <div className="text-[11px] text-jacq-t2 mt-0.5">Scheduling, conflict detection</div>
            </div>
          </div>
          <div className="h-px bg-jacq-bord2 mx-3.5" />
          <div className="flex gap-3 py-2.5 px-3.5 items-center">
            <div className="w-8 h-8 rounded-[10px] bg-jacq-surf2 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-jacq-t2 font-semibold">C</span>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-jacq-t1">Contacts</div>
              <div className="text-[11px] text-jacq-t2 mt-0.5">People you work with</div>
            </div>
          </div>
        </div>

        <div className="mx-4 my-2 p-2.5 bg-jacq-goldl rounded-xl border border-jacq-goldb">
          <span className="text-[12px] text-jacq-t1 leading-relaxed">
            One thing worth considering: setting up a dedicated send-from address like jacq@yourdomain.com keeps things clearly attributed. Entirely optional — easy to add later.
          </span>
        </div>
        <div className="mx-4 my-2 p-2.5 bg-jacq-greenl rounded-xl border border-jacq-green/20">
          <span className="text-[12px] text-jacq-t1 leading-relaxed">
            I will never send, delete, or book anything without your approval first.
          </span>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-col gap-2 border-t border-jacq-bord p-2.5 px-[18px] pb-7" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.75rem)" }}>
        {oauthError && (
          <p className="text-[13px] text-jacq-red text-center px-2">{oauthError}</p>
        )}
        <button
          type="button"
          onClick={connectGoogle}
          className="w-full h-[52px] rounded-[14px] bg-jacq-surf border border-jacq-bord flex items-center justify-center gap-2.5 cursor-pointer font-dm-sans"
        >
          <span className="text-[14px] font-semibold text-jacq-t1">Connect Google</span>
        </button>
        <button type="button" onClick={skip} className="w-full h-10 rounded-[14px] bg-transparent border-none text-jacq-t3 text-[13px] cursor-pointer">
          Skip for now
        </button>
      </div>
    </div>
  );
}
