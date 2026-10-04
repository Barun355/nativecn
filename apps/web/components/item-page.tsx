import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { CodeBlock } from "@/components/code-block";
import { CopyCommand } from "@/components/copy-command";
import {
  CurrentStyle,
  ForStyle,
  StyledCopyToLlm,
  StyleProvider,
  StyleSwitch,
} from "@/components/style-switch";
import { HEADINGS, type CodeFile, type ItemDoc, type ItemLink } from "@/lib/item-doc";
import type { Heading } from "@/lib/markdown";

/** Renders `code` spans in Registry text (descriptions, props, notes). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Code({ file }: { file: CodeFile }) {
  const lang = /\.(\w+)$/.exec(file.path)?.[1] ?? "";
  return (
    <CodeBlock className="max-h-[32rem] overflow-auto">
      <code className={lang ? `language-${lang}` : undefined}>
        {file.content?.replace(/\n$/, "")}
      </code>
    </CodeBlock>
  );
}

function ItemLinkView({ link }: { link: ItemLink }) {
  return link.href ? (
    <Link href={link.href}>
      <code>{link.name}</code>
    </Link>
  ) : (
    <code>{link.name}</code>
  );
}

function List({ links }: { links: ItemLink[] }) {
  return (
    <>
      {links.map((l, i) => (
        <Fragment key={l.name}>
          {i > 0 && ", "}
          <ItemLinkView link={l} />
        </Fragment>
      ))}
    </>
  );
}

/** A section heading, with the id "On this page" links to (parsed from the page's markdown). */
function H2({ text, headings }: { text: string; headings: Heading[] }) {
  const id = headings.find((h) => h.depth === 2 && h.text === text)?.id;
  return <h2 id={id}>{text}</h2>;
}

/**
 * A generated Registry item page. `docs` holds the item in each Style, default Style first:
 * code (usage examples and source) is shown per Style, everything else is the same in every Style.
 */
