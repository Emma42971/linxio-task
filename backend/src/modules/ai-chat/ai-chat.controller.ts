import {
  Controller,
  Post,
  Body,
  UseGuards,
  Delete,
  Param,
  Res,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiChatService } from './ai-chat.service';
import { AiService } from './ai.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  TestConnectionDto,
  TestConnectionResponseDto,
} from './dto/chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

@ApiTags('AI Chat')
@Controller('ai-chat')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(
    private readonly aiChatService: AiChatService,
    private readonly aiService: AiService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send chat message to AI assistant' })
  @ApiResponse({ status: 200, type: ChatResponseDto })
  async chat(
    @CurrentUser() user: User,
    @Body() chatRequest: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    return this.aiChatService.chat(chatRequest, user.id);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test AI provider connection without requiring AI to be enabled' })
  @ApiResponse({ status: 200, type: TestConnectionResponseDto })
  async testConnection(
    @Body() testConnectionDto: TestConnectionDto,
  ): Promise<TestConnectionResponseDto> {
    return this.aiChatService.testConnection(testConnectionDto);
  }

  @Delete('context/:sessionId')
  @ApiOperation({ summary: 'Clear conversation context for a session' })
  @ApiResponse({ status: 200, description: 'Context cleared successfully' })
  clearContext(@Param('sessionId') sessionId: string): { success: boolean } {
    return this.aiChatService.clearContext(sessionId);
  }

  @Post('stream')
  @ApiOperation({ summary: 'Stream AI chat response using Server-Sent Events (SSE)' })
  @ApiResponse({ status: 200, description: 'SSE stream of AI response chunks' })
  async streamChat(
    @CurrentUser() user: User,
    @Body() chatRequest: ChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    try {
      // Convert messages to OpenAI format
      const messages: ChatCompletionMessageParam[] = [];

      // Add system prompt if needed (from existing service logic)
      // You can extend this to include system prompts from aiChatService

      // Add conversation history
      if (chatRequest.history && chatRequest.history.length > 0) {
        chatRequest.history.forEach((msg) => {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        });
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: chatRequest.message,
      });

      // Stream the response
      for await (const chunk of this.aiService.streamChat(messages, user.id)) {
        // Send chunk as SSE event
        res.write(`data: ${JSON.stringify({ content: chunk, done: false })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      // Send error event
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ error: errorMessage, done: true })}\n\n`);
      res.end();
    }
  }

  @Sse('stream-sse')
  @ApiOperation({ summary: 'Stream AI chat response using SSE decorator' })
  @ApiResponse({ status: 200, description: 'SSE stream of AI response chunks' })
  streamChatSSE(
    @CurrentUser() user: User,
    @Body() chatRequest: ChatRequestDto,
  ): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      (async () => {
        try {
          // Convert messages to OpenAI format
          const messages: ChatCompletionMessageParam[] = [];

          // Add conversation history
          if (chatRequest.history && chatRequest.history.length > 0) {
            chatRequest.history.forEach((msg) => {
              messages.push({
                role: msg.role,
                content: msg.content,
              });
            });
          }

          // Add current user message
          messages.push({
            role: 'user',
            content: chatRequest.message,
          });

          // Stream the response
          for await (const chunk of this.aiService.streamChat(messages, user.id)) {
            subscriber.next({
              data: { content: chunk, done: false },
            } as MessageEvent);
          }

          // Send completion
          subscriber.next({
            data: { done: true },
          } as MessageEvent);
          subscriber.complete();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          subscriber.next({
            data: { error: errorMessage, done: true },
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }
}
