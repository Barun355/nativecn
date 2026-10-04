import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ComponentProps } from "react";

import { CodeBlock } from "@/components/code-block";

const components: MDXComponents = {
  a: ({ href = "", ...props }: ComponentProps<"a">) =>
    href.startsWith("/") || href.startsWith("#") ? (
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
