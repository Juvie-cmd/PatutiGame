import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import './css/PatutiGame.css';

// Sprite imports
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

// Bullet imports
import bulletH from '../images/bullet_h.png';
import bulletV from '../images/bullet_v.png';

const SPRITES = {
  idle: [idle1, idle2],
  left: [left1, left2, left3, left4, left6],
  right: [right1, right2, right3, right4, right5],
  jump: [jump1, jump2, jump3, jump4, jump5, jump6, jump7],
  dock: [dock1, dock2, dock3, dock4, dock1]
};


const PatutiGame = () => {
  const containerRef = useRef(null);
  const patutiRef = useRef(null);
  const [life, setLife] = useState(100);
  const [score, setScore] = useState(0);
  const [gameRunning, setGameRunning] = useState(true);
  const [bullets, setBullets] = useState([]);
  const [sprite, setSprite] = useState(SPRITES.idle[0]);
  const [timeSurvived, setTimeSurvived] = useState(0);  // <--- Add this
  const keys = useRef({});
  const patutiPos = useRef({ x: 0, y: 0 });
  const animation = useRef({ current: 'idle', frame: 0, counter: 0 });
  const jumping = useRef(false);
  const ducking = useRef(false);
  const jumpVelocity = useRef(0);
  const startTime = useRef(Date.now());

  // Memoize platform so it doesn't recreate on every render
  const platform = useMemo(() => ({
    left: (window.innerWidth - 600) / 2 + 150,
    right: (window.innerWidth - 600) / 2 + 150 + 300,
    top: window.innerHeight - 220,
    bottom: window.innerHeight - 100
  }), []);

  // Memoize groundLevel dependent on platform
  const groundLevel = useMemo(() => platform.top - 60, [platform]);

  const updatePosition = useCallback(() => {
    if (!gameRunning) return;

    let newAction = 'idle';
    const speed = 2;
    if (keys.current['ArrowLeft'] && patutiPos.current.x > platform.left) {
      patutiPos.current.x -= speed;
      newAction = 'left';
    } else if (keys.current['ArrowRight'] && patutiPos.current.x < platform.right - 60) {
      patutiPos.current.x += speed;
      newAction = 'right';
    }

    if (keys.current['ArrowUp'] && !jumping.current && !ducking.current) {
      jumping.current = true;
      jumpVelocity.current = -18;
      newAction = 'jump';
    }

    if (keys.current['ArrowDown'] && !jumping.current) {
      ducking.current = true;
      newAction = 'dock';
    } else {
      ducking.current = false;
    }

    if (jumping.current) {
      patutiPos.current.y += jumpVelocity.current;
      jumpVelocity.current += 1;
      if (patutiPos.current.y >= groundLevel) {
        patutiPos.current.y = groundLevel;
        jumping.current = false;
      }
      newAction = 'jump';
    }

    if (ducking.current && !jumping.current) newAction = 'dock';

    if (animation.current.current !== newAction) {
      animation.current.current = newAction;
      animation.current.frame = 0;
      animation.current.counter = 0;
    }

    updateSprite();
  }, [gameRunning, groundLevel, platform.left, platform.right]);

  const updateSprite = () => {
    animation.current.counter++;
    const frameDelay = 8;
    if (animation.current.counter >= frameDelay) {
      animation.current.counter = 0;
      animation.current.frame = (animation.current.frame + 1) % SPRITES[animation.current.current].length;
    }
    setSprite(SPRITES[animation.current.current][animation.current.frame]);
  };

  const updateBullets = useCallback(() => {
    setBullets(prev => {
      return prev.filter(bullet => {
        bullet.x += bullet.speedX;
        bullet.y += bullet.speedY;

        const collided = checkCollision(bullet);
        if (collided) {
          hitPatuti();
          return false;
        }
        if (bullet.x < -50 || bullet.y > window.innerHeight) {
          setScore(s => s + 10);
          return false;
        }
        return true;
      });
    });
  }, []);

const gameLoop = useCallback(() => {
  if (gameRunning) {
    updatePosition();
    updateBullets();
    setScore(s => s + 1);
    setTimeSurvived(Math.floor((Date.now() - startTime.current) / 1000));
    requestAnimationFrame(gameLoop);

  }
  // requestAnimationFrame(gameLoop);
}, [gameRunning, updatePosition, updateBullets]);



const spawnBullet = useCallback(() => {
  if (!gameRunning) return;

  const isHorizontal = Math.random() < 0.5;
  const bullet = {
    id: Date.now(),
    type: isHorizontal ? 'horizontal' : 'vertical',
    x: isHorizontal
      ? window.innerWidth
      : platform.left + Math.random() * (platform.right - platform.left),
    y: isHorizontal
      ? platform.top - 100 + Math.random() * 100
      : 0,
    speedX: isHorizontal ? -(1 + Math.random() * 1) : 0,
    speedY: isHorizontal ? 0 : 1 + Math.random() * 1
  };

  setBullets(prev => [...prev, bullet]);

  if (gameRunning) {
    setTimeout(spawnBullet, 800 + Math.random() * 1000);
  }
}, [gameRunning, platform.left, platform.right, platform.top]);

useEffect(() => {
  if (!gameRunning) {
    setBullets([]);  // clear bullets on game over
  }
}, [gameRunning]);



  useEffect(() => {
    patutiPos.current = {
      x: (window.innerWidth - 60) / 2,
      y: groundLevel
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    gameLoop();
    spawnBullet();
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameLoop, spawnBullet, groundLevel]);

  const handleKeyDown = (e) => {
    keys.current[e.code] = true;
  };

  const handleKeyUp = (e) => {
    keys.current[e.code] = false;
  };

  const checkCollision = (bullet) => {
    const patutiRect = {
      x: patutiPos.current.x,
      y: ducking.current && !jumping.current ? patutiPos.current.y + 15 : patutiPos.current.y,
      width: 60,
      height: ducking.current ? 35 : 60
    };
    const bulletRect = {
      x: bullet.x,
      y: bullet.y,
      width: bullet.type === 'horizontal' ? 40 : 20,
      height: bullet.type === 'horizontal' ? 20 : 40
    };
    return (
      patutiRect.x < bulletRect.x + bulletRect.width &&
      patutiRect.x + patutiRect.width > bulletRect.x &&
      patutiRect.y < bulletRect.y + bulletRect.height &&
      patutiRect.y + patutiRect.height > bulletRect.y
    );
  };

// const hitPatuti = () => {
//   setLife(prev => {
//     const newLife = Math.max(prev - 20, 0);
//     if (newLife === 0) {
//       setGameRunning(false);
//       setBullets([]); // Clear bullets when game ends
//       setTimeSurvived(Math.floor((Date.now() - startTime.current) / 1000));

//     }
//     return newLife;
//   });
// };

const hitPatuti = () => {
  setLife(prev => {
    const newLife = Math.max(prev - 20, 0);
    if (newLife === 0) {
      setGameRunning(false);
    }
    return newLife;
  });
};


  return (
    <div ref={containerRef} className="game-container">
      <div className="platform" />
      <img
        ref={patutiRef}
        id="patuti"
        src={sprite}
        alt="Patuti"
        style={{
          left: patutiPos.current.x,
          top: ducking.current && !jumping.current ? patutiPos.current.y + 15 : patutiPos.current.y,
          width: '60px',
          height: ducking.current ? '45px' : '60px',
          position: 'absolute'
        }}
      />

      <div className="hud">
        <div className="life-bar">
          <span>{life}</span>
          <div className="life-bar-bg">
            <div className="life-bar-inner" style={{ width: `${life}%` }} />
          </div>
        </div>
        <div className="score">
          Score: <span>{score}</span>
        </div>
      </div>

      {!gameRunning && (
        <div className="game-over-screen">
          <div className="game-over-content">
            <h1>Game Over</h1>
            <p>Final Score: {score}</p>
            {/* <p>Time Survived: {Math.floor((Date.now() - startTime.current) / 1000)} seconds</p> */}
            <p>Time Survived: {timeSurvived} seconds</p>

            <button onClick={() => window.location.reload()}>Restart</button>
          </div>
        </div>
      )}

     {gameRunning &&
  bullets.map(bullet => (
    <img
      key={bullet.id}
      src={bullet.type === 'horizontal' ? bulletH : bulletV}
      className={`bullet bullet-${bullet.type}`}
      style={{ left: bullet.x, top: bullet.y, position: 'absolute' }}
      alt="Bullet"
    />
  ))
}
    </div>
  );
};

export default PatutiGame;
