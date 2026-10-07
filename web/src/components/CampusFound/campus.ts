import { useTranslate, type Translations } from "@/utils/i18n";

/**
 * Campus lost-and-found extensions (校园寻物).
 *
 * These helpers are shared by the editor controls, the memo card badges and
 * the filter bar. They exist only in the CampusFound fork — upstream memos
 * has no concept of item lifecycle or anonymous posting.
 */

export const CAMPUS_ITEM_STATUSES = ["LOST", "FOUND", "RESOLVED"] as const;
export type CampusItemStatus = (typeof CAMPUS_ITEM_STATUSES)[number];

/** The creator resource name the server reports for anonymous posts. */
export const CAMPUS_ANONYMOUS_CREATOR = "users/anonymous";

export const isCampusItemStatus = (value: string): value is CampusItemStatus =>
  (CAMPUS_ITEM_STATUSES as readonly string[]).includes(value);

interface CampusStatusMeta {
  labelKey: Translations;
  /** Pill styling, following the Chinese convention: lost = red, found = blue, resolved = green. */
  pillClasses: string;
}

export const CAMPUS_STATUS_META: Record<CampusItemStatus, CampusStatusMeta> = {
  LOST: {
    labelKey: "campus.status-lost",
    pillClasses: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  FOUND: {
    labelKey: "campus.status-found",
    pillClasses: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  RESOLVED: {
    labelKey: "campus.status-resolved",
    pillClasses: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
};

/** Short action verb for each status, used in the composer and filter pills. */
export const CAMPUS_STATUS_ACTION_KEYS: Record<CampusItemStatus, Translations> = {
  LOST: "campus.action-lost",
  FOUND: "campus.action-found",
  RESOLVED: "campus.action-resolved",
};

/** Human-readable status label in the current locale. */
export const useCampusStatusLabel = (): ((status: string) => string) => {
  const t = useTranslate();
  return (status: string) => (isCampusItemStatus(status) ? t(CAMPUS_STATUS_META[status].labelKey) : status);
};
