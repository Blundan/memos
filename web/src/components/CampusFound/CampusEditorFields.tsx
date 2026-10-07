import { create } from "@bufbuild/protobuf";
import { EyeOffIcon, MapPinIcon } from "lucide-react";
import { useEditorContext, useEditorSelector } from "@/components/MemoEditor/state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LocationSchema } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { CAMPUS_ITEM_STATUSES, CAMPUS_STATUS_ACTION_KEYS, CAMPUS_STATUS_META } from "./campus";

/**
 * Campus lost-and-found composer fields: the item lifecycle pills, a plain-text
 * location input (stored as the memo location placeholder) and the anonymous
 * posting switch. Rendered inside the memo editor's metadata area; invisible
 * for ordinary memos until the user engages with it.
 */
const CampusEditorFields = () => {
  const t = useTranslate();
  const { actions, dispatch } = useEditorContext();
  const itemStatus = useEditorSelector((s) => s.metadata.itemStatus);
  const isAnonymous = useEditorSelector((s) => s.metadata.isAnonymous);
  const location = useEditorSelector((s) => s.metadata.location);
  const disabled = useEditorSelector((s) => s.ui.isLoading.saving);

  const handleStatusClick = (status: (typeof CAMPUS_ITEM_STATUSES)[number]) => {
    dispatch(actions.setMetadata({ itemStatus: itemStatus === status ? undefined : status }));
  };

  const handleLocationChange = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      // Keep coordinates if a map location was already set; only clear the text.
      if (location && (location.latitude !== 0 || location.longitude !== 0)) {
        dispatch(
          actions.setMetadata({
            location: create(LocationSchema, { latitude: location.latitude, longitude: location.longitude }),
          }),
        );
      } else {
        dispatch(actions.setMetadata({ location: undefined }));
      }
      return;
    }
    dispatch(
      actions.setMetadata({
        location: create(LocationSchema, {
          placeholder: text,
          latitude: location?.latitude ?? 0,
          longitude: location?.longitude ?? 0,
        }),
      }),
    );
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {CAMPUS_ITEM_STATUSES.map((status) => {
          const active = itemStatus === status;
          return (
            <button
              key={status}
              type="button"
              disabled={disabled}
              onClick={() => handleStatusClick(status)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors",
                "disabled:pointer-events-none disabled:opacity-50",
                active
                  ? CAMPUS_STATUS_META[status].pillClasses
                  : "border-border/60 bg-accent/30 text-muted-foreground hover:bg-accent/60",
              )}
            >
              {t(CAMPUS_STATUS_ACTION_KEYS[status])}
            </button>
          );
        })}
        <label
          className={cn(
            "ml-auto inline-flex h-7 cursor-pointer select-none items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
            isAnonymous
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-border/60 bg-accent/30 text-muted-foreground hover:bg-accent/60",
          )}
          title={t("campus.anonymous-hint")}
        >
          <input
            type="checkbox"
            className="sr-only"
            checked={isAnonymous}
            disabled={disabled}
            onChange={(e) => dispatch(actions.setMetadata({ isAnonymous: e.target.checked }))}
          />
          <EyeOffIcon className="size-3.5" />
          {t("campus.post-anonymously")}
        </label>
      </div>
      <div className="relative">
        <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-8 text-sm"
          disabled={disabled}
          value={location?.placeholder ?? ""}
          placeholder={t("campus.location-placeholder")}
          onChange={(e) => handleLocationChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CampusEditorFields;
