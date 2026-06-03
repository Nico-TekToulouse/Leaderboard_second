"use client";

import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  Alert,
  Group,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import type { UserWithFaction, UserInsert } from "@/types/user";

type Faction = {
  id: string;
  name: string;
  color: string;
};

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  faction_id: string | null;
};

type UserFormModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: UserWithFaction | null;
  factions: Faction[];
};

const EMPTY_FORM: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  faction_id: null,
};

export default function UserFormModal({
  opened,
  onClose,
  onSaved,
  user,
  factions,
}: UserFormModalProps) {
  const isEdit = user !== null;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setError(null);
      setForm(
        user
          ? {
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              faction_id: user.faction_id,
            }
          : EMPTY_FORM
      );
    }
  }, [opened, user]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: UserInsert = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim().toLowerCase(),
      faction_id: form.faction_id,
    };

    const url = isEdit ? `/api/admin/users/${user!.id}` : "/api/admin/users";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error: string };
      setError(json.error ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved();
    onClose();
  }

  const factionOptions = factions.map((f) => ({ value: f.id, label: f.name }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {error}
            </Alert>
          )}

          <Group grow>
            <TextInput
              label="Prénom"
              placeholder="Marie"
              required
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
            />
            <TextInput
              label="Nom"
              placeholder="Dupont"
              required
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
            />
          </Group>

          <TextInput
            label="Email"
            type="email"
            placeholder="marie.dupont@epitech.eu"
            required
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
          />

          <Select
            label="Faction"
            placeholder="Choisir une faction"
            clearable
            data={factionOptions}
            value={form.faction_id}
            onChange={(v) => setField("faction_id", v)}
          />

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
