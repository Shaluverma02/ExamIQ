import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Plus, BookOpen, Settings } from 'lucide-react';
import { toast } from 'react-toastify';

const CategoryCourseManager = () => {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, crsRes] = await Promise.all([API.get('/admin/categories'), API.get('/admin/courses')]);
      setCategories(catRes.data.categories || []);
      setCourses(crsRes.data.courses || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await API.post('/admin/categories', { name: newCatName });
      toast.success('Category added');
      setNewCatName('');
      fetchData();
    } catch (err) {
      toast.error('Failed to add category');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseName || !newCourseCode) return;
    try {
      await API.post('/admin/courses', { name: newCourseName, code: newCourseCode });
      toast.success('Course added');
      setNewCourseName('');
      setNewCourseCode('');
      fetchData();
    } catch (err) {
      toast.error('Failed to add course');
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header Section */}
      <div className="mb-4 pb-2 border-bottom">
        <h3 className="fw-bold m-0 d-flex align-items-center gap-2 text-body">
          <Settings className="text-primary" size={26} /> Courses & Subject Domains
        </h3>
        <p className="text-secondary small mt-1 mb-0">
          Configure category classifications and academic course codes.
        </p>
      </div>

      <div className="row g-4">
        {/* Categories Section */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-body-tertiary">
            <h5 className="fw-bold mb-3 text-body d-flex align-items-center gap-2">
              <BookOpen size={20} className="text-primary" /> Categories
            </h5>

            <form onSubmit={handleAddCategory} className="d-flex gap-2 mb-4">
              <input
                type="text"
                className="form-control"
                placeholder="New Category Name (e.g. Cybersecurity)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button type="submit" className="btn btn-primary fw-semibold text-nowrap d-flex align-items-center gap-1">
                <Plus size={16} /> Add Category
              </button>
            </form>

            <ul className="list-group list-group-flush bg-transparent">
              {categories.length === 0 ? (
                <li className="list-group-item bg-transparent text-secondary text-center py-3 border-0">
                  No categories found.
                </li>
              ) : (
                categories.map((c) => (
                  <li key={c._id} className="list-group-item bg-transparent text-body border-secondary-subtle d-flex justify-content-between align-items-center py-3">
                    <span className="fw-medium">{c.name}</span>
                    <span className="badge bg-secondary">Category</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Courses Section */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-body-tertiary">
            <h5 className="fw-bold mb-3 text-body d-flex align-items-center gap-2">
              <BookOpen size={20} className="text-warning" /> Academic Courses
            </h5>

            <form onSubmit={handleAddCourse} className="row g-2 mb-4">
              <div className="col-7">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Course Name"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                />
              </div>
              <div className="col-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Code"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                />
              </div>
              <div className="col-2">
                <button type="submit" className="btn btn-warning w-100 fw-bold d-flex align-items-center justify-content-center" title="Add Course">
                  <Plus size={18} />
                </button>
              </div>
            </form>

            <ul className="list-group list-group-flush bg-transparent">
              {courses.length === 0 ? (
                <li className="list-group-item bg-transparent text-secondary text-center py-3 border-0">
                  No courses found.
                </li>
              ) : (
                courses.map((crs) => (
                  <li key={crs._id} className="list-group-item bg-transparent text-body border-secondary-subtle d-flex justify-content-between align-items-center py-3">
                    <span className="fw-medium">{crs.name}</span>
                    <span className="badge bg-warning text-dark font-monospace">{crs.code}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryCourseManager;