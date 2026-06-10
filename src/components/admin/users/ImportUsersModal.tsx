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
  IconDownload,
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

// --- ZIP / XLSX data-validation patcher ---

const CRC32_TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const b of data) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ b) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function concatBytes(arrays: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(arrays.reduce((s, a) => s + a.length, 0));
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

type ZipEntry = { name: string; data: Uint8Array; dosTime: number; dosDate: number };

function parseZipEntries(bytes: Uint8Array): ZipEntry[] {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const dec = new TextDecoder();
  const entries: ZipEntry[] = [];
  let pos = 0;
  while (pos + 30 <= bytes.length && dv.getUint32(pos, true) === 0x04034b50) {
    const dosTime   = dv.getUint16(pos + 10, true);
    const dosDate   = dv.getUint16(pos + 12, true);
    const compSize  = dv.getUint32(pos + 18, true);
    const nameLen   = dv.getUint16(pos + 26, true);
    const extraLen  = dv.getUint16(pos + 28, true);
    const dataStart = pos + 30 + nameLen + extraLen;
    entries.push({
      name: dec.decode(bytes.slice(pos + 30, pos + 30 + nameLen)),
      data: bytes.slice(dataStart, dataStart + compSize),
      dosTime,
      dosDate,
    });
    pos = dataStart + compSize;
  }
  return entries;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const { name, data, dosTime, dosDate } of entries) {
    const nb   = enc.encode(name);
    const checksum = crc32(data);
    const size = data.length;

    const lh = new Uint8Array(30 + nb.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, dosTime, true); lv.setUint16(12, dosDate, true);
    lv.setUint32(14, checksum, true); lv.setUint32(18, size, true); lv.setUint32(22, size, true);
    lv.setUint16(26, nb.length, true);
    lh.set(nb, 30);
    locals.push(lh, data);

    const cd = new Uint8Array(46 + nb.length);
    const cv = new DataView(cd.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(10, 0, true); // stored
    cv.setUint16(12, dosTime, true); cv.setUint16(14, dosDate, true);
    cv.setUint32(16, checksum, true); cv.setUint32(20, size, true); cv.setUint32(24, size, true);
    cv.setUint16(28, nb.length, true);
    cv.setUint32(42, offset, true);
    cd.set(nb, 46);
    central.push(cd);

    offset += 30 + nb.length + size;
  }

  const dir = concatBytes(central);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
  ev.setUint32(12, dir.length, true); ev.setUint32(16, offset, true);
  return concatBytes([...locals, dir, eocd]);
}

function addDropdownToSheet(xlsxBytes: Uint8Array, sqref: string, values: string[]): Uint8Array {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const entries = parseZipEntries(xlsxBytes);
  const sheet = entries.find(e => e.name === "xl/worksheets/sheet1.xml");
  if (!sheet) return xlsxBytes;
  const validationXml = `<dataValidations count="1"><dataValidation type="list" allowBlank="1" showDropDown="0" sqref="${sqref}"><formula1>"${values.join(",")}"</formula1></dataValidation></dataValidations>`;
  sheet.data = enc.encode(dec.decode(sheet.data).replace("</worksheet>", `${validationXml}</worksheet>`));
  return buildZip(entries);
}

function downloadCsvTemplate(factions: Faction[]) {
  const faction1 = factions[0]?.name ?? "fire";
  const faction2 = factions[1]?.name ?? "water";
  const validFactions = factions.map((f) => f.name).join(", ");
  const lines = [
    `# Factions valides : ${validFactions}`,
    "prénom,nom,email,faction",
    `Marie,Dupont,marie.dupont@exemple.com,${faction1}`,
    `Jean,Martin,jean.martin@exemple.com,${faction2}`,
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele_import_utilisateurs.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const FACTION_CHOICES = ["Bats", "Owls", "Tigers", "Turtles", "none"];

function downloadXlsxTemplate(factions: Faction[]) {
  const faction1 = factions[0]?.name ?? "Bats";
  const faction2 = factions[1]?.name ?? "Owls";
  const rows = [
    { prénom: "Marie", nom: "Dupont", email: "marie.dupont@exemple.com", faction: faction1 },
    { prénom: "Jean", nom: "Martin", email: "jean.martin@exemple.com", faction: faction2 },
  ];
  const wsData = XLSX.utils.json_to_sheet(rows);
  wsData["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsData, "Utilisateurs");

  const rawBytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
  const patchedBytes = addDropdownToSheet(rawBytes, "D2:D1000", FACTION_CHOICES);

  const blob = new Blob([patchedBytes.buffer.slice(0) as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele_import_utilisateurs.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
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
  const email = (
    raw["email"] ??
    raw["mail"] ??
    raw["email élève"] ??
    raw["email eleve"] ??
    ""
  ).trim().toLowerCase();
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
    comments: "#",
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
        <Paper p="sm" radius="md" bg="light-dark(var(--mantine-color-blue-0), var(--mantine-color-dark-5))" withBorder style={{ borderColor: "light-dark(var(--mantine-color-blue-2), var(--mantine-color-dark-4))" }}>
          <Text fz="xs" c="light-dark(var(--mantine-color-blue-7), var(--mantine-color-blue-3))" fw={500} mb={4}>Colonnes attendues</Text>
          <Group gap="xs">
            {["prénom", "nom", "email"].map((col) => (
              <Code key={col} fz="xs">{col}</Code>
            ))}
            <Text fz="xs" c="dimmed">+ optionnel : <Code fz="xs">faction</Code></Text>
          </Group>
          <Text fz="xs" c="dimmed" mt={4}>Formats acceptés : JSON · CSV · XLSX</Text>
          <Group gap="xs" mt={6}>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={() => downloadCsvTemplate(factions)}
              px={0}
            >
              Modèle CSV
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconDownload size={14} />}
              onClick={() => downloadXlsxTemplate(factions)}
              px={0}
            >
              Modèle XLSX
            </Button>
          </Group>
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
