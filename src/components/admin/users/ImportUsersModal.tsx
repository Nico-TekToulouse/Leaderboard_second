"use client";

import {
  Modal,
  Button,
  Stack,
  Text,
  Alert,
  Group,
  List,
  ListItem,
  Progress,
  Badge,
  ScrollArea,
  Divider,
  Code,
  ThemeIcon,
  Paper,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import {
  IconAlertCircle,
  IconUpload,
  IconCheck,
  IconFileImport,
  IconX,
  IconFile,
} from "@tabler/icons-react";
import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type {
  ImportRow,
  ParseError,
  ParsedFileResult,
  ImportApiResult,
  DuplicateConflict,
} from "@/types/user";

type Faction = {
  id: string;
  name: string;
};

type ImportUsersModalProps = {
  opened: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
  factions: Faction[];
  onDuplicatesFound: (
    duplicates: DuplicateConflict[],
    rows: ImportRow[]
  ) => void;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCEPTED_MIME = [
  "application/json",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

function normalizeRow(
  raw: Record<string, string>,
  rowIndex: number,
  factionsByName: Map<string, string>
): { row: ImportRow | null; errors: ParseError[] } {
  const errors: ParseError[] = [];

  const first_name = (
    raw["prénom"] ??
    raw["prenom"] ??
    raw["first_name"] ??
    raw["firstname"] ??
    ""
  ).trim();
  const last_name = (
    raw["nom"] ??
    raw["last_name"] ??
    raw["lastname"] ??
    ""
  ).trim();
  const email = (raw["email"] ?? raw["mail"] ?? "").trim().toLowerCase();
  const factionRaw = (raw["faction"] ?? "").trim();

  if (!first_name) errors.push({ rowIndex, field: "prénom", message: "Champ obligatoire manquant." });
  if (!last_name) errors.push({ rowIndex, field: "nom", message: "Champ obligatoire manquant." });
  if (!email) {
    errors.push({ rowIndex, field: "email", message: "Champ obligatoire manquant." });
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({ rowIndex, field: "email", message: `Format invalide : "${email}".` });
  }

  if (errors.length > 0) return { row: null, errors };

  const faction_id = factionRaw ? (factionsByName.get(factionRaw.toLowerCase()) ?? null) : null;

  return {
    row: { first_name, last_name, email, faction_id, rowIndex },
    errors: [],
  };
}

function parseJSON(text: string, factionsByName: Map<string, string>): ParsedFileResult {
  const rows: ImportRow[] = [];
  const errors: ParseError[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { rows: [], errors: [{ rowIndex: 0, field: "fichier", message: "JSON invalide." }] };
  }

  if (!Array.isArray(parsed)) {
    return { rows: [], errors: [{ rowIndex: 0, field: "fichier", message: "Le JSON doit être un tableau d'objets." }] };
  }

  parsed.forEach((item: unknown, i) => {
    if (typeof item !== "object" || item === null) {
      errors.push({ rowIndex: i + 1, field: "ligne", message: "L'élément n'est pas un objet." });
      return;
    }
    const { row, errors: rowErrors } = normalizeRow(item as Record<string, string>, i + 1, factionsByName);
    if (row) rows.push(row);
    errors.push(...rowErrors);
  });

  return { rows, errors };
}

function parseCSV(text: string, factionsByName: Map<string, string>): ParsedFileResult {
  const rows: ImportRow[] = [];
  const errors: ParseError[] = [];

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
  });

  result.errors.forEach((e) => {
    errors.push({ rowIndex: e.row ?? 0, field: "csv", message: e.message });
  });

  result.data.forEach((item, i) => {
    const { row, errors: rowErrors } = normalizeRow(item, i + 1, factionsByName);
    if (row) rows.push(row);
    errors.push(...rowErrors);
  });

  return { rows, errors };
}

function parseXLSX(buffer: ArrayBuffer, factionsByName: Map<string, string>): ParsedFileResult {
  const rows: ImportRow[] = [];
  const errors: ParseError[] = [];

  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });

  data.forEach((item, i) => {
    const normalized = Object.fromEntries(
      Object.entries(item).map(([k, v]) => [k.toLowerCase().trim(), v])
    );
    const { row, errors: rowErrors } = normalizeRow(normalized, i + 1, factionsByName);
    if (row) rows.push(row);
    errors.push(...rowErrors);
  });

  return { rows, errors };
}

type ImportState =
  | { step: "idle" }
  | { step: "parsed"; result: ParsedFileResult; fileName: string }
  | { step: "importing" }
  | { step: "done"; inserted: number };

