/**
 * Export utilities for data export functionality
 */

export interface ExportColumn {
    key: string;
    label: string;
    format?: (value: any) => string;
}

export function exportToCSV(
    data: any[],
    columns: ExportColumn[],
    filename: string
): void {
    if (data.length === 0) {
        throw new Error('No data to export');
    }

    // Create CSV header
    const header = columns.map(col => col.label).join(',');

    // Create CSV rows
    const rows = data.map(item => {
        return columns.map(col => {
            const value = item[col.key];
            const formatted = col.format ? col.format(value) : value;
            
            // Escape commas and quotes
            if (typeof formatted === 'string' && (formatted.includes(',') || formatted.includes('"'))) {
                return `"${formatted.replace(/"/g, '""')}"`;
            }
            
            return formatted ?? '';
        }).join(',');
    });

    // Combine header and rows
    const csv = [header, ...rows].join('\n');

    // Create and download file
    downloadFile(csv, filename, 'text/csv');
}

export function exportToJSON(
    data: any[],
    filename: string,
    pretty: boolean = true
): void {
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    downloadFile(json, filename, 'application/json');
}

export function downloadFile(
    content: string,
    filename: string,
    mimeType: string
): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export function generateFilename(
    prefix: string,
    extension: string = 'csv'
): string {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}-${date}-${time}.${extension}`;
}
