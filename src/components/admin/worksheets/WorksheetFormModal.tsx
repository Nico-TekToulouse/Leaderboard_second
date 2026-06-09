"use client";

import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Alert,
  Tabs,
  Accordion,
  Badge,
  ActionIcon,
  Text,
  Select,
  Paper,
  Divider,
  FileButton,
  Loader,
} from "@mantine/core";
import { IconAlertCircle, IconPlus, IconTrash, IconGripVertical, IconPaperclip, IconX } from "@tabler/icons-react";
import { useState, useRef, useEffect } from "react";
import type {
  Worksheet,
  WorksheetSection,
  WorksheetQuestion,
  WorksheetQuestionType,
  WorksheetFaction,
  SectionResource,
} from "@/types/worksheet";
import { parseMarkdownToSections } from "@/lib/worksheet-parser";

type WorksheetFormModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: (saved: Worksheet) => void;
  worksheet: Worksheet | null;
  factions: WorksheetFaction[];
};

const QUESTION_TYPE_LABELS: Record<WorksheetQuestionType, string> = {
  text: "Texte libre",
  table: "Tableau",
  checkbox: "Cases à cocher",
  short: "Texte court",
};

const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

function createDefaultQuestion(type: WorksheetQuestionType, id: string): WorksheetQuestion {
  switch (type) {
    case "text":
      return { id, type: "text", label: "" };
    case "table":
      return { id, type: "table", label: "", columns: ["Colonne 1", "Colonne 2"], rows: ["Ligne 1"] };
    case "checkbox":
      return { id, type: "checkbox", label: "", options: ["Option 1", "Option 2"] };
    case "short":
      return { id, type: "short", label: "" };
  }
}

let idCounter = Date.now();
function nextId() {
  return `q${++idCounter}`;
}
function nextSectionId() {
  return `s${++idCounter}`;
}

