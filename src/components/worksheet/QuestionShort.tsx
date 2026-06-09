"use client";

import { TextInput, Stack, Text } from "@mantine/core";
import type { WorksheetQuestionShort } from "@/types/worksheet";

type QuestionShortProps = {
  question: WorksheetQuestionShort;
  value: string;
  onChange: (value: string) => void;
};

export default function QuestionShort({ question, value, onChange }: QuestionShortProps) {
  return (
    <Stack gap="xs">
      <Text fz="sm" fw={500}>{question.label}</Text>
      <TextInput
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder="Votre réponse..."
      />
    </Stack>
  );
}
