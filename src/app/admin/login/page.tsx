"use client";

import {
  Box,
  Button,
  Center,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
  Alert,
} from "@mantine/core";
import { IconAlertCircle, IconShield } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { supabase } from "@/lib/supabase";

type LoginFormState = {
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [state, setState] = useState<LoginFormState>({
    email: "",
    password: "",
    error: null,
    loading: false,
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithPassword({
      email: state.email,
      password: state.password,
    });

    if (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Email ou mot de passe incorrect.",
      }));
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="sm">
        {state.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {state.error}
          </Alert>
        )}
        <TextInput
          label="Email"
          type="email"
          placeholder="admin@epitech.eu"
          required
          value={state.email}
          onChange={(e) =>
            setState((prev) => ({ ...prev, email: e.target.value }))
          }
        />
        <PasswordInput
          label="Mot de passe"
          placeholder="••••••••"
          required
          value={state.password}
          onChange={(e) =>
            setState((prev) => ({ ...prev, password: e.target.value }))
          }
        />
        <Button type="submit" fullWidth loading={state.loading} mt="xs">
          Se connecter
        </Button>
      </Stack>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <Center h="100vh" bg="gray.0">
      <Box w={380}>
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Stack gap="lg" align="center" mb="lg">
            <IconShield size={40} color="var(--mantine-color-blue-6)" />
            <Stack gap={4} align="center">
              <Title order={3}>Administration</Title>
              <Text c="dimmed" fz="sm">
                Connexion réservée aux administrateurs
              </Text>
            </Stack>
          </Stack>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </Paper>
      </Box>
    </Center>
  );
}
