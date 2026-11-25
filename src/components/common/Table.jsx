import React from 'react';
import Spinner from './Spinner';
import EmptyState from './EmptyState';

export default function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There is currently no data in this table.',
  keyField = 'id',
}) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface border border-line rounded-[20px] overflow-hidden p-12 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-muted font-medium">Loading data from database...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-[20px] border border-line bg-surface shadow-sm dark:shadow-none">
      <table className="min-w-full divide-y divide-line text-left text-sm">
        <thead className="bg-surface-2/70">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`px-6 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider ${
                  col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line bg-surface">
          {data.map((row, rowIdx) => (
            <tr
              key={row[keyField] || rowIdx}
              className="hover:bg-surface-2/50 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`px-6 py-4 whitespace-nowrap text-ink ${
                    col.cellClassName || ''
                  }`}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
