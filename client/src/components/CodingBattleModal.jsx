import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { toast } from 'react-toastify';
import { Swords, Trophy, Play, Clock, CheckCircle2, Zap, RotateCcw, X, ShieldAlert, Award } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';

const CodingBattleModal = ({ isOpen, onClose }) => {
  const [battleState, setBattleState] = useState('matchmaking'); // 'matchmaking' | 'battle' | 'finished'
  const [countdown, setCountdown] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins match
  const [opponent, setOpponent] = useState({ name: 'Alex (IIT Lucknow)', score: 0, status: 'Coding...' });
  const [myScore, setMyScore] = useState(0);
  const [code, setCode] = useState('function solve(n) {\n  // Write optimal solution here\n  return n * (n + 1) / 2;\n}');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Matchmaking simulation countdown
  useEffect(() => {
    let timer;
    if (isOpen && battleState === 'matchmaking') {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      } else {
        setBattleState('battle');
        toast.success('Opponent Found! 1v1 Speed Battle Started!');
      }
    }
    return () => clearTimeout(timer);
  }, [isOpen, battleState, countdown]);

  // Battle timer countdown & opponent simulation
  useEffect(() => {
    let interval;
    if (battleState === 'battle' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setBattleState('finished');
            return 0;
          }
          return prev - 1;
        });

        // Simulating opponent progress
        if (Math.random() > 0.85) {
          setOpponent((prev) => ({
            ...prev,
            score: Math.min(100, prev.score + 25),
            status: prev.score >= 75 ? 'Passed All Test Cases!' : 'Running Tests...',
          }));
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [battleState, timerSeconds]);

  if (!isOpen) return null;

  const handleSubmitSolution = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setMyScore(100);
      setIsSubmitting(false);
      setBattleState('finished');
      toast.success('🎉 Victory! You passed all testcases faster than your opponent!');
    }, 1500);
  };

  const handleReset = () => {
    setBattleState('matchmaking');
    setCountdown(3);
    setTimerSeconds(300);
    setMyScore(0);
    setOpponent({ name: 'Alex (IIT Lucknow)', score: 0, status: 'Coding...' });
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content glass-card text-light border border-warning shadow-lg rounded-4 overflow-hidden">
          {/* Header */}
          <div className="modal-header bg-dark border-bottom border-secondary px-4 py-3">
            <div className="d-flex align-items-center gap-3">
              <div className="p-2 bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center">
                <Swords size={24} />
              </div>
              <div>
                <h5 className="modal-title fw-extrabold text-light m-0 d-flex align-items-center gap-2">
                  1v1 Real-Time Speed Coding Battle <span className="badge bg-danger">LIVE</span>
                </h5>
                <p className="text-muted small m-0">Compete live against opponent to solve the algorithm first!</p>
              </div>
            </div>

            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <div className="modal-body p-4" style={{ minHeight: '65vh' }}>
            {/* Matchmaking Screen */}
            {battleState === 'matchmaking' && (
              <div className="text-center py-5">
                <div className="p-4 bg-warning bg-opacity-15 rounded-circle d-inline-block mb-3 border border-warning">
                  <Swords size={56} className="text-warning animate-bounce" />
                </div>
                <h3 className="fw-extrabold text-light mb-2">Searching for Opponent...</h3>
                <p className="text-muted small mb-4">Matching you with an active candidate in your tier rating</p>

                <div className="display-3 fw-extrabold text-warning font-monospace mb-3">{countdown}</div>
                <div className="spinner-border text-warning" role="status" />
              </div>
            )}

            {/* Battle Active Arena Screen */}
            {battleState === 'battle' && (
              <div className="d-flex flex-column h-100">
                {/* Live scoreboard */}
                <div className="row g-3 mb-3">
                  {/* My Card */}
                  <div className="col-6">
                    <div className="p-3 glass-card border-primary border bg-primary bg-opacity-10 rounded-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-light">You (Candidate)</span>
                        <span className="badge bg-primary fs-6">{myScore} / 100 PTS</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-primary" style={{ width: `${myScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Opponent Card */}
                  <div className="col-6">
                    <div className="p-3 glass-card border-danger border bg-danger bg-opacity-10 rounded-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-light">{opponent.name}</span>
                        <span className="badge bg-danger fs-6">{opponent.score} / 100 PTS</span>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className="progress-bar bg-danger" style={{ width: `${opponent.score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Timer */}
                <div className="d-flex justify-content-between align-items-center bg-dark p-2 rounded-3 border border-secondary mb-3">
                  <span className="text-muted small d-flex align-items-center gap-1">
                    <Clock size={16} className="text-warning" /> Match Time Remaining:
                  </span>
                  <span className="font-monospace fw-bold text-warning fs-5">
                    {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Code Editor & Problem */}
                <div className="row g-3 flex-grow-1">
                  <div className="col-12 col-md-5">
                    <div className="p-3 bg-dark rounded-3 border border-secondary h-100">
                      <span className="badge bg-warning text-dark font-monospace mb-2">Problem: Sum of First N Numbers</span>
                      <h6 className="fw-bold text-light">Write a function `solve(n)` returning sum $1 + 2 + \dots + n$.</h6>
                      <p className="text-muted small mb-2">Input: Single integer `n` ($1 \le n \le 10^9$).</p>
                      <pre className="bg-black p-2 rounded text-success small">Input: 5 &#10;Output: 15</pre>
                    </div>
                  </div>

                  <div className="col-12 col-md-7">
                    <div className="rounded-3 border border-secondary overflow-hidden h-100" style={{ minHeight: 280 }}>
                      <MonacoEditor
                        height="280px"
                        language="javascript"
                        theme="vs-dark"
                        value={code}
                        onChange={(v) => setCode(v || '')}
                        options={{ minimap: { enabled: false }, fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Battle Finished Screen */}
            {battleState === 'finished' && (
              <div className="text-center py-5">
                <div className="p-4 bg-success bg-opacity-20 text-success rounded-circle d-inline-block mb-3 border border-success">
                  <Trophy size={64} className="text-warning animate-bounce" />
                </div>

                <h2 className="fw-extrabold text-light mb-1">
                  {myScore > opponent.score ? '🏆 VICTORY!' : myScore === opponent.score ? '🤝 DRAW MATCH!' : '💔 DEFEAT'}
                </h2>
                <p className="text-muted small mb-4">
                  Final Score: You ({myScore} pts) vs Opponent ({opponent.score} pts) • +50 XP Earned!
                </p>

                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-warning fw-bold rounded-pill px-4" onClick={handleReset}>
                    <RotateCcw size={16} className="me-1" /> Play Rematch
                  </button>
                  <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                    Exit Arena
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {battleState === 'battle' && (
            <div className="modal-footer border-top border-secondary px-4 py-3 justify-content-between">
              <button className="btn btn-outline-secondary rounded-pill px-4" onClick={onClose}>
                Surrender Match
              </button>

              <button
                className="btn btn-warning fw-bold text-dark rounded-pill px-4 d-flex align-items-center gap-2 shadow"
                onClick={handleSubmitSolution}
                disabled={isSubmitting}
              >
                <Zap size={18} /> {isSubmitting ? 'Running Tests...' : 'Submit & Execute Code'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingBattleModal;
