import {
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconCalendar, IconLock, IconTrophy } from "@tabler/icons-react";
import { FACTION_MANTINE_COLOR } from "@/lib/theme";
import type { PlannedActivity } from "@/types/planning";

type PlannedActivityListProps = {
  activities: PlannedActivity[];
};

type DateLabel = {
  relative: string;
  full: string;
  isFuture: boolean;
  isToday: boolean;
};

function getDateLabel(dateStr: string): DateLabel {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activityDay = new Date(dateStr);
  activityDay.setHours(0, 0, 0, 0);

  const diffMs = activityDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const full = activityDay.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let relative: string;
  if (diffDays === 0) {
    relative = "Aujourd'hui";
  } else if (diffDays === 1) {
    relative = "Demain";
  } else if (diffDays === -1) {
    relative = "Hier";
  } else if (diffDays > 1) {
    relative = `Dans ${diffDays} jour${diffDays > 1 ? "s" : ""}`;
  } else {
    relative = `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? "s" : ""}`;
  }

  return { relative, full, isFuture: diffDays > 0, isToday: diffDays === 0 };
}

export default function PlannedActivityList({ activities }: PlannedActivityListProps) {
  return (
    <Stack gap="sm">
      {activities.map((activity) => {
        const { relative, full, isFuture, isToday } = getDateLabel(activity.date);
        const isPast = !isFuture && !isToday;

        return (
          <Paper
            key={activity.id}
            p="md"
            radius="md"
            withBorder
            style={{
              opacity: isPast && activity.scores.length === 0 ? 0.6 : 1,
              borderColor: isToday ? "var(--mantine-color-blue-4)" : undefined,
              borderWidth: isToday ? 2 : undefined,
            }}
          >
            <Group gap="md" wrap="nowrap" align="flex-start">
              {/* Icône */}
              <ThemeIcon
                size="lg"
                radius="md"
                variant="light"
                color={activity.revealed ? "blue" : "gray"}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                {activity.revealed ? <IconTrophy size={16} /> : <IconLock size={16} />}
              </ThemeIcon>

              {/* Contenu */}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap" mb={4}>
                  {/* Titre + description */}
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      fw={700}
                      fz="sm"
                      lineClamp={1}
                      style={
                        !activity.revealed
                          ? { filter: "blur(5px)", userSelect: "none" }
                          : undefined
                      }
                    >
                      {activity.name}
                    </Text>
                    {activity.description && (
                      <Text
                        fz="xs"
                        c="dimmed"
                        lineClamp={activity.isUpcoming ? undefined : 2}
                        style={
                          activity.isUpcoming
                            ? { filter: "blur(4px)", userSelect: "none" }
                            : undefined
                        }
                      >
                        {activity.description}
                      </Text>
                    )}
                  </Stack>

                  {/* Badge statut */}
                  {isFuture && (
                    <Badge variant="light" color="blue" size="sm" style={{ flexShrink: 0 }}>
                      À venir
                    </Badge>
                  )}
                  {isToday && (
                    <Badge variant="filled" color="blue" size="sm" style={{ flexShrink: 0 }}>
                      Aujourd&apos;hui
                    </Badge>
                  )}
                </Group>

                {/* Date */}
                <Group gap={4} mb={activity.scores.length > 0 ? 8 : 0}>
                  <IconCalendar size={11} color="var(--mantine-color-dimmed)" />
                  <Text fz="xs" c="dimmed">
                    {relative} · {full}
                  </Text>
                </Group>

                {/* Points par faction (si révélé et scores disponibles) */}
                {activity.revealed && activity.scores.length > 0 && (
                  <Group gap="xs" wrap="wrap">
                    {activity.scores.map((score) => (
                      <Badge
                        key={score.factionId}
                        variant="light"
                        color={FACTION_MANTINE_COLOR[score.factionColor]}
                        size="sm"
                      >
                        {score.factionName} · {score.points.toLocaleString("fr-FR")} pts
                      </Badge>
                    ))}
                  </Group>
                )}

                {/* Message si révélé mais pas encore de points */}
                {activity.revealed && activity.scores.length === 0 && (
                  <Text fz="xs" c="dimmed" fs="italic">
                    Points non encore attribués
                  </Text>
                )}
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
