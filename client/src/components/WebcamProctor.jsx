import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, AlertTriangle, ShieldCheck, Eye, Users, UserX } from 'lucide-react';
import { detectFacesAndGaze } from '../utils/aiFaceDetector';

const WebcamProctor = ({ examId, onViolation }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // AI Detection State
  const [faceCount, setFaceCount] = useState(1);
  const [gazeStatus, setGazeStatus] = useState('center');
  const lastViolationTime = useRef({ noFace: 0, multiFace: 0, gaze: 0, audio: 0 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    let activeStream = null;
    let audioCtx = null;

    const startMediaStream = async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, frameRate: 15 },
          audio: true,
        });

        activeStream = userStream;
        setStream(userStream);
        setHasPermissions(true);

        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }

        // 1. Audio Analyzer setup
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const microphone = audioCtx.createMediaStreamSource(userStream);
        microphone.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkAudio = () => {
          if (!activeStream || activeStream.active === false) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const normalized = Math.min(100, Math.round((average / 128) * 100));
          setAudioLevel(normalized);

          const now = Date.now();
          if (normalized > 70 && now - lastViolationTime.current.audio > 5000) {
            lastViolationTime.current.audio = now;
            if (onViolation) {
              onViolation('audio_spike', `Noise level spiked to ${normalized}% — speaking detected`);
            }
          }

          animationFrameRef.current = requestAnimationFrame(checkAudio);
        };
        checkAudio();
      } catch (err) {
        console.error('Media stream access failed:', err);
        setHasPermissions(false);
        if (onViolation) {
          onViolation('proctor_denied', 'Webcam/Microphone permission was denied by candidate');
        }
      }
    };

    startMediaStream();

    // 2. Real-Time AI Face & Gaze Detection Loop (Every 2 seconds)
    const aiInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const analysis = detectFacesAndGaze(videoRef.current);
        setFaceCount(analysis.faceCount);
        setGazeStatus(analysis.gazeOrientation);

        const now = Date.now();
        if (analysis.faceCount === 0 && now - lastViolationTime.current.noFace > 6000) {
          lastViolationTime.current.noFace = now;
          if (onViolation) {
            onViolation('no_face_detected', 'No face detected in webcam frame for > 3 seconds');
          }
        } else if (analysis.faceCount > 1 && now - lastViolationTime.current.multiFace > 6000) {
          lastViolationTime.current.multiFace = now;
          if (onViolation) {
            onViolation('multiple_faces_detected', 'Multiple faces detected in candidate webcam feed');
          }
        } else if (analysis.gazeOrientation !== 'center' && now - lastViolationTime.current.gaze > 8000) {
          lastViolationTime.current.gaze = now;
          if (onViolation) {
            onViolation('gaze_deviation', `Gaze deviation detected: candidate ${analysis.gazeOrientation.replace('_', ' ')}`);
          }
        }
      }
    }, 2000);

    // Cleanup tracks and intervals on unmount
    return () => {
      clearInterval(aiInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [examId, onViolation]);

  return (
    <div
      className="webcam-proctor-box position-fixed bottom-0 end-0 m-3 rounded-4 overflow-hidden shadow-lg border border-primary bg-dark"
      style={{ zIndex: 1500, width: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
    >
      {/* Header Bar */}
      <div className="bg-primary bg-opacity-20 px-3 py-1.5 border-bottom border-primary d-flex align-items-center justify-content-between">
        <span className="small fw-bold text-light d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
          <ShieldCheck size={14} className="text-success" /> AI Proctor Stream
        </span>
        <span className="badge bg-danger rounded-circle p-1" style={{ width: 8, height: 8, animation: 'pulse 1s infinite' }} />
      </div>

      {/* Video Stream Canvas */}
      <div className="position-relative bg-black" style={{ height: 135 }}>
        {hasPermissions ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-100 h-100"
            style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        ) : (
          <div className="d-flex flex-column align-items-center justify-content-center h-100 p-2 text-center text-danger">
            <AlertTriangle size={24} className="mb-1" />
            <span className="small fw-bold" style={{ fontSize: '0.7rem' }}>Camera Required</span>
          </div>
        )}

        {/* AI Detection Badges Overlay */}
        <div className="position-absolute top-0 start-0 p-1 d-flex flex-column gap-1">
          {faceCount === 1 && (
            <span className="badge bg-success bg-opacity-80 small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
              👤 1 Face
            </span>
          )}
          {faceCount === 0 && (
            <span className="badge bg-danger bg-opacity-90 small d-inline-flex align-items-center gap-1 animate-pulse" style={{ fontSize: '0.65rem' }}>
              <UserX size={10} /> No Face Detected!
            </span>
          )}
          {faceCount > 1 && (
            <span className="badge bg-warning text-dark bg-opacity-90 small d-inline-flex align-items-center gap-1 animate-pulse" style={{ fontSize: '0.65rem' }}>
              <Users size={10} /> Multiple Faces!
            </span>
          )}

          {gazeStatus !== 'center' && (
            <span className="badge bg-info bg-opacity-80 small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
              <Eye size={10} /> Gaze Off-Center
            </span>
          )}
        </div>

        {/* Audio Meter Indicator Bar */}
        <div
          className="position-absolute bottom-0 start-0 w-100 px-2 py-1 bg-black bg-opacity-75 d-flex align-items-center justify-content-between"
          style={{ fontSize: '0.7rem' }}
        >
          <span className="text-muted d-flex align-items-center gap-1">
            <Mic size={12} className={audioLevel > 50 ? 'text-warning' : 'text-success'} /> Audio:
          </span>
          <div className="progress flex-grow-1 ms-2" style={{ height: 4 }}>
            <div
              className={`progress-bar ${audioLevel > 60 ? 'bg-danger' : audioLevel > 35 ? 'bg-warning' : 'bg-success'}`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamProctor;