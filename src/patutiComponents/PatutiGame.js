import React, { useEffect, useRef, useState, useCallback } from 'react';
import './css/PatutiGame.css';

// Import sprite images so bundler can handle them:
import idle1 from '../images/idle-1.png';
import idle2 from '../images/idle-2.png';
import left1 from '../images/left-1.png';
import left2 from '../images/left-2.png';
import left3 from '../images/left-3.png';
import left4 from '../images/left-4.png';
import left6 from '../images/left-6.png';
import right1 from '../images/right-1.png';
import right2 from '../images/right-2.png';
import right3 from '../images/right-3.png';
import right4 from '../images/right-4.png';
import right5 from '../images/right-5.png';
import jump1 from '../images/jump-1.png';
import jump2 from '../images/jump-2.png';
import jump3 from '../images/jump-3.png';
import jump4 from '../images/jump-4.png';
import jump5 from '../images/jump-5.png';
import jump6 from '../images/jump-6.png';
import jump7 from '../images/jump-7.png';
import dock1 from '../images/dock-1.png';
import dock2 from '../images/dock-2.png';
import dock3 from '../images/dock-3.png';
import dock4 from '../images/dock-4.png';

// Also import background and bullets images
import backgroundImg from '../images/background.png';
import areaImg from '../images/area.png';
import bulletHImg from '../images/bullet_h.png';
import bulletVImg from '../images/bullet_v.png';

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
    idle: [idle1, idle2],
    left: [left1, left2, left3, left4, left6],
    right: [right1, right2, right3, right4, right5],
    jump: [jump1, jump2, jump3, jump4, jump5, jump6, jump7],
    dock: [dock1, dock2, dock3, dock4, dock1],
  });

  useEffect(() => {
    const platformTop = window.innerHeight - 220;
    const patutiInitial = {
      x: (window.innerWidth - 60) / 2,
      y: platformTop - 60,
    };
    setGameState(prev => ({
      ...prev,
      patutiPos: patutiInitial,
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = e => {
      setGameState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.code]: true },
      }));
    };

    const handleKeyUp = e => {
      setGameState(prev => ({
        ...prev,
        keys: { ...prev.keys, [e.code]: false },
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const updatePatutiPosition = useCallback(() => {
    const speed = 6;
    const platformTop = window.innerHeight - 220;
    const platformLeft = (window.innerWidth - 600) / 2 + 150;
    // Removed unused platformRight variable here

    let newAction = 'idle';
    let newX = gameState.patutiPos.x;
    let newY = gameState.patutiPos.y;
    let { jumpVelocity, isJumping, isDucking } = gameState;

    if (gameState.keys['ArrowLeft'] && newX > platformLeft) {
      newX -= speed;
      newAction = 'left';
    } else if (gameState.keys['ArrowRight'] && newX < platformLeft + 300 - 60) {
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
      patuti.src = sprites.current[newAction][
        gameState.animationFrame % sprites.current[newAction].length
      ];
    }

    setGameState(prev => ({
      ...prev,
      patutiPos: { x: newX, y: newY },
      jumpVelocity,
      isJumping,
      isDucking,
      currentAction: newAction,
      animationFrame:
        (prev.animationFrame + 1) % sprites.current[newAction].length,
    }));
  }, [gameState]);

  const updateScore = useCallback(() => {
    if (scoreValueRef.current) {
      scoreValueRef.current.textContent = gameState.score.toString();
    }
  }, [gameState.score]);

  const spawnBullet = useCallback(() => {
    if (!gameState.gameRunning) return;

    // Randomly choose bullet type and position
    const isHorizontal = Math.random() > 0.5;
    const platformLeft = (window.innerWidth - 600) / 2 + 150;
    const platformTop = window.innerHeight - 220;
    const speed = 5 + Math.random() * 3;

    let bullet = null;

    if (isHorizontal) {
      // Horizontal bullet comes from left or right
      const fromLeft = Math.random() > 0.5;
      bullet = {
        id: Date.now(),
        x: fromLeft ? platformLeft - 40 : platformLeft + 340,
        y: platformTop - 30 + Math.random() * 60,
        speed: fromLeft ? speed : -speed,
        direction: 'horizontal',
        img: bulletHImg,
        width: 40,
        height: 20,
      };
    } else {
      // Vertical bullet comes from top or bottom
      const fromTop = Math.random() > 0.5;
      bullet = {
        id: Date.now(),
        x: platformLeft + Math.random() * 300,
        y: fromTop ? platformTop - 80 : platformTop + 80,
        speed: fromTop ? speed : -speed,
        direction: 'vertical',
        img: bulletVImg,
        width: 20,
        height: 40,
      };
    }

    setGameState(prev => ({
      ...prev,
      bullets: [...prev.bullets, bullet],
    }));
  }, [gameState.gameRunning]);

  const gameOver = useCallback(() => {
    setGameState(prev => ({ ...prev, gameRunning: false }));
    if (gameOverScreenRef.current) {
      gameOverScreenRef.current.style.display = 'flex';
    }
  }, []);

  const updateBullets = useCallback(() => {
    if (!gameState.gameRunning) return;

    const platformLeft = (window.innerWidth - 600) / 2 + 150;
    const platformTop = window.innerHeight - 220;

    let newBullets = [];

    gameState.bullets.forEach(bullet => {
      let newX = bullet.x;
      let newY = bullet.y;

      if (bullet.direction === 'horizontal') {
        newX += bullet.speed;
      } else {
        newY += bullet.speed;
      }

      // Remove bullets that go off screen
      if (
        newX < platformLeft - 50 ||
        newX > platformLeft + 400 ||
        newY < platformTop - 100 ||
        newY > platformTop + 100
      ) {
        return;
      }

      // Collision detection with patuti
      const patutiX = gameState.patutiPos.x;
      const patutiY = gameState.patutiPos.y;
      const patutiWidth = 60;
      const patutiHeight = gameState.isDucking ? 45 : 60;

      if (
        newX < patutiX + patutiWidth &&
        newX + bullet.width > patutiX &&
        newY < patutiY + patutiHeight &&
        newY + bullet.height > patutiY
      ) {
        // Collision: reduce life
        const newLife = gameState.life - 10;
        setGameState(prev => ({
          ...prev,
          life: newLife > 0 ? newLife : 0,
          score: prev.score + 5,
          bullets: prev.bullets.filter(b => b.id !== bullet.id),
        }));

        if (newLife <= 0) {
          gameOver();
        }
      } else {
        newBullets.push({ ...bullet, x: newX, y: newY });
      }
    });

    setGameState(prev => ({
      ...prev,
      bullets: newBullets,
    }));
  }, [gameState, gameOver]);

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
  }, [gameState.gameRunning, updatePatutiPosition, updateBullets, updateScore]);

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
  }, [gameState.gameRunning, spawnBullet]);

  return (
    <div
      id="gameContainer"
      ref={gameContainerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <img
        id="area"
        src={areaImg}
        alt="game area"
        style={{
          position: 'absolute',
          left: '50%',
          top: 'calc(100vh - 220px)',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '200px',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      <img
        id="patuti"
        ref={patutiRef}
        src={idle1}
        style={{ position: 'absolute', userSelect: 'none' }}
        alt="Patuti"
      />
      <div
        id="platform"
        ref={platformRef}
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '220px',
          width: '600px',
          height: '10px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          transform: 'translateX(-50%)',
        }}
      />

      {gameState.bullets.map(bullet => (
        <img
          key={bullet.id}
          src={bullet.img}
          alt="bullet"
          style={{
            position: 'absolute',
            left: bullet.x,
            top: bullet.y,
            width: bullet.width,
            height: bullet.height,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ))}

      <div className="hud">
        <div className="life-bar">
          <span id="lifeValue" ref={lifeValueRef}>
            {gameState.life}
          </span>
          <div
            className="life-bar-inner"
            ref={lifeBarInnerRef}
            style={{ width: `${gameState.life}%` }}
          ></div>
        </div>
        <div className="score">
          Score: <span id="scoreValue" ref={scoreValueRef}>{gameState.score}</span>
        </div>
      </div>

      <div
        id="gameOverScreen"
        ref={gameOverScreenRef}
        style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        <div>Game Over</div>
        <div>
          Final Score: <span ref={finalScoreRef}>{gameState.score}</span>
        </div>
        <div>
          Time Survived:{' '}
          <span
            ref={timeSurvivedRef}
          >{Math.floor((Date.now() - gameState.startTime) / 1000)}</span>
          s
        </div>
        <button onClick={() => window.location.reload()}>Restart</button>
      </div>
    </div>
  );
};

export default PatutiGame;
