interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
  titleClassName = "",
  descriptionClassName = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`${align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-2xl"} mb-10 md:mb-12 ${className}`}
    >
      {eyebrow && (
        <p className="text-xs font-semibold text-gold uppercase tracking-[0.15em] mb-3">
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-3xl md:text-4xl lg:text-[2.75rem] font-serif font-semibold text-forest leading-[1.15] text-balance ${titleClassName}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-4 text-base md:text-lg text-muted leading-relaxed ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </div>
  );
}
