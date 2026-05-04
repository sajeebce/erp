"use client";

import { use } from "react";
import { RoleEditForm } from "@/components/settings/role-edit-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RoleEditPage({ params }: PageProps) {
  const { id } = use(params);
  return <RoleEditForm roleId={id} />;
}
