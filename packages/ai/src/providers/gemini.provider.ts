import { GoogleGenAI, type Part } from '@google/genai';
import type { LLMFinishReason, LLMMessage, LLMRequestOptions, LLMResponse } from '@repo/shared';
import { BaseLLMProvider } from './base.provider.js';

export class GeminiProvider extends BaseLLMProvider {
  readonly name = 'google';
  readonly defaultModel = process.env.AI_MODEL_NAME ?? 'gemini-2.0-flash';

  private client: GoogleGenAI;

  constructor(apiKey?: string) {
    super();
    this.client = new GoogleGenAI({
      apiKey: apiKey ?? process.env.AI_API_KEY,
    });
  }

  async complete(messages: LLMMessage[], options: LLMRequestOptions = {}): Promise<LLMResponse> {
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: toGeminiParts(m),
    }));

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) throw new Error('No messages provided');

    const chat = this.client.chats.create({
      model: options.model ?? this.defaultModel,
      history,
      config: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 16000,
        ...(options.systemPrompt ? { systemInstruction: options.systemPrompt } : {}),
        ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const result = await chat.sendMessage({ message: toGeminiParts(lastMessage) });
    const finishReason = mapGeminiFinishReason(
      result.candidates?.[0]?.finishReason as string | undefined,
    );

    return {
      text: result.text ?? '',
      inputTokens: result.usageMetadata?.promptTokenCount,
      outputTokens: result.usageMetadata?.candidatesTokenCount,
      model: options.model ?? this.defaultModel,
      provider: this.name,
      finishReason,
    };
  }
}

/** Text (+ optional inline images on user turns) → Gemini `Part[]`. */
function toGeminiParts(message: LLMMessage): Part[] {
  const parts: Part[] =
    message.role === 'user' && message.images?.length
      ? message.images.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.data },
        }))
      : [];
  parts.push({ text: message.content });
  return parts;
}

function mapGeminiFinishReason(reason: string | undefined): LLMFinishReason {
  switch (reason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    default:
      return reason ? 'other' : 'stop';
  }
}
