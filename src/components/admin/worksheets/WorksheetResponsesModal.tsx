"use client";

import {
  Modal,
  Stack,
  Table,
  Badge,
  Text,
  LoadingOverlay,
  Box,
  Alert,
  Button,
  Group,
  Paper,
  Title,
  Textarea,
  Checkbox,
} from "@mantine/core";
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import type {
  Worksheet,
  WorksheetResponseWithFaction,
  WorksheetSection,
  AnswerValue,
} from "@/types/worksheet";

type WorksheetResponsesModalProps = {
  opened: boolean;
  onClose: () => void;
  worksheet: Worksheet | null;
};

function findQuestion(sections: WorksheetSection[], questionId: string) {
  for (const section of sections) {
    const q = section.questions.find((q) => q.id === questionId);
    if (q) return q;
  }
  return null;
}

type AnswerDisplayProps = {
  answer: AnswerValue;
  questionId: string;
  sections: WorksheetSection[];
};

function AnswerDisplay({ answer, questionId, sections }: AnswerDisplayProps) {
  const question = findQuestion(sections, questionId);

  if (!question) {
    return <Text fz="sm">{String(answer)}</Text>;
  }

  if (question.type === "text" || question.type === "short") {
    return (
      <Textarea
        value={typeof answer === "string" ? answer : ""}
        readOnly
        minRows={2}
        autosize
        styles={{ input: { background: "transparent", cursor: "default" } }}
      />
    );
  }

  if (question.type === "table" && Array.isArray(answer)) {
    const rows = answer as string[][];
    return (
      <Table withTableBorder withColumnBorders fz="sm">
        <Table.Thead>
          <Table.Tr>
            {question.columns.map((col, i) => (
              <Table.Th key={i}>{col}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row, rIdx) => (
            <Table.Tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <Table.Td key={cIdx}>{cell}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    );
  }

  if (question.type === "checkbox" && Array.isArray(answer)) {
    const checked = answer as string[];
    return (
      <Group gap="xs">
        {question.options.map((opt, i) => (
          <Checkbox
            key={i}
            label={opt}
            checked={checked.includes(opt)}
            readOnly
            styles={{ input: { cursor: "default" } }}
          />
        ))}
      </Group>
    );
  }

  return <Text fz="sm">{String(answer)}</Text>;
}

export default function WorksheetResponsesModal({
  opened,
  onClose,
  worksheet,
}: WorksheetResponsesModalProps) {
  const [responses, setResponses] = useState<WorksheetResponseWithFaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<WorksheetResponseWithFaction | null>(null);

  useEffect(() => {
    if (!opened || !worksheet) return;

    setLoading(true);
    setError(null);
    setSelectedResponse(null);

    fetch(`/api/admin/worksheets/${worksheet.id}/responses`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Impossible de charger les réponses.");
        return res.json() as Promise<WorksheetResponseWithFaction[]>;
      })
      .then((data) => {
        setResponses(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [opened, worksheet]);

  function handleClose() {
    setSelectedResponse(null);
    setResponses([]);
    onClose();
  }

  const allQuestions = worksheet
    ? worksheet.sections.flatMap((s) => s.questions.map((q) => ({ ...q, sectionTitle: s.title })))
    : [];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Réponses — ${worksheet?.title ?? ""}`}
      size="xl"
    >
      <Box pos="relative" mih={100}>
        <LoadingOverlay visible={loading} />

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" mb="sm">
            {error}
          </Alert>
        )}

        {!loading && !error && !selectedResponse && (
          <Stack gap="sm">
            {responses.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">
                Aucune réponse pour ce worksheet.
              </Text>
            ) : (
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Prénom</Table.Th>
                    <Table.Th>Nom</Table.Th>
                    <Table.Th>Faction</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {responses.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>{r.respondent_firstname}</Table.Td>
                      <Table.Td>{r.respondent_lastname}</Table.Td>
                      <Table.Td>
                        <Badge color={r.faction.color} variant="light">
                          {r.faction.name}
                        </Badge>
                      </Table.Td>
                      <Table.Td c="dimmed" fz="sm">
                        {new Date(r.submitted_at).toLocaleString("fr-FR")}
                      </Table.Td>
                      <Table.Td>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => setSelectedResponse(r)}
                        >
                          Voir détail
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        )}

        {selectedResponse && worksheet && (
          <Stack gap="md">
            <Group gap="xs">
              <Button
                size="xs"
                variant="subtle"
                leftSection={<IconArrowLeft size={14} />}
                onClick={() => setSelectedResponse(null)}
              >
                Retour à la liste
              </Button>
              <Group gap={6} align="center">
                <Text fz="sm" c="dimmed">
                  {selectedResponse.respondent_firstname} {selectedResponse.respondent_lastname} —
                </Text>
                <Badge color={selectedResponse.faction.color} size="sm" variant="light">
                  {selectedResponse.faction.name}
                </Badge>
              </Group>
            </Group>

            {allQuestions.map((q) => {
              const answer = selectedResponse.answers[q.id];
              return (
                <Paper key={q.id} p="sm" withBorder radius="sm">
                  <Stack gap="xs">
                    <Text fz="xs" c="dimmed">{q.sectionTitle}</Text>
                    <Title order={6}>{q.label}</Title>
                    {answer !== undefined ? (
                      <AnswerDisplay
                        answer={answer}
                        questionId={q.id}
                        sections={worksheet.sections}
                      />
                    ) : (
                      <Text fz="sm" c="dimmed" fs="italic">Sans réponse</Text>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Box>
    </Modal>
  );
}
