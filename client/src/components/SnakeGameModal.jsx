import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Trophy, Gamepad2, Play, Pause, RotateCcw, Volume2, 
  VolumeX, Sparkles, Award, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ShieldCheck, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

// Web Audio API Retro Sound Effects Synthesizer
class SoundFx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
  }

  playTone(freq, type, duration) {
    if (this.muted || !this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  eatNormal() {
    this.playTone(600, 'square', 0.08);
  }

  eatGolden() {
    this.playTone(850, 'square', 0.1);
    setTimeout(() => this.playTone(1200, 'square', 0.15), 80);
  }

  crash() {
    this.playTone(180, 'sawtooth', 0.3);
  }

  start() {
    this.playTone(440, 'sine', 0.08);
    setTimeout(() => this.playTone(880, 'sine', 0.12), 100);
  }
}

const sfx = new SoundFx();

export default function SnakeGameModal({
  tournamentId,
  tournamentTitle,
  onClose,
  onScoreSubmitted
}) {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('IDLE'); // 'IDLE', 'PLAYING', 'PAUSED', 'GAMEOVER'
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [applesEaten, setApplesEaten] = useState(0);
  const [goldenApplesEaten, setGoldenApplesEaten] = useState(0);
  const [goldenAppleActive, setGoldenAppleActive] = useState(false);
  const [goldenTimer, setGoldenTimer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [gameMode, setGameMode] = useState('retro'); // 'retro' (Nokia 3310 LCD) or 'modern' (Neon)
  const [soundMuted, setSoundMuted] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  // Dynamic game parameters from DB
  const [settings, setSettings] = useState({
    base_speed: 110,
    min_speed: 40,
    acceleration_step: 3,
    golden_apple_chance: 0.25,
    golden_apple_points: 50,
    normal_apple_points: 10,
    golden_apple_duration_sec: 7,
    board_size: 20
  });

  // Game internal state references (mutable for high performance animation loop)
  const snakeRef = useRef([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const dirRef = useRef({ x: 0, y: -1 });
  const nextDirRef = useRef({ x: 0, y: -1 });
  const appleRef = useRef({ x: 5, y: 5 });
  const goldenAppleRef = useRef(null);
  const gameLoopRef = useRef(null);
  const speedRef = useRef(110);
  const startTimeRef = useRef(null);
  const scoreRef = useRef(0);

  // Initialize Audio & fetch dynamic settings & game session
  useEffect(() => {
    sfx.init();

    const fetchConfigAndSession = async () => {
      try {
        const res = await api.game.startSession(tournamentId);
        if (res.success) {
          setSessionToken(res.sessionToken);
          setSettings(res.settings);
          setHighScore(res.currentHighScore || 0);
          speedRef.current = res.settings.base_speed;
        }
      } catch (err) {
        console.error('Failed to initialize session:', err);
      }
    };

    fetchConfigAndSession();

    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [tournamentId]);

  // Handle Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;

      const cur = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (cur.y === 0) nextDirRef.current = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (cur.y === 0) nextDirRef.current = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (cur.x === 0) nextDirRef.current = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (cur.x === 0) nextDirRef.current = { x: 1, y: 0 };
          e.preventDefault();
          break;
        case ' ':
          togglePause();
          e.preventDefault();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Spawn Normal Apple
  const spawnApple = () => {
    const boardSize = settings.board_size;
    let newPos;
    while (true) {
      newPos = {
        x: Math.floor(Math.random() * boardSize),
        y: Math.floor(Math.random() * boardSize)
      };
      const onSnake = snakeRef.current.some((seg) => seg.x === newPos.x && seg.y === newPos.y);
      if (!onSnake) break;
    }
    appleRef.current = newPos;

    // Check chance to spawn Golden Apple
    if (!goldenAppleRef.current && Math.random() < settings.golden_apple_chance) {
      let goldPos;
      while (true) {
        goldPos = {
          x: Math.floor(Math.random() * boardSize),
          y: Math.floor(Math.random() * boardSize)
        };
        const onSnake = snakeRef.current.some((seg) => seg.x === goldPos.x && seg.y === goldPos.y);
        const onApple = goldPos.x === newPos.x && goldPos.y === newPos.y;
        if (!onSnake && !onApple) break;
      }
      goldenAppleRef.current = {
        x: goldPos.x,
        y: goldPos.y,
        timer: settings.golden_apple_duration_sec * 10
      };
      setGoldenAppleActive(true);
    }
  };

  // Start / Restart Game
  const startGame = async () => {
    sfx.init();
    sfx.start();

    // Reset snake
    snakeRef.current = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ];
    dirRef.current = { x: 0, y: -1 };
    nextDirRef.current = { x: 0, y: -1 };
    goldenAppleRef.current = null;
    speedRef.current = settings.base_speed;
    startTimeRef.current = Date.now();
    scoreRef.current = 0;

    setScore(0);
    setApplesEaten(0);
    setGoldenApplesEaten(0);
    setGoldenAppleActive(false);
    setSubmissionResult(null);
    setSubmitError('');

    spawnApple();
    setGameState('PLAYING');

    // Fresh session token for new game
    try {
      const res = await api.game.startSession(tournamentId);
      if (res.success) {
        setSessionToken(res.sessionToken);
      }
    } catch (e) {
      // ignore
    }
  };

  const togglePause = () => {
    setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  };

  // Direction Controller for Virtual D-Pad buttons, Swipes & Keyboard
  const handleVirtualDir = (dx, dy) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch (_) {}

    // If not playing yet (or game over), tapping any arrow auto-starts game run!
    if (gameState === 'IDLE' || gameState === 'GAMEOVER') {
      startGame();
      if (dy !== 1) { // Default start direction is UP (y: -1), don't allow DOWN (y: 1)
        nextDirRef.current = { x: dx, y: dy };
      }
      return;
    }

    if (gameState !== 'PLAYING') return;

    const cur = dirRef.current;
    // Prevent 180-degree instant reversal into own snake neck
    if (dx !== 0 && cur.x === 0) {
      nextDirRef.current = { x: dx, y: 0 };
    } else if (dy !== 0 && cur.y === 0) {
      nextDirRef.current = { x: 0, y: dy };
    }
  };

  // Main Game Tick
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const tick = () => {
      // Golden Apple timer tick
      if (goldenAppleRef.current) {
        goldenAppleRef.current.timer -= 1;
        setGoldenTimer(Math.ceil(goldenAppleRef.current.timer / 10));
        if (goldenAppleRef.current.timer <= 0) {
          goldenAppleRef.current = null;
          setGoldenAppleActive(false);
        }
      }

      // Update Direction
      dirRef.current = nextDirRef.current;
      const head = { ...snakeRef.current[0] };
      head.x += dirRef.current.x;
      head.y += dirRef.current.y;

      const boardSize = settings.board_size;

      // Wall Collision Check (Snake II arcade classic mode: wall hit is game over)
      if (head.x < 0 || head.x >= boardSize || head.y < 0 || head.y >= boardSize) {
        handleGameOver();
        return;
      }

      // Self Collision Check
      if (snakeRef.current.some((seg) => seg.x === head.x && seg.y === head.y)) {
        handleGameOver();
        return;
      }

      // Move Snake forward
      const newSnake = [head, ...snakeRef.current];

      // Check Normal Apple
      if (head.x === appleRef.current.x && head.y === appleRef.current.y) {
        sfx.eatNormal();
        const newScore = score + settings.normal_apple_points;
        scoreRef.current = newScore;
        setScore(newScore);
        setApplesEaten((prev) => prev + 1);

        // Dynamic acceleration: accelerate as score increases
        const newSpeed = Math.max(
          settings.min_speed,
          settings.base_speed - Math.floor(newScore / 10) * settings.acceleration_step
        );
        speedRef.current = newSpeed;

        spawnApple();
      } else if (goldenAppleRef.current && head.x === goldenAppleRef.current.x && head.y === goldenAppleRef.current.y) {
        // Check Golden Apple
        sfx.eatGolden();
        const newScore = score + settings.golden_apple_points;
        scoreRef.current = newScore;
        setScore(newScore);
        setGoldenApplesEaten((prev) => prev + 1);
        goldenAppleRef.current = null;
        setGoldenAppleActive(false);
      } else {
        newSnake.pop(); // Remove tail
      }

      snakeRef.current = newSnake;
      draw();

      gameLoopRef.current = setTimeout(tick, speedRef.current);
    };

    gameLoopRef.current = setTimeout(tick, speedRef.current);

    return () => {
      if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    };
  }, [gameState, score, settings]);

  // Submit Score to Leaderboard (can be called automatically or manually)
  const submitScoreToLeaderboard = async (scoreToSubmit) => {
    if (isSubmitting) return;

    const finalScore = scoreToSubmit !== undefined ? scoreToSubmit : scoreRef.current;
    const durationSeconds = startTimeRef.current
      ? Math.round((Date.now() - startTimeRef.current) / 1000)
      : 10;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      let activeToken = sessionToken;
      if (!activeToken) {
        const sRes = await api.game.startSession(tournamentId);
        if (sRes.success) {
          activeToken = sRes.sessionToken;
          setSessionToken(sRes.sessionToken);
        }
      }

      if (activeToken) {
        const payload = {
          session_token: activeToken,
          tournament_id: tournamentId,
          score: finalScore,
          apples_eaten: applesEaten,
          golden_apples_eaten: goldenApplesEaten,
          duration_seconds: durationSeconds
        };

        const res = await api.game.submitScore(payload);
        if (res.success) {
          setSubmissionResult(res);
          if (res.isPersonalBest || res.highScore) {
            setHighScore(res.highScore);
            try {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.5 }
              });
            } catch (e) {}
          }
          if (onScoreSubmitted) {
            onScoreSubmitted(res);
          }
        } else {
          setSubmitError(res.error || 'Failed to submit score');
        }
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
      setSubmitError(err.message || 'Failed to submit score');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Game Over & Score Submission to Backend
  const handleGameOver = async () => {
    sfx.crash();
    setGameState('GAMEOVER');
    await submitScoreToLeaderboard(scoreRef.current);
  };

  // Manual End & Submit Current Score (e.g. from Pause menu or button)
  const handleManualFinishAndSubmit = async () => {
    if (gameLoopRef.current) clearTimeout(gameLoopRef.current);
    setGameState('GAMEOVER');
    await submitScoreToLeaderboard(scoreRef.current);
  };

  // Canvas Rendering (Retro Nokia LCD or Sleek Neon Arcade)
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const boardSize = settings.board_size;
    const cellSize = canvas.width / boardSize;

    if (gameMode === 'retro') {
      // Retro Nokia 3310 LCD Display Colors
      ctx.fillStyle = '#9ea771'; // Vintage Green Monochrome LCD
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // LCD Grid Dots
      ctx.strokeStyle = '#929b67';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
          ctx.strokeRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }

      // Normal Apple (Nokia pixel square apple)
      ctx.fillStyle = '#262d16';
      ctx.fillRect(
        appleRef.current.x * cellSize + 2,
        appleRef.current.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );

      // Golden Bonus Apple (Flashing larger pixel circle)
      if (goldenAppleRef.current) {
        ctx.fillStyle = '#262d16';
        ctx.beginPath();
        ctx.arc(
          goldenAppleRef.current.x * cellSize + cellSize / 2,
          goldenAppleRef.current.y * cellSize + cellSize / 2,
          cellSize / 2 - 1,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Snake Body & Head (Vintage Nokia snake segments)
      snakeRef.current.forEach((seg, idx) => {
        ctx.fillStyle = '#262d16';
        ctx.fillRect(
          seg.x * cellSize + 1,
          seg.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );

        // Head Eyes
        if (idx === 0) {
          ctx.fillStyle = '#9ea771';
          ctx.fillRect(seg.x * cellSize + 3, seg.y * cellSize + 3, 2, 2);
        }
      });
    } else {
      // Modern Neon Cyber Arcade Mode
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= boardSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // Normal Apple (Neon Red Glow)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f43f5e';
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(
        appleRef.current.x * cellSize + cellSize / 2,
        appleRef.current.y * cellSize + cellSize / 2,
        cellSize / 2.5,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Golden Bonus Apple (Glowing Radiant Gold)
      if (goldenAppleRef.current) {
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(
          goldenAppleRef.current.x * cellSize + cellSize / 2,
          goldenAppleRef.current.y * cellSize + cellSize / 2,
          cellSize / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Snake (Cyan Neon Gradient)
      snakeRef.current.forEach((seg, idx) => {
        ctx.shadowBlur = idx === 0 ? 12 : 6;
        ctx.shadowColor = '#0284c7';
        ctx.fillStyle = idx === 0 ? '#38bdf8' : '#0284c7';
        ctx.beginPath();
        ctx.roundRect(
          seg.x * cellSize + 1.5,
          seg.y * cellSize + 1.5,
          cellSize - 3,
          cellSize - 3,
          idx === 0 ? 5 : 3
        );
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }
  };

  useEffect(() => {
    draw();
  }, [gameMode]);

  // Touch / Swipe Gesture Handlers on Canvas
  const touchStartRef = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || gameState !== 'PLAYING') return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    // Minimum swipe threshold 20px
    if (Math.max(absX, absY) > 20) {
      if (absX > absY) {
        // Horizontal swipe
        handleVirtualDir(dx > 0 ? 1 : -1, 0);
      } else {
        // Vertical swipe
        handleVirtualDir(0, dy > 0 ? 1 : -1);
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(11, 17, 32, 0.92)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '0'
    }}>
      <div 
        className="snake-modal-card"
        style={{
          background: '#070c18',
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85), 0 0 35px rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
          height: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          background: '#0b1120',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Gamepad2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', lineHeight: 1.2 }}>
                Nokia Snake II Arcade
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                Swipe anywhere or use D-Pad below
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={togglePause}
              disabled={gameState === 'IDLE' || gameState === 'GAMEOVER'}
              style={{
                background: gameState === 'PAUSED' ? '#0284c7' : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                padding: '5px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: '700',
                border: 'none',
                cursor: gameState === 'PLAYING' || gameState === 'PAUSED' ? 'pointer' : 'default',
                opacity: gameState === 'IDLE' || gameState === 'GAMEOVER' ? 0.4 : 1
              }}
              title={gameState === 'PAUSED' ? 'Resume Game' : 'Pause Game'}
            >
              {gameState === 'PAUSED' ? <Play size={13} fill="#fff" /> : <Pause size={13} fill="#fff" />}
              <span>{gameState === 'PAUSED' ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={() => {
                sfx.muted = !soundMuted;
                setSoundMuted(!soundMuted);
              }}
              style={{ background: 'transparent', color: '#94a3b8', padding: '4px' }}
              title={soundMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {soundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', padding: '5px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Game Stats Bar */}
        <div style={{
          padding: '10px 18px',
          background: 'linear-gradient(180deg, #090e1a 0%, #0d1527 100%)',
          borderBottom: '1px solid rgba(56, 189, 248, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', letterSpacing: '0.08em' }}>SCORE:</span>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace', textShadow: '0 0 12px rgba(56, 189, 248, 0.6)' }}>
              {score}
            </span>
          </div>

          {/* Golden Apple Alert Badge */}
          {goldenAppleActive ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(217, 119, 6, 0.35) 100%)',
              border: '1px solid #f59e0b',
              color: '#fef08a',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 14px rgba(245, 158, 11, 0.45)',
              animation: 'pulseSlow 1s infinite'
            }}>
              <Sparkles size={12} />
              <span>GOLDEN APPLE (+{settings.golden_apple_points || 50}): {goldenTimer}s</span>
            </div>
          ) : (
            <div style={{
              fontSize: '11px',
              color: '#94a3b8',
              fontWeight: '700',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '3px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🍏</span>
              <span>Apples:</span>
              <strong style={{ color: '#ffffff' }}>{applesEaten}</strong>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '800', letterSpacing: '0.08em' }}>BEST:</span>
            <span style={{ fontSize: '18px', fontWeight: '900', color: '#e2e8f0', fontFamily: 'monospace' }}>
              {highScore}
            </span>
          </div>
        </div>

        {/* Vintage Nokia Body Frame or Screen */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            padding: '10px 12px',
            background: gameMode === 'retro' ? '#111827' : '#080d1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            flexShrink: 0,
            touchAction: 'none'
          }}
        >
          {/* Nokia Screen Border with Responsive Sizing */}
          <div style={{
            padding: '6px',
            background: gameMode === 'retro' ? '#64748b' : '#1e293b',
            borderRadius: '16px',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              style={{
                borderRadius: '8px',
                display: 'block',
                boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)',
                width: 'min(280px, 64vw)',
                height: 'min(280px, 64vw)',
                maxWidth: '300px',
                maxHeight: '300px',
                touchAction: 'none'
              }}
            />

            {/* Overlays for Idle, Paused, GameOver */}
            {gameState === 'IDLE' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(3px)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: '16px',
                textAlign: 'center'
              }}>
                <Trophy size={36} color="#f59e0b" style={{ marginBottom: '6px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>
                  Retro Snake II Arena
                </h3>
                <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px', marginBottom: '14px', maxWidth: '240px' }}>
                  Dynamic acceleration + Golden Apples (+50 pts).
                </p>
                <button
                  onClick={startGame}
                  className="trendy-action-btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    padding: '12px 28px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px -2px rgba(16, 185, 129, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={16} fill="#ffffff" />
                  <span>Start Game Run</span>
                </button>
              </div>
            )}

            {gameState === 'PAUSED' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.72)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: '16px',
                textAlign: 'center'
              }}>
                <Pause size={30} color="#38bdf8" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginTop: '6px', marginBottom: '2px' }}>
                  Game Paused
                </h3>
                <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px' }}>
                  Current Score: <strong style={{ color: '#38bdf8' }}>{score} pts</strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '210px' }}>
                  <button
                    type="button"
                    onClick={togglePause}
                    className="trendy-action-btn"
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontWeight: '800',
                      fontSize: '13px',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      boxShadow: '0 6px 18px -2px rgba(2, 132, 199, 0.45), inset 0 1px 1px rgba(255,255,255,0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    Resume Play
                  </button>

                  {score > 0 && (
                    <button
                      type="button"
                      onClick={handleManualFinishAndSubmit}
                      className="trendy-action-btn"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: '#fff',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        fontWeight: '800',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        cursor: 'pointer',
                        boxShadow: '0 6px 18px -2px rgba(245, 158, 11, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)'
                      }}
                    >
                      <Trophy size={14} />
                      <span>Submit Score ({score} pts)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {gameState === 'GAMEOVER' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(11, 17, 32, 0.95)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                padding: '14px 12px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#f43f5e', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Game Over!
                </div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', fontFamily: 'monospace', margin: '2px 0 4px 0' }}>
                  {score} <span style={{ fontSize: '15px', color: '#94a3b8' }}>pts</span>
                </div>

                {/* Score breakdown pills */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', color: '#cbd5e1' }}>
                    🍏 {applesEaten} Apples
                  </div>
                  {goldenApplesEaten > 0 && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', color: '#fbbf24' }}>
                      ⭐ {goldenApplesEaten} Golden
                    </div>
                  )}
                </div>

                {/* Submission Result / Status */}
                {isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', marginBottom: '10px' }}>
                    <Loader2 size={13} className="spin" />
                    <span>Submitting Score to Leaderboard...</span>
                  </div>
                ) : submissionResult ? (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Trophy size={13} color="#f59e0b" />
                    <span>Score Submitted • Rank #{submissionResult.rank}</span>
                  </div>
                ) : submitError ? (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {submitError}
                  </div>
                ) : null}

                {/* Explicit Submit & Play Again Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '230px' }}>
                  <button
                    type="button"
                    onClick={() => submitScoreToLeaderboard()}
                    disabled={isSubmitting}
                    className="trendy-action-btn"
                    style={{
                      background: submissionResult
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '12px',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      border: submissionResult ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: submissionResult
                        ? '0 6px 20px -3px rgba(16, 185, 129, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                        : '0 6px 20px -3px rgba(245, 158, 11, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        <span>Submitting...</span>
                      </>
                    ) : submissionResult ? (
                      <>
                        <ShieldCheck size={16} />
                        <span>Re-Submit Score</span>
                      </>
                    ) : (
                      <>
                        <Trophy size={16} />
                        <span>Submit Score to Leaderboard</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={startGame}
                    className="trendy-action-btn"
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '12px',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 6px 20px -3px rgba(2, 132, 199, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Play Again</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High-Visibility Mobile Game Controls & D-Pad (Always Visible & Thumb-Friendly) */}
        <div 
          className="snake-controllers-panel"
          style={{
            padding: '12px 18px 16px',
            background: 'linear-gradient(180deg, #0b1120 0%, #050811 100%)',
            borderTop: '1px solid rgba(56, 189, 248, 0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 -8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            overflowY: 'auto'
          }}
        >
          {/* Mode Switcher and Controls */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              fontSize: '11px',
              color: '#38bdf8',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.08)',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(56, 189, 248, 0.22)'
            }}>
              <Gamepad2 size={13} color="#38bdf8" />
              <span style={{ letterSpacing: '0.04em' }}>TOUCH D-PAD</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {score > 0 && (gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <button
                  type="button"
                  onClick={handleManualFinishAndSubmit}
                  className="trendy-pill-btn"
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: '1px solid rgba(251, 191, 36, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(245, 158, 11, 0.35)'
                  }}
                  title="Submit current score to leaderboard"
                >
                  <Trophy size={11} color="#ffffff" />
                  <span>Submit ({score})</span>
                </button>
              )}

              <button
                type="button"
                onClick={togglePause}
                disabled={gameState === 'IDLE' || gameState === 'GAMEOVER'}
                className="trendy-pill-btn"
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 11px',
                  borderRadius: '8px',
                  background: gameState === 'PAUSED'
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: gameState === 'PAUSED' ? '#ffffff' : '#94a3b8',
                  border: gameState === 'PAUSED'
                    ? '1px solid rgba(56, 189, 248, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: gameState === 'PLAYING' || gameState === 'PAUSED' ? 'pointer' : 'default',
                  opacity: gameState === 'IDLE' || gameState === 'GAMEOVER' ? 0.35 : 1,
                  boxShadow: gameState === 'PAUSED' ? '0 0 12px rgba(2, 132, 199, 0.4)' : 'none'
                }}
              >
                {gameState === 'PAUSED' ? <Play size={11} fill="#ffffff" /> : <Pause size={11} fill="#94a3b8" />}
                <span>{gameState === 'PAUSED' ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGameMode('retro')}
                className="trendy-pill-btn"
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: gameMode === 'retro'
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: gameMode === 'retro' ? '#ffffff' : '#94a3b8',
                  border: gameMode === 'retro'
                    ? '1px solid rgba(56, 189, 248, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: gameMode === 'retro' ? '0 0 12px rgba(2, 132, 199, 0.4)' : 'none'
                }}
              >
                Nokia LCD
              </button>
              <button
                type="button"
                onClick={() => setGameMode('modern')}
                className="trendy-pill-btn"
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: gameMode === 'modern'
                    ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: gameMode === 'modern' ? '#ffffff' : '#94a3b8',
                  border: gameMode === 'modern'
                    ? '1px solid rgba(56, 189, 248, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: gameMode === 'modern' ? '0 0 12px rgba(2, 132, 199, 0.4)' : 'none'
                }}
              >
                Neon
              </button>
            </div>
          </div>

          {/* Ergonomic Handheld Virtual D-Pad (Large 58px buttons with high tactile visibility) */}
          <div className="dpad-container">
            {/* Row 1: Up */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); handleVirtualDir(0, -1); }}
              onClick={(e) => { e.preventDefault(); handleVirtualDir(0, -1); }}
              className="dpad-btn dpad-up"
              title="Up Arrow"
            >
              <ArrowUp size={26} strokeWidth={2.8} />
            </button>
            <div />

            {/* Row 2: Left, Center Neutral Pivot (Thumb Glide Hub), Right */}
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); handleVirtualDir(-1, 0); }}
              onClick={(e) => { e.preventDefault(); handleVirtualDir(-1, 0); }}
              className="dpad-btn dpad-left"
              title="Left Arrow"
            >
              <ArrowLeft size={26} strokeWidth={2.8} />
            </button>

            {/* Authentic Neutral D-Pad Pivot - Smooth thumb glide, 0 accidental pauses */}
            <div className="dpad-center-pivot">
              <div className="dpad-center-core" />
            </div>

            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); handleVirtualDir(1, 0); }}
              onClick={(e) => { e.preventDefault(); handleVirtualDir(1, 0); }}
              className="dpad-btn dpad-right"
              title="Right Arrow"
            >
              <ArrowRight size={26} strokeWidth={2.8} />
            </button>

            {/* Row 3: Down */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => { e.preventDefault(); handleVirtualDir(0, 1); }}
              onClick={(e) => { e.preventDefault(); handleVirtualDir(0, 1); }}
              className="dpad-btn dpad-down"
              title="Down Arrow"
            >
              <ArrowDown size={26} strokeWidth={2.8} />
            </button>
            <div />
          </div>
        </div>

        <style>{`
          .dpad-container {
            display: grid;
            grid-template-columns: repeat(3, 58px);
            grid-template-rows: repeat(3, 56px);
            gap: 8px;
            margin: 0 auto;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            padding: 10px;
            border-radius: 26px;
            background: radial-gradient(circle at center, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.05) 70%, transparent 100%);
          }

          .dpad-btn {
            width: 58px;
            height: 56px;
            background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
            border: 1.5px solid rgba(148, 163, 184, 0.25);
            box-shadow: 
              0 6px 14px -2px rgba(0, 0, 0, 0.65),
              inset 0 1px 1px rgba(255, 255, 255, 0.18),
              inset 0 -2px 4px rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            cursor: pointer;
            touch-action: manipulation;
            user-select: none;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.12s ease, box-shadow 0.12s ease, color 0.12s ease;
          }

          .dpad-up {
            border-radius: 18px 18px 8px 8px;
          }
          .dpad-down {
            border-radius: 8px 8px 18px 18px;
          }
          .dpad-left {
            border-radius: 18px 8px 8px 18px;
          }
          .dpad-right {
            border-radius: 8px 18px 18px 8px;
          }

          .dpad-btn:hover {
            color: #7dd3fc;
            border-color: rgba(56, 189, 248, 0.5);
            box-shadow: 
              0 8px 18px -2px rgba(0, 0, 0, 0.75),
              0 0 14px rgba(56, 189, 248, 0.35),
              inset 0 1px 2px rgba(255, 255, 255, 0.25);
          }

          .dpad-btn:active {
            transform: translateY(2px) scale(0.93);
            background: linear-gradient(145deg, #0284c7 0%, #0369a1 100%) !important;
            border-color: #38bdf8 !important;
            color: #ffffff !important;
            box-shadow: 
              0 2px 6px rgba(0, 0, 0, 0.6),
              0 0 18px rgba(56, 189, 248, 0.7),
              inset 0 2px 4px rgba(0, 0, 0, 0.4) !important;
          }

          .dpad-btn svg {
            filter: drop-shadow(0 0 4px rgba(56, 189, 248, 0.5));
            transition: transform 0.08s ease, filter 0.08s ease;
          }

          .dpad-btn:active svg {
            filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.95));
          }

          .dpad-center-pivot {
            width: 58px;
            height: 56px;
            border-radius: 12px;
            background: radial-gradient(circle at 35% 35%, #1e293b 0%, #090e17 100%);
            border: 1.5px solid rgba(56, 189, 248, 0.2);
            box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            pointer-events: none;
          }

          .dpad-center-core {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #0284c7 0%, #0369a1 100%);
            border: 1.5px solid rgba(56, 189, 248, 0.6);
            box-shadow: 0 0 10px rgba(56, 189, 248, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.5);
            animation: pivotPulse 2.5s infinite ease-in-out;
          }

          @keyframes pivotPulse {
            0%, 100% {
              box-shadow: 0 0 8px rgba(56, 189, 248, 0.5);
            }
            50% {
              box-shadow: 0 0 16px rgba(56, 189, 248, 0.85);
            }
          }

          .trendy-action-btn {
            transition: all 0.16s cubic-bezier(0.2, 0, 0, 1);
          }
          .trendy-action-btn:hover {
            transform: translateY(-2px);
            filter: brightness(1.12);
          }
          .trendy-action-btn:active {
            transform: translateY(1px) scale(0.97);
            filter: brightness(0.95);
          }

          .trendy-pill-btn {
            transition: all 0.15s ease;
          }
          .trendy-pill-btn:hover {
            filter: brightness(1.2);
          }
          .trendy-pill-btn:active {
            transform: scale(0.94);
          }

          @media (max-width: 600px) {
            .snake-modal-card {
              height: 100dvh !important;
              max-height: 100dvh !important;
              border-radius: 0 !important;
              border: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
