"use client";

import { useRef } from "react";
import {
  Modal,
  Stack,
  Text,
  Button,
  Group,
  CopyButton,
  Tooltip,
  ActionIcon,
  Paper,
  Center,
} from "@mantine/core";
import { QRCodeCanvas } from "qrcode.react";
import { IconDownload, IconCopy, IconCheck } from "@tabler/icons-react";
import type { InfoPage } from "@/types/info-page";

type QrCodeModalProps = {
  opened: boolean;
  onClose: () => void;
  page: InfoPage;
};

export default function QrCodeModal({ opened, onClose, page }: QrCodeModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}/info/${page.id}`
    : `/info/${page.id}`;

  function handleDownload() {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-${page.title.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`QR code — ${page.title}`}
      centered
      size="sm"
    >
      <Stack gap="md" align="center">
        <Paper p="md" radius="md" withBorder>
          <Center ref={canvasRef}>
            <QRCodeCanvas
              value={pageUrl}
              size={220}
              level="M"
              includeMargin
            />
          </Center>
        </Paper>

        <Stack gap="xs" w="100%">
          <Text fz="xs" c="dimmed" ta="center">
            URL de la page
          </Text>
          <Group gap="xs" justify="center">
            <Text fz="xs" c="blue" style={{ wordBreak: "break-all" }}>
              {pageUrl}
            </Text>
            <CopyButton value={pageUrl} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Copié !" : "Copier l'URL"} withArrow>
                  <ActionIcon
                    color={copied ? "teal" : "gray"}
                    variant="subtle"
                    onClick={copy}
                    size="sm"
                    aria-label={copied ? "URL copiée" : "Copier l'URL"}
                  >
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
        </Stack>

        <Group gap="sm" w="100%" justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Fermer
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleDownload}
          >
            Télécharger (PNG)
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
