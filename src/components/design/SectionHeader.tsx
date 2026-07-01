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
        <p className="text-sm font-medium text-gold uppercase tracking-wide mb-2">
          {eyebrow}
        </p>
      )}
      <h2
        className={`text-2xl md:text-4xl font-bold text-forest text-balance ${titleClassName}`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-charcoal-light leading-relaxed ${descriptionClassName}`}>
          {description}
        </p>
      )}
    </div>
  );
}
