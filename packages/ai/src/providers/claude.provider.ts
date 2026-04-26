import Anthropic from '@anthropic-ai/sdk';
import type { LLMMessage, LLMRequestOptions, LLMResponse } from '@repo/shared';
import { BaseLLMProvider } from './base.provider.js';

export class ClaudeProvider extends BaseLLMProvider {
  readonly name = 'anthropic';
  readonly defaultModel = 'claude-sonnet-4-20250514';

  private client: Anthropic;

  constructor(apiKey?: string) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey ?? process.env.AI_API_KEY ?? process.env.ANTHROPIC_API_KEY,
    });
  }

  async complete(messages: LLMMessage[], options: LLMRequestOptions = {}): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.3,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: response.model,
      provider: this.name,
    };
  }
}
