import API from '../services/api';
import { toast } from 'react-toastify';

/**
 * Downloads assessment results as an Excel (.xlsx) file with full filter support.
 * @param {Object} filters - Query filters (examId, groupId, courseId, department, studentId)
 * @param {String} customFileName - Optional custom filename overriding Content-Disposition header
 * @returns {Promise<boolean>} Success status
 */
export const downloadResultsExcel = async (filters = {}, customFileName = null) => {
  try {
    const response = await API.get('/results/export/excel', {
      params: filters,
      responseType: 'blob',
    });

    // Handle Blob error payloads (e.g. 404 / 403 returned as JSON Blob)
    if (response.data.type && response.data.type.includes('application/json')) {
      const text = await response.data.text();
      const errObj = JSON.parse(text);
      toast.info(errObj.message || 'No results found for the selected filters');
      return false;
    }

    const contentDisposition = response.headers['content-disposition'];
    let fileName = customFileName || 'Assessment_Results.xlsx';

    if (!customFileName && contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        fileName = match[1];
      }
    }

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Results Excel spreadsheet downloaded successfully!');
    return true;
  } catch (err) {
    console.error('Excel Download Error:', err);

    if (err.response && err.response.data) {
      if (err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errObj = JSON.parse(text);
          if (err.response.status === 404) {
            toast.info(errObj.message || 'No results found for the selected filters');
          } else {
            toast.error(errObj.message || 'Failed to download results Excel');
          }
          return false;
        } catch (e) {}
      }
      toast.error(err.response.data.message || 'Failed to download results Excel');
    } else {
      toast.error('Failed to download results Excel');
    }
    return false;
  }
};