export function ItemPage({
  docs,
  headings,
  built,
}: {
  docs: ItemDoc[];
  headings: Heading[];
  /** False when the Registry has not been built, so no code can be shown. */
  built: boolean;
}) {
  const doc = docs[0]!;
  const perStyle = (render: (d: ItemDoc) => ReactNode) =>
    docs.map((d) => (
      <ForStyle key={d.style} style={d.style}>
        {render(d)}
      </ForStyle>
    ));

  return (
    <StyleProvider styles={docs.map((d) => d.style)}>
      <div className="not-prose -mt-4 mb-8 flex flex-wrap items-center gap-3 text-xs">
        <span className="rounded-md border px-2 py-0.5 font-medium">{doc.kind}</span>
        {doc.categories.map((c) => (
          <span key={c} className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
            {c}
          </span>
        ))}
        <StyledCopyToLlm item={doc.name} />
        <div className="ml-auto">
          <StyleSwitch />
        </div>
      </div>

      {!built && (
        <p className="rounded-md border border-dashed p-3 text-sm">
          The Registry has not been built, so no code is shown. Run{" "}
          <code>pnpm --filter ui build</code> and reload.
        </p>
      )}

      <H2 text={HEADINGS.installation} headings={headings} />
      <div className="not-prose space-y-2">
        {doc.add.commands.map((c) => (
          <CopyCommand key={c} command={c} />
        ))}
      </div>
      {doc.add.notes.length > 0 && (
        <ul>
          {doc.add.notes.map((n) => (
            <li key={n}>
              <Inline text={n} />
            </li>
          ))}
        </ul>
      )}
      {doc.installs.length > 0 && (
        <p>
          Also installs: <List links={doc.installs} />.
        </p>
      )}
      {doc.packages.length > 0 && (
        <p>
          Packages:{" "}
          {doc.packages.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && ", "}
              <code>{p}</code>
            </Fragment>
          ))}
          .
        </p>
      )}

      {doc.difference && (
        <>
          <H2 text={HEADINGS.difference} headings={headings} />
          <p>
            <Inline text={doc.difference} />
          </p>
        </>
      )}
      {doc.blockVariants.length > 0 && (
        <>
          <H2 text={HEADINGS.variants} headings={headings} />
          <ul>
            {doc.blockVariants.map((v) => (
              <li key={v.name}>
                {v.current ? (
                  <>
                    <strong>
                      <code>{v.name}</code>
                    </strong>{" "}
                    (this page)
                  </>
                ) : (
                  <ItemLinkView link={v} />
                )}
                {v.title && <> – {v.title}</>}
                {v.difference && (
                  <>
                    : <Inline text={v.difference} />
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {doc.screenshots && (
        <>
          <H2 text={HEADINGS.screenshots} headings={headings} />
          <div className="not-prose flex flex-wrap gap-4">
            {Object.entries(doc.screenshots).map(([key, url]) => (
              // Device screenshots are hosted files of unknown size, so no next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={key}
                src={url}
                alt={`${doc.title} (${key})`}
                loading="lazy"
                className="max-h-[36rem] w-auto rounded-xl border"
              />
            ))}
          </div>
        </>
      )}

      {doc.examples.length > 0 && (
        <>
          <H2 text={HEADINGS.usage} headings={headings} />
          {perStyle((d) =>
            d.examples.map((ex) => (
              <Fragment key={ex.name}>
                <h3>{ex.title}</h3>
                {ex.description && (
                  <p>
                    <Inline text={ex.description} />
                  </p>
                )}
                {built && ex.files.map((f) => <Code key={f.path} file={f} />)}
              </Fragment>
            )),
          )}
        </>
      )}

      {doc.props.length > 0 && (
        <>
          <H2 text={HEADINGS.props} headings={headings} />
          {doc.props.map((table, i) => (
            <Fragment key={table.name ?? i}>
              {table.name && doc.props.length > 1 && (
                <h3>
                  <code>{table.name}</code>
                </h3>
              )}
              <div className="my-6 w-full overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Prop</th>
                      <th>Type and description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((r) => (
                      <tr key={r.name}>
                        <td className="align-top whitespace-nowrap">
                          <code>{r.name}</code>
                        </td>
                        <td>
                          <Inline text={r.description} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Fragment>
          ))}
        </>
      )}
      {doc.variants.length > 0 && (
        <>
          <H2 text={HEADINGS.variantValues} headings={headings} />
          <ul>
            {doc.variants.map((v) => (
              <li key={v.prop ?? "values"}>
                {v.prop && (
                  <>
                    <code>{v.prop}</code>:{" "}
                  </>
                )}
                {v.values.map((x, i) => (
                  <Fragment key={x}>
                    {i > 0 && ", "}
                    <code>{x}</code>
                  </Fragment>
                ))}
              </li>
            ))}
          </ul>
        </>
      )}
      {doc.accessibility.length > 0 && (
        <>
          <H2 text={HEADINGS.accessibility} headings={headings} />
          <ul>
            {doc.accessibility.map((s) => (
              <li key={s}>
                <Inline text={s} />
              </li>
            ))}
          </ul>
        </>
      )}
      {doc.notes.length > 0 && (
        <>
          <H2 text={HEADINGS.notes} headings={headings} />
          <p>
            <Inline text={doc.notes.join(" ")} />
          </p>
        </>
      )}

      {built && doc.source.length > 0 && (
        <>
          <H2 text={HEADINGS.source} headings={headings} />
          <p className="text-sm text-muted-foreground">
            The <CurrentStyle /> Style&apos;s code, exactly as <code>add</code> copies it into your
            app.
          </p>
          {perStyle((d) =>
            d.source.map((f) => (
              <Fragment key={f.target}>
                <p className="mb-1 font-mono text-xs text-muted-foreground">{f.target}</p>
                <Code file={f} />
              </Fragment>
            )),
          )}
        </>
      )}
    </StyleProvider>
  );
}
