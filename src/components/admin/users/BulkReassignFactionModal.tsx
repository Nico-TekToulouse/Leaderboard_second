"use client";

import { Modal, Text, Button, Group, Alert, Select } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import type { UserWithFaction, BulkUsersResult } from "@/types/user";

type Faction = {
  id: string;
  name: string;
  color: string;
};

type BulkReassignFactionModalProps = {
  opened: boolean;
  onClose: () => void;
  onReassigned: (count: number, factionId: string | null) => void;
  users: UserWithFaction[];
  factions: Faction[];
};

export default function BulkReassignFactionModal({
  opened,
  onClose,
  onReassigned,
  users,
  factions,
}: BulkReassignFactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factionId, setFactionId] = useState<string | null>(null);

  const selectData = factions.map((f) => ({ value: f.id, label: f.name }));

  async function handleReassign() {
    if (users.length === 0 || factionId === null) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reassign",
        ids: users.map((u) => u.id),
        faction_id: factionId,
      }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error: string };
      setError(json.error ?? "Impossible de réassigner la faction.");
      setLoading(false);
      return;
    }

    const result = (await res.json()) as BulkUsersResult;
    const confirmedFactionId = factionId;
    setLoading(false);
    setFactionId(null);
    onReassigned(result.affected, confirmedFactionId);
    onClose();
  }

  function handleClose() {
    setError(null);
    setFactionId(null);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Réassigner la faction"
      size="sm"
    >
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="sm">
          {error}
        </Alert>
      )}

      <Text mb="md">
        Choisissez la nouvelle faction pour{" "}
        <Text span fw={700}>
          {users.length} élève(s)
        </Text>{" "}
        sélectionné(s).
      </Text>

      <Select
        label="Nouvelle faction"
        placeholder="Sélectionner une faction…"
        data={selectData}
        value={factionId}
        onChange={setFactionId}
        mb="lg"
        clearable
      />

      <Group justify="flex-end">
        <Button variant="default" onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          loading={loading}
          disabled={factionId === null}
          onClick={handleReassign}
        >
          Réassigner {users.length} élève(s)
        </Button>
      </Group>
    </Modal>
  );
}
