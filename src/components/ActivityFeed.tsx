"use client";

import { Alert, Badge, Box, Group, Paper, Progress, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertCircle, IconCalendar, IconTrophy } from "@tabler/icons-react";
import type { ActivityScore } from "@/lib/factions";

type ActivityFeedProps = {
  scores: ActivityScore[];
  factionColor: string;
};

export default function ActivityFeed({ scores, factionColor }: ActivityFeedProps) {
  if (scores.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="orange" title="Aucune activité">
        Cette faction n&apos;a encore participé à aucune activité.
      </Alert>
    );
  }

  return (
    <Stack gap="sm">
      {scores.map((score) => {
        const pct = score.maxPoints > 0 ? (score.points / score.maxPoints) * 100 : 0;
        const isGood = pct >= 75;
        const badgeVariant = isGood ? "filled" : "light";
        const dateLabel = new Date(score.date).toLocaleDateString("fr-FR", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        return (
          <Paper key={score.activityId} p="md" radius="md" withBorder>
            <Group gap="md" wrap="nowrap" align="flex-start">
              {/* Icône activité */}
              <ThemeIcon
                size="lg"
                radius="md"
                variant="light"
                color={factionColor}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <IconTrophy size={16} />
              </ThemeIcon>

              {/* Contenu principal */}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
                  <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={700} fz="sm" lineClamp={1}>
                      {score.activityName}
                    </Text>
                    {score.description && (
                      <Text fz="xs" c="dimmed" lineClamp={1}>
                        {score.description}
                      </Text>
                    )}
                  </Stack>
                  <Badge
                    variant={badgeVariant}
                    color={factionColor}
                    size="md"
                    style={{ flexShrink: 0 }}
                  >
                    {score.points.toLocaleString("fr-FR")} / {score.maxPoints.toLocaleString("fr-FR")} pts
                  </Badge>
                </Group>

                {/* Barre de progression */}
                <Progress value={pct} color={factionColor} size="sm" radius="xl" />

                {/* Date + pourcentage */}
                <Group justify="space-between" mt={4}>
                  <Group gap={4}>
                    <IconCalendar size={11} color="var(--mantine-color-dimmed)" />
                    <Text fz="xs" c="dimmed">{dateLabel}</Text>
                  </Group>
                  <Text fz="xs" fw={600} c={isGood ? `${factionColor}.6` : "dimmed"}>
                    {pct.toFixed(0)} %
                  </Text>
                </Group>
              </Box>
            </Group>
          </Paper>
        );
      })}
    </Stack>
  );
}
