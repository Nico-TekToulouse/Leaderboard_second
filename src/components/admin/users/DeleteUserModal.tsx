"use client";

import { Modal, Text, Button, Group, Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import type { UserWithFaction } from "@/types/user";

type DeleteUserModalProps = {
  opened: boolean;
  onClose: () => void;
  onDeleted: () => void;
  user: UserWithFaction | null;
};

export default function DeleteUserModal({
  opened,
  onClose,
  onDeleted,
  user,
}: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!user) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });

    if (!res.ok) {
      const json = (await res.json()) as { error: string };
      setError(json.error ?? "Impossible de supprimer l'utilisateur.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onDeleted();
    onClose();
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Modal opened={opened} onClose={handleClose} title="Supprimer l'utilisateur" size="sm">
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="sm">
          {error}
        </Alert>
      )}

      {user && (
        <Text mb="lg">
          Voulez-vous supprimer{" "}
          <Text span fw={600}>
            {user.first_name} {user.last_name}
          </Text>{" "}
          ({user.email}) ? Cette action est irréversible.
        </Text>
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button color="red" loading={loading} onClick={handleDelete}>
          Supprimer
        </Button>
      </Group>
    </Modal>
  );
}
