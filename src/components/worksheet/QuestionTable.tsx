"use client";

import { Table, TextInput, Stack, Text, Button, ActionIcon, Group } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { WorksheetQuestionTable } from "@/types/worksheet";

type QuestionTableProps = {
  question: WorksheetQuestionTable;
  value: string[][];
  onChange: (value: string[][]) => void;
};

function initMatrix(question: WorksheetQuestionTable): string[][] {
  if (question.rows.length === 0) {
    return [Array.from({ length: question.columns.length }, () => "")];
  }
  return question.rows.map((label) => [
    label,
    ...Array.from({ length: question.columns.length - 1 }, () => ""),
  ]);
}

function resolveMatrix(question: WorksheetQuestionTable, value: string[][]): string[][] {
  if (value.length > 0 && value[0]?.length === question.columns.length) return value;
  return initMatrix(question);
}

export default function QuestionTable({ question, value, onChange }: QuestionTableProps) {
  const matrix = resolveMatrix(question, value);

  function update(next: string[][]) {
    onChange(next);
  }

  function handleCellChange(rowIndex: number, colIndex: number, cellValue: string) {
    update(
      matrix.map((row, r) =>
        r === rowIndex ? row.map((cell, c) => (c === colIndex ? cellValue : cell)) : row
      )
    );
  }

  function addRow() {
    update([...matrix, Array.from({ length: question.columns.length }, () => "")]);
  }

  function removeRow(rowIndex: number) {
    if (matrix.length <= 1) return;
    update(matrix.filter((_, r) => r !== rowIndex));
  }

  return (
    <Stack gap="xs">
      <Text fz="sm" fw={500}>{question.label}</Text>
      <Table withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            {question.columns.map((col, i) => (
              <Table.Th key={i}>{col}</Table.Th>
            ))}
            <Table.Th w={32} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {matrix.map((row, rIdx) => (
            <Table.Tr key={rIdx}>
              {question.columns.map((_, cIdx) => (
                <Table.Td key={cIdx}>
                  <TextInput
                    value={row[cIdx] ?? ""}
                    onChange={(e) => handleCellChange(rIdx, cIdx, e.currentTarget.value)}
                    size="xs"
                    variant="unstyled"
                    placeholder={cIdx === 0 ? "Titre…" : "…"}
                  />
                </Table.Td>
              ))}
              <Table.Td>
                <ActionIcon
                  size="xs"
                  color="red"
                  variant="subtle"
                  onClick={() => removeRow(rIdx)}
                  disabled={matrix.length <= 1}
                >
                  <IconTrash size={12} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Group>
        <Button
          size="xs"
          variant="light"
          leftSection={<IconPlus size={13} />}
          onClick={addRow}
        >
          Ajouter une ligne
        </Button>
      </Group>
    </Stack>
  );
}
