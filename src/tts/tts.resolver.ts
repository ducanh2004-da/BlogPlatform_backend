// src/graphql/resolvers/nl-to-sql.resolver.ts
import { Resolver, Query, Args } from '@nestjs/graphql';
import { BadRequestException, Logger } from '@nestjs/common';
import { TtsService } from 'src/tts/tts.service';
import { ChatAiResponse, NltoSQL } from 'src/common/models/chatAi/chat.model';

@Resolver()
export class TtsResolver {
  private readonly logger = new Logger(TtsResolver.name);
  constructor(private readonly ttsService: TtsService) {}

  @Query(() => NltoSQL, { name: 'queryNLtoSQL' })
  async queryNLtoSQL(@Args('text') text: string): Promise<any> {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      throw new BadRequestException('text is required');
    }
    try {
      const result = await this.ttsService.queryNLtoSQL(text);
      // result = { rows, spec, raw }
      return { rows: result.rows, spec: result.spec, raw: result.raw };
    } catch (err: any) {
      this.logger.error('queryNLtoSQL error', err);
      throw new BadRequestException(err.message ?? 'Internal error');
    }
  }

  @Query(() => ChatAiResponse, { name: 'chatAi' })
  async chatAiGQL(@Args('text') text: string): Promise<ChatAiResponse> {
    const message = (text ?? '').trim();
    if (!message) {
      return { text: '', raw: null };
    }

    try {
      const result = await this.ttsService.chatAi(message);
      return { text: result?.text ?? '', raw: result?.raw ?? null };
    } catch (err) {
      // log full error server-side
      this.logger.error('chatAi error', err);

      // return a stable GraphQL object so client gets a 200 with details in raw
      return {
        text: '',
        raw: {
          error: err?.message ?? 'Unknown error',
          details: err?.response?.data ?? null,
        },
      };
    }
  }
}
