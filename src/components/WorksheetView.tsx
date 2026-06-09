"use client";

import {
  Stack,
  TextInput,
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

export default function WorksheetView({ worksheet, factions }: WorksheetViewProps) {
  const DRAFT_KEY = `worksheet_draft_${worksheet.id}`;

  const [phase, setPhase] = useState<Phase>("identify");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [factionId, setFactionId] = useState("");
  const [answers, setAnswers] = useState<WorksheetAnswers>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as WorksheetDraft;
      if (draft.worksheetId !== worksheet.id) return;
      setFirstname(draft.respondentFirstname);
      setLastname(draft.respondentLastname);
      setFactionId(draft.factionId);
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
    const draft: WorksheetDraft = {
      worksheetId: worksheet.id,
      answers,
      respondentFirstname: firstname,
      respondentLastname: lastname,
      factionId,
      currentSectionIndex,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [answers, firstname, lastname, factionId, currentSectionIndex, phase, DRAFT_KEY, worksheet.id]);

  function handleAnswerChange(questionId: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleReset() {
    localStorage.removeItem(DRAFT_KEY);
    setAnswers({});
    setFirstname("");
    setLastname("");
    setFactionId("");
    setCurrentSectionIndex(0);
    setSubmitError(null);
    setIdentifyError(null);
    setPhase("identify");
  }

  function handleStart() {
    if (!firstname.trim()) {
      setIdentifyError("Le prénom est requis.");
      return;
    }
    if (!lastname.trim()) {
      setIdentifyError("Le nom est requis.");
      return;
    }
    if (!factionId) {
      setIdentifyError("Veuillez choisir votre faction.");
      return;
    }
    setIdentifyError(null);
    setPhase("answer");
  }

  async function handleSubmit() {
    setSubmitError(null);
    setSubmitting(true);

    const payload: WorksheetResponseInsert = {
      worksheet_id: worksheet.id,
      faction_id: factionId,
      respondent_firstname: firstname.trim(),
      respondent_lastname: lastname.trim(),
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
            Merci {firstname}, tes réponses ont bien été enregistrées.
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

          <TextInput
            label="Prénom"
            placeholder="Ton prénom"
            value={firstname}
            onChange={(e) => setFirstname(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Nom"
            placeholder="Ton nom de famille"
            value={lastname}
            onChange={(e) => setLastname(e.currentTarget.value)}
            required
          />
          <Select
            label="Faction"
            placeholder="Choisir ta faction"
            data={factionOptions}
            value={factionId || null}
            onChange={(v) => setFactionId(v ?? "")}
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
              {firstname} {lastname}
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
