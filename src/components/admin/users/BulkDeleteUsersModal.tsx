"use client";

import { Modal, Text, Button, Group, Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";
import type { UserWithFaction, BulkUsersResult } from "@/types/user";

type BulkDeleteUsersModalProps = {
  opened: boolean;
  onClose: () => void;
  onDeleted: (count: number) => void;
  users: UserWithFaction[];
};

export default function BulkDeleteUsersModal({
  opened,
  onClose,
  onDeleted,
  users,
}: BulkDeleteUsersModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (users.length === 0) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", ids: users.map((u) => u.id) }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error: string };
      setError(json.error ?? "Impossible de supprimer les utilisateurs.");
      setLoading(false);
      return;
    }

    const result = (await res.json()) as BulkUsersResult;
    setLoading(false);
    onDeleted(result.affected);
    onClose();
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Supprimer la sélection"
      size="sm"
    >
      {error && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light" mb="sm">
          {error}
        </Alert>
      )}

      <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light" mb="md">
        Cette action est <strong>irréversible</strong>. Les élèves supprimés ne
        pourront pas être récupérés.
      </Alert>

      <Text mb="lg">
        Vous êtes sur le point de supprimer{" "}
        <Text span fw={700}>
          {users.length} élève(s)
        </Text>
        . Confirmer ?
      </Text>

      <Group justify="flex-end">
        <Button variant="default" onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button color="red" loading={loading} onClick={handleDelete}>
          Supprimer {users.length} élève(s)
        </Button>
      </Group>
    </Modal>
  );
}
