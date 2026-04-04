import type { LLMProvider } from '@repo/shared';
import { ClaudeProvider } from './claude.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { GeminiProvider } from './gemini.provider.js';

export type ProviderName = 'anthropic' | 'openai' | 'google';

/**
 * Returns the configured LLM provider based on the AI_PROVIDER env variable.
 * Defaults to Anthropic Claude if not set.
 */
export function createLLMProvider(name?: ProviderName): LLMProvider {
  const provider = name ?? (process.env.AI_PROVIDER as ProviderName | undefined) ?? 'anthropic';

  switch (provider) {
    case 'google':
      return new GeminiProvider();
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
    default:
      return new ClaudeProvider();
  }
}

export { ClaudeProvider, OpenAIProvider };
export type { LLMProvider };
