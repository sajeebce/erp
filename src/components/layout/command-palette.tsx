"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navigation } from "@/data/navigation";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const t = useTranslations("navigation");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={t("searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{t("noResults")}</CommandEmpty>
        {navigation.map((module, idx) => (
          <React.Fragment key={module.title}>
            <CommandGroup heading={t(module.title)}>
              <CommandItem onSelect={() => handleSelect(module.url)}>
                {module.icon && <module.icon className="mr-2 h-4 w-4" />}
                <span>{t(module.title)}</span>
              </CommandItem>
              {module.items?.map((sub) => (
                <CommandItem
                  key={sub.url}
                  onSelect={() => handleSelect(sub.url)}
                >
                  <span className="ml-6">{t(sub.title)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {idx < navigation.length - 1 && <CommandSeparator />}
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
