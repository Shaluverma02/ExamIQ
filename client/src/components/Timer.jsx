import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

const Timer = ({ initialSeconds = 0, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the ref updated with the latest onTimeUp callback
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeUpRef.current) onTimeUpRef.current();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeUpRef.current) onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatTime = (totalSecs) => {
    if (totalSecs < 0) return '00:00';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const isCritical = secondsLeft <= 120; // Last 2 minutes
  const isWarning = secondsLeft > 120 && secondsLeft <= 600; // Last 10 minutes

  return (
    <div
      className={`exam-timer-box d-flex align-items-center gap-2 px-3 py-2 rounded border fw-bold ${isCritical
          ? 'bg-danger bg-opacity-25 text-danger border-danger shadow-sm'
          : isWarning
            ? 'bg-warning bg-opacity-25 text-warning border-warning'
            : 'bg-body-tertiary text-body border'
        }`}
      style={{ minWidth: '130px', justifyContent: 'center' }}
    >
      {isCritical ? (
        <AlertCircle size={18} className="text-danger flex-shrink-0" />
      ) : (
        <Clock size={18} className="text-secondary flex-shrink-0" />
      )}
      <span className="font-monospace fs-6">{formatTime(secondsLeft)}</span>
    </div>
  );
};

export default Timer;