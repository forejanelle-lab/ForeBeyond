import { Logo } from "@/components/design/Logo";

interface AuthBrandHeaderProps {
  className?: string;
}

export function AuthBrandHeader({ className = "mb-8" }: AuthBrandHeaderProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Logo size="sm" className="justify-center" />
    </div>
  );
}
