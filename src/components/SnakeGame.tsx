'use client';

import { useEffect, useState, useCallback } from 'react';

type Position = {
  x: number;
  y: number;
};

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameResult = 'PLAYER_WIN' | 'COMPUTER_WIN' | 'DRAW' | null;

export default function SnakeGame() {
  const [playerSnake, setPlayerSnake] = useState<Position[]>([{ x: 5, y: 5 }]);
  const [computerSnake, setComputerSnake] = useState<Position[]>([{ x: 15, y: 15 }]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [playerDirection, setPlayerDirection] = useState<Direction>('RIGHT');
  const [computerDirection, setComputerDirection] = useState<Direction>('LEFT');
  const [gameOver, setGameOver] = useState(false);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [speed, setSpeed] = useState(200);

  const gridSize = 20;

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
    setFood(newFood);
  }, []);

  const calculateNextDirection = useCallback((snake: Position[], food: Position, currentDirection: Direction, playerSnake: Position[]): Direction => {
    const head = snake[0];
    
    const oppositeDirections = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };

    const possibleDirections = ['UP', 'DOWN', 'LEFT', 'RIGHT'].filter(
      dir => dir !== oppositeDirections[currentDirection as keyof typeof oppositeDirections]
    ) as Direction[];

    const directionScores = possibleDirections.map(dir => {
      let nextX = head.x;
      let nextY = head.y;
      
      switch (dir) {
        case 'UP': nextY--; break;
        case 'DOWN': nextY++; break;
        case 'LEFT': nextX--; break;
        case 'RIGHT': nextX++; break;
      }

      // 벽과의 충돌 체크
      if (nextX < 0 || nextX >= gridSize || nextY < 0 || nextY >= gridSize) {
        return { direction: dir, score: -1000 };
      }

      // 자신의 몸과의 충돌 체크
      if (snake.some((segment, i) => i > 0 && segment.x === nextX && segment.y === nextY)) {
        return { direction: dir, score: -1000 };
      }

      // 플레이어 뱀과의 충돌 위험 체크
      const playerCollisionRisk = playerSnake.some(segment => {
        const distanceToSegment = Math.abs(nextX - segment.x) + Math.abs(nextY - segment.y);
        return distanceToSegment <= 2; // 2칸 이내의 거리는 위험으로 간주
      });

      // 플레이어 뱀의 예상 이동 방향을 고려
      const playerHead = playerSnake[0];
      const playerNextPositions = [
        { x: playerHead.x, y: playerHead.y - 1 }, // UP
        { x: playerHead.x, y: playerHead.y + 1 }, // DOWN
        { x: playerHead.x - 1, y: playerHead.y }, // LEFT
        { x: playerHead.x + 1, y: playerHead.y }, // RIGHT
      ];

      const playerCollisionRiskFuture = playerNextPositions.some(pos => {
        const distanceToFuturePos = Math.abs(nextX - pos.x) + Math.abs(nextY - pos.y);
        return distanceToFuturePos <= 1;
      });

      // 목표(음식)까지의 거리 계산
      const distanceToFood = Math.abs(food.x - nextX) + Math.abs(food.y - nextY);
      
      // 최종 점수 계산
      let score = -distanceToFood; // 기본 점수는 음식까지의 거리의 음수값

      // 플레이어 뱀 회피 로직
      if (playerCollisionRisk) {
        score -= 500; // 플레이어 뱀 근처는 큰 페널티
      }
      if (playerCollisionRiskFuture) {
        score -= 300; // 플레이어 뱀의 예상 이동 경로도 페널티
      }

      // 벽 근처에서는 추가 페널티
      if (nextX <= 1 || nextX >= gridSize - 2 || nextY <= 1 || nextY >= gridSize - 2) {
        score -= 100;
      }

      return { direction: dir, score };
    });

    // 가장 높은 점수를 가진 방향 선택
    const bestDirection = directionScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return bestDirection.direction;
  }, [gridSize]);

  const checkCollision = (head: Position, snake: Position[]) => {
    // 벽과의 충돌 체크
    if (
      head.x < 0 ||
      head.x >= gridSize ||
      head.y < 0 ||
      head.y >= gridSize
    ) {
      return true;
    }

    // 자기 자신과의 충돌 체크
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }

    return false;
  };

  const checkSnakeCollision = (playerHead: Position, computerHead: Position, playerBody: Position[], computerBody: Position[]) => {
    // 플레이어 머리가 컴퓨터 몸에 부딪힘
    const playerHitComputerBody = computerBody.some(segment => 
      playerHead.x === segment.x && playerHead.y === segment.y
    );

    // 컴퓨터 머리가 플레이어 몸에 부딪힘
    const computerHitPlayerBody = playerBody.some(segment => 
      computerHead.x === segment.x && computerHead.y === segment.y
    );

    // 머리끼리 부딪힘
    const headCollision = playerHead.x === computerHead.x && playerHead.y === computerHead.y;

    if (headCollision) {
      return 'DRAW';
    } else if (playerHitComputerBody) {
      return 'COMPUTER_WIN';
    } else if (computerHitPlayerBody) {
      return 'PLAYER_WIN';
    }

    return null;
  };

  const moveSnakes = useCallback(() => {
    if (gameOver) return;

    const playerHead = { ...playerSnake[0] };
    switch (playerDirection) {
      case 'UP': playerHead.y -= 1; break;
      case 'DOWN': playerHead.y += 1; break;
      case 'LEFT': playerHead.x -= 1; break;
      case 'RIGHT': playerHead.x += 1; break;
    }

    const computerHead = { ...computerSnake[0] };
    const nextComputerDirection = calculateNextDirection(computerSnake, food, computerDirection, playerSnake);
    setComputerDirection(nextComputerDirection);
    
    switch (nextComputerDirection) {
      case 'UP': computerHead.y -= 1; break;
      case 'DOWN': computerHead.y += 1; break;
      case 'LEFT': computerHead.x -= 1; break;
      case 'RIGHT': computerHead.x += 1; break;
    }

    // 벽이나 자신과의 충돌 체크
    if (checkCollision(playerHead, playerSnake)) {
      setGameOver(true);
      setGameResult('COMPUTER_WIN');
      return;
    }

    if (checkCollision(computerHead, computerSnake)) {
      setGameOver(true);
      setGameResult('PLAYER_WIN');
      return;
    }

    // 뱀들 간의 충돌 체크
    const collisionResult = checkSnakeCollision(playerHead, computerHead, playerSnake, computerSnake);
    if (collisionResult) {
      setGameOver(true);
      setGameResult(collisionResult as GameResult);
      return;
    }

    // 새로운 뱀 위치 계산
    const newPlayerSnake = [playerHead];
    const newComputerSnake = [computerHead];
    
    const playerAteFood = playerHead.x === food.x && playerHead.y === food.y;
    const computerAteFood = computerHead.x === food.x && computerHead.y === food.y;

    if (playerAteFood) {
      setPlayerScore(prev => {
        const newScore = prev + 1;
        setSpeed(current => Math.max(70, current - 10));
        return newScore;
      });
      generateFood();
      newPlayerSnake.push(...playerSnake);
    } else {
      newPlayerSnake.push(...playerSnake.slice(0, -1));
    }

    if (computerAteFood) {
      setComputerScore(prev => {
        const newScore = prev + 1;
        setSpeed(current => Math.max(70, current - 10));
        return newScore;
      });
      generateFood();
      newComputerSnake.push(...computerSnake);
    } else {
      newComputerSnake.push(...computerSnake.slice(0, -1));
    }

    setPlayerSnake(newPlayerSnake);
    setComputerSnake(newComputerSnake);
  }, [playerSnake, computerSnake, playerDirection, computerDirection, food, gameOver, generateFood, calculateNextDirection]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 현재 방향의 반대 방향으로는 이동할 수 없도록 설정
      const oppositeDirections = {
        'UP': 'DOWN',
        'DOWN': 'UP',
        'LEFT': 'RIGHT',
        'RIGHT': 'LEFT'
      };

      let newDirection: Direction | null = null;

      switch (e.key) {
        case 'ArrowUp':
          newDirection = 'UP';
          break;
        case 'ArrowDown':
          newDirection = 'DOWN';
          break;
        case 'ArrowLeft':
          newDirection = 'LEFT';
          break;
        case 'ArrowRight':
          newDirection = 'RIGHT';
          break;
      }

      // 새로운 방향이 현재 방향의 반대가 아닐 경우에만 방향 변경
      if (newDirection && newDirection !== oppositeDirections[playerDirection as keyof typeof oppositeDirections]) {
        setPlayerDirection(newDirection);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playerDirection]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnakes, speed);
    return () => clearInterval(gameInterval);
  }, [moveSnakes, speed]);

  const resetGame = () => {
    setPlayerSnake([{ x: 5, y: 5 }]);
    setComputerSnake([{ x: 15, y: 15 }]);
    setPlayerDirection('RIGHT');
    setComputerDirection('LEFT');
    setGameOver(false);
    setPlayerScore(0);
    setComputerScore(0);
    setGameResult(null);
    setSpeed(200);
    generateFood();
  };

  const getResultMessage = () => {
    switch (gameResult) {
      case 'PLAYER_WIN':
        return '플레이어 승리!';
      case 'COMPUTER_WIN':
        return '컴퓨터 승리!';
      case 'DRAW':
        return '무승부!';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-800 p-4">
      <div className="mb-4 flex gap-8">
        <div className="text-white">플레이어 점수: {playerScore}</div>
        <div className="text-white">컴퓨터 점수: {computerScore}</div>
        {gameOver && (
          <>
            <div className="text-white font-bold">{getResultMessage()}</div>
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              다시 시작
            </button>
          </>
        )}
      </div>
      <div 
        className="grid bg-green-600 rounded-lg p-2"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 20px)`,
          gap: '1px',
        }}
      >
        {Array.from({ length: gridSize * gridSize }).map((_, index) => {
          const x = index % gridSize;
          const y = Math.floor(index / gridSize);
          const isPlayerSnake = playerSnake.some(segment => segment.x === x && segment.y === y);
          const isComputerSnake = computerSnake.some(segment => segment.x === x && segment.y === y);
          const isPlayerHead = playerSnake[0].x === x && playerSnake[0].y === y;
          const isComputerHead = computerSnake[0].x === x && computerSnake[0].y === y;
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={index}
              className={`w-5 h-5 rounded-sm ${
                isPlayerSnake
                  ? isPlayerHead
                    ? 'bg-blue-700'
                    : 'bg-blue-500'
                  : isComputerSnake
                  ? isComputerHead
                    ? 'bg-orange-700'
                    : 'bg-orange-500'
                  : isFood
                  ? 'bg-red-500'
                  : 'bg-green-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
} 