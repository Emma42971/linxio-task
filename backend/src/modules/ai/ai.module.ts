import { Module } from '@nestjs/common';
import { ContextBuilderService } from './services/context-builder.service';
import { AIActionsService } from './ai-actions.service';
import { AIActionsController } from './ai-actions.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { SprintsModule } from '../sprints/sprints.module';
import { OrganizationMembersModule } from '../organization-members/organization-members.module';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { ProjectMembersModule } from '../project-members/project-members.module';
import {
  CreateTaskTool,
  AssignTaskTool,
  CreateSprintTool,
  BulkUpdateTasksTool,
  SearchTasksTool,
  GenerateReportTool,
} from './tools';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    OrganizationMembersModule,
    WorkspaceMembersModule,
    ProjectMembersModule,
  ],
  controllers: [AIActionsController],
  providers: [
    ContextBuilderService,
    AIActionsService,
    CreateTaskTool,
    AssignTaskTool,
    CreateSprintTool,
    BulkUpdateTasksTool,
    SearchTasksTool,
    GenerateReportTool,
  ],
  exports: [
    ContextBuilderService,
    AIActionsService,
    CreateTaskTool,
    AssignTaskTool,
    CreateSprintTool,
    BulkUpdateTasksTool,
    SearchTasksTool,
    GenerateReportTool,
  ],
})
export class AiModule {}

