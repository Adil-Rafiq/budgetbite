import OpenAI from 'openai';
import type { LLMMessage, LLMRequestOptions, LLMResponse } from '@repo/shared';
import { BaseLLMProvider } from './base.provider.js';

export class OpenAIProvider extends BaseLLMProvider {
  readonly name = 'openai';
  readonly defaultModel = 'gpt-4o';

  private client: OpenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey ?? process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY,
    });
  }

  async complete(messages: LLMMessage[], options: LLMRequestOptions = {}): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: options.model ?? this.defaultModel,
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.3,
      messages: [
        ...(options.systemPrompt
          ? [{ role: 'system' as const, content: options.systemPrompt }]
          : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const text = response.choices[0]?.message?.content ?? '';
    return {
      text,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
      model: response.model,
      provider: this.name,
    };
  }
}
