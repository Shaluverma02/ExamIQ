import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const NOISE_THRESHOLD_DB = 68; // Decibel threshold for voice/noise detection
const NOISE_COOLDOWN_MS = 8000; // Cooldown between noise warnings

const AudioProctor = ({ onAudioViolation }) => {
  const [audioActive, setAudioActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const lastViolationTime = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    startAudioMonitoring();
    return () => {
      stopAudioMonitoring();
    };
  }, []);

  const startAudioMonitoring = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setAudioActive(true);
      monitorVolume();
    } catch (err) {
      console.warn('Audio proctoring permission skipped or denied:', err);
      setAudioActive(false);
    }
  };

  const stopAudioMonitoring = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const monitorVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const dbLevel = Math.min(100, Math.round((average / 255) * 100));

    setVolumeLevel(dbLevel);

    if (dbLevel > NOISE_THRESHOLD_DB) {
      const now = Date.now();
      if (now - lastViolationTime.current > NOISE_COOLDOWN_MS) {
        lastViolationTime.current = now;
        toast.warn(`🎙️ Audio Spike / Speech Detected (${dbLevel} dB)! Keep your environment quiet.`);
        if (onAudioViolation) {
          onAudioViolation('audio_noise_spike', `Background noise/speech spike detected (${dbLevel} dB)`);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(monitorVolume);
  };

  if (!audioActive) return null;

  return (
    <div
      className="position-fixed bottom-0 end-0 m-3 p-2 px-3 rounded-pill bg-dark bg-opacity-90 border border-secondary text-light font-monospace extra-small d-flex align-items-center gap-2 shadow-lg"
      style={{ zIndex: 1050, backdropFilter: 'blur(6px)' }}
    >
      <Mic size={14} className="text-info animate-pulse" />
      <span className="text-muted">Audio Monitored:</span>
      <div className="progress flex-grow-1" style={{ width: 60, height: 6 }}>
        <div
          className={`progress-bar transition-all ${
            volumeLevel > 70 ? 'bg-danger' : volumeLevel > 40 ? 'bg-warning' : 'bg-info'
          }`}
          style={{ width: `${volumeLevel}%` }}
        />
      </div>
      <span className="fw-bold">{volumeLevel} dB</span>
    </div>
  );
};

export default AudioProctor;
