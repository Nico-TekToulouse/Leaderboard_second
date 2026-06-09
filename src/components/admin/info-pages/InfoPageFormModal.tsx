"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
} from "@mantine/core";
import type { InfoPage, InfoPageInsert } from "@/types/info-page";

type InfoPageFormModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: (page: InfoPage) => void;
  page: InfoPage | null;
};

type FormState = {
  title: string;
  content: string;
};

type FormError = {
  title: string | null;
};

export default function InfoPageFormModal({
  opened,
  onClose,
  onSaved,
  page,
}: InfoPageFormModalProps) {
  const isEditing = page !== null;

  const [form, setForm] = useState<FormState>({ title: "", content: "" });
  const [errors, setErrors] = useState<FormError>({ title: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (opened) {
      setForm({
        title: page?.title ?? "",
        content: page?.content ?? "",
      });
      setErrors({ title: null });
    }
  }, [opened, page]);

  async function handleSubmit() {
    if (!form.title.trim()) {
      setErrors({ title: "Le titre est requis." });
      return;
    }
    setErrors({ title: null });
    setLoading(true);

    const payload: InfoPageInsert = {
      title: form.title.trim(),
      content: form.content.trim(),
    };

    const url = isEditing
      ? `/api/admin/info-pages/${page.id}`
      : "/api/admin/info-pages";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error: string };
        setErrors({ title: json.error ?? "Une erreur est survenue." });
        return;
      }

      const saved = (await res.json()) as InfoPage;
      onSaved(saved);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? "Modifier la page" : "Nouvelle page d'information"}
      centered
      size="md"
    >
      <Stack gap="md">
        <TextInput
          label="Titre"
          placeholder="Ex : Consignes du jour"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          error={errors.title}
        />

        <Textarea
          label="Contenu"
          placeholder="Écris ici le contenu de la page…"
          autosize
          minRows={4}
          maxRows={12}
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {isEditing ? "Enregistrer" : "Créer"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
