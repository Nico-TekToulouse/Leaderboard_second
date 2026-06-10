"use client";

import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Button,
  Group,
  Alert,
  Tabs,
  FileButton,
  Text,
} from "@mantine/core";
import { IconAlertCircle, IconUpload, IconMarkdown } from "@tabler/icons-react";
import { useState, useEffect, useRef } from "react";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { InfoEntry, InfoEntryInsert, InfoCategory } from "@/types/info";

type InfoFormModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: (entry: InfoEntry) => void;
  entry: InfoEntry | null;
  defaultCategory?: InfoCategory;
};

const CATEGORY_OPTIONS = [
  { value: "rules", label: "Règlement intérieur" },
  { value: "sanctions", label: "Rappel des sanctions" },
  { value: "discord", label: "Discord" },
];

type MarkdownPreview = string;

async function buildMarkdownPreview(markdown: string): Promise<MarkdownPreview> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(markdown);
  return String(result);
}

export default function InfoFormModal({
  opened,
  onClose,
  onSaved,
  entry,
  defaultCategory,
}: InfoFormModalProps) {
  const isEditing = entry !== null;

  const [category, setCategory] = useState<InfoCategory>(
    entry?.category ?? defaultCategory ?? "rules"
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [url, setUrl] = useState(entry?.url ?? "");
  const [order, setOrder] = useState<number>(entry?.order ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mdTab, setMdTab] = useState<string>("edit");
  const [previewHtml, setPreviewHtml] = useState<MarkdownPreview>("");
  const resetFileRef = useRef<() => void>(null);

  useEffect(() => {
    if (opened) {
      setCategory(entry?.category ?? defaultCategory ?? "rules");
      setTitle(entry?.title ?? "");
      setContent(entry?.content ?? "");
      setUrl(entry?.url ?? "");
      setOrder(entry?.order ?? 0);
      setError(null);
      setMdTab("edit");
      setPreviewHtml("");
      resetFileRef.current?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  function reset() {
    setCategory(entry?.category ?? defaultCategory ?? "rules");
    setTitle(entry?.title ?? "");
    setContent(entry?.content ?? "");
    setUrl(entry?.url ?? "");
    setOrder(entry?.order ?? 0);
    setError(null);
    setMdTab("edit");
    setPreviewHtml("");
    resetFileRef.current?.();
  }

  async function handleTabChange(tab: string | null) {
    const next = tab ?? "edit";
    if (next === "preview") {
      setPreviewHtml(await buildMarkdownPreview(content));
    }
    setMdTab(next);
  }

  function handleFileUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setContent(text);
        setMdTab("edit");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit() {
    setError(null);

    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }

    setSubmitting(true);

    const payload: InfoEntryInsert = {
      category,
      title: title.trim(),
      content: content.trim(),
      url: category === "discord" ? url.trim() || null : null,
      order,
    };

    const res = isEditing
      ? await fetch(`/api/admin/info/${entry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    const saved = (await res.json()) as InfoEntry;
    setSubmitting(false);
    handleClose();
    onSaved(saved);
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditing ? "Modifier l'entrée" : "Nouvelle entrée"}
      size="md"
    >
      <Stack gap="sm">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <Select
          label="Catégorie"
          data={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => setCategory((v as InfoCategory) ?? "rules")}
          required
        />

        <TextInput
          label="Titre"
          placeholder={category === "discord" ? "Serveur Discord Epitech" : "Titre de la règle"}
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
        />

        {category === "rules" ? (
          <Stack gap={4}>
            <Group justify="space-between" align="flex-end">
              <Text fz="sm" fw={500}>
                Contenu (markdown)
              </Text>
              <FileButton
                resetRef={resetFileRef}
                onChange={handleFileUpload}
                accept=".md,.markdown,text/markdown,text/plain"
              >
                {(props) => (
                  <Button
                    {...props}
                    size="xs"
                    variant="light"
                    leftSection={<IconUpload size={14} />}
                  >
                    Importer un fichier .md
                  </Button>
                )}
              </FileButton>
            </Group>

            <Tabs value={mdTab} onChange={handleTabChange}>
              <Tabs.List>
                <Tabs.Tab value="edit" leftSection={<IconMarkdown size={14} />}>
                  Éditer
                </Tabs.Tab>
                <Tabs.Tab value="preview">Aperçu</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="edit" pt="xs">
                <Textarea
                  placeholder={"# Titre du règlement\n\n## Article 1\n\nContenu..."}
                  value={content}
                  onChange={(e) => setContent(e.currentTarget.value)}
                  minRows={8}
                  autosize
                  styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
                />
                <Text fz="xs" c="dimmed" mt={4}>
                  Markdown supporté : titres, listes, **gras**, tableaux…
                </Text>
              </Tabs.Panel>

              <Tabs.Panel value="preview" pt="xs">
                {previewHtml ? (
                  <div
                    style={{
                      border: "1px solid var(--mantine-color-default-border)",
                      borderRadius: "var(--mantine-radius-sm)",
                      padding: "var(--mantine-spacing-sm)",
                      minHeight: 120,
                      fontSize: 14,
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <Text fz="sm" c="dimmed" ta="center" py="md">
                    Aucun contenu à prévisualiser.
                  </Text>
                )}
              </Tabs.Panel>
            </Tabs>
          </Stack>
        ) : (
          <Textarea
            label="Description"
            placeholder="Détails supplémentaires (optionnel)"
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            minRows={3}
            autosize
          />
        )}

        {category === "discord" && (
          <TextInput
            label="Lien d'invitation"
            placeholder="https://discord.gg/..."
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
          />
        )}

        <NumberInput
          label="Ordre d'affichage"
          value={order}
          onChange={(v) => setOrder(typeof v === "number" ? v : 0)}
          min={0}
        />

        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" onClick={handleClose} disabled={submitting}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
