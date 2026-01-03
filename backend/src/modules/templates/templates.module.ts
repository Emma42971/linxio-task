import { Module, OnModuleInit } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController, ProjectsFromTemplateController } from './templates.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [TemplatesController, ProjectsFromTemplateController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule implements OnModuleInit {
  constructor(private readonly templatesService: TemplatesService) {}

  async onModuleInit() {
    // Initialize default templates on module startup
    await this.templatesService.initializeDefaultTemplates();
  }
}

