import React, { useContext, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import API, { getApiErrorMessage } from '../services/api';
import '../styles/college-management-modern.css';

const template = 'name,email,password,phone,course,branch,rollNumber,semester\r\n';

export default function BulkImportStudents({ onImported }) {
  const { activeCollege } = useContext(AuthContext);
  const dialog = useRef(null);
  const fileInput = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (open && !dialog.current.open) dialog.current.showModal();
    else if (!open && dialog.current.open) dialog.current.close();
  }, [open]);

  const close = () => {
    if (importing) return;
    setOpen(false);
    setFile(null);
    setError('');
    setReport(null);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (event) => {
    event.preventDefault();
    if (!file || importing) return;

    const formData = new FormData();
    formData.append('file', file);
    setImporting(true);
    setError('');
    setReport(null);
    try {
      const response = await API.post('/admin/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(response.data);
      if (response.data.importedCount > 0) onImported?.();
      if (response.data.failedCount > 0) {
        toast.warning(`${response.data.importedCount} students imported; ${response.data.failedCount} rows need attention.`);
      } else {
        toast.success(`${response.data.importedCount} students imported successfully.`);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to import this student file.'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <button className="btn btn-outline-primary" disabled={!activeCollege?._id} onClick={() => setOpen(true)}>
        <FileSpreadsheet size={16} /> Bulk import
      </button>
      <dialog
        ref={dialog}
        className="cm-editor"
        aria-labelledby="bulk-student-import-title"
        onCancel={(event) => { event.preventDefault(); close(); }}
      >
        <div className="cm-editor-heading">
          <div>
            <span className="ca-eyebrow">{activeCollege?.name}</span>
            <h2 id="bulk-student-import-title">Bulk import students</h2>
            <p>Upload a CSV or Excel file to create multiple student accounts in this college.</p>
          </div>
          <button className="cm-icon-button" disabled={importing} aria-label="Close bulk import" onClick={close}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={importFile}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <span className="small text-secondary">Required columns: name, email, password</span>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={downloadTemplate}>
              <Download size={15} /> Download CSV template
            </button>
          </div>
          <p className="form-text mb-3">
            Optional columns: phone, course, branch, rollNumber, semester. Use one student per row; files are limited to 500 students and 5 MB.
            Temporary passwords are included in the file, so keep it private and delete it securely after import.
          </p>
          <label className="form-label" htmlFor="bulk-student-file">Student spreadsheet</label>
          <input
            ref={fileInput}
            id="bulk-student-file"
            className="form-control"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={importing}
            onChange={(event) => { setFile(event.target.files?.[0] || null); setReport(null); setError(''); }}
          />
          {file && <div className="form-text mt-2">Selected: {file.name}</div>}
          {error && <div className="alert alert-danger small mt-3 mb-0" role="alert">{error}</div>}

          {report && (
            <div className="mt-4">
              <div className="alert alert-info py-2" role="status">
                {report.importedCount} imported · {report.failedCount} failed
              </div>
              {report.failedCount > 0 && (
                <div className="table-responsive" style={{ maxHeight: 240, overflowY: 'auto' }}>
                  <table className="table table-sm align-middle">
                    <thead><tr><th>Row</th><th>Email</th><th>Issue</th></tr></thead>
                    <tbody>
                      {report.results.filter((result) => result.status === 'failed').map((result) => (
                        <tr key={`${result.row}-${result.email}`}>
                          <td>{result.row}</td>
                          <td>{result.email || '—'}</td>
                          <td>{result.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" disabled={importing} onClick={close}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={!file || importing}>
              {importing ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Importing...</> : <><Upload size={16} /> Import students</>}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
