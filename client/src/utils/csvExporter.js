/**
 * Exports JSON data objects to a downloadable UTF-8 CSV file
 * @param {string} filename - Output file name (e.g. Gradebook_Exam_CS101.csv)
 * @param {Array<Object>} rows - Data rows array
 * @param {Array<{key: string, label: string}>} headers - Header mappings
 */
export const exportToCSV = (filename, rows, headers) => {
  if (!rows || !rows.length) return;

  const headerLabels = headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
  const rowLines = rows.map((row) => {
    return headers
      .map((h) => {
        let val = row[h.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headerLabels, ...rowLines].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
