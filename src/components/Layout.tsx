import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-[var(--bg-dark)] text-[var(--text-primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
