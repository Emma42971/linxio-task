import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
  workspaceId?: string;
  projectId?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private connectedUsers = new Map<string, string[]>(); // userId -> socketIds[]

  constructor(private jwtService: JwtService) {}

  handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth.token || client.handshake.query.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token as string);
      client.userId = payload.sub;

      // Track user connections
      const userSockets = this.connectedUsers.get(client.userId!) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(client.userId!, userSockets);

      this.logger.log(`User ${client.userId} connected with socket ${client.id}`);

      // Join user to their personal room
      void client.join(`user:${client.userId}`);

      // Emit connection confirmation
      client.emit('connected', {
        userId: client.userId,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Authentication failed for socket ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      // Remove socket from user's connections
      const userSockets = this.connectedUsers.get(client.userId) || [];
      const updatedSockets = userSockets.filter((socketId) => socketId !== client.id);

      if (updatedSockets.length === 0) {
        this.connectedUsers.delete(client.userId);
      } else {
        this.connectedUsers.set(client.userId, updatedSockets);
      }

      this.logger.log(`User ${client.userId} disconnected socket ${client.id}`);
    }
  }

  // Join organization room
  @SubscribeMessage('join:organization')
  joinOrganization(
    @MessageBody() data: { organizationId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.organizationId = data.organizationId;
    void client.join(`org:${data.organizationId}`);
    client.emit('joined:organization', { organizationId: data.organizationId });
    this.logger.log(`User ${client.userId} joined organization ${data.organizationId}`);
  }

  // Join workspace room
  @SubscribeMessage('join:workspace')
  joinWorkspace(
    @MessageBody() data: { workspaceId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.workspaceId = data.workspaceId;
    void client.join(`workspace:${data.workspaceId}`);
    client.emit('joined:workspace', { workspaceId: data.workspaceId });
    this.logger.log(`User ${client.userId} joined workspace ${data.workspaceId}`);
  }

  // Join project room
  @SubscribeMessage('join:project')
  joinProject(
    @MessageBody() data: { projectId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.projectId = data.projectId;
    void client.join(`project:${data.projectId}`);
    client.emit('joined:project', { projectId: data.projectId });
    this.logger.log(`User ${client.userId} joined project ${data.projectId}`);
  }

  // Join task room for task-specific updates
  @SubscribeMessage('join:task')
  joinTask(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    void client.join(`task:${data.taskId}`);
    client.emit('joined:task', { taskId: data.taskId });
    this.logger.log(`User ${client.userId} joined task ${data.taskId}`);
  }

  // Leave rooms
  @SubscribeMessage('leave:organization')
  leaveOrganization(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.organizationId) {
      void client.leave(`org:${client.organizationId}`);
      client.emit('left:organization', {
        organizationId: client.organizationId,
      });
      client.organizationId = undefined;
    }
  }

  @SubscribeMessage('leave:workspace')
  leaveWorkspace(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.workspaceId) {
      void client.leave(`workspace:${client.workspaceId}`);
      client.emit('left:workspace', { workspaceId: client.workspaceId });
      client.workspaceId = undefined;
    }
  }

  @SubscribeMessage('leave:project')
  leaveProject(@ConnectedSocket() client: AuthenticatedSocket) {
    if (client.projectId) {
      void client.leave(`project:${client.projectId}`);
      client.emit('left:project', { projectId: client.projectId });
      client.projectId = undefined;
    }
  }

  @SubscribeMessage('leave:task')
  leaveTask(
    @MessageBody() data: { taskId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    void client.leave(`task:${data.taskId}`);
    client.emit('left:task', { taskId: data.taskId });
  }

  // Real-time event broadcasting methods

  // Task events
  emitTaskCreated(projectId: string, task: any) {
    this.server.to(`project:${projectId}`).emit('task:created', {
      event: 'task:created',
      data: task,
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskUpdated(projectId: string, taskId: string, updates: any) {
    this.server.to(`project:${projectId}`).emit('task:updated', {
      event: 'task:updated',
      data: { taskId, updates },
      timestamp: new Date().toISOString(),
    });

    // Also emit to task-specific room
    this.server.to(`task:${taskId}`).emit('task:updated', {
      event: 'task:updated',
      data: { taskId, updates },
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    this.server.to(`project:${projectId}`).emit('task:deleted', {
      event: 'task:deleted',
      data: { taskId },
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskStatusChanged(projectId: string, taskId: string, statusChange: any) {
    this.server.to(`project:${projectId}`).emit('task:status_changed', {
      event: 'task:status_changed',
      data: { taskId, statusChange },
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskAssigned(projectId: string, taskId: string, assignment: any) {
    this.server.to(`project:${projectId}`).emit('task:assigned', {
      event: 'task:assigned',
      data: { taskId, assignment },
      timestamp: new Date().toISOString(),
    });

    // Also notify the assigned user directly
    if (assignment.assigneeId) {
      this.server.to(`user:${assignment.assigneeId}`).emit('task:assigned', {
        event: 'task:assigned',
        data: { taskId, assignment },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Comment events
  emitCommentAdded(projectId: string, taskId: string, comment: any) {
    this.server.to(`project:${projectId}`).emit('comment:added', {
      event: 'comment:added',
      data: { taskId, comment },
      timestamp: new Date().toISOString(),
    });

    this.server.to(`task:${taskId}`).emit('comment:added', {
      event: 'comment:added',
      data: { taskId, comment },
      timestamp: new Date().toISOString(),
    });
  }

  // Time tracking events
  emitTimeEntryStarted(projectId: string, taskId: string, timeEntry: any) {
    this.server.to(`project:${projectId}`).emit('time:started', {
      event: 'time:started',
      data: { taskId, timeEntry },
      timestamp: new Date().toISOString(),
    });
  }

  emitTimeEntryStopped(projectId: string, taskId: string, timeEntry: any) {
    this.server.to(`project:${projectId}`).emit('time:stopped', {
      event: 'time:stopped',
      data: { taskId, timeEntry },
      timestamp: new Date().toISOString(),
    });
  }

  // Time tracking WebSocket handlers
  private activeTimers = new Map<string, { taskId: string; userId: string; startTime: Date; lastActivity: Date }>();

  @SubscribeMessage('join:time-tracking')
  joinTimeTracking(
    @MessageBody() data: { taskId: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    void client.join(`time-tracking:${data.taskId}`);
    client.emit('joined:time-tracking', { taskId: data.taskId });
    this.logger.log(`User ${client.userId} joined time tracking for task ${data.taskId}`);
  }

  @SubscribeMessage('timer:start')
  handleTimerStart(
    @MessageBody() data: { taskId: string; userId: string; startTime: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const timerKey = `${data.userId}:${data.taskId}`;
    const startTime = new Date(data.startTime);

    this.activeTimers.set(timerKey, {
      taskId: data.taskId,
      userId: data.userId,
      startTime,
      lastActivity: startTime,
    });

    // Emit to all clients tracking this task
    this.server.to(`time-tracking:${data.taskId}`).emit('timer:started', {
      taskId: data.taskId,
      startTime: startTime.toISOString(),
    });

    this.logger.log(`Timer started for task ${data.taskId} by user ${data.userId}`);
  }

  @SubscribeMessage('timer:stop')
  handleTimerStop(
    @MessageBody() data: { taskId: string; userId: string; elapsedSeconds: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const timerKey = `${data.userId}:${data.taskId}`;
    const timer = this.activeTimers.get(timerKey);

    if (timer) {
      this.activeTimers.delete(timerKey);

      this.server.to(`time-tracking:${data.taskId}`).emit('timer:stopped', {
        taskId: data.taskId,
        elapsedSeconds: data.elapsedSeconds,
      });

      this.logger.log(`Timer stopped for task ${data.taskId} by user ${data.userId}`);
    }
  }

  @SubscribeMessage('timer:pause')
  handleTimerPause(
    @MessageBody() data: { taskId: string; userId: string; reason: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const timerKey = `${data.userId}:${data.taskId}`;
    const timer = this.activeTimers.get(timerKey);

    if (timer) {
      this.server.to(`time-tracking:${data.taskId}`).emit('timer:paused', {
        taskId: data.taskId,
        reason: data.reason,
      });

      this.logger.log(`Timer paused for task ${data.taskId} by user ${data.userId}: ${data.reason}`);
    }
  }

  @SubscribeMessage('timer:resume')
  handleTimerResume(
    @MessageBody() data: { taskId: string; userId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const timerKey = `${data.userId}:${data.taskId}`;
    const timer = this.activeTimers.get(timerKey);

    if (timer) {
      timer.lastActivity = new Date();

      this.server.to(`time-tracking:${data.taskId}`).emit('timer:resumed', {
        taskId: data.taskId,
      });

      this.logger.log(`Timer resumed for task ${data.taskId} by user ${data.userId}`);
    }
  }

  @SubscribeMessage('timer:sync')
  handleTimerSync(
    @MessageBody() data: { taskId: string; userId: string; elapsedSeconds: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Broadcast sync to all clients tracking this task
    this.server.to(`time-tracking:${data.taskId}`).emit('timer:sync', {
      taskId: data.taskId,
      elapsedSeconds: data.elapsedSeconds,
      isRunning: true,
    });
  }

  // Project events
  emitProjectUpdated(workspaceId: string, projectId: string, updates: any) {
    this.server.to(`workspace:${workspaceId}`).emit('project:updated', {
      event: 'project:updated',
      data: { projectId, updates },
      timestamp: new Date().toISOString(),
    });
  }

  // Sprint events
  emitSprintStarted(projectId: string, sprint: any) {
    this.server.to(`project:${projectId}`).emit('sprint:started', {
      event: 'sprint:started',
      data: sprint,
      timestamp: new Date().toISOString(),
    });
  }

  emitSprintCompleted(projectId: string, sprint: any) {
    this.server.to(`project:${projectId}`).emit('sprint:completed', {
      event: 'sprint:completed',
      data: sprint,
      timestamp: new Date().toISOString(),
    });
  }

  // Notification events
  emitNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      event: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }

  // Typing indicators for comments
  emitUserTyping(taskId: string, user: any) {
    this.server.to(`task:${taskId}`).emit('user:typing', {
      event: 'user:typing',
      data: { taskId, user },
      timestamp: new Date().toISOString(),
    });
  }

  emitUserStoppedTyping(taskId: string, user: any) {
    this.server.to(`task:${taskId}`).emit('user:stopped_typing', {
      event: 'user:stopped_typing',
      data: { taskId, user },
      timestamp: new Date().toISOString(),
    });
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get all online users in a room
  getOnlineUsersInRoom(room: string): string[] {
    const clients = this.server.sockets.adapter.rooms.get(room);
    if (!clients) return [];

    const onlineUsers: string[] = [];
    for (const socketId of clients) {
      const socket = this.server.sockets.sockets.get(socketId) as AuthenticatedSocket;
      if (socket?.userId) {
        onlineUsers.push(socket.userId);
      }
    }
    return [...new Set(onlineUsers)]; // Remove duplicates
  }
}
