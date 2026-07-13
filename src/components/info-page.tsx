import type { InfoPageConfig } from "@/lib/info-pages";

type InfoPageProps = {
  config: InfoPageConfig;
  className?: string;
  hideHeader?: boolean;
};

export function InfoPage({ config, className, hideHeader }: InfoPageProps) {
  return (
    <article className={className}>
      {!hideHeader ? (
        <header className="space-y-2 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{config.title}</h1>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          {config.lastUpdated ? (
            <p className="text-xs text-muted-foreground">
              Last updated: {config.lastUpdated}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className="space-y-6">
        {config.sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="text-base font-medium">{section.title}</h2>
            <div className="space-y-3">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm text-muted-foreground leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
