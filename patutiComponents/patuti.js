import React, { useEffect, useRef, useState } from 'react';
import './PatutiGame.css'; // Keep your CSS styles here

const PatutiGame = () => {
  const patutiRef = useRef(null);
  const platformRef = useRef(null);
  const gameContainerRef = useRef(null);
  const lifeValueRef = useRef(null);
  const lifeBarInnerRef = useRef(null);
  const scoreValueRef = useRef(null);
  const gameOverScreenRef = useRef(null);
  const finalScoreRef = useRef(null);
  const timeSurvivedRef = useRef(null);

  const [gameState, setGameState] = useState({
    life: 100,
    score: 0,
    gameRunning: true,
    bullets: [],
    keys: {},
    isJumping: false,
    isDucking: false,
    jumpVelocity: 0,
    startTime: Date.now(),
    patutiPos: { x: 0, y: 0 },
    currentAction: 'idle',
    animationFrame: 0,
    animationCounter: 0,
  });

  const sprites = useRef({
    idle: ['../images/idle-1.png', '../images/idle-2.png'],
    left: ['../images/left-1.png', '../images/left-2.png', '../images/left-3.png', '../images/left-4.png', '../images/left-6.png'],
    right: ['../images/right-1.png', '../images/right-2.png', '../images/right-3.png', '../images/right-4.png', '../images/right-5.png'],
    jump: ['../images/jump-1.png', '../images/jump-2.png', '../images/jump-3.png', '../images/jump-4.png', '../images/jump-5.png', '../images/jump-6.png', '../images/jump-7.png'],
    dock: ['../images/dock-1.png', '../images/dock-2.png', '../images/dock-3.png', '../images/dock-4.png', '../images/dock-1.png'],
  });

  // Set initial position
  useEffect(() => {
    const platformTop = window.innerHeight - 220;
    const patutiInitial = {
      x: (window.innerWidth - 60) / 2,
      y: platformTop - 60
    };
    setGameState(prev => ({
      ...prev,
      patutiPos: patutiInitial,
    }));
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = e => {
      setGameState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.code]: true }
      }));
    };

    const handleKeyUp = e => {
      setGameState(prev => {
        const updatedKeys = { ...prev.keys, [e.code]: false };
        return { ...prev, keys: updatedKeys };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main game loop
  useEffect(() => {
    let animationId;

    const gameLoop = () => {
      updatePatutiPosition();
      updateBullets();
      updateScore();
      animationId = requestAnimationFrame(gameLoop);
    };

    if (gameState.gameRunning) {
      gameLoop();
    }

    return () => cancelAnimationFrame(animationId);
  }, [gameState.gameRunning, gameState.patutiPos, gameState.keys]);

  // Spawn bullets
  useEffect(() => {
    let bulletInterval;

    const spawn = () => {
      if (gameState.gameRunning) {
        spawnBullet();
        bulletInterval = setTimeout(spawn, 800 + Math.random() * 1000);
      }
    };

    spawn();
    return () => clearTimeout(bulletInterval);
  }, [gameState.gameRunning]);

  const updatePatutiPosition = () => {
    const speed = 6;
    const platformTop = window.innerHeight - 220;
    const platformLeft = (window.innerWidth - 600) / 2 + 150;
    const platformRight = platformLeft + 300;
    let newAction = 'idle';
    let newX = gameState.patutiPos.x;
    let newY = gameState.patutiPos.y;
    let { jumpVelocity, isJumping, isDucking } = gameState;

    if (gameState.keys['ArrowLeft'] && newX > platformLeft) {
      newX -= speed;
      newAction = 'left';
    } else if (gameState.keys['ArrowRight'] && newX < platformRight - 60) {
      newX += speed;
      newAction = 'right';
    }

    if (gameState.keys['ArrowUp'] && !isJumping && !isDucking) {
      isJumping = true;
      jumpVelocity = -12;
      newAction = 'jump';
    }

    if (gameState.keys['ArrowDown'] && !isJumping) {
      if (!isDucking) {
        isDucking = true;
      }
      newAction = 'dock';
    } else {
      if (isDucking) {
        isDucking = false;
      }
    }

    if (isJumping) {
      newY += jumpVelocity;
      jumpVelocity += 1;
      newAction = 'jump';

      if (newY >= platformTop - 60) {
        newY = platformTop - 60;
        isJumping = false;
        jumpVelocity = 0;
      }
    }

    // Update patuti DOM
    const patuti = patutiRef.current;
    if (patuti) {
      patuti.style.left = `${newX}px`;
      patuti.style.top = `${isDucking ? newY + 15 : newY}px`;
      patuti.style.width = '60px';
      patuti.style.height = isDucking ? '45px' : '60px';
      patuti.src = sprites.current[newAction][(gameState.animationFrame % sprites.current[newAction].length)];
    }

    // Update game state
    setGameState(prev => ({
      ...prev,
      patutiPos: { x: newX, y: newY },
      jumpVelocity,
      isJumping,
      isDucking,
      currentAction: newAction,
      animationFrame: (prev.animationFrame + 1) % sprites.current[newAction].length,
    }));
  };

  const spawnBullet = () => {
    // Implement bullet creation using document.createElement, useRef and manual DOM logic,
    // or create bullet as a React component if rewriting the whole bullet system.
  };

  const updateBullets = () => {
    // Implement manual DOM bullet updates or use React state for a cleaner architecture.
  };

  const updateScore = () => {
    scoreValueRef.current.textContent = gameState.score.toString();
  };

  const gameOver = () => {
    setGameState(prev => ({ ...prev, gameRunning: false }));
    gameOverScreenRef.current.style.display = 'flex';
  };

  return (
    <div id="gameContainer" ref={gameContainerRef}>
      <img id="patuti" ref={patutiRef} src="../images/idle-1.png" style={{ position: 'absolute' }} alt="Patuti" />
      <div id="platform" ref={platformRef}></div>

      <div className="hud">
        <div className="life-bar">
          <span id="lifeValue" ref={lifeValueRef}>100</span>
          <div className="life-bar-inner" ref={lifeBarInnerRef}></div>
        </div>
        <div className="score">
          Score: <span id="scoreValue" ref={scoreValueRef}>0</span>
        </div>
      </div>

      <div id="gameOverScreen" ref={gameOverScreenRef}>
        <div>Game Over</div>
        <div>Final Score: <span ref={finalScoreRef}></span></div>
        <div>Time Survived: <span ref={timeSurvivedRef}></span>s</div>
        <button onClick={() => window.location.reload()}>Restart</button>
      </div>
    </div>
  );
};

export default PatutiGame;
