import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Agent as HttpAgent } from 'http';
import { env } from 'prisma/config';
import 'dotenv/config';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { parseGoogleError } from 'src/common/utils/google-error';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TtsService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly logger = new Logger(TtsService.name);
  private GEMINI_URL = 'https://generativelanguage.googleapis.com';

  private httpAgent = new HttpAgent({ keepAlive: true, family: 4 });

  // allowed tables/fields map (whitelist)
  private allowed = {
    Blog: [
      'id',
      'title',
      'content',
      'userId',
      'likeCount',
      'createdAt',
      'updatedAt',
    ],
    User: ['id', 'username', 'email', 'createdAt', 'updatedAt'],
    Comment: ['id', 'content', 'userId', 'blogId', 'createdAt'],
    Tag: ['id', 'name', 'blogId', 'createdAt'],
    Like: ['id', 'userId', 'blogId', 'createdAt'],
    Conversation: ['id', 'title', 'isGroup', 'createdAt'],
    Message: ['id', 'content', 'senderId', 'conversationId', 'createdAt'],
  } as Record<string, string[]>;

  constructor(
    private readonly httpService: HttpService,
    private prisma: PrismaService,
  ) {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY not set - text generation may fail');
    }
  }

  // ---------- Helper: extract string text from Gemini response candidate ----------
  private extractTextFromCandidate(respData: any): string {
    const candidate = respData?.candidates?.[0];
    if (!candidate) return '';

    const content = candidate.content ?? candidate;

    // if content is a plain string
    if (typeof content === 'string') return content;

    // if candidate has parts (typical): content.parts => array
    if (content && Array.isArray(content.parts)) {
      return content.parts
        .map((p: any) => {
          if (p == null) return '';
          if (typeof p === 'string') return p;
          if (typeof p.text === 'string') return p.text;
          if (p.content && typeof p.content.text === 'string')
            return p.content.text;
          // fallback: try common shapes
          if (typeof p.content === 'string') return p.content;
          // final fallback: stringify small object
          try {
            return JSON.stringify(p);
          } catch {
            return String(p);
          }
        })
        .join(' ')
        .trim();
    }

    // if content.text exists
    if (content && typeof content.text === 'string') return content.text;

    // candidate might have text directly
    if (typeof candidate.text === 'string') return candidate.text;

    // fallback: stringify content
    try {
      return content ? JSON.stringify(content) : '';
    } catch {
      return '';
    }
  }

  private extractJsonFromText(text: string): any {
    if (!text || typeof text !== 'string') {
      throw new Error('No text to extract JSON from');
    }

    // 1) If text contains a triple-backtick code block with json, prefer that
    const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeFenceMatch && codeFenceMatch[1]) {
      const candidate = codeFenceMatch[1].trim();
      try {
        return JSON.parse(candidate);
      } catch {
        // fallthrough to other strategies
      }
    }

    // 2) Try to find first '{' and then find matching closing '}' by counting braces
    const firstBrace = text.indexOf('{');
    if (firstBrace === -1) {
      throw new Error('No JSON object start found');
    }

    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\') {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === '{') depth++;
      else if (ch === '}') depth--;

      if (depth === 0) {
        const candidate = text.slice(firstBrace, i + 1);
        try {
          return JSON.parse(candidate);
        } catch (err) {
          // maybe JSON has trailing commas or single quotes; try to sanitize a bit
          const sanitized = candidate
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":'); // single-quoted keys -> double quotes
          try {
            return JSON.parse(sanitized);
          } catch (err2) {
            // if still fails, break to outer fallback
            break;
          }
        }
      }
    }
    // 3) As last resort: try to parse entire trimmed text
    const trimmed = text.trim();
    try {
      return JSON.parse(trimmed);
    } catch (err) {
      this.logger.debug(
        'extractJsonFromText failure; snippet:',
        trimmed.slice(0, 600),
      );
      throw new Error('Unable to extract/parse JSON from model output');
    }
  }

  // ---------- Chat with Gemini (returns string in text) ----------
  async chatAi(text: string): Promise<{ text: string; raw: any }> {
    const url = `${this.GEMINI_URL}/v1beta/models/${this.model}:generateContent`;
    const body = { contents: [{ parts: [{ text }] }] };
    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      const respData = response.data;
      const generatedText = this.extractTextFromCandidate(respData);
      this.logger.debug('Generated text (chatAi): ' + generatedText);
      return { text: generatedText, raw: respData };
    } catch (err: any) {
      // log for debugging
      this.logger.error('chatAi API error', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });

      // return stable shape (text always string)
      const parsed = (() => {
        try {
          return parseGoogleError(err);
        } catch {
          return null;
        }
      })();

      return {
        text: '',
        raw: {
          error: parsed?.message ?? err?.message ?? 'Google API error',
          status: err?.response?.status ?? null,
          details: err?.response?.data ?? null,
        },
      };
    }
  }

  //------------------------- query database NL to SQL with gemini-------------------------//
  // ----------------- translateToSpec (ensure returns string) -----------------
  async translateToSpec(text: string): Promise<{ text: string; raw: any }> {
    const prompt = `You are a helpful assistant that translates natural language requests into a JSON "query spec".
Return ONLY valid JSON (no explanation). The JSON must follow this schema exactly:

{
  "action": "select",
  "table": "<TableName>",
  "fields": ["id","title","content"],
  "filters": [ { "field": "user.username", "op": "equals", "value": "Đỗ Đức Anh" } ],
  "limit": 3
}

Rules:
- Only return a SINGLE JSON object exactly following the schema above.
- Allowed ops: equals, contains, in, lt, lte, gt, gte.
- Table names must be one of: Blog, User, Comment, Tag, Like, Conversation, Message.
- Limit must be integer <= 100. If user doesn't specify, default limit=10.
- For nested filters use dot notation (e.g. "user.username").
- Do NOT output SQL, code, or any explanation — only the JSON object.

Input: "${text}"
Output:`;

    const url = `${this.GEMINI_URL}/v1beta/models/${this.model}:generateContent`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };
    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.apiKey ?? '',
    };

    try {
      const response = await axios.post(url, body, {
        headers,
        timeout: 20000,
        httpAgent: this.httpAgent,
      });
      const respData = response.data;
      const generatedText = this.extractTextFromCandidate(respData);
      this.logger.debug(`Generated spec text: ${generatedText}`);
      return { text: generatedText, raw: respData };
    } catch (err: any) {
      // keep previous behavior: throw normalized google error
      throw parseGoogleError(err);
    }
  }

  // validate spec and sanitize
  validateSpec(spec: any) {
    if (!spec || spec.action !== 'select')
      throw new Error('Only select action supported');
    if (!this.allowed[spec.table]) throw new Error('Table not allowed');
    spec.limit = Math.min(Number(spec.limit || 10), 100);
    // fields sanitize
    if (
      !spec.fields ||
      !Array.isArray(spec.fields) ||
      spec.fields.length === 0
    ) {
      // default: return a small set
      spec.fields = ['id', 'title', 'createdAt'].filter((f) =>
        this.allowed[spec.table].includes(f),
      );
    } else {
      spec.fields = spec.fields.filter((f: string) =>
        this.allowed[spec.table].includes(f),
      );
      if (spec.fields.length === 0)
        throw new Error('No allowed fields requested');
    }
    // filters: ensure field exists (allow nested dot only for relations defined)
    if (!Array.isArray(spec.filters)) spec.filters = [];
    spec.filters = spec.filters.filter(
      (f: any) =>
        typeof f.field === 'string' &&
        ['equals', 'contains', 'in', 'lt', 'lte', 'gt', 'gte'].includes(f.op),
    );
    return spec;
  }

  async buildPrismaQuery(spec: any): Promise<any> {
    // Duyệt spec.filters để build where cho Prisma
    // Duyệt spec.fields để build select
    // Trả về object { where, take: spec.limit, select } để dùng trực tiếp trong prisma.model.findMany(...)
    const where: any = {};
    // where mapping
    for (const f of spec.filters) {
      // nested field like "user.username"
      if (f.field.includes('.')) {
        const [rel, sub] = f.field.split('.', 2);
        where[rel] = where[rel] || {};
        if (f.op === 'equals') where[rel][sub] = f.value;
        else if (f.op === 'contains')
          where[rel][sub] = { contains: f.value, mode: 'insensitive' };
        else if (f.op === 'in') where[rel][sub] = { in: f.value };
        else if (f.op === 'lt') where[rel][sub] = { lt: f.value };
        else if (f.op === 'lte') where[rel][sub] = { lte: f.value };
        else if (f.op === 'gt') where[rel][sub] = { gt: f.value };
        else if (f.op === 'gte') where[rel][sub] = { gte: f.value };
      } else {
        if (f.op === 'equals') where[f.field] = f.value;
        else if (f.op === 'contains')
          where[f.field] = { contains: f.value, mode: 'insensitive' };
        else if (f.op === 'in') where[f.field] = { in: f.value };
        else if (f.op === 'lt') where[f.field] = { lt: f.value };
        else if (f.op === 'lte') where[f.field] = { lte: f.value };
        else if (f.op === 'gt') where[f.field] = { gt: f.value };
        else if (f.op === 'gte') where[f.field] = { gte: f.value };
      }
    }
    // select mapping
    const select: any = {};
    for (const fld of spec.fields) select[fld] = true;
    return { where, take: spec.limit, select };
  }

  // execute the prisma query
  async runSpec(spec: any): Promise<any[]> {
    spec = this.validateSpec(spec);
    const q = await this.buildPrismaQuery(spec);
    if (spec.table === 'Blog') {
      // If a filter uses user.*, include the relation in select so we can return it
      if ((spec.filters || []).some((f: any) => f.field.startsWith('user.'))) {
        q.select.user = { select: { username: true, id: true, email: true } };
      }
      // Note: Prisma expects 'select' to be exact shape; ensure q.select exists
      const rows = await (this.prisma as any)[spec.table].findMany(q);
      return rows;
    }
    // You can add other tables (User, Comment...) with similar mapping
    throw new Error('Table not implemented in server mapping yet');
  }

  async queryNLtoSQL(text: string): Promise<any> {
    this.logger.debug(`NL to SQL text: ${text}`);
    const { text: specTextRaw, raw } = await this.translateToSpec(text);
    this.logger.debug(
      `Generated spec raw string (first 500 chars): ${String(specTextRaw).slice(0, 500)}`,
    );

    let specObj: any = null;
    // Try parse directly first (fast path)
    if (typeof specTextRaw === 'string') {
      try {
        specObj = JSON.parse(specTextRaw);
      } catch {
        // attempt to extract JSON block
        try {
          specObj = this.extractJsonFromText(specTextRaw);
        } catch (err) {
          // Log server-side full model output to help debug (avoid dumping huge text to client)
          this.logger.warn(
            'Failed to parse spec JSON from model output. Model output snippet:',
            specTextRaw.slice(0, 1000),
          );
          throw new Error('Failed to parse spec JSON');
        }
      }
    } else if (typeof specTextRaw === 'object' && specTextRaw !== null) {
      // If translateToSpec already returned an object, use it
      specObj = specTextRaw;
    } else {
      throw new Error('Invalid spec text returned from model');
    }

    // Now specObj should be an object following schema
    // Run spec
    const rows = await this.runSpec(specObj);
    this.logger.debug(
      `Query results: ${Array.isArray(rows) ? rows.length : 0}`,
    );
    return { rows, spec: specObj, raw };
  }
}
