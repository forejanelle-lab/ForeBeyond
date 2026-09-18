interface HostLocalLawsDisclaimerProps {
  className?: string;
}

export function HostLocalLawsDisclaimer({ className = "" }: HostLocalLawsDisclaimerProps) {
  return (
    <p className={className}>
      Hosts are responsible for following local laws, regulations, and any permits that apply to
      homestays in their area. Fore Beyond does not provide legal advice and does not confirm that
      hosting is permitted where you live.
    </p>
  );
}
