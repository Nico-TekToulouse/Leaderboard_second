"use client";

import {
  Modal,
  Button,
  Group,
  Text,
  Stack,
  TextInput,
  Box,
  ThemeIcon,
  Avatar,
  FileInput,
  ColorInput,
} from "@mantine/core";
import {
  IconShield,
  IconDeviceFloppy,
  IconUpload,
  IconTrash,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { notifications } from "@mantine/notifications";

export type FactionAdminRow = {
  id: string;
  name: string;
  color: string;
  logo: string | null;
};

type FactionEditModalProps = {
  opened: boolean;
  onClose: () => void;
  onSaved: (updated: FactionAdminRow) => void;
  faction: FactionAdminRow | null;
};

type FactionPatchResponse = FactionAdminRow;
type FactionPatchError = { error: string };

type LogoApiResponse = FactionAdminRow;
type LogoApiError = { error: string };

/** Action demandée par l'admin sur le logo avant enregistrement. */
type LogoAction = "keep" | "upload" | "remove";

export default function FactionEditModal({
  opened,
  onClose,
  onSaved,
  faction,
}: FactionEditModalProps) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [color, setColor] = useState("");
  const [loading, setLoading] = useState(false);

  // Logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoAction, setLogoAction] = useState<LogoAction>("keep");
  // Aperçu local du fichier sélectionné
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Réinitialiser l'état à chaque ouverture
  useEffect(() => {
    if (opened && faction) {
      setName(faction.name);
      setColor(faction.color);
      setLogoFile(null);
      setLogoAction("keep");
      setLocalPreview(null);
      setNameError(null);
    }
  }, [opened, faction]);

  // Générer / révoquer l'URL objet dès que le fichier change.
  // La mise à null est gérée dans handleFileChange (hors effet) pour éviter setState en effet.
  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLocalPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  function handleFileChange(file: File | null) {
    setLogoFile(file);
    setLogoAction(file ? "upload" : "keep");
    if (!file) setLocalPreview(null);
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setLocalPreview(null);
    setLogoAction("remove");
  }

  function handleCancelRemove() {
    setLogoAction("keep");
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Le nom est requis.");
      return;
    }
    setNameError(null);
    setLoading(true);

    let latest: FactionAdminRow = faction!;

    try {
      // 1. Mettre à jour le nom et/ou la couleur si modifiés
      if (trimmedName !== faction!.name || color !== faction!.color) {
        const patch: Record<string, string> = {};
        if (trimmedName !== faction!.name) patch.name = trimmedName;
        if (color !== faction!.color) patch.color = color;

        const res = await fetch(`/api/admin/factions/${faction!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) {
          const data = (await res.json()) as FactionPatchError;
          notifications.show({
            title: "Erreur",
            message: data.error ?? "Une erreur est survenue.",
            color: "red",
            autoClose: 4000,
          });
          setLoading(false);
          return;
        }
        latest = (await res.json()) as FactionPatchResponse;
      }

      // 2. Upload du logo
      if (logoAction === "upload" && logoFile) {
        const form = new FormData();
        form.append("file", logoFile);
        const res = await fetch(`/api/admin/factions/${faction!.id}/logo`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          const data = (await res.json()) as LogoApiError;
          notifications.show({
            title: "Erreur lors de l'upload",
            message: data.error ?? "Une erreur est survenue.",
            color: "red",
            autoClose: 4000,
          });
          setLoading(false);
          return;
        }
        latest = (await res.json()) as LogoApiResponse;
      }

      // 3. Suppression du logo
      if (logoAction === "remove") {
        const res = await fetch(`/api/admin/factions/${faction!.id}/logo`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const data = (await res.json()) as LogoApiError;
          notifications.show({
            title: "Erreur lors de la suppression du logo",
            message: data.error ?? "Une erreur est survenue.",
            color: "red",
            autoClose: 4000,
          });
          setLoading(false);
          return;
        }
        latest = (await res.json()) as LogoApiResponse;
      }
    } catch {
      notifications.show({
        title: "Erreur réseau",
        message: "Impossible de contacter le serveur.",
        color: "red",
        autoClose: 4000,
      });
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved(latest);
    onClose();
  }

  // Source de l'aperçu : preview local > logo existant > null
  const previewSrc =
    logoAction === "remove"
      ? null
      : (localPreview ?? faction?.logo ?? null);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="violet" variant="light" size="md">
            <IconShield size={16} />
          </ThemeIcon>
          <Text fw={600}>Modifier la faction</Text>
        </Group>
      }
      size="sm"
    >
      <Stack gap="md">
        {/* Aperçu */}
        {faction && (
          <Group
            gap="sm"
            p="sm"
            style={{
              background: "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))",
              borderRadius: "var(--mantine-radius-md)",
            }}
          >
            {previewSrc ? (
              <Avatar src={previewSrc} size={36} radius="xl" />
            ) : (
              <Box
                w={36}
                h={36}
                style={{
                  borderRadius: "50%",
                  background: color || faction.color,
                  flexShrink: 0,
                }}
              />
            )}
            <Text fw={600} fz="sm">
              {name || faction.name}
            </Text>
          </Group>
        )}

        <TextInput
          label="Nom de la faction"
          placeholder="ex: Bats"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
          required
        />

        <ColorInput
          label="Couleur de la faction"
          description="Utilisée pour les progress bars, graphiques et badges."
          placeholder="#E53935"
          format="hex"
          value={color}
          onChange={setColor}
        />

        {/* Upload du logo */}
        <FileInput
          label="Logo de la faction"
          placeholder="Choisir une image…"
          description="PNG, JPEG, WebP ou SVG — 2 Mo max."
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          leftSection={<IconUpload size={16} />}
          value={logoFile}
          onChange={handleFileChange}
          clearable
        />

        {/* Bouton « Retirer le logo » affiché uniquement si un logo est actuellement défini */}
        {faction?.logo && logoAction !== "remove" && !logoFile && (
          <Button
            variant="subtle"
            color="red"
            size="xs"
            leftSection={<IconTrash size={14} />}
            onClick={handleRemoveLogo}
          >
            Retirer le logo actuel
          </Button>
        )}

        {/* Annuler la suppression */}
        {logoAction === "remove" && (
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={handleCancelRemove}
          >
            Annuler la suppression du logo
          </Button>
        )}

        <Group justify="flex-end" gap="sm" mt="xs">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            leftSection={<IconDeviceFloppy size={16} />}
          >
            Enregistrer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
