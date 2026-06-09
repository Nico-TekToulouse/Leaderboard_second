"use client";

import { Checkbox, Stack, Text, Group, TextInput } from "@mantine/core";
import type { WorksheetQuestionCheckbox } from "@/types/worksheet";

type QuestionCheckboxProps = {
  question: WorksheetQuestionCheckbox;
  value: string[];
  onChange: (value: string[]) => void;
};

const AUTRE_RE = /^autre/i;

function isAutre(option: string) {
  return AUTRE_RE.test(option.trim());
}

function findAutreEntry(values: string[]): string | undefined {
  return values.find((v) => AUTRE_RE.test(v.trim()));
}

function autreText(entry: string): string {
  return entry.replace(/^autre\s*:\s*/i, "").replace(/_+/g, "").trim();
}

export default function QuestionCheckbox({ question, value, onChange }: QuestionCheckboxProps) {
  // Dérivé directement de value — aucun state local pour éviter les désync
  const autreEntry = findAutreEntry(value);
  const autreInput = autreEntry ? autreText(autreEntry) : "";

  function isChecked(option: string): boolean {
    if (isAutre(option)) return autreEntry !== undefined;
    return value.includes(option);
  }

  function toggleRegular(option: string, checked: boolean) {
    onChange(checked ? [...value, option] : value.filter((v) => v !== option));
  }

  function toggleAutre(checked: boolean) {
    if (checked) {
      onChange([...value, autreInput.trim() ? `Autre : ${autreInput.trim()}` : "Autre : "]);
    } else {
      onChange(value.filter((v) => !AUTRE_RE.test(v.trim())));
    }
  }

  function handleAutreTextChange(text: string) {
    if (autreEntry !== undefined) {
      const next = value.map((v) =>
        AUTRE_RE.test(v.trim()) ? `Autre : ${text}` : v
      );
      onChange(next);
    }
  }

  return (
    <Stack gap="xs">
      <Text fz="sm" fw={500}>{question.label}</Text>
      <Stack gap="xs">
        {question.options.map((option, i) => {
          if (isAutre(option)) {
            const checked = autreEntry !== undefined;
            return (
              <Group key={i} gap="xs" align="center" wrap="nowrap">
                <Checkbox
                  checked={checked}
                  onChange={(e) => toggleAutre(e.currentTarget.checked)}
                  label="Autre :"
                />
                <TextInput
                  size="xs"
                  placeholder="Précisez…"
                  value={autreInput}
                  disabled={!checked}
                  onChange={(e) => handleAutreTextChange(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
              </Group>
            );
          }
          return (
            <Checkbox
              key={i}
              value={option}
              label={option}
              checked={isChecked(option)}
              onChange={(e) => toggleRegular(option, e.currentTarget.checked)}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
