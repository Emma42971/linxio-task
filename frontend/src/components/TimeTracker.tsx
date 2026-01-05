import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { HiPlay, HiStop, HiPause, HiClock } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface TimeTrackerProps {
  taskId: string;
  taskTitle?: string;
  onTimeLogged?: (minutes: number) => void;
}

interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedSeconds: number;
  lastActiveTime: Date | null;
  isIdle: boolean;
}

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const IDLE_CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds

export default function TimeTracker({
  taskId,
  taskTitle,
  onTimeLogged,
}: TimeTrackerProps) {
  const { user, token } = useAuth();
  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedSeconds: 0,
    lastActiveTime: null,
    isIdle: false,
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const idleCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<Date>(new Date());

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token || !user) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const newSocket = io(`${socketUrl}/events`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join:time-tracking', { taskId, userId: user.id });
      toast.success('Time tracker connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.warning('Time tracker disconnected');
    });

    newSocket.on('timer:started', (data: { taskId: string; startTime: string }) => {
      if (data.taskId === taskId) {
        setTimer((prev) => ({
          ...prev,
          isRunning: true,
          startTime: new Date(data.startTime),
          isIdle: false,
        }));
      }
    });

    newSocket.on('timer:stopped', (data: { taskId: string; elapsedSeconds: number }) => {
      if (data.taskId === taskId) {
        setTimer((prev) => ({
          ...prev,
          isRunning: false,
          elapsedSeconds: data.elapsedSeconds,
        }));
      }
    });

    newSocket.on('timer:paused', (data: { taskId: string; reason: string }) => {
      if (data.taskId === taskId) {
        setTimer((prev) => ({
          ...prev,
          isRunning: false,
          isIdle: true,
        }));
        toast.info(`Timer paused: ${data.reason}`);
      }
    });

    newSocket.on('timer:resumed', (data: { taskId: string }) => {
      if (data.taskId === taskId) {
        setTimer((prev) => ({
          ...prev,
          isRunning: true,
          isIdle: false,
          lastActiveTime: new Date(),
        }));
        lastActivityRef.current = new Date();
      }
    });

    newSocket.on('timer:sync', (data: { taskId: string; elapsedSeconds: number; isRunning: boolean }) => {
      if (data.taskId === taskId) {
        setTimer((prev) => ({
          ...prev,
          elapsedSeconds: data.elapsedSeconds,
          isRunning: data.isRunning,
        }));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, taskId]);

  // Track user activity
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = new Date();
      if (timer.isIdle && timer.isRunning) {
        socket?.emit('timer:resume', { taskId, userId: user?.id });
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [socket, taskId, user, timer.isIdle, timer.isRunning]);

  // Idle detection
  useEffect(() => {
    if (!timer.isRunning) {
      if (idleCheckRef.current) {
        clearInterval(idleCheckRef.current);
        idleCheckRef.current = null;
      }
      return;
    }

    idleCheckRef.current = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime();

      if (timeSinceLastActivity > IDLE_THRESHOLD_MS && !timer.isIdle) {
        socket?.emit('timer:pause', {
          taskId,
          userId: user?.id,
          reason: 'User idle',
        });
        setTimer((prev) => ({
          ...prev,
          isIdle: true,
          isRunning: false,
        }));
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      if (idleCheckRef.current) {
        clearInterval(idleCheckRef.current);
      }
    };
  }, [timer.isRunning, timer.isIdle, socket, taskId, user]);

  // Timer tick
  useEffect(() => {
    if (!timer.isRunning || !timer.startTime) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - timer.startTime!.getTime()) / 1000);
      setTimer((prev) => ({
        ...prev,
        elapsedSeconds: elapsed,
      }));

      // Sync with server every 30 seconds
      if (elapsed % 30 === 0) {
        socket?.emit('timer:sync', {
          taskId,
          userId: user?.id,
          elapsedSeconds: elapsed,
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timer.isRunning, timer.startTime, socket, taskId, user]);

  const startTimer = useCallback(() => {
    if (!socket || !user) return;

    socket.emit('timer:start', {
      taskId,
      userId: user.id,
      startTime: new Date().toISOString(),
    });

    setTimer((prev) => ({
      ...prev,
      isRunning: true,
      startTime: new Date(),
      lastActiveTime: new Date(),
      isIdle: false,
      elapsedSeconds: 0,
    }));
    lastActivityRef.current = new Date();
  }, [socket, taskId, user]);

  const stopTimer = useCallback(async () => {
    if (!socket || !user || !timer.startTime) return;

    const elapsedMinutes = Math.floor(timer.elapsedSeconds / 60);

    if (elapsedMinutes > 0) {
      try {
        // Log time entry via API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/time-entries`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              taskId,
              userId: user.id,
              timeSpent: elapsedMinutes,
              startTime: timer.startTime.toISOString(),
              endTime: new Date().toISOString(),
            }),
          },
        );

        if (response.ok) {
          toast.success(`Logged ${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''}`);
          onTimeLogged?.(elapsedMinutes);
        } else {
          toast.error('Failed to log time entry');
        }
      } catch (error) {
        toast.error('Failed to log time entry');
        console.error('Error logging time:', error);
      }
    }

    socket.emit('timer:stop', {
      taskId,
      userId: user.id,
      elapsedSeconds: timer.elapsedSeconds,
    });

    setTimer((prev) => ({
      ...prev,
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      isIdle: false,
    }));
  }, [socket, taskId, user, timer.startTime, timer.elapsedSeconds, token, onTimeLogged]);

  const pauseTimer = useCallback(() => {
    if (!socket || !user) return;

    socket.emit('timer:pause', {
      taskId,
      userId: user.id,
      reason: 'User paused',
    });

    setTimer((prev) => ({
      ...prev,
      isRunning: false,
    }));
  }, [socket, taskId, user]);

  const resumeTimer = useCallback(() => {
    if (!socket || !user) return;

    socket.emit('timer:resume', {
      taskId,
      userId: user.id,
    });

    setTimer((prev) => ({
      ...prev,
      isRunning: true,
      isIdle: false,
      lastActiveTime: new Date(),
    }));
    lastActivityRef.current = new Date();
  }, [socket, taskId, user]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HiClock className="w-5 h-5" />
          Time Tracker
          {!isConnected && (
            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
              (Disconnected)
            </span>
          )}
        </CardTitle>
        {taskTitle && (
          <p className="text-sm text-muted-foreground mt-1">{taskTitle}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-mono font-bold">
            {formatTime(timer.elapsedSeconds)}
          </div>

          {timer.isIdle && (
            <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded">
              Timer paused (idle)
            </div>
          )}

          <div className="flex gap-2">
            {!timer.isRunning ? (
              <>
                {timer.startTime ? (
                  <Button onClick={resumeTimer} variant="default" size="sm">
                    <HiPlay className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                ) : (
                  <Button onClick={startTimer} variant="default" size="sm">
                    <HiPlay className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                )}
                {timer.startTime && (
                  <Button onClick={stopTimer} variant="destructive" size="sm">
                    <HiStop className="w-4 h-4 mr-2" />
                    Stop & Log
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button onClick={pauseTimer} variant="outline" size="sm">
                  <HiPause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button onClick={stopTimer} variant="destructive" size="sm">
                  <HiStop className="w-4 h-4 mr-2" />
                  Stop & Log
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


