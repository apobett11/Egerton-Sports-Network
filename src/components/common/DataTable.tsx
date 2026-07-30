import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState, LoadingSpinner } from './UIComponents';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchKey?: keyof T;
  pageSize?: number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchKey,
  pageSize = 10,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyMessage = 'There are no records matching your request.',
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  if (isLoading) return <LoadingSpinner label="Loading table records..." />;

  // Filter
  const filteredData = data.filter((row) => {
    if (!searchKey || !searchTerm) return true;
    const val = row[searchKey];
    return String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search records..."
            aria-label="Search records"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-9 py-2.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none focus:border-[#D4AF37] min-h-[44px]"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto max-w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#191c1e] shadow-xs">
        <table className="w-full text-left text-xs min-w-[600px] border-collapse">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#101415] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 shadow-2xs">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`p-3.5 whitespace-nowrap ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-6">
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id ?? rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                    onRowClick ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`p-3.5 text-slate-800 dark:text-slate-200 ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as unknown as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Page {currentPage} of {totalPages} ({filteredData.length} records)
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              aria-label="Previous page"
              className="p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              aria-label="Next page"
              className="p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

