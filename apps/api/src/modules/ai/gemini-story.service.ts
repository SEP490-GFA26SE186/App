// apps/api/src/modules/ai/gemini-story.service.ts
// AI-Assisted Writing & Illustration Generator using @google/genai SDK

import { GoogleGenAI, Type } from '@google/genai';
import { RedactionMapping, StoryPage, PedagogicalTemplate } from '../../../../../packages/shared-types';
import { redactionService } from './redaction.service';

export interface GenerateStoryOptions {
  userPrompt: string;
  mappings: RedactionMapping[];
  template: PedagogicalTemplate;
  characterDescriptions: string[];
  targetAgeGroup: string;
  pagesCount?: number;
}

export class GeminiStoryService {
  private getAiClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
  }

  /**
   * Tạo truyện sử dụng Gemini API với JSON Schema chặt chẽ
   */
  public async generateStoryContent(options: {
    prompt: string;
    template: PedagogicalTemplate;
    characterMappings: RedactionMapping[];
    characterTraits: string[];
    pagesCount?: number;
  }): Promise<{
    title: string;
    summary: string;
    redactedPages: {
      pageNumber: number;
      text: string;
      illustrationPrompt: string;
      choiceLabel?: string;
      eqSignal: 'EMPATHY' | 'INDEPENDENCE' | 'PATIENCE' | 'CREATIVITY' | 'COMMUNICATION';
    }[];
  }> {
    const pagesCount = options.pagesCount || options.template.suggestedPagesCount || 5;

    // Bước 1: Redact nội dung đề xuất của phụ huynh
    const redactedUserPrompt = redactionService.redactText(options.prompt, options.characterMappings);

    // Xây dựng danh sách nhân vật đã che tên
    const characterListRedacted = options.characterMappings.map((m, idx) => {
      const trait = options.characterTraits[idx] || 'Tính cách thân thiện';
      return `- Nhân vật [${m.placeholder}]: Vai trò ${m.role}, Giới tính ${m.gender}. Mô tả ngoại hình & tính cách: ${trait}`;
    }).join('\n');

    const promptMessage = `
Bạn là nhà văn chuyên viết truyện tranh thiếu nhi cho trẻ em lứa tuổi ${options.template.targetAgeGroup}.
Hãy sáng tác một cuốn truyện ngắn gồm đúng ${pagesCount} trang dựa trên các yêu cầu sau:

CHỦ ĐỀ & KHUÔN MẪU SƯ PHẠM:
- Tựa khuôn mẫu: ${options.template.title}
- Mục tiêu giáo dục EQ: ${options.template.eqDimensions.join(', ')}
- Hướng dẫn sư phạm: ${options.template.promptGuidance}

DANH SÁCH NHÂN VẬT (BẮT BUỘC DÙNG ĐÚNG CÁC PLACEHOLDER SAU, TUYỆT ĐỐI KHÔNG TỰ ĐẶT TÊN KHÁC):
${characterListRedacted}

Ý TƯỞNG CỦA PHỤ HUYNH:
${redactedUserPrompt || 'Một ngày phiêu lưu thú vị giúp các nhân vật gắn kết và học được bài học quý giá.'}

YÊU CẦU ĐẶC BIỆT:
1. Mỗi trang từ 40 đến 70 từ, câu văn ấm áp, vần điệu vui tai, giàu hình ảnh như phong cách truyện cổ tích Nhật Bản (Ehon/HeyJapan).
2. Cuối trang số 3 hoặc 4, hãy tạo một câu hỏi hoặc lựa chọn tương tác rẽ nhánh để bé cùng tương tác khi đọc.
3. Cung cấp prompt vẽ tranh (illustrationPrompt) chi tiết bằng tiếng Anh mô tả bối cảnh hoạt hình ấm áp, màu pastel, bo tròn mềm mại cho từng trang.
    `.trim();

    const ai = this.getAiClient();

    if (ai) {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptMessage,
            config: {
              systemInstruction: 'Bạn là chuyên gia sư phạm thiếu nhi và tác giả truyện thiếu nhi đoạt giải. Luôn tuân thủ tuyệt đối các mã placeholder nhân vật đã cung cấp.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'Tên truyện hấp dẫn, có chứa placeholder nhân vật chính nếu phù hợp',
                  },
                  summary: {
                    type: Type.STRING,
                    description: 'Tóm tắt bài học sư phạm ngắn trong 2 câu',
                  },
                  pages: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        pageNumber: { type: Type.INTEGER },
                        text: {
                          type: Type.STRING,
                          description: 'Lời kể trang sách tiếng Việt, dùng các mã placeholder nhân vật',
                        },
                        illustrationPrompt: {
                          type: Type.STRING,
                          description: 'Mô tả khung cảnh bằng tiếng Anh cho họa sĩ AI minh hoạ',
                        },
                        choiceLabel: {
                          type: Type.STRING,
                          description: 'Lựa chọn rẽ nhánh tương tác cho bé (tuỳ chọn)',
                        },
                        eqSignal: {
                          type: Type.STRING,
                          description: 'Một trong các giá trị: EMPATHY, INDEPENDENCE, PATIENCE, CREATIVITY, COMMUNICATION',
                        },
                      },
                      required: ['pageNumber', 'text', 'illustrationPrompt', 'eqSignal'],
                    },
                  },
                },
                required: ['title', 'summary', 'pages'],
              },
            },
          });

          const jsonText = response.text?.trim();
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            return {
              title: parsed.title,
              summary: parsed.summary,
              redactedPages: parsed.pages.map((p: any) => ({
                pageNumber: p.pageNumber,
                text: p.text,
                illustrationPrompt: p.illustrationPrompt,
                choiceLabel: p.choiceLabel || '',
                eqSignal: (['EMPATHY', 'INDEPENDENCE', 'PATIENCE', 'CREATIVITY', 'COMMUNICATION'].includes(p.eqSignal)
                  ? p.eqSignal
                  : options.template.eqDimensions[0] || 'EMPATHY') as any,
              })),
            };
          }
        } catch (err) {
          console.warn(`Gemini model ${modelName} call failed, trying next fallback:`, err);
        }
      }
    }

    // High quality Fallback pedagogical generator if offline or key not provided
    const heroTag = options.characterMappings[0]?.placeholder || '[HERO_1]';
    const parentTag = options.characterMappings[1]?.placeholder || '[MOTHER_1]';

    return {
      title: `Chuyến Phiêu Lưu Diệu Kỳ Của ${heroTag}`,
      summary: `Câu chuyện ấm áp giúp ${heroTag} rèn luyện tính ${options.template.eqDimensions[0]} và thấu hiểu tình yêu thương gia đình.`,
      redactedPages: [
        {
          pageNumber: 1,
          text: `Một buổi sáng nắng vàng rực rỡ, ${heroTag} thức dậy với nụ cười tươi rói. Hôm nay là một ngày đặc biệt để bắt đầu chuyến phiêu lưu kỳ thú!`,
          illustrationPrompt: `Warm whimsical children book illustration, cute cartoon character playing in a sunny cozy bedroom, pastel colors, soft round lines, HeyJapan aesthetic.`,
          choiceLabel: '',
          eqSignal: 'INDEPENDENCE',
        },
        {
          pageNumber: 2,
          text: `${heroTag} chạy lại ôm chầm lấy ${parentTag} và hào hứng nói: "Hôm nay con sẽ tự tay chuẩn bị ba lô nhỏ xinh nhé!". ${parentTag} xoa đầu khen ngợi.`,
          illustrationPrompt: `Loving parent and happy child packing a cute backpack together in a bright kitchen, storybook style, warm lighting.`,
          choiceLabel: '',
          eqSignal: 'COMMUNICATION',
        },
        {
          pageNumber: 3,
          text: `Khi bước ra khu vườn nhỏ, ${heroTag} gặp một bạn thỏ con đang loay hoay tìm cà rốt bị rơi. Bạn thỏ trông có vẻ buồn và cần giúp đỡ.`,
          illustrationPrompt: `Friendly child meeting a little fluffy bunny in a magical flower garden, gentle expressions, children book watercolor.`,
          choiceLabel: `${heroTag} chọn dừng lại giúp bạn thỏ hay tiếp tục đi khám phá?`,
          eqSignal: 'EMPATHY',
        },
        {
          pageNumber: 4,
          text: `Không ngần ngại, ${heroTag} cúi xuống nhặt củ cà rốt và đưa cho bạn thỏ bằng cả hai tay. Bạn thỏ vui mừng vẫy đôi tai xinh xắn: "Cảm ơn bạn nhiều lắm!".`,
          illustrationPrompt: `The child kindly handing a bright orange carrot to a joyful bunny, sparkling friendship vibes, soft magical particles.`,
          choiceLabel: '',
          eqSignal: 'PATIENCE',
        },
        {
          pageNumber: 5,
          text: `Mặt trời dần lặn xuống, ${heroTag} trở về nhà bên mâm cơm ấm cúng. ${heroTag} nhận ra rằng chia sẻ niềm vui chính là điều kỳ diệu nhất trên đời!`,
          illustrationPrompt: `Cozy evening family dinner at a wooden table, warm glowing lamp, smiling family, heartwarming storybook ending.`,
          choiceLabel: '',
          eqSignal: 'EMPATHY',
        },
      ],
    };
  }
}

export const geminiStoryService = new GeminiStoryService();
