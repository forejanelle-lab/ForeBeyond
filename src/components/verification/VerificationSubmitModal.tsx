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
  video_verification: "video/webm,video/mp4,video/quicktime",
};

const VERIFICATION_BUCKET = "verification-documents";

function getSupportedRecorderMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function extensionForMime(mime: string) {
  if (mime.includes("mp4") || mime.includes("quicktime")) return "mp4";
  return "webm";
}

export function VerificationSubmitModal({
  open,
  documentType,
  title,
  description,
  onClose,
  onSubmitted,
}: VerificationSubmitModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selfieCameraActive, setSelfieCameraActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recorderMimeRef = useRef("video/webm");

  useEffect(() => {
    if (!open) {
      setFile(null);
      setError("");
      setRecordedBlob(null);
      setPreviewUrl(null);
      setSelfieCameraActive(false);
      stopCamera();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function stopStreamTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function stopCamera() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    stopStreamTracks();
    setIsRecording(false);
  }

  function setVideoPreviewFromBlob(blob: Blob) {
    setRecordedBlob(blob);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(blob);
    });
  }

  async function startRecording() {
    setError("");
    setFile(null);

    const mimeType = getSupportedRecorderMimeType();
    if (!mimeType) {
      setError("Video recording is not supported in this browser. Upload a video file instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderMimeRef.current = mimeType;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorderMimeRef.current || "video/webm",
        });
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        stopStreamTracks();
        setIsRecording(false);

        if (blob.size === 0) {
          setError("Recording was empty. Try again or upload a video file.");
          return;
        }

        setVideoPreviewFromBlob(blob);
      };

      recorder.onerror = () => {
        setError("Recording failed. Try again or upload a video file.");
        stopCamera();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
    } catch {
      setError("Camera access is required for video verification. Check browser permissions.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function clearVideoPreview() {
    setRecordedBlob(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setFile(null);
  }

  function clearSelfiePreview() {
    setFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setSelfieCameraActive(false);
    stopStreamTracks();
  }

  async function startSelfieCamera() {
    setError("");
    setFile(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setSelfieCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError("Camera access is required for a live selfie. Allow camera permissions and try again.");
      stopStreamTracks();
      setSelfieCameraActive(false);
    }
  }

  function captureSelfie() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera is not ready yet. Please try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Unable to capture photo. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Unable to capture photo. Please try again.");
          return;
        }

        stopStreamTracks();
        setSelfieCameraActive(false);
        const selfieFile = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
        setFile(selfieFile);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return URL.createObjectURL(blob);
        });
        setError("");
      },
      "image/jpeg",
      0.92
    );
  }

  function handleVideoFileSelect(next: File | null) {
    if (!next) return;
    clearVideoPreview();
    setFile(next);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(next);
    });
    setError("");
  }

  async function handleSubmit() {
    if (!documentType) return;

    let uploadFile: File | null = null;

    if (documentType === "video_verification") {
      if (recordedBlob) {
        const mime = recordedBlob.type || recorderMimeRef.current || "video/webm";
        const ext = extensionForMime(mime);
        uploadFile = new File([recordedBlob], `verification.${ext}`, { type: mime });
      } else {
        uploadFile = file;
      }
    } else {
      uploadFile = file;
    }

    if (!uploadFile) {
      setError(
        documentType === "video_verification"
          ? "Record or upload a short video before submitting."
          : documentType === "selfie"
            ? "Take a live selfie before submitting."
            : "Please choose a file to upload."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
        .from(VERIFICATION_BUCKET)
        .upload(path, uploadFile, {
          upsert: false,
          contentType: uploadFile.type || undefined,
        });

      if (uploadError) {
        setError(
          uploadError.message.includes("Bucket not found")
            ? "Verification storage is not set up yet. Please try again shortly or contact support."
            : uploadError.message
        );
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
        notes: null,
        reviewed_at: null,
      },
      { onConflict: "user_id,document_type" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setIsSubmitting(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", user.id)
      .eq("verification_status", "rejected");

    setIsSubmitting(false);
    onSubmitted();
    onClose();
  }

  if (!open || !documentType) return null;

  const isVideo = documentType === "video_verification";
  const isSelfie = documentType === "selfie";

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
          {isVideo ? (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-charcoal/5 aspect-video relative">
                {previewUrl ? (
                  <video
                    key={previewUrl}
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-cover bg-black"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover bg-black"
                  />
                )}
                {isRecording && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white">
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Recording
                  </span>
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
                  <Button type="button" variant="outline" size="sm" onClick={clearVideoPreview}>
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
          ) : isSelfie ? (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden bg-charcoal/5 aspect-[4/5] max-h-80 relative">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Captured selfie preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover bg-black mirror"
                    style={{ transform: "scaleX(-1)" }}
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!previewUrl && !selfieCameraActive && (
                  <Button type="button" variant="secondary" size="sm" onClick={startSelfieCamera}>
                    <Camera className="h-4 w-4" />
                    Open camera
                  </Button>
                )}
                {selfieCameraActive && !previewUrl && (
                  <Button type="button" variant="primary" size="sm" onClick={captureSelfie}>
                    <Camera className="h-4 w-4" />
                    Take photo
                  </Button>
                )}
                {previewUrl && (
                  <Button type="button" variant="outline" size="sm" onClick={clearSelfiePreview}>
                    Retake selfie
                  </Button>
                )}
              </div>
              <p className="text-xs text-charcoal-light">
                Use your front camera and take a live selfie. Uploads from your photo library are
                not accepted for this step.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-sage-dark/50 px-4 py-8 text-center hover:bg-sage/20 transition-colors"
              >
                <FileText className="h-8 w-8 text-forest mx-auto mb-2" />
                <p className="text-sm font-medium text-forest">
                  {file ? file.name : "Choose a file to upload"}
                </p>
                <p className="text-xs text-charcoal-light mt-1">JPEG, PNG, WEBP, or PDF up to 50MB</p>
              </button>
            </div>
          )}

          {!isSelfie && (
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_BY_TYPE[documentType] ?? "*/*"}
            className="hidden"
            onChange={(e) => {
              const next = e.target.files?.[0] ?? null;
              if (isVideo) {
                handleVideoFileSelect(next);
              } else {
                setFile(next);
                setError("");
              }
              e.target.value = "";
            }}
          />
          )}

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
