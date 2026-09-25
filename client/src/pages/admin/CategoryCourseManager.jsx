import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { BookOpen, FolderTree, Plus, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';

const CategoryCourseManager = () => {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, crsRes] = await Promise.all([API.get('/admin/categories'), API.get('/admin/courses')]);
      setCategories(catRes.data.categories || []);
      setCourses(crsRes.data.courses || []);
    } catch (e) {
      console.error(e);
      toast.error('Unable to load academic setup');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return toast.warning('Category name is required');
    try {
      await API.post('/admin/categories', { name: newCatName.trim() });
      toast.success('Category added');
      setNewCatName('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) return toast.warning('Course name and code are required');
    try {
      await API.post('/admin/courses', { name: newCourseName.trim(), code: newCourseCode.trim().toUpperCase() });
      toast.success('Course added');
      setNewCourseName('');
      setNewCourseCode('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add course');
    }
  };

  return (
    <div className="workspace-page management-page">
      <PageHeader
        icon={BookOpen}
        eyebrow="Academic Setup"
        title="Courses & categories"
        description="Create reusable categories and course codes for exams, groups, and analytics inside the active college."
        actions={<button className="btn btn-outline-primary" onClick={fetchData}><Settings size={16} /> Refresh</button>}
      />

      <div className="workspace-summary" aria-label="Academic setup summary">
        <div className="workspace-summary-item"><FolderTree size={18} /><strong>{loading ? '—' : categories.length}</strong> categories</div>
        <div className="workspace-summary-item"><BookOpen size={18} /><strong>{loading ? '—' : courses.length}</strong> courses</div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="icon-box"><FolderTree size={22} /></span>
                <div>
                  <h5 className="fw-bold mb-1">Subject categories</h5>
                  <p className="text-muted mb-0 small">Used to classify assessments and question banks.</p>
                </div>
              </div>

              <form onSubmit={handleAddCategory} className="input-group category-form mb-4">
                <input aria-label="New subject category" className="form-control" placeholder="e.g. Computer science" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                <button type="submit" className="btn btn-primary"><Plus size={16} /> Add</button>
              </form>

              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
              ) : categories.length === 0 ? (
                <EmptyState title="No categories yet" description="Add your first subject category for this college." />
              ) : (
                <div className="vstack gap-2">
                  {categories.map((item) => (
                    <div key={item._id} className="metric-row bg-body">
                      <span className="fw-semibold text-body">{item.name}</span>
                      <span className="badge bg-primary">Category</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card h-100">
            <div className="card-body p-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <span className="icon-box"><BookOpen size={22} /></span>
                <div>
                  <h5 className="fw-bold mb-1">Academic courses</h5>
                  <p className="text-muted mb-0 small">Course codes connect students, groups, and reports.</p>
                </div>
              </div>

              <form onSubmit={handleAddCourse} className="row g-2 course-form mb-4">
                <div className="col-12 col-md-7">
                  <input aria-label="Course name" className="form-control" placeholder="Bachelor of Technology" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required />
                </div>
                <div className="col-8 col-md-3">
                  <input aria-label="Course code" className="form-control text-uppercase" placeholder="BTECH" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())} required />
                </div>
                <div className="col-4 col-md-2">
                  <button type="submit" className="btn btn-primary w-100" aria-label="Add course"><Plus size={16} /></button>
                </div>
              </form>

              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
              ) : courses.length === 0 ? (
                <EmptyState title="No courses yet" description="Add course names and codes used by your college." />
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead><tr><th>Course</th><th>Code</th></tr></thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course._id}>
                          <td className="fw-semibold">{course.name}</td>
                          <td><span className="badge bg-warning text-dark font-monospace">{course.code}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCourseManager;
