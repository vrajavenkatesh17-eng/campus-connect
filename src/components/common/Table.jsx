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
      <div className="w-full bg-white border border-neutral-200 rounded-xl overflow-hidden p-12 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-neutral-500 font-medium">Loading data from database...</p>
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
    <div className="w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                scope="col"
                className={`px-6 py-3.5 font-semibold text-neutral-700 text-xs uppercase tracking-wider ${
                  col.className || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {data.map((row, rowIdx) => (
            <tr
              key={row[keyField] || rowIdx}
              className="hover:bg-neutral-50/70 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key || colIdx}
                  className={`px-6 py-4 whitespace-nowrap text-neutral-800 ${
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
