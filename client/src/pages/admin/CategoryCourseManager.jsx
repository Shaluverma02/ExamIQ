import React, { useContext, useEffect, useState } from 'react';
import API from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { ArrowRight, BookOpen, CheckCircle2, FolderTree, Plus, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import EmptyState from '../../components/common/EmptyState';

const CategoryCourseManager = () => {
  const { activeCollege } = useContext(AuthContext);
  const [saving, setSaving] = useState('');
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCourseId, setNewCatCourseId] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeCollege?._id]);

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
    if (!newCatName.trim() || !newCatCourseId) return toast.warning('Category name and course are required');
    if (saving) return;
    setSaving('category');
    try {
      await API.post('/admin/categories', { name: newCatName.trim(), courseId: newCatCourseId });
      toast.success('Category added');
      setNewCatName('');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    } finally { setSaving(''); }
  };

  const handleAssignCourse = async (categoryId, courseId) => {
    if (!courseId || saving) return;
    setSaving(`category-${categoryId}`);
    try {
      await API.put(`/admin/categories/${categoryId}/course`, { courseId });
      toast.success('Course mapped to category');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to map course to category');
    } finally { setSaving(''); }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName.trim() || !newCourseCode.trim()) return toast.warning('Course name and code are required');
    if (saving) return;
    setSaving('course');
    try {
      const response = await API.post('/admin/courses', { name: newCourseName.trim(), code: newCourseCode.trim().toUpperCase() });
      setNewCatCourseId(response.data.course?._id || '');
      toast.success('Course added. Now choose it when adding a category.');
      setNewCourseName('');
      setNewCourseCode('');
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add course');
    } finally { setSaving(''); }
  };

  return (
    <div className="workspace-page management-page ca-academic-page">
      <div className="ca-academic-flow" aria-label="Academic setup steps">
        <div className="ca-academic-flow-steps">
          <div className={`ca-academic-flow-step ${courses.length ? 'is-complete' : 'is-current'}`}>
            <span>{courses.length ? <CheckCircle2 size={16} /> : '01'}</span><div><strong>Create courses</strong><small>Add the programs offered at your college</small></div>
          </div>
          <div className="ca-academic-flow-connector" />
          <div className={`ca-academic-flow-step ${courses.length ? 'is-current' : ''}`}>
            <span>02</span><div><strong>Connect categories</strong><small>Link each subject to its course</small></div>
          </div>
        </div>
        <div className="ca-academic-flow-summary" aria-label="Academic setup summary">
          <span><BookOpen size={15} /> <strong>{loading ? '—' : courses.length}</strong> courses</span>
          <span><FolderTree size={15} /> <strong>{loading ? '—' : categories.length}</strong> categories</span>
          <button className="ca-academic-refresh" onClick={fetchData} disabled={loading} aria-label="Refresh academic setup">
            <Settings size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6 order-1">
          <div className="card ca-academic-work-card h-100">
            <div className="card-body p-4">
              <div className="ca-academic-card-heading">
                <span className="ca-academic-step-icon ca-academic-course-icon"><BookOpen size={20} /></span>
                <div className="ca-academic-card-title">
                  <span className="ca-academic-step-label">STEP 01 · YOUR PROGRAMS</span>
                  <h2>Academic courses</h2>
                  <p>Add each course with its own unique code.</p>
                </div>
                <span className="ca-academic-count">{courses.length}</span>
              </div>

              <form onSubmit={handleAddCourse} className="row g-2 course-form mb-4">
                <div className="col-12 col-md-6">
                  <input aria-label="Course name" className="form-control" placeholder="Bachelor of Technology" value={newCourseName} onChange={(e) => setNewCourseName(e.target.value)} required />
                </div>
                <div className="col-8 col-md-3">
                  <input aria-label="Course code" className="form-control text-uppercase" placeholder="BTECH" value={newCourseCode} onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())} required />
                </div>
                <div className="col-4 col-md-3">
                  <button type="submit" disabled={!!saving} className="btn btn-primary w-100 ca-academic-add-button"><Plus size={16} /><span>Add course</span></button>
                </div>
              </form>

              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
              ) : courses.length === 0 ? (
                <EmptyState title="No courses added yet" description="Enter a course name and code above. After adding it, select that course in Step 2 to create its categories." />
              ) : (
                <div className="ca-academic-list">
                  {courses.map((course) => (
                    <div className="ca-academic-list-item" key={course._id}>
                      <span className="ca-academic-list-icon"><BookOpen size={17} /></span>
                      <div className="ca-academic-list-copy"><strong>{course.name}</strong><span>Course program</span></div>
                      <span className="ca-academic-code">{course.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6 order-2">
          <div className="card ca-academic-work-card h-100">
            <div className="card-body p-4">
              <div className="ca-academic-card-heading">
                <span className="ca-academic-step-icon ca-academic-category-icon"><FolderTree size={20} /></span>
                <div className="ca-academic-card-title">
                  <span className="ca-academic-step-label">STEP 02 · COURSE SUBJECTS</span>
                  <h2>Subject categories</h2>
                  <p>Choose the course each category belongs to.</p>
                </div>
                <span className="ca-academic-count">{categories.length}</span>
              </div>

              <form onSubmit={handleAddCategory} className="ca-academic-category-form mb-4">
                <label className="ca-academic-field-label" htmlFor="new-subject-category">Category name</label>
                <div className="ca-academic-field">
                  <FolderTree size={17} aria-hidden="true" />
                  <input id="new-subject-category" aria-label="New subject category" className="form-control" placeholder="e.g. Computer science" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                </div>
                <label className="ca-academic-field-label" htmlFor="category-course">Link to course</label>
                <select id="category-course" aria-label="Course for new category" className="form-select" value={newCatCourseId} onChange={(e) => setNewCatCourseId(e.target.value)} required disabled={courses.length === 0}>
                  <option value="">{courses.length ? 'Select a course' : 'Add a course first'}</option>
                  {courses.map((course) => <option key={course._id} value={course._id}>{course.name} ({course.code})</option>)}
                </select>
                <div className="ca-academic-form-footer">
                  <span>{courses.length ? 'This category will be linked to the selected course.' : 'A course is needed before you can add a category.'}</span>
                  <button type="submit" disabled={!!saving || courses.length === 0} className="btn btn-primary ca-academic-add-button"><Plus size={16} /><span>Add category</span></button>
                </div>
              </form>

              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" /></div>
              ) : categories.length === 0 ? (
                <EmptyState title="No categories added yet" description={courses.length ? 'Add a category above and link it to a course.' : 'Add a course in Step 1 first to enable category creation.'} />
              ) : (
                <div className="vstack gap-2">
                  {categories.map((item) => {
                    const categoryCourseId = item.courseId?._id || item.courseId;
                    const categoryCourse = courses.find((course) => course._id === String(categoryCourseId));
                    return (
                      <div key={item._id} className="ca-academic-list-item">
                        <span className="ca-academic-list-icon ca-academic-category-list-icon"><FolderTree size={17} /></span>
                        <div className="ca-academic-list-copy">
                          <strong>{item.name}</strong>
                          {categoryCourse ? (
                            <span>{categoryCourse.name} · {categoryCourse.code}</span>
                          ) : (
                            <span className="ca-academic-unassigned">Course not assigned yet</span>
                          )}
                        </div>
                        {!categoryCourse && (
                          <select
                            aria-label={`Assign course to ${item.name}`}
                            className="form-select form-select-sm ca-academic-assign-select"
                            value=""
                            onChange={(e) => handleAssignCourse(item._id, e.target.value)}
                            disabled={!!saving || courses.length === 0}
                          >
                            <option value="">Select course</option>
                            {courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}
                          </select>
                        )}
                      </div>
                    );
                  })}
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