export default function ImportUsersModal({
  opened,
  onClose,
  onImported,
  factions,
  onDuplicatesFound,
}: ImportUsersModalProps) {
  const [state, setState] = useState<ImportState>({ step: "idle" });
  const [globalError, setGlobalError] = useState<string | null>(null);

  const factionsByName = new Map(factions.map((f) => [f.name.toLowerCase(), f.id]));

  function reset() {
    setState({ step: "idle" });
    setGlobalError(null);
  }

  async function handleFile(file: File) {
    reset();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    let result: ParsedFileResult;

    try {
      if (ext === "json") {
        result = parseJSON(await file.text(), factionsByName);
      } else if (ext === "csv") {
        result = parseCSV(await file.text(), factionsByName);
      } else if (ext === "xlsx" || ext === "xls") {
        result = parseXLSX(await file.arrayBuffer(), factionsByName);
      } else {
        setGlobalError("Format non supporté. Utilisez JSON, CSV ou XLSX.");
        return;
      }
    } catch (err) {
      setGlobalError(`Erreur lors de la lecture du fichier : ${String(err)}`);
      return;
    }

    setState({ step: "parsed", result, fileName: file.name });
  }

  async function handleImport() {
    if (state.step !== "parsed") return;
    const { result } = state;
    if (result.rows.length === 0) return;

    setState({ step: "importing" });

    const res = await fetch("/api/admin/users/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: result.rows }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error: string };
      setGlobalError(json.error ?? "Erreur lors de l'import.");
      setState({ step: "parsed", result, fileName: "" });
      return;
    }

    const importResult = (await res.json()) as ImportApiResult;

    if (importResult.duplicates.length > 0) {
      setState({ step: "idle" });
      onDuplicatesFound(importResult.duplicates, result.rows);
      onClose();
      return;
    }

    setState({ step: "done", inserted: importResult.inserted });
    onImported(importResult.inserted);
  }

  const parsedState = state.step === "parsed" ? state : null;
  const doneState = state.step === "done" ? state : null;

  return (
    <Modal
      opened={opened}
      onClose={() => { reset(); onClose(); }}
      title="Importer des utilisateurs"
      size="lg"
    >
      <Stack gap="md">
        <Paper p="sm" radius="md" bg="blue.0" withBorder style={{ borderColor: "var(--mantine-color-blue-2)" }}>
          <Text fz="xs" c="blue.7" fw={500} mb={4}>Colonnes attendues</Text>
          <Group gap="xs">
            {["prénom", "nom", "email"].map((col) => (
              <Code key={col} fz="xs">{col}</Code>
            ))}
            <Text fz="xs" c="dimmed">+ optionnel : <Code fz="xs">faction</Code></Text>
          </Group>
          <Text fz="xs" c="dimmed" mt={4}>Formats acceptés : JSON · CSV · XLSX</Text>
        </Paper>

        {globalError && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {globalError}
          </Alert>
        )}

        {state.step === "idle" && (
          <Dropzone
            onDrop={(files) => files[0] && handleFile(files[0])}
            onReject={() => setGlobalError("Fichier rejeté. Vérifiez le format.")}
            accept={ACCEPTED_MIME}
            maxFiles={1}
          >
            <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: "none" }}>
              <Dropzone.Accept>
                <ThemeIcon size={48} radius="md" color="blue" variant="light">
                  <IconUpload size={24} />
                </ThemeIcon>
              </Dropzone.Accept>
              <Dropzone.Reject>
                <ThemeIcon size={48} radius="md" color="red" variant="light">
                  <IconX size={24} />
                </ThemeIcon>
              </Dropzone.Reject>
              <Dropzone.Idle>
                <ThemeIcon size={48} radius="md" color="gray" variant="light">
                  <IconFileImport size={24} />
                </ThemeIcon>
              </Dropzone.Idle>
              <Stack gap={4} align="center">
                <Text size="md" fw={600}>Glissez votre fichier ici</Text>
                <Text size="sm" c="dimmed">ou cliquez pour sélectionner — JSON, CSV, XLSX</Text>
              </Stack>
            </Group>
          </Dropzone>
        )}

        {state.step === "importing" && (
          <Stack gap="xs">
            <Text fz="sm" c="dimmed">Import en cours…</Text>
            <Progress animated value={100} />
          </Stack>
        )}

        {doneState && (
          <>
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              <Text fw={600}>{doneState.inserted} utilisateur(s) importé(s) avec succès.</Text>
            </Alert>
            <Group justify="flex-end">
              <Button onClick={() => { reset(); onClose(); }}>Fermer</Button>
            </Group>
          </>
        )}

        {parsedState && (
          <>
            <Paper p="sm" radius="md" withBorder>
              <Group gap="sm" wrap="wrap">
                <ThemeIcon size="md" radius="md" color="blue" variant="light">
                  <IconFile size={16} />
                </ThemeIcon>
                <Text fz="sm" fw={500} style={{ flex: 1 }}>{parsedState.fileName}</Text>
                <Badge color="green" variant="light">{parsedState.result.rows.length} valide(s)</Badge>
                {parsedState.result.errors.length > 0 && (
                  <Badge color="red" variant="light">{parsedState.result.errors.length} erreur(s)</Badge>
                )}
              </Group>
            </Paper>

            {parsedState.result.errors.length > 0 && (
              <>
                <Divider label="Erreurs de syntaxe" labelPosition="left" />
                <ScrollArea h={140}>
                  <List fz="sm" spacing={4}>
                    {parsedState.result.errors.map((err, i) => (
                      <ListItem key={i} icon={<IconAlertCircle size={14} color="var(--mantine-color-red-5)" />}>
                        Ligne {err.rowIndex} — <strong>{err.field}</strong> : {err.message}
                      </ListItem>
                    ))}
                  </List>
                </ScrollArea>
              </>
            )}

            <Group justify="space-between">
              <Button variant="subtle" size="sm" onClick={reset}>Changer de fichier</Button>
              <Button
                leftSection={<IconUpload size={16} />}
                onClick={handleImport}
                disabled={parsedState.result.rows.length === 0}
              >
                Importer {parsedState.result.rows.length} utilisateur(s)
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
