import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

export class TaskNotFoundException extends NotFoundException {
  constructor(taskId: string) {
    super(`Task with ID ${taskId} not found`);
  }
}

export class ProjectNotFoundException extends NotFoundException {
  constructor(projectId: string) {
    super(`Project with ID ${projectId} not found`);
  }
}

export class WorkspaceNotFoundException extends NotFoundException {
  constructor(workspaceId: string) {
    super(`Workspace with ID ${workspaceId} not found`);
  }
}

export class OrganizationNotFoundException extends NotFoundException {
  constructor(organizationId: string) {
    super(`Organization with ID ${organizationId} not found`);
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(action?: string) {
    super(
      action
        ? `Insufficient permissions to ${action}`
        : 'Insufficient permissions',
    );
  }
}

export class ResourceAlreadyExistsException extends ConflictException {
  constructor(resourceType: string, identifier: string) {
    super(`${resourceType} with ${identifier} already exists`);
  }
}

export class InvalidInputException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationException extends BadRequestException {
  constructor(errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
  }
}


