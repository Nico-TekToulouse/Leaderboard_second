"use client";

import {
  Modal,
  Stack,
  Text,
  Group,
  Button,
  Badge,
  ScrollArea,
  SegmentedControl,
  Alert,
  Divider,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import type {
  DuplicateConflict,
  DuplicateResolution,
  ImportRow,
  ImportApiResult,
} from "@/types/user";

type DuplicateResolutionModalProps = {
  opened: boolean;
  onClose: () => void;
  onResolved: (count: number) => void;
  duplicates: DuplicateConflict[];
  allRows: ImportRow[];
};

export default function DuplicateResolutionModal({
  opened,
  onClose,
  onResolved,
  duplicates,
  allRows,
}: DuplicateResolutionModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, "replace" | "ignore">>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setResolution(email: string, action: "replace" | "ignore") {
    setResolutions((prev) => ({ ...prev, [email]: action }));
  }

  const allResolved = duplicates.every((d) => resolutions[d.incoming.email] !== undefined);

  async function handleConfirm() {
    setLoading(true);
    setError(null);

    const resolutionList: DuplicateResolution[] = Object.entries(resolutions).map(
      ([email, action]) => ({ email, action })
    );

    const res = await fetch("/api/admin/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: allRows, resolutions: resolutionList }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error: string };
      setError(json.error ?? "Erreur lors de l'import.");
      setLoading(false);
      return;
    }

    const result = (await res.json()) as ImportApiResult;

    // If there are still unresolved duplicates (shouldn't happen), report error
    if (result.duplicates.length > 0) {
      setError("Des doublons non résolus subsistent. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setResolutions({});
    onResolved(result.inserted);
    onClose();
  }

  function handleClose() {
    setResolutions({});
    setError(null);
    onClose();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Doublons détectés (${duplicates.length})`}
      size="lg"
    >
      <Stack gap="md">
        <Text fz="sm" c="dimmed">
          Les utilisateurs suivants existent déjà. Choisissez pour chacun si vous souhaitez
          remplacer les données existantes ou ignorer la ligne importée.
        </Text>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        <ScrollArea h={350}>
          <Stack gap="sm">
            {duplicates.map((conflict, i) => {
              const { incoming, existing } = conflict;
              const resolution = resolutions[incoming.email];

              return (
                <Stack key={incoming.email} gap="xs">
                  {i > 0 && <Divider />}

                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text fz="sm" fw={600}>
                        {incoming.email}
                      </Text>
                      <Group gap="xs">
                        <Badge size="xs" color="gray" variant="outline">
                          Existant
                        </Badge>
                        <Text fz="xs" c="dimmed">
                          {existing.first_name} {existing.last_name}
                          {existing.faction ? ` — ${existing.faction.name}` : ""}
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <Badge size="xs" color="blue" variant="outline">
                          Importé
                        </Badge>
                        <Text fz="xs" c="dimmed">
                          {incoming.first_name} {incoming.last_name}
                        </Text>
                      </Group>
                    </Stack>

                    <SegmentedControl
                      size="xs"
                      value={resolution ?? ""}
                      onChange={(v) =>
                        setResolution(incoming.email, v as "replace" | "ignore")
                      }
                      data={[
                        { value: "replace", label: "Remplacer" },
                        { value: "ignore", label: "Ignorer" },
                      ]}
                    />
                  </Group>
                </Stack>
              );
            })}
          </Stack>
        </ScrollArea>

        <Group justify="space-between">
          <Group gap="xs">
            <Button
              size="xs"
              variant="subtle"
              onClick={() => {
                const all: Record<string, "replace" | "ignore"> = {};
                duplicates.forEach((d) => { all[d.incoming.email] = "ignore"; });
                setResolutions(all);
              }}
            >
              Tout ignorer
            </Button>
            <Button
              size="xs"
              variant="subtle"
              onClick={() => {
                const all: Record<string, "replace" | "ignore"> = {};
                duplicates.forEach((d) => { all[d.incoming.email] = "replace"; });
                setResolutions(all);
              }}
            >
              Tout remplacer
            </Button>
          </Group>

          <Group>
            <Button variant="default" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              loading={loading}
              disabled={!allResolved}
              onClick={handleConfirm}
            >
              Confirmer
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
