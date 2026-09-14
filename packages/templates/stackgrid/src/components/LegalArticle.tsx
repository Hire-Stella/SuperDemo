import Container from "../components/Container";
import Reveal from "../components/Reveal";
import type { LegalPage } from "../defaults";

/**
 * Renders the three legal documents from their block lists. The shapes
 * are deliberately narrow (heading / paragraph / bullets) because that
 * is all the live pages use.
 */
export default function LegalArticle({ page }: { page: LegalPage }) {
  return (
    <article className="py-20">
      <Container>
        <div className="flex max-w-[80ch] flex-col gap-6">
          <Reveal as="h1" className="sg-display">
            {page.title}
          </Reveal>

          {page.intro.map((paragraph, index) => (
            <Reveal
              key={paragraph.slice(0, 40)}
              as="p"
              delay={60 + index * 40}
              className="sg-body"
            >
              {paragraph}
            </Reveal>
          ))}

          <div className="mt-6 flex flex-col gap-6">
            {page.blocks.map((block, index) => {
              switch (block.kind) {
                case "heading":
                  return (
                    <h2
                      key={`${index}-${block.text}`}
                      className="mt-6 text-[22px] leading-[1.4] text-[var(--sg-text)]"
                    >
                      {block.text}
                    </h2>
                  );

                case "paragraph":
                  return (
                    <p key={`${index}-${block.text.slice(0, 30)}`} className="sg-body">
                      {block.lead && (
                        <strong className="font-normal text-[var(--sg-text)]">
                          {block.lead}{" "}
                        </strong>
                      )}
                      {block.text}
                    </p>
                  );

                case "bullets":
                  return (
                    <ul key={`${index}-bullets`} className="flex flex-col gap-3">
                      {block.items.map((entry) => (
                        <li
                          key={entry.text.slice(0, 40)}
                          className="flex items-start gap-3"
                        >
                          <span
                            aria-hidden
                            className="mt-[7px] inline-block size-[5px] shrink-0"
                            style={{ background: "var(--sg-marker)" }}
                          />
                          <span className="sg-body">
                            {entry.lead && (
                              <strong className="font-normal text-[var(--sg-text)]">
                                {entry.lead}{" "}
                              </strong>
                            )}
                            {entry.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  );
              }
            })}
          </div>
        </div>
      </Container>
    </article>
  );
}
