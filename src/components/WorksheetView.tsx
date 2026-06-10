"use client";

import {
  Stack,
  Autocomplete,
  Select,
  Button,
  Group,
  Title,
  Text,
  Paper,
  Alert,
  Badge,
  Progress,
  ThemeIcon,
  Anchor,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconPaperclip } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import type {
  Worksheet,
  WorksheetAnswers,
  WorksheetDraft,
  WorksheetResponseInsert,
  AnswerValue,
  WorksheetQuestion,
  WorksheetMember,
} from "@/types/worksheet";
import QuestionText from "@/components/worksheet/QuestionText";
import QuestionTable from "@/components/worksheet/QuestionTable";
import QuestionCheckbox from "@/components/worksheet/QuestionCheckbox";
import QuestionShort from "@/components/worksheet/QuestionShort";

type ViewFaction = {
  id: string;
  name: string;
  color: string;
};

type WorksheetViewProps = {
  worksheet: Worksheet;
  factions: ViewFaction[];
  members: WorksheetMember[];
};

type Phase = "identify" | "answer" | "submitted";

function getAnswerAsString(answers: WorksheetAnswers, id: string): string {
  const v = answers[id];
  return typeof v === "string" ? v : "";
}

function getAnswerAsStringArray(answers: WorksheetAnswers, id: string): string[] {
  const v = answers[id];
  return Array.isArray(v) && (v.length === 0 || typeof v[0] === "string") ? (v as string[]) : [];
}

function getAnswerAsMatrix(answers: WorksheetAnswers, id: string): string[][] {
  const v = answers[id];
  return Array.isArray(v) && (v.length === 0 || Array.isArray(v[0])) ? (v as string[][]) : [];
}

function renderQuestion(
  q: WorksheetQuestion,
  answers: WorksheetAnswers,
  onChange: (id: string, value: AnswerValue) => void
) {
  switch (q.type) {
    case "text":
      return (
        <QuestionText
          question={q}
          value={getAnswerAsString(answers, q.id)}
          onChange={(v) => onChange(q.id, v)}
        />
      );
    case "table":
      return (
        <QuestionTable
          question={q}
          value={getAnswerAsMatrix(answers, q.id)}
          onChange={(v) => onChange(q.id, v)}
        />
      );
    case "checkbox":
      return (
        <QuestionCheckbox
          question={q}
          value={getAnswerAsStringArray(answers, q.id)}
          onChange={(v) => onChange(q.id, v)}
        />
      );
    case "short":
      return (
        <QuestionShort
          question={q}
          value={getAnswerAsString(answers, q.id)}
          onChange={(v) => onChange(q.id, v)}
        />
      );
  }
}

