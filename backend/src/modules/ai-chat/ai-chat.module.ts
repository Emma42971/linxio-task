import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { SettingsModule } from '../settings/settings.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsModule } from '../projects/projects.module';
import { AiModule } from '../ai/ai.module';
import { AiService } from './ai.service';

@Module({
  imports: [SettingsModule, PrismaModule, WorkspacesModule, ProjectsModule, AiModule],
  controllers: [AiChatController],
  providers: [AiChatService, AiService],
  exports: [AiChatService, AiService],
})
export class AiChatModule {}
