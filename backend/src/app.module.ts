import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule } from '@nestjs/core';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { TaskStatusesModule } from './modules/task-statuses/task-statuses.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { LabelsModule } from './modules/labels/labels.module';
import { TaskCommentsModule } from './modules/task-comments/task-comments.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { OrganizationMembersModule } from './modules/organization-members/organization-members.module';
import { WorkspaceMembersModule } from './modules/workspace-members/workspace-members.module';
import { ProjectMembersModule } from './modules/project-members/project-members.module';
import { TaskWatchersModule } from './modules/task-watchers/task-watchers.module';
import { TaskAttachmentsModule } from './modules/task-attachments/task-attachments.module';
import { TaskDependenciesModule } from './modules/task-dependencies/task-dependencies.module';
import { GatewayModule } from './gateway/gateway.module';
import { SearchModule } from './modules/search/search.module';
import { AutomationModule } from './modules/automation/automation.module';
import { GanttModule } from './modules/gantt/gantt.module';
import { SeederModule } from './seeder/seeder.module';
import { ActivityLogModule } from './modules/activity-log/activity-log.module';
import { ActivityNotificationInterceptor } from './common/interceptor/activity-notification.interceptor';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { S3Module } from './modules/storage/s3.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { TaskLabelsModule } from './modules/task-label/task-labels.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AiChatModule } from './modules/ai-chat/ai-chat.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { TemplatesModule } from './modules/templates/templates.module';

import { PublicModule } from './modules/public/public.module';
import { HealthModule } from './modules/health/health.module';
import { AllExceptionsFilter } from './common/exceptions/all-exceptions.filter';
import { CacheModule } from './common/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      cache: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (general)
      },
      {
        name: 'auth',
        ttl: 60000, // 1 minute
        limit: 5, // 5 requests per minute for auth endpoints
      },
      {
        name: 'strict',
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute for strict endpoints
      },
    ]),
    RouterModule.register([
      {
        path: 'api',
        children: [
          AuthModule,
          UsersModule,
          OrganizationsModule,
          WorkspacesModule,
          ProjectsModule,
          TasksModule,
          WorkflowsModule,
          TaskStatusesModule,
          SprintsModule,
          LabelsModule,
          TaskCommentsModule,
          TimeEntriesModule,
          OrganizationMembersModule,
          WorkspaceMembersModule,
          ProjectMembersModule,
          TaskWatchersModule,
          TaskAttachmentsModule,
          TaskDependenciesModule,
          SearchModule,
          AutomationModule,
          GanttModule,
          ActivityLogModule,
          NotificationsModule,
          S3Module,
          InvitationsModule,
          TaskLabelsModule,
          SettingsModule,
          AiChatModule,
          InboxModule,
          AnalyticsModule,
          TemplatesModule,
          PublicModule,
          HealthModule,
        ],
      },
    ]),
    PrismaModule,
    CacheModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    WorkflowsModule,
    TaskStatusesModule,
    SprintsModule,
    LabelsModule,
    TaskCommentsModule,
    TimeEntriesModule,
    OrganizationMembersModule,
    WorkspaceMembersModule,
    ProjectMembersModule,
    TaskWatchersModule,
    TaskAttachmentsModule,
    TaskDependenciesModule,
    GatewayModule,
    SearchModule,
    AutomationModule,
    GanttModule,
    SeederModule,
    ActivityLogModule,
    NotificationsModule,
    S3Module,
    InvitationsModule,
    TaskLabelsModule,
    SettingsModule,
    AiChatModule,
    InboxModule,
    AnalyticsModule,
    AiModule,
    TemplatesModule,
    PublicModule,
    HealthModule,
    // EmailModule,
    // SchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityNotificationInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
