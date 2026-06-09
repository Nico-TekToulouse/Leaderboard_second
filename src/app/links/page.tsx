import {
  Stack,
  Group,
  ThemeIcon,
  Title,
  Text,
  Paper,
  List,
  ListItem,
  Button,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconFileText,
  IconAlertTriangle,
  IconBrandDiscord,
  IconExternalLink,
} from "@tabler/icons-react";
import { fetchInfoEntries } from "@/lib/info";
import ErrorAlert from "@/components/ErrorAlert";
import type { InfoEntry } from "@/types/info";

export const dynamic = "force-dynamic";

type ListSectionProps = {
  icon: React.ReactNode;
  title: string;
  color: string;
  entries: InfoEntry[];
};

function ListSection({ icon, title, color, entries }: ListSectionProps) {
  if (entries.length === 0) return null;

  return (
    <Paper shadow="xs" p="xl" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color={color} variant="light">
            {icon}
          </ThemeIcon>
          <Title order={3}>{title}</Title>
        </Group>

        <List spacing="sm" size="sm">
          {entries.map((entry) => (
            <ListItem key={entry.id}>
              <Text fw={600} component="span">
                {entry.title}
              </Text>
              {entry.content && (
                <Text c="dimmed" fz="sm" mt={2}>
                  {entry.content}
                </Text>
              )}
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}

type TextSectionProps = {
  icon: React.ReactNode;
  title: string;
  color: string;
  entries: InfoEntry[];
};

function TextSection({ icon, title, color, entries }: TextSectionProps) {
  if (entries.length === 0) return null;

  return (
    <Paper shadow="xs" p="xl" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color={color} variant="light">
            {icon}
          </ThemeIcon>
          <Title order={3}>{title}</Title>
        </Group>

        <Stack gap="sm">
          {entries.map((entry) => (
            <Stack key={entry.id} gap={4}>
              {entry.title && (
                <Text fw={600} fz="sm">
                  {entry.title}
                </Text>
              )}
              {entry.content && (
                <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
                  {entry.content}
                </Text>
              )}
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

type DiscordSectionProps = {
  entries: InfoEntry[];
};

function DiscordSection({ entries }: DiscordSectionProps) {
  if (entries.length === 0) return null;

  const entry = entries[0];

  return (
    <Paper shadow="xs" p="xl" radius="md" withBorder>
      <Stack gap="md">
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
            <IconBrandDiscord size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={3}>Discord</Title>
            <Text c="dimmed" fz="sm">
              {entry.title}
            </Text>
          </Stack>
        </Group>

        {entry.content && <Text fz="sm">{entry.content}</Text>}

        {entry.url && (
          <Button
            component="a"
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
            color="indigo"
            leftSection={<IconExternalLink size={16} />}
            style={{ alignSelf: "flex-start" }}
          >
            Rejoindre le Discord
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

export default async function LinksPage() {
  const entries = await fetchInfoEntries();

  const rules = entries.filter((e) => e.category === "rules");
  const sanctions = entries.filter((e) => e.category === "sanctions");
  const discord = entries.filter((e) => e.category === "discord");

  const hasContent = rules.length > 0 || sanctions.length > 0 || discord.length > 0;

  return (
    <Stack gap="xl">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconInfoCircle size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>Informations utiles</Title>
          <Text c="dimmed" fz="sm">
            Règlement, sanctions et liens importants du stage
          </Text>
        </Stack>
      </Group>

      {!hasContent ? (
        <ErrorAlert
          title="Aucune information disponible"
          message="Les informations seront ajoutées par les administrateurs."
        />
      ) : (
        <>
          <ListSection
            icon={<IconFileText size={18} />}
            title="Règlement intérieur"
            color="blue"
            entries={rules}
          />
          <TextSection
            icon={<IconAlertTriangle size={18} />}
            title="Rappel des sanctions"
            color="orange"
            entries={sanctions}
          />
          <DiscordSection entries={discord} />
        </>
      )}
    </Stack>
  );
}
