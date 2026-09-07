import { Github, Heart } from "@/components/Icones/Reicon";

const Footer = () => {
  return (
    <footer className="w-full shrink-0 pb-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-2 rounded-2xl border-0 bg-background/80 px-4 py-3 text-xs text-muted-foreground shadow-sm backdrop-blur-md transition-all duration-300 supports-[backdrop-filter]:bg-background/60 sm:flex-row">
          <a
            href="https://github.com/lliooly/komari-theme-floe"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            aria-label="Floe on GitHub"
          >
            <span>Powered by</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Github className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Floe</span>
            </span>
          </a>

          <div className="inline-flex items-center gap-1">
            <span>Made with</span>
            <Heart
              className="h-3 w-3 fill-current text-red-500"
              weight="Filled"
              aria-hidden="true"
            />
            <span>for Komari</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
