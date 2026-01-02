import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import OpenAI from 'openai';
import { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * AI Service with Streaming Support
 * 
 * Provides streaming AI chat functionality using OpenAI SDK.
 * Supports async generator functions for Server-Sent Events (SSE).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private settingsService: SettingsService) {}

  /**
   * Stream AI chat completion
   * 
   * @param messages - Array of chat messages
   * @param userId - User ID for settings retrieval
   * @param options - Additional options (model, temperature, etc.)
   * @returns Async generator yielding chunks of the response
   */
  async *streamChat(
    messages: ChatCompletionMessageParam[],
    userId: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Check if AI is enabled
      const isEnabled = await this.settingsService.get('ai_enabled', userId);
      if (isEnabled !== 'true') {
        throw new BadRequestException(
          'AI chat is currently disabled. Please enable it in settings.',
        );
      }

      // Get API settings from database
      const [apiKey, model, rawApiUrl] = await Promise.all([
        this.settingsService.get('ai_api_key', userId),
        this.settingsService.get('ai_model', userId, options?.model || 'gpt-3.5-turbo'),
        this.settingsService.get('ai_api_url', userId, 'https://api.openai.com/v1'),
      ]);

      if (!apiKey) {
        throw new BadRequestException('AI API key not configured. Please set it in settings.');
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey,
        baseURL: rawApiUrl || 'https://api.openai.com/v1',
      });

      // Prepare chat completion request
      const chatCompletionParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
        model: model || options?.model || 'gpt-3.5-turbo',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: true,
      };

      // Stream the response
      const stream = await openai.chat.completions.create(chatCompletionParams);

      // Yield chunks as they arrive
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      this.logger.error('Error in streamChat:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle OpenAI-specific errors
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new BadRequestException(
            'Invalid API key. Please check your OpenAI API key in settings.',
          );
        } else if (error.status === 429) {
          throw new BadRequestException(
            'Rate limit exceeded. Please try again in a moment.',
          );
        } else if (error.status === 402) {
          throw new BadRequestException(
            'Insufficient credits. Please check your OpenAI account.',
          );
        }
      }

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to stream AI response',
      );
    }
  }

  /**
   * Stream AI chat completion with metadata
   * 
   * Enhanced version that yields both content and metadata
   */
  async *streamChatWithMetadata(
    messages: ChatCompletionMessageParam[],
    userId: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<{ content?: string; done: boolean; error?: string }, void, unknown> {
    try {
      // Check if AI is enabled
      const isEnabled = await this.settingsService.get('ai_enabled', userId);
      if (isEnabled !== 'true') {
        yield { done: true, error: 'AI chat is currently disabled. Please enable it in settings.' };
        return;
      }

      // Get API settings from database
      const [apiKey, model, rawApiUrl] = await Promise.all([
        this.settingsService.get('ai_api_key', userId),
        this.settingsService.get('ai_model', userId, options?.model || 'gpt-3.5-turbo'),
        this.settingsService.get('ai_api_url', userId, 'https://api.openai.com/v1'),
      ]);

      if (!apiKey) {
        yield { done: true, error: 'AI API key not configured. Please set it in settings.' };
        return;
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey,
        baseURL: rawApiUrl || 'https://api.openai.com/v1',
      });

      // Prepare chat completion request
      const chatCompletionParams: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
        model: model || options?.model || 'gpt-3.5-turbo',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: true,
      };

      // Stream the response
      const stream = await openai.chat.completions.create(chatCompletionParams);

      // Yield chunks as they arrive
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield { content, done: false };
        }
      }

      // Signal completion
      yield { done: true };
    } catch (error) {
      this.logger.error('Error in streamChatWithMetadata:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to stream AI response';
      yield { done: true, error: errorMessage };
    }
  }

  /**
   * Non-streaming chat completion (for compatibility)
   */
  async chat(
    messages: ChatCompletionMessageParam[],
    userId: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    try {
      // Check if AI is enabled
      const isEnabled = await this.settingsService.get('ai_enabled', userId);
      if (isEnabled !== 'true') {
        throw new BadRequestException(
          'AI chat is currently disabled. Please enable it in settings.',
        );
      }

      // Get API settings from database
      const [apiKey, model, rawApiUrl] = await Promise.all([
        this.settingsService.get('ai_api_key', userId),
        this.settingsService.get('ai_model', userId, options?.model || 'gpt-3.5-turbo'),
        this.settingsService.get('ai_api_url', userId, 'https://api.openai.com/v1'),
      ]);

      if (!apiKey) {
        throw new BadRequestException('AI API key not configured. Please set it in settings.');
      }

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey,
        baseURL: rawApiUrl || 'https://api.openai.com/v1',
      });

      // Create chat completion
      const completion = await openai.chat.completions.create({
        model: model || options?.model || 'gpt-3.5-turbo',
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('Error in chat:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle OpenAI-specific errors
      if (error instanceof OpenAI.APIError) {
        if (error.status === 401) {
          throw new BadRequestException(
            'Invalid API key. Please check your OpenAI API key in settings.',
          );
        } else if (error.status === 429) {
          throw new BadRequestException(
            'Rate limit exceeded. Please try again in a moment.',
          );
        }
      }

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to get AI response',
      );
    }
  }
}

