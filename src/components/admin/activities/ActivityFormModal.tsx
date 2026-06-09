"use client";

import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  SegmentedControl,
  Paper,
  Box,
  ThemeIcon,
  Divider,
  Select,
} from "@mantine/core";
import { IconTrophy, IconPlus } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";
import type {
  ActivityWithScores,
  ActivityInsert,
  ScoreMode,
  ScoreRow,
  RankingRow,
  ScoreEntry,
} from "@/types/activity";

type Faction = {
  id: string;
  name: string;
  color: string;
};

type ActivityFormModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
  activity: ActivityWithScores | null;
  factions: Faction[];
};

const POSITION_LABELS = ["1ère place", "2ème place", "3ème place", "4ème place"];

function buildInitialScoreRows(factions: Faction[], activity: ActivityWithScores | null): ScoreRow[] {
  return factions.map((f) => {
    const existing = activity?.scores.find((s) => s.faction_id === f.id);
    return { faction_id: f.id, points: existing?.points ?? "" };
  });
}

function buildInitialRankingRows(factions: Faction[], activity: ActivityWithScores | null): RankingRow[] {
  if (!activity || activity.scores.length === 0) {
    return POSITION_LABELS.map(() => ({ faction_id: "", points: "" }));
  }
  // Sort existing scores descending by points to reconstruct ranking
  const sorted = [...activity.scores].sort((a, b) => b.points - a.points);
  const rows: RankingRow[] = sorted.map((s) => ({
    faction_id: s.faction_id,
    points: s.points,
  }));
  // Fill remaining positions
  while (rows.length < factions.length) {
    rows.push({ faction_id: "", points: "" });
  }
  return rows.slice(0, factions.length);
}

function buildScoresFromMode(
  mode: ScoreMode,
  scoreRows: ScoreRow[],
  rankingRows: RankingRow[]
): ScoreEntry[] {
  if (mode === "per_faction") {
    return scoreRows
      .filter((r) => r.points !== "" && Number(r.points) > 0)
      .map((r) => ({ faction_id: r.faction_id, points: Number(r.points) }));
  }
  return rankingRows
    .filter((r) => r.faction_id !== "" && r.points !== "" && Number(r.points) > 0)
    .map((r) => ({ faction_id: r.faction_id as string, points: Number(r.points) }));
}

