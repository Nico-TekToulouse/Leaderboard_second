import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root, Heading, Paragraph, Code, Table, List, PhrasingContent, BlockContent, DefinitionContent } from "mdast";
import type {
  WorksheetSection,
  WorksheetQuestion,
  WorksheetQuestionText,
  WorksheetQuestionTable,
  WorksheetQuestionCheckbox,
  WorksheetQuestionShort,
} from "@/types/worksheet";

type AstNode = Root["children"][number];

function extractText(node: { children?: PhrasingContent[] } | { value?: string }): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  if ("children" in node && Array.isArray(node.children)) {
    return (node.children as Array<{ children?: PhrasingContent[]; value?: string }>)
      .map(extractText)
      .join("");
  }
  return "";
}

function detectQuestionType(
  label: string,
  node: AstNode,
  id: string
): WorksheetQuestion {
  if (node.type === "code") {
    const q: WorksheetQuestionText = { id, type: "text", label };
    return q;
  }

  if (node.type === "table") {
    const tableNode = node as Table;
    const headerRow = tableNode.children[0];
    const columns = headerRow.children.map((cell) =>
      extractText(cell as { children?: PhrasingContent[] })
    );
    const rows = tableNode.children
      .slice(1)
      .map((row) =>
        extractText(row.children[0] as { children?: PhrasingContent[] })
      )
      .filter((r) => r.trim() !== "");
    const q: WorksheetQuestionTable = { id, type: "table", label, columns, rows };
    return q;
  }

  if (node.type === "list") {
    const listNode = node as List;
    const options = listNode.children.map((item) => {
      const firstChild = item.children[0] as BlockContent | DefinitionContent;
      return extractText(firstChild as { children?: PhrasingContent[] });
    });
    const q: WorksheetQuestionCheckbox = { id, type: "checkbox", label, options };
    return q;
  }

  const q: WorksheetQuestionShort = { id, type: "short", label };
  return q;
}

export function parseMarkdownToSections(markdown: string): WorksheetSection[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
  const sections: WorksheetSection[] = [];
  let currentSection: WorksheetSection | null = null;
  let pendingQuestionLabel: string | null = null;
  let sectionCounter = 0;
  let questionCounter = 0;

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];

    if (node.type === "heading" && (node as Heading).depth === 2) {
      currentSection = {
        id: `s${++sectionCounter}`,
        title: extractText(node as { children?: PhrasingContent[] }),
        description: "",
        questions: [],
      };
      sections.push(currentSection);
      pendingQuestionLabel = null;
      continue;
    }

    if (!currentSection) continue;

    if (node.type === "paragraph") {
      const text = extractText(node as Paragraph);
      const questionMatch = /^\d+\.\s+([\s\S]+)/.exec(text);
      if (questionMatch) {
        pendingQuestionLabel = questionMatch[1].trim();
        continue;
      }
      if (!pendingQuestionLabel && currentSection.description === "") {
        currentSection.description = text;
        continue;
      }
    }

    if (pendingQuestionLabel !== null) {
      const question = detectQuestionType(
        pendingQuestionLabel,
        node,
        `q${++questionCounter}`
      );
      currentSection.questions.push(question);
      pendingQuestionLabel = null;
    }
  }

  return sections;
}
