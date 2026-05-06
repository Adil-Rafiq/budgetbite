import OpenAI from 'openai';
import type {
  LLMFinishReason,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
} from '@repo/shared';
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
      ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      messages: [
        ...(options.systemPrompt
          ? [{ role: 'system' as const, content: options.systemPrompt }]
          : []),
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    const choice = response.choices[0];
    const text = choice?.message?.content ?? '';
    return {
      text,
      inputTokens: response.usage?.prompt_tokens,
      outputTokens: response.usage?.completion_tokens,
      model: response.model,
      provider: this.name,
      finishReason: mapOpenAIFinishReason(choice?.finish_reason),
    };
  }
}

function mapOpenAIFinishReason(reason: string | null | undefined): LLMFinishReason {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    default:
      return reason ? 'other' : 'stop';
  }
}
