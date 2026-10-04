import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps } from "react";

import { CodeBlock } from "@/components/code-block";
import { CopyToLlm } from "@/components/copy-to-llm";

const components: MDXComponents = {
  CopyToLlm,
  a: ({ href = "", ...props }: ComponentProps<"a">) =>
    // Plain-text files (/llms.txt, the .md twins) are not pages, so they get a plain link.
    (href.startsWith("/") || href.startsWith("#")) && !/\.(md|txt|json)$/.test(href) ? (
      <Link href={href} {...props} />
    ) : (
      <a href={href} {...props} />
    ),
  pre: (props: ComponentProps<"pre">) => <CodeBlock {...props} />,
  table: (props: ComponentProps<"table">) => (
    <div className="my-6 w-full overflow-x-auto">
      <table {...props} />
    </div>
  ),
};

// Required by @next/mdx in the App Router.
export function useMDXComponents(): MDXComponents {
  return components;
}
