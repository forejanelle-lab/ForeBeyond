"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminDeleteUserModalProps {
  open: boolean;
  userName: string | null;
  userEmail: string;
  isLoading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function AdminDeleteUserModal({
  open,
  userName,
  userEmail,
  isLoading = false,
  error,
  onClose,
  onConfirm,
}: AdminDeleteUserModalProps) {
  if (!open) return null;

  const displayName = userName ?? userEmail;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Close delete dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl border border-sage-dark/30 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-charcoal-light hover:text-forest"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-3 mb-4 pr-8">
          <div className="rounded-full bg-red-100 p-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="delete-user-title" className="text-lg font-semibold text-forest">
              Delete user account?
            </h2>
            <p className="text-sm text-charcoal-light mt-1">
              This permanently removes <strong>{displayName}</strong> ({userEmail}) and all
              associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 mt-6">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 bg-red-700 hover:bg-red-800"
          >
            Delete user
          </Button>
        </div>
      </div>
    </div>
  );
}
