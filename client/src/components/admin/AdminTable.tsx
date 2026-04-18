import { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: any, row: T) => ReactNode;
  sortable?: boolean;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  rowActions?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
}

export default function AdminTable<T extends { id: number | string }>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  rowActions,
  emptyState,
  loading,
}: AdminTableProps<T>) {
  if (loading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="h-64 flex items-center justify-center">
          {emptyState || (
            <p className="text-muted-foreground">Nenhum item encontrado</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.label}</span>
                    {col.sortable && onSort && (
                      <button
                        onClick={() =>
                          onSort(
                            String(col.key),
                            sortDirection === "asc" ? "desc" : "asc"
                          )
                        }
                        className="opacity-50 hover:opacity-100 transition"
                      >
                        {sortKey === String(col.key) ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronUp className="w-4 h-4 opacity-30" />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && (
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id}
                className={`border-b border-border hover:bg-muted/50 transition ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/20"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className="px-4 py-3 text-sm text-foreground"
                    style={{ width: col.width }}
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-4 py-3 text-right">{rowActions(row)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
