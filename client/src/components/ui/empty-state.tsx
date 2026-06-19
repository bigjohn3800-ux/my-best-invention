import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconColor?: string;
  iconBg?: string;
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  className?: string;
  testId?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  iconColor = "text-cyan-400",
  iconBg = "bg-cyan-500/10",
  size = "md",
  children,
  className = "",
  testId,
}: EmptyStateProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";
  const padding = isSm ? "p-6" : isLg ? "p-12" : "p-8 sm:p-10";
  const iconSize = isSm ? "w-10 h-10" : isLg ? "w-16 h-16" : "w-14 h-14";
  const iconInner = isSm ? "w-5 h-5" : isLg ? "w-8 h-8" : "w-7 h-7";
  const titleSize = isSm ? "text-base" : isLg ? "text-xl" : "text-lg";

  return (
    <div
      className={`glass-card rounded-2xl ${padding} text-center ${className}`}
      data-testid={testId}
    >
      <div
        className={`${iconSize} mx-auto rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center mb-4`}
      >
        <Icon className={iconInner} />
      </div>
      <h3 className={`${titleSize} font-bold text-white mb-2`}>{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          {description}
        </p>
      )}
      {children && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
