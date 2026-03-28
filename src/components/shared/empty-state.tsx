'use client'

import { useTranslations } from 'next-intl'
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  const t = useTranslations('common')
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Construction className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{title || t('labels.comingSoon')}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description || t('labels.comingSoonDesc')}</p>
      </CardContent>
    </Card>
  );
}
