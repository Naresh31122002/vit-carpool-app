import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
  activeRoute?: string;
  showNav?: boolean;
  header?: React.ReactNode;
}

export function Layout({
  children,
  activeRoute,
  showNav = true,
  header,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {header && (
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
          <div className="max-w-md mx-auto">{header}</div>
        </header>
      )}
      <main
        className={`flex-1 max-w-md mx-auto w-full ${showNav ? "pb-20" : ""}`}
      >
        {children}
      </main>
      {showNav && <BottomNav activeRoute={activeRoute} />}
      <footer className="bg-muted/40 border-t border-border py-3 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors duration-200"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
