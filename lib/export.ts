function getObjectEntries(row: object): Array<[string, unknown]> {
  return Object.entries(row);
}

/**
 * Export data to CSV
 * @param data Array of objects to export
 * @param filename Name of the file to download
 */
export function exportToCSV<T extends object>(data: T[], filename: string) {
  if (!data || data.length === 0) {
    return;
  }

  // Get headers from first object
  const headers = getObjectEntries(data[0]).map(([header]) => header);

  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) => {
      const rowEntries = new Map(getObjectEntries(row));
      return headers
        .map((header) => {
          const value = rowEntries.get(header);
          // Handle strings with commas, quotes, or newlines
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          // Handle dates and objects roughly
          if (value instanceof Date) {
            return value.toISOString();
          }
          if (typeof value === 'object' && value !== null) {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',');
    }),
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
