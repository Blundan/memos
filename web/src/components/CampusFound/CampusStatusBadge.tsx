import { cn } from "@/lib/utils";
import { useTranslate } from "@/utils/i18n";
import { CAMPUS_STATUS_META, isCampusItemStatus } from "./campus";

interface CampusStatusBadgeProps {
  status: string;
  className?: string;
}

/** The colored lifecycle pill shown on a memo card: 寻物 / 招领 / 已寻回. */
const CampusStatusBadge = ({ status, className }: CampusStatusBadgeProps) => {
  const t = useTranslate();
  if (!isCampusItemStatus(status)) {
    return null;
  }
  const meta = CAMPUS_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 select-none items-center rounded-full border px-1.5 py-0.5 text-2xs font-medium leading-none",
        meta.pillClasses,
        className,
      )}
    >
      {t(meta.labelKey)}
    </span>
  );
};

export default CampusStatusBadge;