export default function ActivityFormModal({
  opened,
  onClose,
  onSaved,
  activity,
  factions,
}: ActivityFormModalProps) {
  const isEdit = activity !== null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<string>("");
  const [maxPoints, setMaxPoints] = useState<number | "">(100);
  const [scoreMode, setScoreMode] = useState<ScoreMode>("per_faction");
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [rankingRows, setRankingRows] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  useEffect(() => {
    if (opened) {
      setName(activity?.name ?? "");
      setDescription(activity?.description ?? "");
      setDate(activity ? activity.date : "");
      setMaxPoints(activity?.max_points ?? 100);
      setScoreMode("per_faction");
      setScoreRows(buildInitialScoreRows(factions, activity));
      setRankingRows(buildInitialRankingRows(factions, activity));
      setErrors({});
    }
  }, [opened, activity, factions]);

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {};
    if (!name.trim()) newErrors.name = "Le nom est requis.";
    if (!date) newErrors.date = "La date est requise.";
    if (maxPoints === "" || Number(maxPoints) < 0) newErrors.maxPoints = "Points max invalide.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);

    const scores = buildScoresFromMode(scoreMode, scoreRows, rankingRows);

    // Check for duplicate factions in ranking mode
    if (scoreMode === "by_ranking") {
      const ids = scores.map((s) => s.faction_id);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        setErrors({ ranking: "Chaque faction ne peut apparaître qu'une seule fois." });
        setLoading(false);
        return;
      }
    }

    const payload: ActivityInsert = {
      name: name.trim(),
      description: description.trim() || null,
      date: date,
      max_points: Number(maxPoints),
      scores,
    };

    const url = isEdit ? `/api/admin/activities/${activity!.id}` : "/api/admin/activities";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      notifications.show({
        title: "Erreur",
        message: data.error ?? "Une erreur est survenue.",
        color: "red",
        autoClose: 4000,
      });
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved();
    onClose();
  }

  function updateScoreRow(index: number, points: number | "") {
    setScoreRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], points };
      return next;
    });
  }

  function updateRankingRow(index: number, field: "faction_id" | "points", value: string | number | "") {
    setRankingRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  const usedFactionIds = rankingRows
    .map((r) => r.faction_id)
    .filter((id): id is string => id !== "");

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="blue" variant="light" size="md">
            <IconTrophy size={16} />
          </ThemeIcon>
          <Text fw={600}>{isEdit ? "Modifier l'Epitech Race" : "Nouvelle Epitech Race"}</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* Champs activité */}
        <TextInput
          label="Nom de l'Epitech Race"
          placeholder="ex: Course d'orientation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        <Textarea
          label="Description"
          placeholder="Description optionnelle…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          autosize
          minRows={2}
          maxRows={4}
        />

        <Group grow>
          <TextInput
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
            required
          />
          <NumberInput
            label="Points maximum"
            placeholder="100"
            value={maxPoints}
            onChange={(v) => setMaxPoints(v === "" ? "" : Number(v))}
            min={0}
            error={errors.maxPoints}
            required
          />
        </Group>

        <Divider label="Attribution des points" labelPosition="center" />

        {/* Mode de scoring */}
        <Stack gap="xs">
          <Text fz="sm" fw={500}>
            Mode d&apos;attribution
          </Text>
          <SegmentedControl
            value={scoreMode}
            onChange={(v) => setScoreMode(v as ScoreMode)}
            data={[
              { label: "Par faction", value: "per_faction" },
              { label: "Par classement", value: "by_ranking" },
            ]}
            fullWidth
          />
        </Stack>

        {/* Mode Par faction */}
        {scoreMode === "per_faction" && (
          <Stack gap="xs">
            <Text fz="xs" c="dimmed">
              Entrez les points pour chaque faction (laisser vide si la faction ne gagne rien).
            </Text>
            {factions.map((faction, i) => (
              <Paper key={faction.id} withBorder p="sm" radius="md">
                <Group gap="sm" align="center">
                  <Box
                    w={12}
                    h={12}
                    style={{ borderRadius: "50%", background: faction.color, flexShrink: 0 }}
                  />
                  <Text fz="sm" fw={500} style={{ flex: 1 }}>
                    {faction.name}
                  </Text>
                  <NumberInput
                    placeholder="Points"
                    value={scoreRows[i]?.points ?? ""}
                    onChange={(v) => updateScoreRow(i, v === "" ? "" : Number(v))}
                    min={0}
                    w={120}
                    size="sm"
                    rightSection={<Text fz="xs" c="dimmed">pts</Text>}
                  />
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Mode Par classement */}
        {scoreMode === "by_ranking" && (
          <Stack gap="xs">
            <Text fz="xs" c="dimmed">
              Sélectionnez la faction pour chaque position et entrez les points correspondants.
            </Text>
            {errors.ranking && (
              <Text fz="xs" c="red">
                {errors.ranking}
              </Text>
            )}
            {rankingRows.map((row, i) => (
              <Paper key={i} withBorder p="sm" radius="md">
                <Group gap="sm" align="center">
                  <ThemeIcon
                    size="sm"
                    radius="xl"
                    color={i === 0 ? "yellow" : i === 1 ? "gray" : i === 2 ? "orange" : "dimmed"}
                    variant="filled"
                  >
                    <Text fz={10} fw={700}>
                      {i + 1}
                    </Text>
                  </ThemeIcon>
                  <Text fz="xs" c="dimmed" w={80}>
                    {POSITION_LABELS[i]}
                  </Text>
                  <Select
                    placeholder="Faction…"
                    value={row.faction_id || null}
                    onChange={(v) => updateRankingRow(i, "faction_id", v ?? "")}
                    data={factions.map((f) => ({
                      value: f.id,
                      label: f.name,
                      disabled: usedFactionIds.includes(f.id) && f.id !== row.faction_id,
                    }))}
                    clearable
                    style={{ flex: 1 }}
                    size="sm"
                  />
                  <NumberInput
                    placeholder="Points"
                    value={row.points}
                    onChange={(v) => updateRankingRow(i, "points", v === "" ? "" : Number(v))}
                    min={0}
                    w={120}
                    size="sm"
                    rightSection={<Text fz="xs" c="dimmed">pts</Text>}
                  />
                </Group>
              </Paper>
            ))}
          </Stack>
        )}

        <Group justify="flex-end" gap="sm" mt="sm">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            leftSection={<IconPlus size={16} />}
          >
            {isEdit ? "Enregistrer" : "Créer l'Epitech Race"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
