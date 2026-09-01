import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle = "Nenhum registro encontrado",
  emptyDescription,
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-ink-200 bg-white", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink-200 bg-ink-50/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-3 font-medium text-ink-500 whitespace-nowrap", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-3 align-middle text-ink-800", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
