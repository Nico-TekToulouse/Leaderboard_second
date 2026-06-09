"use client";

import { Textarea, Stack, Text } from "@mantine/core";
import type { WorksheetQuestionText } from "@/types/worksheet";

type QuestionTextProps = {
  question: WorksheetQuestionText;
  value: string;
  onChange: (value: string) => void;
};

export default function QuestionText({ question, value, onChange }: QuestionTextProps) {
  return (
    <Stack gap="xs">
      <Text fz="sm" fw={500}>{question.label}</Text>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        minRows={4}
        autosize
        placeholder="Votre réponse..."
      />
    </Stack>
  );
}
