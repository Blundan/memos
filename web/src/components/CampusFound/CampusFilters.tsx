import { useState } from "react";
import { toast } from "react-hot-toast";
import { MapPinIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { memoServiceClient } from "@/connect";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import { useTranslate } from "@/utils/i18n";
import { CAMPUS_ITEM_STATUSES, CAMPUS_STATUS_ACTION_KEYS, CAMPUS_STATUS_META, useCampusStatusLabel } from "./campus";

/** Download `text` as a file, the standard in-browser export trick. */
const downloadTextFile = (filename: string, text: string, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const csvEscape = (value: string): string => `"${value.replaceAll('"', '""')}"`;

interface CampusFiltersProps {
  /** The full CEL filter the current list is using; the export reuses it. */
  filter?: string;
  className?: string;
}

/**
 * The campus lost-and-found filter rail above the memo list: status pills, a
 * location search box and a CSV export button for reporting/展示.
 */
const CampusFilters = ({ filter, className }: CampusFiltersProps) => {
  const t = useTranslate();
  const statusLabel = useCampusStatusLabel();
  const { filters, addFilter, removeFiltersByFactor } = useMemoFilterContext();
  const activeStatus = filters.find((f) => f.factor === "campus.status")?.value;
  const activeLocation = filters.find((f) => f.factor === "campus.location")?.value ?? "";
  const [locationInput, setLocationInput] = useState(activeLocation);
  const [isExporting, setIsExporting] = useState(false);

  const handleStatusClick = (status: (typeof CAMPUS_ITEM_STATUSES)[number] | undefined) => {
    removeFiltersByFactor("campus.status");
    if (status) {
      addFilter({ factor: "campus.status", value: status });
    }
  };

  const applyLocationFilter = (value: string) => {
    removeFiltersByFactor("campus.location");
    const trimmed = value.trim();
    if (trimmed) {
      addFilter({ factor: "campus.location", value: trimmed });
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      const memos = [];
      let pageToken = "";
      // Page through every memo matching the current filter (cap at 5000 rows for safety).
      for (let page = 0; page < 50; page++) {
        const response = await memoServiceClient.listMemos({
          state: State.NORMAL,
          orderBy: "create_time desc",
          filter,
          pageSize: 100,
          pageToken,
        });
        memos.push(...response.memos);
        pageToken = response.nextPageToken;
        if (!pageToken) break;
      }
      if (memos.length === 0) {
        toast.success(t("campus.export-csv-empty"));
        return;
      }
      const header = [
        t("campus.csv.id"),
        t("campus.csv.created-at"),
        t("campus.csv.status"),
        t("campus.csv.location"),
        t("campus.csv.content"),
        t("campus.csv.creator"),
        t("campus.csv.anonymous"),
      ];
      const rows = memos.map((memo) => [
        memo.name,
        memo.createTime ? timestampDate(memo.createTime).toISOString() : "",
        memo.itemStatus ? statusLabel(memo.itemStatus) : "",
        memo.location?.placeholder ?? "",
        memo.content,
        memo.creator,
        memo.isAnonymous ? t("campus.yes") : t("campus.no"),
      ]);
      // UTF-8 BOM keeps Excel happy with Chinese text.
      const csv = ["\uFEFF", [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\r\n")].join("");
      const date = new Date().toISOString().slice(0, 10);
      downloadTextFile(`campus-found-${date}.csv`, csv);
      toast.success(t("campus.export-csv-success", { count: memos.length }));
    } catch (error) {
      console.error(error);
      toast.error(t("campus.export-csv-error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn("flex w-full flex-row flex-wrap items-center gap-1.5", className)}>
      <button
        type="button"
        onClick={() => handleStatusClick(undefined)}
        className={cn(
          "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium transition-colors",
          !activeStatus ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 bg-accent/30 text-muted-foreground hover:bg-accent/60",
        )}
      >
        {t("campus.filter-all")}
      </button>
      {CAMPUS_ITEM_STATUSES.map((status) => {
        const active = activeStatus === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => handleStatusClick(active ? undefined : status)}
            title={statusLabel(status)}
            className={cn(
              "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium transition-colors",
              active ? CAMPUS_STATUS_META[status].pillClasses : "border-border/60 bg-accent/30 text-muted-foreground hover:bg-accent/60",
            )}
          >
            {t(CAMPUS_STATUS_ACTION_KEYS[status])}
          </button>
        );
      })}
      <div className="relative ml-1 h-7 w-44">
        <MapPinIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-7 rounded-full pl-8 pr-7 text-xs"
          placeholder={t("campus.filter-location-placeholder")}
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applyLocationFilter(locationInput);
            }
          }}
          onBlur={() => {
            if (locationInput.trim() !== activeLocation) {
              applyLocationFilter(locationInput);
            }
          }}
        />
        {activeLocation && (
          <button
            type="button"
            aria-label={t("campus.clear-location")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setLocationInput("");
              removeFiltersByFactor("campus.location");
            }}
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="ml-auto h-7 rounded-full px-2.5 text-xs"
        disabled={isExporting}
        onClick={() => void handleExportCsv()}
      >
        <SearchIcon className={cn("size-3.5", isExporting && "animate-pulse")} />
        {t("campus.export-csv")}
      </Button>
    </div>
  );
};

export default CampusFilters;
