import { Typography } from "@mantine/core";
import { renderMarkdown } from "@/lib/markdown";

type MarkdownContentProps = {
  markdown: string;
};

export default async function MarkdownContent({ markdown }: MarkdownContentProps) {
  const html = await renderMarkdown(markdown);

  return (
    <Typography>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </Typography>
  );
}
