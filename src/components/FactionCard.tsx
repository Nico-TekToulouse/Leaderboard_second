import { Card, Group, Text, Badge, Avatar, Stack } from "@mantine/core";
import Link from "next/link";

type FactionCardProps = {
  id: string;
  name: string;
  hexColor: string;
  logo: string | null;
  totalPoints: number;
  rank: number;
};

const RANK_LABELS: Record<number, string> = {
  1: "🥇 1er",
  2: "🥈 2ème",
  3: "🥉 3ème",
  4: "4ème",
};

export default function FactionCard({
  id,
  name,
  hexColor,
  logo,
  totalPoints,
  rank,
}: FactionCardProps) {

  return (
    <Link href={`/faction/${id}`} style={{ textDecoration: "none" }}>
      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ cursor: "pointer" }}>
      <Group justify="space-between" mb="xs">
        <Group gap="sm">
          <Avatar
            src={logo}
            color="blue"
            radius="xl"
            size="md"
            style={logo ? undefined : { backgroundColor: hexColor }}
          >
            {!logo && name[0].toUpperCase()}
          </Avatar>
          <Stack gap={0}>
            <Text fw={700} fz="md">
              {name}
            </Text>
            <Text fz="xs" c="dimmed">
              Faction
            </Text>
          </Stack>
        </Group>
        <Badge variant="light" size="lg">
          {RANK_LABELS[rank] ?? `${rank}ème`}
        </Badge>
      </Group>

      <Group justify="space-between" mt="md">
        <Text fz="sm" c="dimmed">
          Points totaux
        </Text>
        <Text fw={800} fz="xl" c="blue.5">
          {totalPoints.toLocaleString("fr-FR")}
        </Text>
      </Group>
    </Card>
    </Link>
  );
}
