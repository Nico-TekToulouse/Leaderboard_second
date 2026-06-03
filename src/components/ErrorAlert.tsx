"use client";

import { Alert } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

type ErrorAlertProps = {
  title: string;
  message: string;
};

export default function ErrorAlert({ title, message }: ErrorAlertProps) {
  return (
    <Alert icon={<IconAlertCircle size={16} />} color="orange" title={title}>
      {message}
    </Alert>
  );
}
