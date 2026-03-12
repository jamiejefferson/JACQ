"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SectionLabel } from "@/components/ui/section-label";

export function LogoutSection() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Continue to redirect even if signOut fails (e.g. no env)
    }
    router.push("/sign-in");
    router.refresh();
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete account");
      }
      setShowDeleteModal(false);
      router.push("/sign-in");
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <SectionLabel>Account</SectionLabel>
      <div className="mx-4 mb-1 bg-jacq-surf rounded-[14px] border border-jacq-bord overflow-hidden">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left text-[13px] text-jacq-t1 font-dm-sans cursor-pointer hover:bg-jacq-surf2/50 transition-colors border-b border-jacq-bord2"
        >
          <span>Log out</span>
          <svg viewBox="0 0 24 24" width={14} height={14} className="fill-jacq-t3">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="w-full py-2.5 px-3.5 flex items-center justify-between text-left text-[13px] text-jacq-red font-dm-sans cursor-pointer hover:bg-jacq-surf2/50 transition-colors"
        >
          <span>Delete account (and all my data)</span>
          <svg viewBox="0 0 24 24" width={14} height={14} className="fill-jacq-red">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        </button>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div
            className="bg-jacq-surf rounded-2xl border border-jacq-bord shadow-xl max-w-[343px] w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-account-title" className="text-[18px] font-semibold text-jacq-t1 mb-2" style={{ fontFamily: '"Gilda Display", Georgia, serif' }}>
              Delete account?
            </h2>
            <p className="text-[13px] text-jacq-t2 leading-relaxed mb-4">
              This will permanently delete your account and all your data. You will be signed out. This cannot be undone.
            </p>
            {deleteError && (
              <p className="text-[13px] text-jacq-red mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-jacq-bord bg-jacq-surf2 text-[13px] font-semibold text-jacq-t1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-jacq-red text-[13px] font-semibold text-white disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
