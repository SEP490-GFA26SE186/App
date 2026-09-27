// apps/api/src/modules/ai/redaction.service.ts
// Redaction Engine: CHE TÊN THẬT trước khi gửi prompt cho Gemini API
// và lưu bảng mapping để khôi phục khi phụ huynh đọc truyện.

import { FamilyCharacter, RedactionMapping } from '../../../../../packages/shared-types';

export class RedactionService {
  /**
   * Tạo mapping từ danh sách nhân vật gia đình
   */
  public generateMappings(characters: FamilyCharacter[]): RedactionMapping[] {
    const roleCounters: Record<string, number> = {};

    return characters.map((char) => {
      const role = char.relationRole;
      roleCounters[role] = (roleCounters[role] || 0) + 1;
      const placeholder = `[${role}_${roleCounters[role]}]`;

      return {
        placeholder,
        realName: char.name.trim(),
        role: char.relationRole,
        gender: char.relationRole === 'MOTHER' || char.relationRole === 'SISTER' || char.relationRole === 'GRANDMOTHER' ? 'FEMALE' : 'MALE',
      };
    });
  }

  /**
   * Thay thế tên thật bằng placeholder trong mô tả/ý tưởng của phụ huynh
   */
  public redactText(text: string, mappings: RedactionMapping[]): string {
    let result = text;
    for (const item of mappings) {
      if (!item.realName) continue;
      // Regex case-insensitive thay thế toàn bộ từ trùng tên thật
      const escaped = item.realName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      result = result.replace(regex, item.placeholder);
    }
    return result;
  }

  /**
   * Khôi phục tên thật từ placeholder khi trả về cho phụ huynh
   */
  public restoreRealNames(text: string, mappings: RedactionMapping[]): string {
    let result = text;
    for (const item of mappings) {
      const escaped = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'g');
      result = result.replace(regex, item.realName);
    }
    return result;
  }

  /**
   * Tự động gỡ cá nhân hoá (Anonymize) khi người bán đưa truyện lên Marketplace
   * Biến nhân vật gia đình thành nhân vật cổ tích đại chúng thân thiện thiếu nhi
   */
  public anonymizeForMarketplace(text: string, mappings: RedactionMapping[]): string {
    let result = text;
    const universalFairyNames: Record<string, string> = {
      HERO: 'Bé Thỏ Trắng',
      FATHER: 'Bác Gấu Bố',
      MOTHER: 'Cô Thỏ Mẹ',
      BROTHER: 'Bạn Cáo Nhỏ',
      SISTER: 'Bé Sóc Nâu',
      GRANDFATHER: 'Ông Rùa Thông Thái',
      GRANDMOTHER: 'Bà Cú Hiền Từ',
      PET: 'Cún Đốm Tinh Nghịch',
      FRIEND: 'Bạn Nhím Nhỏ',
    };

    for (const item of mappings) {
      const fairyName = universalFairyNames[item.role] || 'Bé Nhân Vật Nhỏ';
      // Thay thế cả tên thật và placeholder nếu còn
      const escapedReal = item.realName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedHolder = item.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedReal, 'gi'), fairyName);
      result = result.replace(new RegExp(escapedHolder, 'g'), fairyName);
    }
    return result;
  }
}

export const redactionService = new RedactionService();