export default function WorksheetView({ worksheet, factions, members }: WorksheetViewProps) {
  const DRAFT_KEY = `worksheet_draft_${worksheet.id}`;

  /** Nom complet tel que tapé / sélectionné dans l'Autocomplete */
  const [memberValue, setMemberValue] = useState("");
  /** Faction verrouillée quand un membre inscrit est sélectionné */
  const [factionLocked, setFactionLocked] = useState(false);

  const [phase, setPhase] = useState<Phase>("identify");
  const [factionId, setFactionId] = useState("");
  const [answers, setAnswers] = useState<WorksheetAnswers>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  /** Map factionId → nom de faction pour les libellés dans l'autocomplete */
  const factionNameById = Object.fromEntries(factions.map((f) => [f.id, f.name]));

  /** Résout un nom complet vers le membre correspondant, ou null */
  function findMember(fullName: string): WorksheetMember | null {
    return members.find(
      (m) => `${m.firstName} ${m.lastName}` === fullName
    ) ?? null;
  }

  /** Dérive [prénom, nom] depuis memberValue : membre inscrit ou découpage sur premier espace */
  function deriveNames(): { firstName: string; lastName: string } {
    const matched = findMember(memberValue.trim());
    if (matched) return { firstName: matched.firstName, lastName: matched.lastName };
    const trimmed = memberValue.trim();
    const spaceIndex = trimmed.indexOf(" ");
    if (spaceIndex === -1) return { firstName: trimmed, lastName: "" };
    return {
      firstName: trimmed.slice(0, spaceIndex),
      lastName: trimmed.slice(spaceIndex + 1),
    };
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as WorksheetDraft;
      if (draft.worksheetId !== worksheet.id) return;
      const restoredValue = `${draft.respondentFirstname} ${draft.respondentLastname}`.trim();
      setMemberValue(restoredValue);
      setFactionId(draft.factionId);
      // Réévaluer le verrou : si le nom correspond à un membre inscrit, on verrouille
      const matched = members.find(
        (m) => `${m.firstName} ${m.lastName}` === restoredValue
      );
      setFactionLocked(!!matched);
      setAnswers(draft.answers);
      const sectionIndex = Math.min(
        draft.currentSectionIndex ?? 0,
        worksheet.sections.length - 1
      );
      setCurrentSectionIndex(sectionIndex);
      // Si l'identité est complète, reprendre directement en phase "answer"
      if (draft.respondentFirstname && draft.respondentLastname && draft.factionId) {
        setPhase("answer");
      }
    } catch {
      // brouillon corrompu, on ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "answer") return;
    const { firstName, lastName } = deriveNames();
    const draft: WorksheetDraft = {
      worksheetId: worksheet.id,
      answers,
      respondentFirstname: firstName,
      respondentLastname: lastName,
      factionId,
      currentSectionIndex,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, memberValue, factionId, currentSectionIndex, phase, DRAFT_KEY, worksheet.id]);

  function handleAnswerChange(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleReset() {
    localStorage.removeItem(DRAFT_KEY);
    setAnswers({});
    setMemberValue("");
    setFactionLocked(false);
    setFactionId("");
    setCurrentSectionIndex(0);
    setSubmitError(null);
    setIdentifyError(null);
    setPhase("identify");
  }

  function handleStart() {
    const { firstName, lastName } = deriveNames();
    if (!firstName.trim()) {
      setIdentifyError("Le prénom est requis (ex : Marie Dupont).");
      return;
    }
    if (!lastName.trim()) {
      setIdentifyError("Le nom complet est requis (ex : Marie Dupont).");
      return;
    }
    if (!factionId) {
      setIdentifyError("Veuillez choisir votre faction.");
      return;
    }
    setIdentifyError(null);
    setPhase("answer");
  }

  function handleMemberChange(value: string) {
    setMemberValue(value);
    const matched = findMember(value.trim());
    if (matched) {
      setFactionId(matched.factionId);
      setFactionLocked(true);
    } else {
      setFactionLocked(false);
    }
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);

    const { firstName, lastName } = deriveNames();

    const payload: WorksheetResponseInsert = {
      worksheet_id: worksheet.id,
      faction_id: factionId,
      respondent_firstname: firstName.trim(),
      respondent_lastname: lastName.trim(),
      answers,
    };

    const res = await fetch("/api/worksheet-responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = (await res.json()) as { error?: string };
      setSubmitError(body.error ?? "Une erreur est survenue.");
      setSubmitting(false);
      return;
    }

    localStorage.removeItem(DRAFT_KEY);
    setPhase("submitted");
  }

  const currentSection = worksheet.sections[currentSectionIndex];
  const totalSections = worksheet.sections.length;
  const isLastSection = currentSectionIndex === totalSections - 1;

  const factionOptions = factions.map((f) => ({ value: f.id, label: f.name }));

  if (phase === "submitted") {
    return (
      <Paper shadow="xs" p="xl" radius="md" withBorder ta="center">
        <Stack align="center" gap="md">
          <ThemeIcon size={64} radius="xl" color="green">
            <IconCheck size={32} />
          </ThemeIcon>
          <Title order={3}>Réponses envoyées !</Title>
          <Text c="dimmed">
            Merci {deriveNames().firstName}, tes réponses ont bien été enregistrées.
          </Text>
        </Stack>
      </Paper>
    );
  }

  if (phase === "identify") {
    return (
      <Paper shadow="xs" p="xl" radius="md" withBorder>
        <Stack gap="md" maw={400} mx="auto">
          <Title order={3}>{worksheet.title}</Title>
          {worksheet.description && (
            <Text c="dimmed" fz="sm">{worksheet.description}</Text>
          )}

          {identifyError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {identifyError}
            </Alert>
          )}

          <Autocomplete
            label="Membre"
            placeholder="Commence à taper ton prénom ou nom…"
            value={memberValue}
            onChange={handleMemberChange}
            data={members.map((m) => ({
              value: `${m.firstName} ${m.lastName}`,
              label: `${m.firstName} ${m.lastName}`,
            }))}
            renderOption={({ option }) => {
              const matched = findMember(option.value);
              const factionName = matched ? (factionNameById[matched.factionId] ?? "") : "";
              return (
                <Text fz="sm">
                  {option.value}
                  {factionName ? (
                    <Text component="span" fz="xs" c="dimmed" ml={6}>
                      — {factionName}
                    </Text>
                  ) : null}
                </Text>
              );
            }}
            required
            description={
              factionLocked
                ? undefined
                : "Si tu n'es pas dans la liste, saisis ton prénom suivi de ton nom."
            }
          />
          <Select
            label="Faction"
            placeholder="Choisir ta faction"
            data={factionOptions}
            value={factionId || null}
            onChange={(v) => setFactionId(v ?? "")}
            disabled={factionLocked}
            required
          />
          <Button onClick={handleStart} fullWidth>
            Commencer l&apos;activité
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="lg">
      <Paper shadow="xs" p="md" radius="md" withBorder>
        <Group justify="space-between" align="center" mb="xs">
          <Group gap="xs">
            <Text fz="sm" c="dimmed">
              Section {currentSectionIndex + 1} / {totalSections}
            </Text>
            <Badge size="sm" variant="light" color="violet">
              {currentSection.title}
            </Badge>
          </Group>
          <Group gap="xs" align="center">
            <Text fz="xs" c="dimmed">
              {memberValue.trim() || "—"}
            </Text>
            <Button
              variant="subtle"
              color="red"
              size="compact-xs"
              onClick={handleReset}
            >
              Effacer mes réponses
            </Button>
          </Group>
        </Group>
        <Progress
          value={((currentSectionIndex + 1) / totalSections) * 100}
          size="sm"
          color="violet"
        />
      </Paper>

      <Paper shadow="xs" p="xl" radius="md" withBorder>
        <Stack gap="lg">
          <Stack gap={4}>
            <Title order={3}>{currentSection.title}</Title>
            {currentSection.description && (
              <Text c="dimmed" fz="sm">{currentSection.description}</Text>
            )}
            {(() => {
              const globalFiles = currentSection.resources ?? [];
              const factionFiles = currentSection.resourcesByFaction?.[factionId] ?? [];
              const allFiles = [...globalFiles, ...factionFiles];
              if (allFiles.length === 0) return null;
              return (
                <Stack gap={4} mt={4}>
                  {allFiles.map((resource) => (
                    <Group key={resource.url} gap={6}>
                      <IconPaperclip size={14} />
                      <Anchor
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        fz="sm"
                      >
                        {resource.name}
                      </Anchor>
                    </Group>
                  ))}
                </Stack>
              );
            })()}
          </Stack>

          {currentSection.questions.map((q) => (
            <Paper key={q.id} p="sm" withBorder radius="sm">
              {renderQuestion(q, answers, handleAnswerChange)}
            </Paper>
          ))}
        </Stack>
      </Paper>

      {submitError && (
        <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
          {submitError}
        </Alert>
      )}

      <Group justify="space-between">
        <Button
          variant="subtle"
          onClick={() => setCurrentSectionIndex((i) => i - 1)}
          disabled={currentSectionIndex === 0}
        >
          Précédent
        </Button>

        {isLastSection ? (
          <Button color="green" onClick={handleSubmit} loading={submitting}>
            Soumettre mes réponses
          </Button>
        ) : (
          <Button onClick={() => setCurrentSectionIndex((i) => i + 1)}>
            Section suivante
          </Button>
        )}
      </Group>
    </Stack>
  );
}
