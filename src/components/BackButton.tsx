"use client";

import { Button } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

type BackButtonProps = {
  href: string;
  label: string;
};

export default function BackButton({ href, label }: BackButtonProps) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} size="sm">
        {label}
      </Button>
    </Link>
  );
}
