"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Upload, Video, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { DocumentType } from "@/types/database";

interface VerificationSubmitModalProps {
  open: boolean;
  documentType: DocumentType | null;
  title: string;
  description: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const ACCEPT_BY_TYPE: Partial<Record<DocumentType, string>> = {
  government_id: "image/jpeg,image/png,image/webp,application/pdf",
  selfie: "image/jpeg,image/png,image/webp",
  address_proof: "image/jpeg,image/png,image/webp,application/pdf",
  background_check: "",
  video_verification: "video/webm,video/mp4,video/quicktime",
};

export function VerificationSubmitModal({
  open,
  documentType,
  title,
  description,
  onClose,
  onSubmitted,
}: VerificationSubmitModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setConsent(false);
      setError("");
      setRecordedBlob(null);
      setPreviewUrl(null);
      stopCamera();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopCamera() {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsRecording(false);
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        setRecordedBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Camera access is required for video verification. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleSubmit() {
    if (!documentType) return;

    if (documentType === "background_check" && !consent) {
      setError("Please consent to the background check to continue.");
      return;
    }

    const uploadFile =
      documentType === "video_verification"
        ? recordedBlob
          ? new File([recordedBlob], "verification.webm", { type: "video/webm" })
          : file
        : file;

    if (documentType !== "background_check" && !uploadFile) {
      setError(
        documentType === "video_verification"
          ? "Record or upload a short video before submitting."
          : "Please choose a file to upload."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in to submit verification.");
      setIsSubmitting(false);
      return;
    }

    let fileUrl: string | null = null;

    if (uploadFile) {
      const ext = uploadFile.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${documentType}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(path, uploadFile, { upsert: false });

      if (uploadError) {
        setError(uploadError.message);
        setIsSubmitting(false);
        return;
      }

      fileUrl = path;
    }

    const { error: upsertError } = await supabase.from("verification_documents").upsert(
      {
        user_id: user.id,
        document_type: documentType,
        file_url: fileUrl,
        status: "pending",
      },
      { onConflict: "user_id,document_type" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onSubmitted();
    onClose();
  }

  if (!open || !documentType) return null;

  const isVideo = documentType === "video_verification";
  const isBackground = documentType === "background_check";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-modal-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-sage-dark/30 overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 border-b border-sage-dark/20 px-6 py-4">
          <div>
            <h2 id="verification-modal-title" className="text-lg font-semibold text-forest">
              {title}
            </h2>
            <p className="text-sm text-charcoal-light mt-1">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-sage/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-charcoal-light" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {isBackground ? (
            <label className="flex items-start gap-3 text-sm text-charcoal-light">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                I consent to a background check as part of the Fore Beyond trust and safety process.
              </span>
            </label>
          ) : isVideo ? (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-charcoal/5 aspect-video relative">
                {previewUrl ? (
                  <video src={previewUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!isRecording && !previewUrl && (
                  <Button type="button" variant="secondary" size="sm" onClick={startRecording}>
                    <Video className="h-4 w-4" />
                    Record video
                  </Button>
                )}
                {isRecording && (
                  <Button type="button" variant="primary" size="sm" onClick={stopRecording}>
                    Stop recording
                  </Button>
                )}
                {previewUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPreviewUrl(null);
                      setRecordedBlob(null);
                    }}
                  >
                    Record again
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload video
                </Button>
              </div>
              <p className="text-xs text-charcoal-light">
                Record a short clip saying your full name. Keep it under 30 seconds.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-sage-dark/50 px-4 py-8 text-center hover:bg-sage/20 transition-colors"
              >
                {documentType === "selfie" ? (
                  <Camera className="h-8 w-8 text-forest mx-auto mb-2" />
                ) : (
                  <FileText className="h-8 w-8 text-forest mx-auto mb-2" />
                )}
                <p className="text-sm font-medium text-forest">
                  {file ? file.name : "Choose a file to upload"}
                </p>
                <p className="text-xs text-charcoal-light mt-1">JPEG, PNG, WEBP, or PDF up to 50MB</p>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_BY_TYPE[documentType] ?? "*/*"}
            className="hidden"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              setFile(next);
              setError("");
            }}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-sage-dark/20 px-6 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
            Submit for review
          </Button>
        </div>
      </div>
    </div>
  );
}
