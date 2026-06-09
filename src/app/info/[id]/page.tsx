import { notFound } from "next/navigation";
import { fetchInfoPage } from "@/lib/info-pages";
import {
  Stack,
  Paper,
  Title,
  Text,
  ThemeIcon,
  Group,
  Badge,
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";

export const dynamic = "force-dynamic";

type InfoPagePublicProps = {
  params: Promise<{ id: string }>;
};

export default async function InfoPagePublic({ params }: InfoPagePublicProps) {
  const { id } = await params;
  const page = await fetchInfoPage(id);

  if (!page) {
    notFound();
  }

  const formattedDate = new Date(page.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Stack gap="xl" maw={720} mx="auto" mt="xl" px="md">
      <Group gap="sm">
        <ThemeIcon size="xl" radius="md" color="blue">
          <IconInfoCircle size={22} />
        </ThemeIcon>
        <Stack gap={0}>
          <Title order={2}>{page.title}</Title>
          <Badge color="gray" variant="light" size="sm">
            Publié le {formattedDate}
          </Badge>
        </Stack>
      </Group>

      {page.content && (
        <Paper shadow="xs" p="lg" radius="md" withBorder>
          <Text
            fz="md"
            lh={1.7}
            style={{ whiteSpace: "pre-wrap" }}
          >
            {page.content}
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
