import type { ReportVersionSummary } from "@/src/modules/reports/api/reports.types";

export interface VersionDropdownProps {
  versions: ReportVersionSummary[];
  value: string;
  onChange: (versionId: string) => void;
}

export function VersionDropdown({
  versions,
  value,
  onChange,
}: VersionDropdownProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-labora-charcoal">Version</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-labora-ui bg-white px-3 text-sm text-labora-charcoal focus:outline-none focus:ring-2 focus:ring-labora-green"
      >
        {versions.map((version) => (
          <option key={version.id} value={version.id}>
            v{version.versionNumber} - {version.status}
          </option>
        ))}
      </select>
    </label>
  );
}
