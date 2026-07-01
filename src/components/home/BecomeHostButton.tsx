"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface BecomeHostButtonProps {
  isLoggedIn: boolean;
  className?: string;
}

export function BecomeHostButton({ isLoggedIn, className = "" }: BecomeHostButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push("/onboarding/host");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/onboarding/host");
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className={`mt-10 hover:shadow-lg hover:-translate-y-0.5 transition-all ${className}`}
      onClick={handleClick}
      isLoading={isLoading}
    >
      Become a Host
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
