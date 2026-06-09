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
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
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

  function reset() {
    setCategory(entry?.category ?? defaultCategory ?? "rules");
    setTitle(entry?.title ?? "");
    setContent(entry?.content ?? "");
    setUrl(entry?.url ?? "");
    setOrder(entry?.order ?? 0);
    setError(null);
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

        <Textarea
          label="Description"
          placeholder="Détails supplémentaires (optionnel)"
          value={content}
          onChange={(e) => setContent(e.currentTarget.value)}
          minRows={3}
          autosize
        />

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