export default function WorksheetFormModal({
  opened,
  onClose,
  onSaved,
  worksheet,
  factions,
}: WorksheetFormModalProps) {
  const isEditing = worksheet !== null;

  const [activeTab, setActiveTab] = useState<string>("import");
  const [title, setTitle] = useState(worksheet?.title ?? "");
  const [description, setDescription] = useState(worksheet?.description ?? "");
  const [isActive, setIsActive] = useState(worksheet?.is_active ?? false);
  const [sections, setSections] = useState<WorksheetSection[]>(worksheet?.sections ?? []);
  const [markdownInput, setMarkdownInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Clé composite sectionId:factionId en cours d'upload */
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const resetFileRef = useRef<() => void>(null);

  // Resynchronise l'état depuis `worksheet` à chaque ouverture du modal.
  // Nécessaire car le composant reste monté en permanence (seul `opened` change),
  // donc les initialiseurs useState ne s'exécutent qu'une seule fois (worksheet = null).
  useEffect(() => {
    if (!opened) return;
    setTitle(worksheet?.title ?? "");
    setDescription(worksheet?.description ?? "");
    setIsActive(worksheet?.is_active ?? false);
    setSections(worksheet?.sections ?? []);
    setMarkdownInput("");
    setError(null);
    setActiveTab(worksheet ? "editor" : "import");
  }, [opened, worksheet]);

  function reset() {
    setTitle(worksheet?.title ?? "");
    setDescription(worksheet?.description ?? "");
    setIsActive(worksheet?.is_active ?? false);
    setSections(worksheet?.sections ?? []);
    setMarkdownInput("");
    setError(null);
    setActiveTab("import");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleParseMarkdown() {
    if (!markdownInput.trim()) return;
    const parsed = parseMarkdownToSections(markdownInput);
    setSections(parsed);
    setActiveTab("editor");
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      { id: nextSectionId(), title: "Nouvelle section", description: "", questions: [] },
    ]);
  }

  function removeSection(sectionId: string) {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  function updateSection(sectionId: string, patch: Partial<Pick<WorksheetSection, "title" | "description">>) {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s))
    );
  }

  function addQuestion(sectionId: string) {
    const q = createDefaultQuestion("text", nextId());
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, questions: [...s.questions, q] } : s
      )
    );
  }

  function removeQuestion(sectionId: string, questionId: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      )
    );
  }

  function updateQuestion(sectionId: string, questionId: string, patch: Partial<WorksheetQuestion>) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? ({ ...q, ...patch } as WorksheetQuestion) : q
              ),
            }
          : s
      )
    );
  }

  function changeQuestionType(sectionId: string, questionId: string, newType: WorksheetQuestionType) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              questions: s.questions.map((q) =>
                q.id === questionId ? createDefaultQuestion(newType, questionId) : q
              ),
            }
          : s
      )
    );
  }

  async function handleUploadGlobalFile(sectionId: string, file: File) {
    const key = `${sectionId}:__global__`;
    setUploadingKey(key);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/worksheets/upload", { method: "POST", body: form });
    setUploadingKey(null);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Erreur lors de l'upload.");
      return;
    }
    const resource = (await res.json()) as SectionResource;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, resources: [...(s.resources ?? []), resource] };
      })
    );
  }

  async function handleRemoveGlobalFile(sectionId: string, url: string) {
    await fetch("/api/admin/worksheets/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, resources: (s.resources ?? []).filter((r) => r.url !== url) };
      })
    );
  }

  async function handleUploadFactionFile(sectionId: string, factionId: string, file: File) {
    const key = `${sectionId}:${factionId}`;
    setUploadingKey(key);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/worksheets/upload", { method: "POST", body: form });
    setUploadingKey(null);
    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setError(body.error ?? "Erreur lors de l'upload.");
      return;
    }
    const resource = (await res.json()) as SectionResource;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const existing = s.resourcesByFaction ?? {};
        const currentList = existing[factionId] ?? [];
        return {
          ...s,
          resourcesByFaction: {
            ...existing,
            [factionId]: [...currentList, resource],
          },
        };
      })
    );
  }

  async function handleRemoveFactionFile(sectionId: string, factionId: string, url: string) {
    await fetch("/api/admin/worksheets/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const existing = s.resourcesByFaction ?? {};
        const filtered = (existing[factionId] ?? []).filter((r) => r.url !== url);
        const updated = { ...existing, [factionId]: filtered };
        return { ...s, resourcesByFaction: updated };
      })
    );
  }

  async function handleSubmit() {
    setError(null);

    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }

    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      is_active: isActive,
      sections,
    };

    const res = isEditing
      ? await fetch(`/api/admin/worksheets/${worksheet.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/admin/worksheets", {
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

    const saved = (await res.json()) as Worksheet;
    setSubmitting(false);
    reset();
    onSaved(saved);
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={isEditing ? "Modifier le worksheet" : "Nouveau worksheet"}
      size="xl"
    >
      <Stack gap="sm">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <TextInput
          label="Titre"
          placeholder="Mission Prévisionniste"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Description courte de l'activité (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={2}
          autosize
        />

        <Switch
          label="Activer ce worksheet (visible par les stagiaires)"
          checked={isActive}
          onChange={(e) => setIsActive(e.currentTarget.checked)}
        />

        <Divider my="xs" />

        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? "import")}>
          <Tabs.List>
            <Tabs.Tab value="import">Import markdown</Tabs.Tab>
            <Tabs.Tab value="editor">
              Éditeur{" "}
              {sections.length > 0 && (
                <Badge size="xs" ml={4} color="violet">
                  {sections.length} section{sections.length > 1 ? "s" : ""}
                </Badge>
              )}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="import" pt="sm">
            <Stack gap="sm">
              <Text fz="sm" c="dimmed">
                Collez votre contenu markdown ci-dessous. Le parser va extraire automatiquement les sections et questions.
              </Text>
              <Textarea
                placeholder="# Titre&#10;&#10;## Partie 1 - ...&#10;&#10;**1.** Question..."
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.currentTarget.value)}
                minRows={10}
                autosize
                styles={{ input: { fontFamily: "monospace", fontSize: 13 } }}
              />
              <Button
                variant="light"
                onClick={handleParseMarkdown}
                disabled={!markdownInput.trim()}
              >
                Parser le markdown → passer à l&apos;éditeur
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="editor" pt="sm">
            <Stack gap="md">
              {sections.length === 0 && (
                <Text c="dimmed" fz="sm" ta="center">
                  Aucune section. Importez un markdown ou ajoutez une section manuellement.
                </Text>
              )}

              <Accordion variant="separated" multiple>
                {sections.map((section, sIdx) => (
                  <Accordion.Item key={section.id} value={section.id}>
                    <Accordion.Control>
                      <Group gap="xs">
                        <IconGripVertical size={14} color="gray" />
                        <Text fz="sm" fw={500}>{section.title || `Section ${sIdx + 1}`}</Text>
                        <Badge size="xs" color="gray" variant="light">
                          {section.questions.length} question{section.questions.length !== 1 ? "s" : ""}
                        </Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <Stack gap="sm">
                        <TextInput
                          label="Titre de la section"
                          value={section.title}
                          onChange={(e) => updateSection(section.id, { title: e.currentTarget.value })}
                          size="sm"
                        />
                        <Textarea
                          label="Description"
                          value={section.description}
                          onChange={(e) => updateSection(section.id, { description: e.currentTarget.value })}
                          minRows={2}
                          autosize
                          size="sm"
                        />

                        <Divider label="Fichier(s) commun(s) — toutes factions (optionnel)" labelPosition="left" my={4} />
                        <Paper p="xs" withBorder radius="sm">
                          <Stack gap={6}>
                            {(section.resources ?? []).map((resource) => (
                              <Group key={resource.url} gap="xs" align="center">
                                <IconPaperclip size={12} />
                                <Text fz="xs" style={{ flex: 1 }} truncate>
                                  {resource.name}
                                </Text>
                                <ActionIcon
                                  size="xs"
                                  color="red"
                                  variant="subtle"
                                  onClick={() => handleRemoveGlobalFile(section.id, resource.url)}
                                >
                                  <IconX size={12} />
                                </ActionIcon>
                              </Group>
                            ))}
                            <FileButton
                              resetRef={resetFileRef}
                              onChange={(file) => file && handleUploadGlobalFile(section.id, file)}
                              accept="*/*"
                            >
                              {(props) => {
                                const globalKey = `${section.id}:__global__`;
                                const isUploading = uploadingKey === globalKey;
                                return (
                                  <Button
                                    {...props}
                                    size="xs"
                                    variant="subtle"
                                    w="fit-content"
                                    leftSection={
                                      isUploading
                                        ? <Loader size={12} />
                                        : <IconPaperclip size={13} />
                                    }
                                    disabled={isUploading}
                                  >
                                    {isUploading ? "Upload…" : "Joindre un fichier commun"}
                                  </Button>
                                );
                              }}
                            </FileButton>
                          </Stack>
                        </Paper>

                        <Divider label="Fichiers par faction (optionnel)" labelPosition="left" my={4} />
                        <Stack gap="xs">
                          {factions.map((faction) => {
                            const factionFiles = section.resourcesByFaction?.[faction.id] ?? [];
                            const uploadKey = `${section.id}:${faction.id}`;
                            const isUploading = uploadingKey === uploadKey;
                            return (
                              <Paper key={faction.id} p="xs" withBorder radius="sm">
                                <Stack gap={6}>
                                  <Group gap="xs" align="center">
                                    <span
                                      style={{
                                        display: "inline-block",
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        background: faction.color,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Text fz="xs" fw={500}>{faction.name}</Text>
                                  </Group>
                                  {factionFiles.map((resource) => (
                                    <Group key={resource.url} gap="xs" align="center" ml={18}>
                                      <IconPaperclip size={12} />
                                      <Text fz="xs" style={{ flex: 1 }} truncate>
                                        {resource.name}
                                      </Text>
                                      <ActionIcon
                                        size="xs"
                                        color="red"
                                        variant="subtle"
                                        onClick={() => handleRemoveFactionFile(section.id, faction.id, resource.url)}
                                      >
                                        <IconX size={12} />
                                      </ActionIcon>
                                    </Group>
                                  ))}
                                  <FileButton
                                    resetRef={resetFileRef}
                                    onChange={(file) => file && handleUploadFactionFile(section.id, faction.id, file)}
                                    accept="*/*"
                                  >
                                    {(props) => (
                                      <Button
                                        {...props}
                                        size="xs"
                                        variant="subtle"
                                        ml={18}
                                        w="fit-content"
                                        leftSection={
                                          isUploading
                                            ? <Loader size={12} />
                                            : <IconPaperclip size={13} />
                                        }
                                        disabled={isUploading}
                                      >
                                        {isUploading ? "Upload…" : "Joindre un fichier"}
                                      </Button>
                                    )}
                                  </FileButton>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>

                        <Text fz="xs" fw={500} c="dimmed" mt="xs">
                          QUESTIONS
                        </Text>

                        {section.questions.map((q, qIdx) => (
                          <Paper key={q.id} p="sm" withBorder radius="sm">
                            <Stack gap="xs">
                              <Group justify="space-between" align="center">
                                <Text fz="xs" c="dimmed">Question {qIdx + 1}</Text>
                                <Group gap="xs">
                                  <Select
                                    size="xs"
                                    data={QUESTION_TYPE_OPTIONS}
                                    value={q.type}
                                    onChange={(v) => changeQuestionType(section.id, q.id, (v as WorksheetQuestionType) ?? "text")}
                                    w={140}
                                  />
                                  <ActionIcon
                                    size="sm"
                                    color="red"
                                    variant="subtle"
                                    onClick={() => removeQuestion(section.id, q.id)}
                                  >
                                    <IconTrash size={14} />
                                  </ActionIcon>
                                </Group>
                              </Group>

                              <TextInput
                                placeholder="Libellé de la question"
                                value={q.label}
                                onChange={(e) => updateQuestion(section.id, q.id, { label: e.currentTarget.value })}
                                size="sm"
                              />

                              {q.type === "table" && (
                                <Stack gap="xs">
                                  <TextInput
                                    label="Colonnes (séparées par |)"
                                    value={q.columns.join(" | ")}
                                    onChange={(e) =>
                                      updateQuestion(section.id, q.id, {
                                        columns: e.currentTarget.value.split("|").map((c) => c.trim()).filter(Boolean),
                                      })
                                    }
                                    size="xs"
                                  />
                                  <TextInput
                                    label="Lignes / labels (séparés par |)"
                                    value={q.rows.join(" | ")}
                                    onChange={(e) =>
                                      updateQuestion(section.id, q.id, {
                                        rows: e.currentTarget.value.split("|").map((r) => r.trim()).filter(Boolean),
                                      })
                                    }
                                    size="xs"
                                  />
                                </Stack>
                              )}

                              {q.type === "checkbox" && (
                                <Textarea
                                  label="Options (une par ligne)"
                                  value={q.options.join("\n")}
                                  onChange={(e) =>
                                    updateQuestion(section.id, q.id, {
                                      options: e.currentTarget.value.split("\n").map((o) => o.trim()).filter(Boolean),
                                    })
                                  }
                                  size="xs"
                                  minRows={3}
                                  autosize
                                />
                              )}
                            </Stack>
                          </Paper>
                        ))}

                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={13} />}
                          onClick={() => addQuestion(section.id)}
                        >
                          Ajouter une question
                        </Button>

                        <Button
                          size="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<IconTrash size={13} />}
                          onClick={() => removeSection(section.id)}
                        >
                          Supprimer cette section
                        </Button>
                      </Stack>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>

              <Button
                variant="light"
                color="violet"
                leftSection={<IconPlus size={15} />}
                onClick={addSection}
              >
                Ajouter une section
              </Button>
            </Stack>
          </Tabs.Panel>
        </Tabs>

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
