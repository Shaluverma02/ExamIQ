import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain,
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  Trophy,
  Target,
  Code2,
  RotateCcw,
  Loader2,
  AlertCircle,
  Swords,
} from 'lucide-react';

import API from '../../services/api';
import CodingBattleModal from '../../components/CodingBattleModal';

const ProblemSolvingArena = () => {
  const [problems, setProblems] = useState([]);
  const [showBattleModal, setShowBattleModal] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // =====================================================
  // FETCH CODING PROBLEMS
  // =====================================================

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await API.get('/coding');

      setProblems(res.data?.problems || []);
    } catch (err) {
      console.error('Fetch coding problems error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load coding problems.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  // =====================================================
  // DYNAMIC STATS
  // =====================================================

  const totalProblems = problems.length;

  /*
   * Abhi CodingProblem model me solved status nahi hai.
   * Isliye jab tak submission-history endpoint nahi banate,
   * solved = false rakhenge.
   */
  const solvedCount = problems.filter(
    (problem) => problem.solved === true
  ).length;

  const accuracy =
    totalProblems > 0
      ? Math.round((solvedCount / totalProblems) * 100)
      : 0;

  const earnedXP = solvedCount * 25;

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        problems
          .map((problem) => problem.category)
          .filter(Boolean)
      ),
    ];

    return uniqueCategories;
  }, [problems]);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const title = problem.title || '';

      const matchesSearch = title
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All' ||
        problem.category === selectedCategory;

      const difficulty =
        problem.difficulty?.toLowerCase() || '';

      const matchesDifficulty =
        selectedDifficulty === 'All' ||
        difficulty === selectedDifficulty.toLowerCase();

      const matchesSolved =
        !showSolvedOnly || problem.solved === true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDifficulty &&
        matchesSolved
      );
    });
  }, [
    problems,
    search,
    selectedCategory,
    selectedDifficulty,
    showSolvedOnly,
  ]);

  // =====================================================
  // RESET
  // =====================================================

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setShowSolvedOnly(false);
  };

  // =====================================================
  // DIFFICULTY
  // =====================================================

  const getDifficultyClass = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-success';

      case 'medium':
        return 'bg-warning text-dark';

      case 'hard':
        return 'bg-danger';

      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid px-0">
      <CodingBattleModal isOpen={showBattleModal} onClose={() => setShowBattleModal(false)} />

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 mb-4">

        <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                className="rounded-3 p-2 d-flex align-items-center justify-content-center"
                style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.12)',
                  color: 'var(--primary-color)',
                }}
              >
                <Brain size={24} />
              </div>

              <h3 className="fw-bold mb-0">
                Problem Solving Arena
              </h3>
            </div>

            <p className="text-muted small mb-0">
              Master Data Structures, Algorithms, and
              Competitive Programming.
            </p>
          </div>

          <button
            className="btn btn-warning fw-bold text-dark rounded-pill px-4 d-flex align-items-center gap-2 shadow-sm"
            onClick={() => setShowBattleModal(true)}
          >
            <Swords size={18} /> Enter 1v1 Speed Battle
          </button>
        </div>

        {/* =================================================
            STATS
            ================================================= */}

        <div className="d-flex flex-wrap gap-2">

          <div className="card shadow-sm">

            <div className="card-body py-2 px-3">

              <div className="d-flex align-items-center gap-2">

                <CheckCircle2
                  size={17}
                  className="text-success"
                />

                <div>

                  <div className="fw-bold small">
                    {solvedCount} / {totalProblems}
                  </div>

                  <div className="text-muted small">
                    Solved
                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="card shadow-sm">

            <div className="card-body py-2 px-3">

              <div className="d-flex align-items-center gap-2">

                <Target
                  size={17}
                  className="text-info"
                />

                <div>

                  <div className="fw-bold small">
                    {accuracy}%
                  </div>

                  <div className="text-muted small">
                    Accuracy
                  </div>

                </div>

              </div>

            </div>

          </div>

          <div className="card shadow-sm">

            <div className="card-body py-2 px-3">

              <div className="d-flex align-items-center gap-2">

                <Trophy
                  size={17}
                  className="text-warning"
                />

                <div>

                  <div className="fw-bold small">
                    {earnedXP} XP
                  </div>

                  <div className="text-muted small">
                    Earned
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          PROGRESS
          ================================================= */}

      <div className="card shadow-sm mb-4">

        <div className="card-body p-3">

          <div className="d-flex flex-column flex-md-row justify-content-between gap-3">

            <div className="d-flex align-items-center gap-3">

              <div
                className="rounded-circle p-2"
                style={{
                  backgroundColor:
                    'rgba(22, 163, 74, 0.12)',
                }}
              >
                <Code2
                  size={20}
                  className="text-success"
                />
              </div>

              <div>

                <div className="fw-bold">
                  Your Coding Progress
                </div>

                <div className="text-muted small">
                  Keep solving problems to improve your
                  placement readiness.
                </div>

              </div>

            </div>

            <div
              className="progress align-self-center"
              style={{
                width: '100%',
                maxWidth: 220,
                height: 8,
              }}
            >

              <div
                className="progress-bar bg-success"
                style={{
                  width:
                    totalProblems > 0
                      ? `${(solvedCount / totalProblems) * 100}%`
                      : '0%',
                }}
              />

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          FILTER BAR
          ================================================= */}

      <div className="card shadow-sm mb-4">

        <div className="card-body p-3">

          <div className="d-flex flex-column flex-lg-row gap-3">

            {/* SEARCH */}

            <div
              className="position-relative flex-grow-1"
              style={{ maxWidth: 420 }}
            >

              <Search
                size={17}
                className="position-absolute top-50 translate-middle-y ms-3 text-muted"
              />

              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search problems by title..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            {/* FILTERS */}

            <div className="d-flex flex-column flex-sm-row gap-2">

              <select
                className="form-select"
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value)
                }
              >

                <option value="All">
                  All Categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}

              </select>

              <select
                className="form-select"
                value={selectedDifficulty}
                onChange={(event) =>
                  setSelectedDifficulty(event.target.value)
                }
              >

                <option value="All">
                  All Difficulties
                </option>

                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>

              </select>

              <button
                type="button"
                className={`btn ${showSolvedOnly
                  ? 'btn-success'
                  : 'btn-outline-secondary'
                  } d-flex align-items-center justify-content-center gap-2`}
                onClick={() =>
                  setShowSolvedOnly(
                    (previous) => !previous
                  )
                }
              >

                <Filter size={16} />

                Solved

              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={resetFilters}
                title="Reset filters"
              >
                <RotateCcw size={16} />
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          RESULT COUNT
          ================================================= */}

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>

          <h5 className="fw-bold mb-1">
            Coding Problems
          </h5>

          <span className="text-muted small">
            Showing {filteredProblems.length} of{' '}
            {totalProblems} problems
          </span>

        </div>

        <span className="badge bg-primary rounded-pill">
          {filteredProblems.length} Problems
        </span>

      </div>

      {/* =================================================
          LOADING
          ================================================= */}

      {loading && (
        <div className="card shadow-sm">

          <div className="card-body text-center py-5">

            <Loader2
              size={32}
              className="text-primary mb-3"
              style={{
                animation: 'spin 1s linear infinite',
              }}
            />

            <div className="fw-bold">
              Loading coding problems...
            </div>

            <div className="text-muted small mt-1">
              Fetching problems from server.
            </div>

          </div>

        </div>
      )}

      {/* =================================================
          ERROR
          ================================================= */}

      {!loading && error && (

        <div className="alert alert-danger d-flex align-items-center gap-2">

          <AlertCircle size={20} />

          <div className="flex-grow-1">
            {error}
          </div>

          <button
            className="btn btn-sm btn-danger"
            onClick={fetchProblems}
          >
            Retry
          </button>

        </div>

      )}

      {/* =================================================
          PROBLEMS TABLE
          ================================================= */}

      {!loading && !error && (

        <div className="card shadow-sm overflow-hidden">

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead>

                <tr>

                  <th
                    className="ps-4 text-muted small"
                    style={{ width: 80 }}
                  >
                    Status
                  </th>

                  <th className="text-muted small">
                    Problem
                  </th>

                  <th className="text-muted small">
                    Category
                  </th>

                  <th className="text-muted small">
                    Difficulty
                  </th>

                  <th className="text-muted small">
                    Marks
                  </th>

                  <th className="pe-4 text-end text-muted small">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredProblems.map((problem) => {

                  const solved = problem.solved === true;

                  return (

                    <tr key={problem._id}>

                      {/* STATUS */}

                      <td className="ps-4">

                        {solved ? (

                          <div
                            className="d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: 30,
                              height: 30,
                              backgroundColor:
                                'rgba(22, 163, 74, 0.12)',
                            }}
                          >

                            <CheckCircle2
                              size={17}
                              className="text-success"
                            />

                          </div>

                        ) : (

                          <div
                            className="rounded-circle border"
                            style={{
                              width: 30,
                              height: 30,
                            }}
                          />

                        )}

                      </td>

                      {/* PROBLEM */}

                      <td>

                        <div className="fw-semibold">
                          {problem.title}
                        </div>

                        {problem.topic && (

                          <div className="text-muted small mt-1">
                            {problem.topic}
                          </div>

                        )}

                        <div className="d-flex flex-wrap gap-1 mt-2">

                          {(problem.tags || []).map(
                            (tag, index) => (

                              <span
                                key={`${tag}-${index}`}
                                className="badge bg-secondary rounded-pill"
                                style={{
                                  fontSize: '0.65rem',
                                }}
                              >
                                {tag}
                              </span>

                            )
                          )}

                        </div>

                      </td>

                      {/* CATEGORY */}

                      <td>

                        <span className="text-muted small">
                          {problem.category || 'General'}
                        </span>

                      </td>

                      {/* DIFFICULTY */}

                      <td>

                        <span
                          className={`badge rounded-pill ${getDifficultyClass(
                            problem.difficulty
                          )}`}
                        >
                          {problem.difficulty || 'Easy'}
                        </span>

                      </td>

                      {/* MARKS */}

                      <td>

                        <span className="text-muted small font-monospace">
                          {problem.marks ?? 10}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td className="pe-4 text-end">

                        <Link
                          to={`/student/problem/${problem._id}`}
                          className="btn btn-primary btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-1"
                        >

                          Solve

                          <ChevronRight size={14} />

                        </Link>

                      </td>

                    </tr>

                  );

                })}

                {/* EMPTY */}

                {filteredProblems.length === 0 && (

                  <tr>

                    <td
                      colSpan="6"
                      className="text-center py-5"
                    >

                      <Search
                        size={36}
                        className="text-muted mb-3"
                      />

                      <h6 className="fw-bold">
                        No problems found
                      </h6>

                      <p className="text-muted small mb-3">
                        Try changing your search or filters.
                      </p>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={resetFilters}
                      >
                        Reset Filters
                      </button>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* =================================================
          MOBILE NOTE
          ================================================= */}

      <div className="text-center text-muted small mt-3 d-lg-none">
        Swipe horizontally to view all problem details.
      </div>

    </div>
  );
};

export default ProblemSolvingArena;