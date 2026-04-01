import type { LLMMessage, LLMProvider, LLMRequestOptions, LLMResponse } from '@repo/shared';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly name: string;
  abstract readonly defaultModel: string;

  abstract complete(messages: LLMMessage[], options?: LLMRequestOptions): Promise<LLMResponse>;

  /**
   * Parse a JSON response from the LLM safely.
   * Strips markdown code fences if present (models sometimes wrap JSON in ```json).
   */
  protected parseJSON<T>(raw: string): T {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }
}
