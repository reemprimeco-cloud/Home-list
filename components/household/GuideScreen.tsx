"use client";

import Link from "next/link";

import { Card, Screen } from "@/components/ui/Primitives";
import { branding } from "@/lib/branding";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const STEP_KEYS: MessageKey[] = [
  "guide.step1",
  "guide.step2",
  "guide.step3",
  "guide.step4",
  "guide.step5",
  "guide.step6",
  "guide.step7",
];

/**
 * The numbered walkthrough itself — just the list, no page chrome —
 * shared between GuideScreen (the permanent Settings page) and
 * PaywallScreen's success state (shown automatically right after a
 * household subscribes, the other moment someone most wants it: having
 * just paid and wanting to know what they now get to do with it).
 */
export function GuideSteps() {
  const { t } = useLocale();

  return (
    <Card>
      <ol className="space-y-4">
        {STEP_KEYS.map((key, index) => (
          <li key={key} className="flex items-start gap-3">
            <span
              aria-hidden
              className="hl-label flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary-tint text-primary"
            >
              {index + 1}
            </span>
            <span className="hl-body text-ink">{t(key)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/**
 * The permanent version, reached from Settings ("How to use"). Distinct
 * from AboutScreen, which is a short "what this app is for" blurb; this
 * one is task-ordered steps, matching how the workflow actually happens
 * end to end.
 */
export function GuideScreen({ backHref = "/home/settings" }: { backHref?: string }) {
  const { t } = useLocale();

  return (
    <Screen title={t("guide.title", { name: branding.name })}>
      <GuideSteps />

      <Link href={backHref} className="hl-label text-center text-primary underline">
        {t("common.back")}
      </Link>
    </Screen>
  );
}
