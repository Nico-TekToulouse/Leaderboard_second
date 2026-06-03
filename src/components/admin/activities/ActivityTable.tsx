"use client";

import {
  Table,
  TableThead,
  TableTbody,
  TableTr,
  TableTh,
  TableTd,
  ActionIcon,
  Group,
  Text,
  Pagination,
  Badge,
  Tooltip,
} from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import type { ActivityWithScores } from "@/types/activity";

type ActivityTableProps = {
  activities: ActivityWithScores[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (activity: ActivityWithScores) => void;
  onDelete: (activity: ActivityWithScores) => void;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ActivityTable({
  activities,
  total,
  page,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
}: ActivityTableProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (activities.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Aucune activité enregistrée.
      </Text>
    );
  }

  return (
    <>
      <Table highlightOnHover withTableBorder withColumnBorders>
        <TableThead>
          <TableTr>
            <TableTh>Nom</TableTh>
            <TableTh>Date</TableTh>
            <TableTh>Points max</TableTh>
            <TableTh>Factions scorées</TableTh>
            <TableTh w={80}>Actions</TableTh>
          </TableTr>
        </TableThead>
        <TableTbody>
          {activities.map((activity) => (
            <TableTr key={activity.id}>
              <TableTd>
                <Text fw={500} fz="sm">
                  {activity.name}
                </Text>
                {activity.description && (
                  <Text fz="xs" c="dimmed" lineClamp={1}>
                    {activity.description}
                  </Text>
                )}
              </TableTd>
              <TableTd>
                <Text fz="sm">{formatDate(activity.date)}</Text>
              </TableTd>
              <TableTd>
                <Text fz="sm">{activity.max_points} pts</Text>
              </TableTd>
              <TableTd>
                <Group gap={4} wrap="wrap">
                  {activity.scores.length === 0 ? (
                    <Text fz="xs" c="dimmed">
                      —
                    </Text>
                  ) : (
                    activity.scores.map((s) => (
                      <Tooltip
                        key={s.faction_id}
                        label={`${s.faction.name} : ${s.points} pts`}
                      >
                        <Badge
                          size="sm"
                          style={{ backgroundColor: s.faction.color, color: "#fff" }}
                        >
                          {s.faction.name}
                        </Badge>
                      </Tooltip>
                    ))
                  )}
                </Group>
              </TableTd>
              <TableTd>
                <Group gap={4}>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => onEdit(activity)}
                    aria-label="Modifier"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => onDelete(activity)}
                    aria-label="Supprimer"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </TableTd>
            </TableTr>
          ))}
        </TableTbody>
      </Table>

      {totalPages > 1 && (
        <Group justify="center" mt="md">
          <Pagination total={totalPages} value={page} onChange={onPageChange} size="sm" />
        </Group>
      )}
    </>
  );
}
