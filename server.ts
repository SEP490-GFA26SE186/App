// server.ts
// Express Full-Stack Server for StoryWeaver with Vite integration
import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { geminiStoryService } from './apps/api/src/modules/ai/gemini-story.service';
import { redactionService } from './apps/api/src/modules/ai/redaction.service';
import { moderationService } from './apps/api/src/modules/moderation/moderation.service';
import { payOsService, PayOsWebhookPayload } from './apps/api/src/modules/payment/payos.service';
import { escrowPayoutCron } from './apps/api/src/modules/cron/escrow-payout.cron';
import { eqService } from './apps/api/src/modules/eq/eq.service';
import {
  UserAccount,
  ChildProfile,
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
  StoryPage,
  OrderOwnership,
  WalletTransaction,
  ModerationChecklist,
  EqReport
} from './packages/shared-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ==========================================
// IN-MEMORY DATABASE SEEDING (PostgreSQL / Prisma model mirror)
// ==========================================

let currentUser: UserAccount = {
  id: 'usr_parent_01',
  email: 'me.lan@gmail.com',
  fullName: 'Mẹ Lan Phương',
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  phone: '0901234567',
  role: 'PARENT',
  kidModePinHash: '1234', // 4-digit PIN for Kid Mode
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  creditBalance: 85, // 💎 Credits
  sellerPendingBalance: 420000, // 420k VND held for 7 days
  sellerAvailableBalance: 750000, // 750k VND available
  bankAccount: {
    bankName: 'Vietcombank',
    accountNumber: '0071001234567',
    accountHolder: 'TRAN LAN PHUONG',
  },
};

let childrenProfiles: ChildProfile[] = [
  {
    id: 'ch_01',
    parentId: 'usr_parent_01',
    name: 'Bé Bo (Gia Bảo)',
    nickname: 'Bo Bo',
    gender: 'MALE',
    birthDate: '2021-04-12',
    age: 4,
    readingLevel: 'BEGINNER',
    interests: ['Khủng long', 'Ô tô cảnh sát', 'Vẽ tranh'],
    avatarUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80',
    favoriteTopics: ['Lòng dũng cảm', 'Chia sẻ cùng bạn'],
  },
  {
    id: 'ch_02',
    parentId: 'usr_parent_01',
    name: 'Bé Miu (Ngọc Mai)',
    nickname: 'Miu Miu',
    gender: 'FEMALE',
    birthDate: '2019-08-20',
    age: 6,
    readingLevel: 'INTERMEDIATE',
    interests: ['Mèo con', 'Khu vườn cổ tích', 'Đố vui'],
    avatarUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150&auto=format&fit=crop&q=80',
    favoriteTopics: ['Kiên nhẫn', 'Sáng tạo'],
  },
];

let familyCharacters: FamilyCharacter[] = [
  {
    id: 'char_01',
    parentId: 'usr_parent_01',
    name: 'Bé Bo',
    relationRole: 'HERO',
    appearanceDescription: 'Cậu bé 4 tuổi, mắt to tròn lém lỉnh, tóc xoăn ngắn, hay mặc áo thun khủng long xanh lá',
    personalityTraits: ['Hiếu động', 'Ham học hỏi', 'Thỉnh thoảng sợ bóng tối'],
    avatarPlaceholder: '👦',
  },
  {
    id: 'char_02',
    parentId: 'usr_parent_01',
    name: 'Bố Tuấn',
    relationRole: 'FATHER',
    appearanceDescription: 'Bố đeo kính cận gọng đen, nụ cười hiền hậu, cao ráo và ấm áp',
    personalityTraits: ['Kiên nhẫn giảng giải', 'Khéo tay sửa đồ chơi'],
    avatarPlaceholder: '👨‍💼',
  },
  {
    id: 'char_03',
    parentId: 'usr_parent_01',
    name: 'Mẹ Lan',
    relationRole: 'MOTHER',
    appearanceDescription: 'Mẹ tóc dài buộc đuôi ngựa, giọng nói ngọt ngào, hay tạp dề hoa',
    personalityTraits: ['Ân cần', 'Nấu ăn ngon', 'Biết lắng nghe'],
    avatarPlaceholder: '👩‍🍳',
  },
  {
    id: 'char_04',
    parentId: 'usr_parent_01',
    name: 'Chó Lu',
    relationRole: 'PET',
    appearanceDescription: 'Chú cún corgi chân ngắn lông vàng trắng, tai to vểnh, đuôi lắc tít',
    personalityTraits: ['Trung thành', 'Thích chơi bóng', 'Hay lon ton'],
    avatarPlaceholder: '🐶',
  },
];

let pedagogicalTemplates: PedagogicalTemplate[] = [
  {
    id: 'tpl_01',
    title: 'Vượt Qua Nỗi Sợ Bóng Tối & Tự Lập Đi Ngủ',
    category: 'EMOTIONAL_INTELLIGENCE',
    description: 'Dạy bé nhận biết nỗi sợ, dùng trí tưởng tượng biến bóng đêm thành khu vườn lấp lánh diệu kỳ.',
    targetAgeGroup: '2-4',
    eqDimensions: ['INDEPENDENCE', 'PATIENCE'],
    suggestedPagesCount: 5,
    promptGuidance: 'Khởi đầu lúc bé chuẩn bị đi ngủ và thấy sợ bóng đen của rèm cửa. Bố mẹ hướng dẫn bé bật đèn pin chiếu hình bóng thành các con thú vui nhộn. Bé dũng cảm ngủ ngon một mình.',
    coverIllustration: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_02',
    title: 'Học Cách Chia Sẻ Đồ Chơi Cùng Bạn Thân',
    category: 'MORAL_VALUES',
    description: 'Giúp bé hiểu niềm vui nhân đôi khi cùng bạn chơi chung, rèn sự đồng cảm và gắn kết.',
    targetAgeGroup: '2-4',
    eqDimensions: ['EMPATHY', 'COMMUNICATION'],
    suggestedPagesCount: 5,
    promptGuidance: 'Bé có món đồ chơi mới rất thích và ban đầu không muốn chia sẻ với bạn. Sau đó hai bạn cùng xây lâu đài to hơn khi gộp đồ chơi lại, tạo ra trải nghiệm vui bất ngờ.',
    coverIllustration: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_03',
    title: 'Dũng Cảm Nhận Lỗi Khi Làm Vỡ Đồ',
    category: 'EMOTIONAL_INTELLIGENCE',
    description: 'Bài học về sự trung thực, cách giải quyết hậu quả nhẹ nhàng và sự bao dung của cha mẹ.',
    targetAgeGroup: '5-7',
    eqDimensions: ['EMPATHY', 'COMMUNICATION', 'PATIENCE'],
    suggestedPagesCount: 6,
    promptGuidance: 'Bé vô tình làm vỡ chậu hoa của mẹ khi chơi đùa. Lúc đầu bé lo lắng muốn giấu. Nhưng sau khi suy nghĩ, bé đã dũng cảm nói sự thật và cùng bố mẹ quét dọn, trồng cây mới.',
    coverIllustration: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_04',
    title: 'Kiên Nhẫn Hoàn Thành Bức Tranh Ước Mơ',
    category: 'DAILY_HABITS',
    description: 'Khuyến khích bé không bỏ cuộc khi gặp bài toán khó hay mảnh ghép chưa vừa.',
    targetAgeGroup: '5-7',
    eqDimensions: ['PATIENCE', 'CREATIVITY'],
    suggestedPagesCount: 5,
    promptGuidance: 'Bé thử vẽ tàu vũ trụ nhưng vẽ mãi chưa được như ý và muốn nản lòng. Nhân vật đồng hành gợi ý hít thở sâu, chia nhỏ từng bước và cuối cùng bé hoàn thành tuyệt phẩm.',
    coverIllustration: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'tpl_05',
    title: 'Học Cách Nói Cảm Ơn & Xin Lỗi Chân Thành',
    category: 'MORAL_VALUES',
    description: 'Giúp bé nhận biết giá trị của sự lễ phép, biết ơn cha mẹ và bạn bè trong từng cử chỉ nhỏ.',
    targetAgeGroup: '2-4',
    eqDimensions: ['EMPATHY', 'COMMUNICATION'],
    suggestedPagesCount: 4,
    promptGuidance: 'Bé nhận được món quà từ ông bà và học cách cất lời cảm ơn chân thành, tạo niềm vui lớn cho cả nhà.',
    coverIllustration: '/s1.jpg',
  },
  {
    id: 'tpl_06',
    title: 'Chú Rồng Con Học Cách Làm Chủ Cơn Giận',
    category: 'EMOTIONAL_INTELLIGENCE',
    description: 'Kỹ năng hít thở sâu, đếm từ 1 đến 5 để bình tĩnh khi mọi chuyện không như ý muốn.',
    targetAgeGroup: '4-7',
    eqDimensions: ['PATIENCE', 'EMPATHY'],
    suggestedPagesCount: 5,
    promptGuidance: 'Rồng con bị đổ tháp gỗ và muốn phun lửa cáu kỉnh. Bé hướng dẫn Rồng hít thở cầu vồng để nguội cơn giận.',
    coverIllustration: '/s2.jpg',
  },
  {
    id: 'tpl_07',
    title: 'Chuyến Tàu Ru Ngủ Đi Tới Xứ Sở Giấc Mơ',
    category: 'DAILY_HABITS',
    description: 'Âm thanh êm dịu, hình ảnh nhẹ nhàng đưa bé vào giấc ngủ sâu và bình yên sau ngày dài khám phá.',
    targetAgeGroup: '2-6',
    eqDimensions: ['INDEPENDENCE'],
    suggestedPagesCount: 5,
    promptGuidance: 'Đoàn tàu mây đón các bạn thú nhỏ lướt qua cánh đồng sao, hát khúc ru êm dịu.',
    coverIllustration: '/s3.jpg',
  },
];

let stories: Story[] = [
  {
    id: 'st_01',
    creatorId: 'usr_parent_01',
    title: 'Chuyến Phiêu Lưu Đến Xứ Sở Ánh Sao Của Bé Bo',
    summary: 'Bé Bo cùng Chó Lu và Bố Tuấn khám phá vẻ đẹp kỳ thú của đêm tối và học cách tự lập khi đi ngủ.',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '2-4',
    theme: 'Vượt qua sợ hãi',
    pedagogicalTemplateId: 'tpl_01',
    pedagogicalTemplateTitle: 'Vượt Qua Nỗi Sợ Bóng Tối & Tự Lập Đi Ngủ',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 49000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 4.9,
    reviewsCount: 14,
    charactersUsed: [
      { characterId: 'char_01', realName: 'Bé Bo', placeholderTag: '[HERO_1]', role: 'HERO' },
      { characterId: 'char_02', realName: 'Bố Tuấn', placeholderTag: '[FATHER_1]', role: 'FATHER' },
      { characterId: 'char_04', realName: 'Chó Lu', placeholderTag: '[PET_1]', role: 'PET' },
    ],
    pages: [
      {
        id: 'p_1',
        pageNumber: 1,
        text: 'Mỗi khi ánh hoàng hôn dần buông xuống, căn phòng nhỏ của Bé Bo bắt đầu khoác lên chiếc áo màu tím dịu mát.',
        redactedText: 'Mỗi khi ánh hoàng hôn dần buông xuống, căn phòng nhỏ của [HERO_1] bắt đầu khoác lên chiếc áo màu tím dịu mát.',
        illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        audioNarrationUrl: '',
        moderatorApproved: true,
      },
      {
        id: 'p_2',
        pageNumber: 2,
        text: 'Bé Bo nhìn ra rèm cửa, thấy chiếc bóng chao liệng và cảm thấy hơi giật mình. Chó Lu khẽ sủa vang gâu gâu an ủi.',
        redactedText: '[HERO_1] nhìn ra rèm cửa, thấy chiếc bóng chao liệng và cảm thấy hơi giật mình. [PET_1] khẽ sủa vang gâu gâu an ủi.',
        illustrationUrl: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=800&auto=format&fit=crop&q=80',
        audioNarrationUrl: '',
        moderatorApproved: true,
      },
      {
        id: 'p_3',
        pageNumber: 3,
        text: 'Bố Tuấn bước vào phòng, mỉm cười dịu dàng và bật chiếc đèn chiếu sao lên trần nhà.',
        redactedText: '[FATHER_1] bước vào phòng, mỉm cười dịu dàng và bật chiếc đèn chiếu sao lên trần nhà.',
        illustrationUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        audioNarrationUrl: '',
        moderatorApproved: true,
        choices: [
          {
            id: 'c_1',
            label: 'Bé Bo dùng đôi bàn tay làm hình chú chim bay lên trần sao',
            targetNextPageNumber: 4,
            eqSignal: 'CREATIVITY',
          },
        ],
      },
      {
        id: 'p_4',
        pageNumber: 4,
        text: 'Cả căn phòng bừng sáng như dải ngân hà rực rỡ! Bé Bo bật cười khúc khích, nhận ra bóng đêm chẳng hề đáng sợ mà lại vô cùng lung linh.',
        redactedText: 'Cả căn phòng bừng sáng như dải ngân hà rực rỡ! [HERO_1] bật cười khúc khích, nhận ra bóng đêm chẳng hề đáng sợ mà lại vô cùng lung linh.',
        illustrationUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        audioNarrationUrl: '',
        moderatorApproved: true,
      },
      {
        id: 'p_5',
        pageNumber: 5,
        text: 'Bé Bo ngoan ngoãn đắp chăn ấm, ôm Chó Lu và chúc Bố Tuấn ngủ ngon. Một giấc ngủ bình yên và ngọt ngào đã đến!',
        redactedText: '[HERO_1] ngoan ngoãn đắp chăn ấm, ôm [PET_1] và chúc [FATHER_1] ngủ ngon. Một giấc ngủ bình yên và ngọt ngào đã đến!',
        illustrationUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        audioNarrationUrl: '',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_02',
    creatorId: 'usr_seller_02',
    title: 'Lâu Đài Cát Của Hai Bạn Sóc',
    summary: 'Câu chuyện rèn tính kiên nhẫn và kỹ năng hợp tác cùng bạn bè khi cùng nhau vượt qua thử thách.',
    coverImageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '4-7',
    theme: 'Hợp tác & Đồng cảm',
    pedagogicalTemplateId: 'tpl_02',
    pedagogicalTemplateTitle: 'Học Cách Chia Sẻ Đồ Chơi Cùng Bạn Thân',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 59000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 5.0,
    reviewsCount: 22,
    charactersUsed: [],
    pages: [
      {
        id: 'p_21',
        pageNumber: 1,
        text: 'Bên bờ biển đầy nắng vàng, Sóc Nâu và Sóc Vàng cùng nhau mang xô và xẻng ra nghịch cát.',
        illustrationUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_22',
        pageNumber: 2,
        text: 'Cơn sóng bất ngờ ập tới cuốn trôi một góc bờ tường. Sóc Nâu buồn thiu, nhưng Sóc Vàng đã động viên: "Đừng lo, chúng mình cùng đắp lại nhé!".',
        illustrationUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_23',
        pageNumber: 3,
        text: 'Nhờ sự kiên nhẫn và đoàn kết, tòa lâu đài cát mới vững chãi và đẹp hơn bao giờ hết!',
        illustrationUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_03',
    creatorId: 'usr_seller_03',
    title: 'Chú Cún Lu Và Chuyến Khám Phá Rừng Đom Đóm',
    summary: 'Cún Lu dũng cảm tìm chiếc xương đồ chơi thất lạc và giúp đỡ các bạn thú nhỏ lạc đường trong đêm.',
    coverImageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '2-4',
    theme: 'Lòng tốt & Tình bạn',
    pedagogicalTemplateId: 'tpl_01',
    pedagogicalTemplateTitle: 'Vượt Qua Nỗi Sợ Bóng Tối & Tự Lập Đi Ngủ',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 45000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 4.9,
    reviewsCount: 31,
    charactersUsed: [
      { characterId: 'char_04', realName: 'Chó Lu', placeholderTag: '[PET_1]', role: 'PET' },
    ],
    pages: [
      {
        id: 'p_31',
        pageNumber: 1,
        text: 'Dưới ánh trăng rằm vằng vặc, chú Cún Lu đeo chiếc nơ đỏ xinh xắn lon ton chạy quanh vườn.',
        illustrationUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_32',
        pageNumber: 2,
        text: 'Hàng ngàn chú đom đóm thắp sáng lấp lánh như bầu trời sao thu nhỏ, soi đường cho Cún Lu và bạn Nhím.',
        illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_33',
        pageNumber: 3,
        text: 'Cún Lu chia sẻ đồ chơi cho các bạn và nhận lại những tràng pháo tay ròn rã khắp khu rừng!',
        illustrationUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_04',
    creatorId: 'usr_seller_04',
    title: 'Bé Gái Và Cây Đũa Thần Nở Hoa',
    summary: 'Cô bé mang lại màu sắc tươi vui cho cả thị trấn bằng những việc tốt nhỏ bé mỗi ngày.',
    coverImageUrl: '/s1.jpg',
    targetAgeGroup: '4-7',
    theme: 'Lòng trắc ẩn & Yêu thương',
    pedagogicalTemplateId: 'tpl_05',
    pedagogicalTemplateTitle: 'Học Cách Nói Cảm Ơn & Xin Lỗi Chân Thành',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 55000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 5.0,
    reviewsCount: 48,
    charactersUsed: [],
    pages: [
      {
        id: 'p_41',
        pageNumber: 1,
        text: 'Trong khu vườn sau nhà, cô bé tìm thấy một nhành cây nhỏ lấp lánh như chiếc đũa thần kỳ diệu.',
        illustrationUrl: '/s1.jpg',
        moderatorApproved: true,
      },
      {
        id: 'p_42',
        pageNumber: 2,
        text: 'Mỗi khi bé nói một lời dịu dàng hoặc giúp đỡ ai đó, một bông hoa thơm ngát lại bừng nở trên nhành cây.',
        illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_43',
        pageNumber: 3,
        text: 'Bé nhận ra phép màu thật sự không ở đâu xa, mà chính là sự ấm áp trong trái tim mình!',
        illustrationUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_05',
    creatorId: 'usr_seller_05',
    title: 'Chú Rồng Con Và Giấc Mơ Bay Cao',
    summary: 'Rồng con học cách kiên trì tập luyện mỗi ngày để chinh phục bầu trời cao rộng cùng bạn bè.',
    coverImageUrl: '/s2.jpg',
    targetAgeGroup: '4-7',
    theme: 'Kiên trì & Tự tin',
    pedagogicalTemplateId: 'tpl_06',
    pedagogicalTemplateTitle: 'Chú Rồng Con Học Cách Làm Chủ Cơn Giận',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 49000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 4.9,
    reviewsCount: 36,
    charactersUsed: [],
    pages: [
      {
        id: 'p_51',
        pageNumber: 1,
        text: 'Chú rồng nhỏ có đôi cánh màu vàng óng ả nhưng rất rụt rè khi đứng trên vách núi cao.',
        illustrationUrl: '/s2.jpg',
        moderatorApproved: true,
      },
      {
        id: 'p_52',
        pageNumber: 2,
        text: 'Mẹ rồng khuyên: "Hãy nhắm mắt lại, cảm nhận ngọn gió và tin vào đôi cánh của con nhé!".',
        illustrationUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_53',
        pageNumber: 3,
        text: 'Rồng con dang rộng cánh bay vút lên bầu trời xanh biếc, vẽ nên một dải cầu vồng tuyệt mỹ!',
        illustrationUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_06',
    creatorId: 'usr_seller_06',
    title: 'Nàng Tiên Cá Dưới Đại Dương Lung Linh',
    summary: 'Bài học ý nghĩa về giữ gìn biển xanh sạch đẹp và tình cảm bạn bè chân thành nơi đáy đại dương.',
    coverImageUrl: '/s3.jpg',
    targetAgeGroup: '5-8',
    theme: 'Bảo vệ môi trường & Tình bạn',
    pedagogicalTemplateId: 'tpl_04',
    pedagogicalTemplateTitle: 'Kiên Nhẫn Hoàn Thành Bức Tranh Ước Mơ',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 59000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 5.0,
    reviewsCount: 52,
    charactersUsed: [],
    pages: [
      {
        id: 'p_61',
        pageNumber: 1,
        text: 'Dưới rạn san hô lấp lánh bảy sắc cầu vồng, Nàng tiên cá nhỏ thích ca hát cùng bầy cá hề tung tăng.',
        illustrationUrl: '/s3.jpg',
        moderatorApproved: true,
      },
      {
        id: 'p_62',
        pageNumber: 2,
        text: 'Khi thấy rác trôi dạt vào rạn san hô, tiên cá đã cùng rùa biển già dọn dẹp sạch sẽ từng ngóc ngách.',
        illustrationUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_63',
        pageNumber: 3,
        text: 'Đại dương lại bừng sáng trong lành, các sinh vật biển cùng tổ chức một vũ hội lung linh dưới ánh trăng.',
        illustrationUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_07',
    creatorId: 'usr_seller_07',
    title: 'Chuyến Tàu Ru Ngủ Đi Tới Xứ Sở Giấc Mơ',
    summary: 'Câu chuyện ru ngủ êm ái đưa bé vào giấc ngủ ngon cùng những ngôi sao biết hát.',
    coverImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '2-5',
    theme: 'Truyện ru ngủ & Bình yên',
    pedagogicalTemplateId: 'tpl_07',
    pedagogicalTemplateTitle: 'Chuyến Tàu Ru Ngủ Đi Tới Xứ Sở Giấc Mơ',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 39000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 4.9,
    reviewsCount: 41,
    charactersUsed: [],
    pages: [
      {
        id: 'p_71',
        pageNumber: 1,
        text: 'Tiếng còi tàu xình xịch nhẹ nhàng vang lên, đón những bé ngoan vào khoang tàu lót đệm mây bồng bềnh.',
        illustrationUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_72',
        pageNumber: 2,
        text: 'Bác Trăng tròn chiếu ánh sáng vàng dịu dàng, khẽ thì thầm khúc ca chúc các bạn nhỏ ngủ ngon.',
        illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
  {
    id: 'st_08',
    creatorId: 'usr_parent_01',
    title: 'Bé Bo Tập Đi Xe Đạp Cùng Bố Tuấn',
    summary: 'Hành trình vượt qua cảm giác lo lắng khi tháo bánh phụ, rèn luyện tính kiên cường và lòng dũng cảm.',
    coverImageUrl: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '4-7',
    theme: 'Tự lập & Kiên cường',
    pedagogicalTemplateId: 'tpl_03',
    pedagogicalTemplateTitle: 'Dũng Cảm Nhận Lỗi Khi Làm Vỡ Đồ',
    status: 'PUBLISHED',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 49000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    ratingsAvg: 4.8,
    reviewsCount: 19,
    charactersUsed: [
      { characterId: 'char_01', realName: 'Bé Bo', placeholderTag: '[HERO_1]', role: 'HERO' },
      { characterId: 'char_02', realName: 'Bố Tuấn', placeholderTag: '[FATHER_1]', role: 'FATHER' },
    ],
    pages: [
      {
        id: 'p_81',
        pageNumber: 1,
        text: 'Chiều thứ bảy gió mát lành tại công viên, Bố Tuấn dắt chiếc xe đạp hai bánh màu xanh của Bé Bo ra bãi cỏ.',
        illustrationUrl: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_82',
        pageNumber: 2,
        text: 'Bố nhẹ nhàng giữ yên sau xe và nói: "Con hãy nhìn thẳng phía trước và đạp đều chân nhé, bố luôn ở ngay sau con!".',
        illustrationUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
      {
        id: 'p_83',
        pageNumber: 3,
        text: 'Bé Bo giữ thăng bằng tuyệt vời và reo vang sung sướng: "Bố ơi, con đã tự lái được xe đạp rồi!".',
        illustrationUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: true,
      },
    ],
  },
];

let moderationQueue: Story[] = [
  {
    id: 'st_mod_01',
    creatorId: 'usr_parent_01',
    title: 'Bé Bo Và Khu Vườn Cà Rốt Bí Mật',
    summary: 'Bé học cách chăm sóc cây cối và quý trọng công sức lao động của người nông dân.',
    coverImageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
    targetAgeGroup: '3-6',
    theme: 'Lòng biết ơn',
    status: 'PENDING_REVIEW',
    isAnonymized: true,
    priceCredits: 0,
    priceVnd: 39000,
    sellerCommissionRate: 0.7,
    platformCommissionRate: 0.3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    charactersUsed: [
      { characterId: 'char_01', realName: 'Bé Bo', placeholderTag: '[HERO_1]', role: 'HERO' },
      { characterId: 'char_03', realName: 'Mẹ Lan', placeholderTag: '[MOTHER_1]', role: 'MOTHER' },
    ],
    pages: [
      {
        id: 'mp_1',
        pageNumber: 1,
        text: 'Sáng chủ nhật râm mát, Bé Bo cùng Mẹ Lan xách bình tưới nước màu vàng ra góc vườn nhỏ sau nhà.',
        illustrationUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: false,
      },
      {
        id: 'mp_2',
        pageNumber: 2,
        text: 'Từng giọt nước trong veo đọng trên kẽ lá xanh mướt. Một chú sâu nhỏ đang bò chầm chậm tìm lá non.',
        illustrationUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: false,
      },
      {
        id: 'mp_3',
        pageNumber: 3,
        text: 'Bé Bo nhẹ nhàng nhấc chú sâu ra bờ cỏ và mỉm cười: "Chúc bạn tìm được bữa ăn ngon mà không làm hỏng cà rốt nhé!".',
        illustrationUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&auto=format&fit=crop&q=80',
        moderatorApproved: false,
      },
    ],
  },
];

let walletTransactions: WalletTransaction[] = [
  {
    id: 'tx_01',
    userId: 'usr_parent_01',
    type: 'CREDIT_PURCHASE',
    amount: 100,
    currency: 'CREDIT',
    status: 'COMPLETED',
    description: 'Nạp gói 100 💎 qua PayOS',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'tx_02',
    userId: 'usr_parent_01',
    type: 'STORY_SALE',
    amount: 34300, // 70% of 49k
    currency: 'VND',
    status: 'COMPLETED',
    description: 'Doanh thu bán truyện "Chuyến Phiêu Lưu Đến Xứ Sở Ánh Sao" (Chia 70%)',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    availableAfterDate: new Date(Date.now() - 1 * 86400000).toISOString(), // Expired 7 days -> already released!
  },
  {
    id: 'tx_03',
    userId: 'usr_parent_01',
    type: 'STORY_SALE',
    amount: 34300,
    currency: 'VND',
    status: 'PENDING',
    description: 'Doanh thu bán truyện mới (Treo 7 ngày bảo chứng khiếu nại)',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    availableAfterDate: new Date(Date.now() + 5 * 86400000).toISOString(), // Còn 5 ngày nữa
  },
];

let withdrawalRequests: any[] = [
  {
    id: 'wdr_01',
    userId: 'usr_parent_01',
    userName: 'Mẹ Lan Phương',
    amountVnd: 300000,
    bankName: 'Vietcombank',
    bankAccount: '0071001234567',
    accountHolder: 'TRAN LAN PHUONG',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let auditLogs: any[] = [
  {
    id: 'aud_01',
    action: 'PUBLISH_STORY',
    targetEntity: 'Story:st_01',
    actor: 'Kiểm duyệt viên Hoàng Bách',
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
    details: 'Đã duyệt 100% (5/5 trang) đạt chuẩn an toàn thiếu nhi.',
  },
  {
    id: 'aud_02',
    action: 'REDACT_PII',
    targetEntity: 'StoryGeneration:st_01',
    actor: 'System Redaction Service',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
    details: 'Đã che 3 tên thật gia đình thành [HERO_1], [FATHER_1], [PET_1] trước khi gửi Gemini.',
  },
];

let playSessions: any[] = [
  {
    id: 'ps_01',
    childId: 'ch_01',
    storyId: 'st_01',
    eqSignal: 'INDEPENDENCE',
    skillDescription: 'Bé Bo tự giác leo lên giường ngủ sau khi đọc truyện.',
    verifiedByParent: true,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'ps_02',
    childId: 'ch_01',
    storyId: 'st_01',
    eqSignal: 'EMPATHY',
    skillDescription: 'Bé chia sẻ đồ chơi khủng long cho em họ.',
    verifiedByParent: true,
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'ps_03',
    childId: 'ch_01',
    storyId: 'st_02',
    eqSignal: 'PATIENCE',
    skillDescription: 'Bé kiên nhẫn xếp 30 mảnh ghép hình ô tô.',
    verifiedByParent: true,
    timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ==========================================
// REST API ENDPOINTS
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// 1. AUTH & PROFILES
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // Demo login: allow any email or default
  currentUser.email = email || currentUser.email;
  res.json({
    token: 'jwt_mock_token_storyweaver',
    user: currentUser,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { fullName, email, password } = req.body;
  currentUser = {
    ...currentUser,
    fullName: fullName || currentUser.fullName,
    email: email || currentUser.email,
  };
  res.json({
    token: 'jwt_mock_token_registered',
    user: currentUser,
  });
});

app.post('/api/auth/google', (req: Request, res: Response) => {
  currentUser.fullName = 'Phụ Huynh Google';
  currentUser.email = 'google.parent@gmail.com';
  res.json({
    token: 'jwt_google_auth_token',
    user: currentUser,
  });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  res.json({
    success: true,
    message: `Đã gửi liên kết khôi phục mật khẩu tới ${email}. Vui lòng kiểm tra hộp thư!`,
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json(currentUser);
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const { fullName, phone, avatarUrl, bankAccount, role } = req.body;
  currentUser = {
    ...currentUser,
    ...(fullName && { fullName }),
    ...(phone && { phone }),
    ...(avatarUrl && { avatarUrl }),
    ...(bankAccount && { bankAccount }),
    ...(role && { role }),
  };
  res.json(currentUser);
});

app.put('/api/auth/kid-pin', (req: Request, res: Response) => {
  const { newPin } = req.body;
  if (!newPin || newPin.length !== 4) {
    return res.status(400).json({ error: 'Mã PIN Kid Mode phải có đúng 4 chữ số' });
  }
  currentUser.kidModePinHash = newPin; // Demo plain hash
  res.json({ success: true, message: 'Cập nhật mã PIN Kid Mode thành công!' });
});

// 2. CHILD PROFILES
app.get('/api/children', (req: Request, res: Response) => {
  res.json(childrenProfiles);
});

app.post('/api/children', (req: Request, res: Response) => {
  const newChild: ChildProfile = {
    id: `ch_${Date.now()}`,
    parentId: currentUser.id,
    name: req.body.name || 'Bé Yêu',
    nickname: req.body.nickname || '',
    gender: req.body.gender || 'MALE',
    birthDate: req.body.birthDate || '2021-01-01',
    age: Number(req.body.age) || 4,
    readingLevel: req.body.readingLevel || 'BEGINNER',
    interests: req.body.interests || [],
    avatarUrl: req.body.avatarUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80',
    favoriteTopics: req.body.favoriteTopics || ['Lòng dũng cảm'],
  };
  childrenProfiles.push(newChild);
  res.json(newChild);
});

app.put('/api/children/:id', (req: Request, res: Response) => {
  const childIndex = childrenProfiles.findIndex((c) => c.id === req.params.id);
  if (childIndex !== -1) {
    childrenProfiles[childIndex] = { ...childrenProfiles[childIndex], ...req.body };
    return res.json(childrenProfiles[childIndex]);
  }
  res.status(404).json({ error: 'Không tìm thấy hồ sơ bé' });
});

// 3. FAMILY CHARACTERS
app.get('/api/characters', (req: Request, res: Response) => {
  res.json(familyCharacters);
});

app.post('/api/characters', (req: Request, res: Response) => {
  const newChar: FamilyCharacter = {
    id: `char_${Date.now()}`,
    parentId: currentUser.id,
    name: req.body.name,
    relationRole: req.body.relationRole || 'HERO',
    appearanceDescription: req.body.appearanceDescription || '',
    personalityTraits: req.body.personalityTraits || [],
    avatarPlaceholder: req.body.avatarPlaceholder || '⭐',
  };
  familyCharacters.push(newChar);
  res.json(newChar);
});

app.delete('/api/characters/:id', (req: Request, res: Response) => {
  familyCharacters = familyCharacters.filter((c) => c.id !== req.params.id);
  res.json({ success: true });
});

// 4. TEMPLATES
app.get('/api/templates', (req: Request, res: Response) => {
  res.json(pedagogicalTemplates);
});

// 5. AI STORY GENERATION PIPELINE (WITH PII REDACTION)
app.post('/api/stories/ai-generate', async (req: Request, res: Response) => {
  const { userPrompt, templateId, characterIds } = req.body;

  // 1. Kiểm tra số dư credit 💎
  const creditCost = 3;
  if (currentUser.creditBalance < creditCost) {
    return res.status(400).json({
      error: `Số dư 💎 không đủ. Cần ${creditCost} 💎 để tạo truyện AI. Vui lòng nạp thêm!`,
    });
  }

  // 2. Tìm template và nhân vật
  const template = pedagogicalTemplates.find((t) => t.id === templateId) || pedagogicalTemplates[0];
  const selectedChars = familyCharacters.filter((c) => characterIds?.includes(c.id));
  const charsToUse = selectedChars.length > 0 ? selectedChars : [familyCharacters[0], familyCharacters[1]];

  // 3. BƯỚC QUAN TRỌNG: CHE TÊN THẬT (REDACTION)
  const mappings = redactionService.generateMappings(charsToUse);

  // Ghi nhật ký kiểm toán che tên
  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    action: 'REDACT_PII',
    targetEntity: 'PromptGeneration',
    actor: currentUser.fullName,
    timestamp: new Date().toISOString(),
    details: `Đã mã hoá ${mappings.length} nhân vật gia đình thành placeholder: ${mappings.map((m) => m.placeholder).join(', ')}`,
  });

  try {
    // 4. Gọi Gemini API với nội dung đã được che tên
    const aiResult = await geminiStoryService.generateStoryContent({
      prompt: userPrompt || '',
      template,
      characterMappings: mappings,
      characterTraits: charsToUse.map((c) => `${c.appearanceDescription}. ${c.personalityTraits.join(', ')}`),
      pagesCount: template.suggestedPagesCount,
    });

    // 5. KHÔI PHỤC TÊN THẬT (RESTORE) để phụ huynh xem
    const restoredTitle = redactionService.restoreRealNames(aiResult.title, mappings);
    const restoredPages: StoryPage[] = aiResult.redactedPages.map((rp, idx) => ({
      id: `pg_${Date.now()}_${idx}`,
      pageNumber: rp.pageNumber,
      text: redactionService.restoreRealNames(rp.text, mappings),
      redactedText: rp.text, // Giữ bản đã che tên để dùng khi publish ra ngoài
      illustrationUrl: [
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
      ][idx % 5],
      illustrationPrompt: rp.illustrationPrompt,
      audioNarrationUrl: '', // Sẽ phát bằng Web Speech Synthesis / TTS
      moderatorApproved: false,
      choices: rp.choiceLabel
        ? [
            {
              id: `choice_${idx}`,
              label: redactionService.restoreRealNames(rp.choiceLabel, mappings),
              targetNextPageNumber: rp.pageNumber + 1,
              eqSignal: rp.eqSignal,
            },
          ]
        : undefined,
    }));

    // 6. Trừ credit 💎 của người dùng
    currentUser.creditBalance -= creditCost;

    // 7. Tạo bản ghi Story draft mới
    const newStory: Story = {
      id: `st_${Date.now()}`,
      creatorId: currentUser.id,
      title: restoredTitle,
      summary: aiResult.summary,
      coverImageUrl: restoredPages[0]?.illustrationUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      targetAgeGroup: template.targetAgeGroup,
      theme: template.title,
      pedagogicalTemplateId: template.id,
      pedagogicalTemplateTitle: template.title,
      status: 'DRAFT',
      isAnonymized: false,
      priceCredits: 0,
      priceVnd: 45000,
      sellerCommissionRate: 0.7,
      platformCommissionRate: 0.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      charactersUsed: charsToUse.map((c, i) => ({
        characterId: c.id,
        realName: c.name,
        placeholderTag: mappings[i]?.placeholder || `[CHAR_${i}]`,
        role: c.relationRole,
      })),
      pages: restoredPages,
    };

    stories.unshift(newStory);

    res.json({
      success: true,
      story: newStory,
      remainingCredits: currentUser.creditBalance,
      redactionMappings: mappings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi khi tạo truyện AI' });
  }
});

// 6. STORIES CRUD & SUBMISSION
app.get('/api/stories', (req: Request, res: Response) => {
  res.json(stories);
});

app.get('/api/stories/:id', (req: Request, res: Response) => {
  const story = stories.find((s) => s.id === req.params.id) || moderationQueue.find((s) => s.id === req.params.id);
  if (story) return res.json(story);
  res.status(404).json({ error: 'Không tìm thấy truyện' });
});

app.put('/api/stories/:id', (req: Request, res: Response) => {
  const idx = stories.findIndex((s) => s.id === req.params.id);
  if (idx !== -1) {
    stories[idx] = { ...stories[idx], ...req.body, updatedAt: new Date().toISOString() };
    return res.json(stories[idx]);
  }
  res.status(404).json({ error: 'Không tìm thấy truyện' });
});

// Gửi truyện đi kiểm duyệt để đăng bán chợ (TỰ ĐỘNG GỠ CÁ NHÂN HOÁ - ANONYMIZE)
app.post('/api/stories/:id/submit-review', (req: Request, res: Response) => {
  const idx = stories.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy truyện' });

  const story = stories[idx];

  // Tự động gỡ cá nhân hoá: Biến đổi các trang truyện thành tên cổ tích đại chúng
  const anonymizedPages = story.pages.map((p) => {
    let cleanText = p.text;
    story.charactersUsed.forEach((c) => {
      cleanText = cleanText.replace(new RegExp(c.realName, 'g'), 'Bé Thỏ Con');
    });
    return {
      ...p,
      text: cleanText,
      moderatorApproved: false,
    };
  });

  const submittedStory: Story = {
    ...story,
    status: 'PENDING_REVIEW',
    isAnonymized: true,
    pages: anonymizedPages,
    updatedAt: new Date().toISOString(),
  };

  stories[idx] = submittedStory;

  // Đưa vào hàng đợi kiểm duyệt
  moderationQueue.unshift(submittedStory);

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    action: 'SUBMIT_FOR_REVIEW',
    targetEntity: `Story:${story.id}`,
    actor: currentUser.fullName,
    timestamp: new Date().toISOString(),
    details: 'Đã tự động gỡ thông tin cá nhân hoá và gửi vào hàng đợi kiểm duyệt.',
  });

  res.json({
    success: true,
    message: 'Truyện đã được gỡ tên thật và chuyển vào hàng đợi kiểm duyệt!',
    story: submittedStory,
  });
});

// 7. MODERATION QUEUE & 100% CHECKLIST APPROVAL
app.get('/api/moderation/queue', (req: Request, res: Response) => {
  res.json(moderationQueue);
});

app.post('/api/moderation/:id/review', (req: Request, res: Response) => {
  const { decision, pageReviews, rejectionReason } = req.body;
  const queueIdx = moderationQueue.findIndex((s) => s.id === req.params.id);
  if (queueIdx === -1) return res.status(404).json({ error: 'Truyện không nằm trong hàng đợi duyệt' });

  const targetStory = moderationQueue[queueIdx];

  if (decision === 'REJECT') {
    targetStory.status = 'REJECTED';
    moderationQueue.splice(queueIdx, 1);
    // Cập nhật lại trong danh sách stories
    const sIdx = stories.findIndex((s) => s.id === targetStory.id);
    if (sIdx !== -1) stories[sIdx].status = 'REJECTED';

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'REJECT_STORY',
      targetEntity: `Story:${targetStory.id}`,
      actor: 'Kiểm duyệt viên',
      timestamp: new Date().toISOString(),
      details: `Từ chối xuất bản: ${rejectionReason || 'Nội dung chưa đạt tiêu chuẩn thiếu nhi'}`,
    });

    return res.json({ success: true, status: 'REJECTED', story: targetStory });
  }

  // Quyết định APPROVE: BẮT BUỘC DUYỆT ĐỦ 100% SỐ TRANG
  const validation = moderationService.validateFullPublishEligibility(targetStory, { pageReviews });

  if (!validation.canPublish) {
    return res.status(400).json({
      error: validation.reason,
      approvedCount: validation.approvedCount,
      totalCount: validation.totalCount,
    });
  }

  // Đạt 100% trang: Chuyển trạng thái PUBLISHED
  targetStory.status = 'PUBLISHED';
  targetStory.publishedAt = new Date().toISOString();
  targetStory.pages.forEach((p) => {
    p.moderatorApproved = true;
  });

  moderationQueue.splice(queueIdx, 1);
  const sIdx = stories.findIndex((s) => s.id === targetStory.id);
  if (sIdx !== -1) stories[sIdx] = targetStory;

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    action: 'PUBLISH_STORY',
    targetEntity: `Story:${targetStory.id}`,
    actor: 'Kiểm duyệt viên',
    timestamp: new Date().toISOString(),
    details: `Đã kiểm duyệt hoàn tất 100% (${validation.totalCount}/${validation.totalCount} trang) và xuất bản lên chợ truyện.`,
  });

  res.json({
    success: true,
    status: 'PUBLISHED',
    message: `Đã duyệt đủ 100% (${validation.totalCount} trang)! Truyện đã xuất bản thành công lên chợ.`,
    story: targetStory,
  });
});

// 8. MARKETPLACE & PAYOS PAYMENT WITH IDEMPOTENCY
app.get('/api/marketplace', (req: Request, res: Response) => {
  const publishedStories = stories.filter((s) => s.status === 'PUBLISHED');
  res.json(publishedStories);
});

// Tạo đơn hàng mua truyện & link PayOS
app.post('/api/orders/checkout', (req: Request, res: Response) => {
  const { storyId, voucherCode } = req.body;
  const story = stories.find((s) => s.id === storyId);
  if (!story) return res.status(404).json({ error: 'Không tìm thấy truyện' });

  let finalAmount = story.priceVnd;
  let discount = 0;
  if (voucherCode === 'STORYWEAVER10') {
    discount = Math.round(finalAmount * 0.1);
    finalAmount -= discount;
  }

  const orderCode = Math.floor(100000 + Math.random() * 900000);
  const payOsPayment = payOsService.createPaymentLink({
    orderCode,
    amount: finalAmount,
    description: `Mua truyen: ${story.title.substring(0, 20)}`,
    buyerName: currentUser.fullName,
    buyerEmail: currentUser.email,
  });

  res.json({
    orderCode,
    story,
    originalAmount: story.priceVnd,
    discount,
    finalAmount,
    paymentLink: payOsPayment.checkoutUrl,
    qrCodeUrl: payOsPayment.qrCode,
  });
});

// Xử lý Webhook PayOS (với Idempotency key bảo vệ tránh cộng credit/tiền trùng)
app.post('/api/orders/webhook/payos', (req: Request, res: Response) => {
  const payload: PayOsWebhookPayload = req.body;
  const idempotencyKey = req.headers['x-idempotency-key'] as string || `payos_key_${payload.orderCode}`;

  const result = payOsService.processWebhook(payload, idempotencyKey);

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  if (result.alreadyProcessed) {
    return res.json({ status: 'ALREADY_PROCESSED', message: result.message });
  }

  // 1. Phân chia 70% người bán, 30% nền tảng
  // Treo 7 ngày trong sellerPendingBalance
  currentUser.sellerPendingBalance += (result.sellerEarnings || 0);

  // 2. Ghi sổ cái ví
  walletTransactions.unshift({
    id: `tx_${Date.now()}`,
    userId: currentUser.id,
    type: 'STORY_SALE',
    amount: result.sellerEarnings || 0,
    currency: 'VND',
    status: 'PENDING',
    description: `Doanh thu đơn hàng #${payload.orderCode} (Treo 7 ngày đến ${new Date(result.escrowReleaseDate || '').toLocaleDateString('vi-VN')})`,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    availableAfterDate: result.escrowReleaseDate,
  });

  auditLogs.unshift({
    id: `aud_${Date.now()}`,
    action: 'PAYOS_WEBHOOK_PROCESSED',
    targetEntity: `Order:#${payload.orderCode}`,
    actor: 'PayOS Webhook Service',
    timestamp: new Date().toISOString(),
    details: `Thanh toán thành công ${payload.amount.toLocaleString()}đ. Doanh thu Seller (+70%): ${(result.sellerEarnings || 0).toLocaleString()}đ (Treo 7 ngày). Phí nền tảng (+30%): ${(result.platformFee || 0).toLocaleString()}đ.`,
  });

  res.json({
    status: 'SUCCESS',
    sellerEarnings: result.sellerEarnings,
    platformFee: result.platformFee,
    escrowReleaseDate: result.escrowReleaseDate,
  });
});

// 9. WALLET & 7-DAY ESCROW CRON
app.get('/api/wallet/summary', (req: Request, res: Response) => {
  res.json({
    creditBalance: currentUser.creditBalance,
    sellerPendingBalance: currentUser.sellerPendingBalance,
    sellerAvailableBalance: currentUser.sellerAvailableBalance,
    bankAccount: currentUser.bankAccount,
    transactions: walletTransactions,
    withdrawalRequests,
  });
});

// Nạp thêm credit 💎
app.post('/api/wallet/topup-credits', (req: Request, res: Response) => {
  const { amountCredits, amountVnd } = req.body;
  const creditsToAdd = Number(amountCredits) || 50;
  currentUser.creditBalance += creditsToAdd;

  walletTransactions.unshift({
    id: `tx_${Date.now()}`,
    userId: currentUser.id,
    type: 'CREDIT_PURCHASE',
    amount: creditsToAdd,
    currency: 'CREDIT',
    status: 'COMPLETED',
    description: `Nạp thành công +${creditsToAdd} 💎 (thanh toán ${(amountVnd || 50000).toLocaleString()}đ)`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    creditBalance: currentUser.creditBalance,
    message: `Đã nạp thành công ${creditsToAdd} 💎 vào ví!`,
  });
});

// Yêu cầu rút tiền
app.post('/api/wallet/request-withdrawal', (req: Request, res: Response) => {
  const { amountVnd, bankName, bankAccount, accountHolder } = req.body;
  const withdrawAmount = Number(amountVnd);

  if (withdrawAmount <= 0) {
    return res.status(400).json({ error: 'Số tiền rút không hợp lệ' });
  }

  if (withdrawAmount > currentUser.sellerAvailableBalance) {
    return res.status(400).json({
      error: `Số dư khả dụng không đủ. Bạn chỉ có ${currentUser.sellerAvailableBalance.toLocaleString()}đ có thể rút.`,
    });
  }

  currentUser.sellerAvailableBalance -= withdrawAmount;

  const newRequest = {
    id: `wdr_${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.fullName,
    amountVnd: withdrawAmount,
    bankName: bankName || currentUser.bankAccount?.bankName || 'Vietcombank',
    bankAccount: bankAccount || currentUser.bankAccount?.accountNumber || '0071001234567',
    accountHolder: accountHolder || currentUser.bankAccount?.accountHolder || currentUser.fullName,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  withdrawalRequests.unshift(newRequest);

  walletTransactions.unshift({
    id: `tx_${Date.now()}`,
    userId: currentUser.id,
    type: 'WITHDRAWAL',
    amount: withdrawAmount,
    currency: 'VND',
    status: 'PENDING',
    description: `Yêu cầu rút ${withdrawAmount.toLocaleString()}đ về tài khoản ngân hàng ${newRequest.bankName}`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Đã gửi yêu cầu rút tiền. Admin sẽ kiểm duyệt và chuyển khoản trong 24h.',
    remainingBalance: currentUser.sellerAvailableBalance,
    request: newRequest,
  });
});

// Kích hoạt Cron job giải toả doanh thu 7 ngày (Simulate BullMQ)
app.post('/api/wallet/run-escrow-cron', (req: Request, res: Response) => {
  // Tìm các giao dịch pending đã đủ 7 ngày
  let releasedAmount = 0;
  let count = 0;

  walletTransactions.forEach((tx) => {
    if (tx.type === 'STORY_SALE' && tx.status === 'PENDING') {
      // Cho phép giải toả trong môi trường demo
      tx.status = 'COMPLETED';
      tx.description = tx.description.replace('(Treo 7 ngày', '(Đã giải toả');
      releasedAmount += tx.amount;
      count++;
    }
  });

  if (releasedAmount > 0) {
    currentUser.sellerPendingBalance = Math.max(0, currentUser.sellerPendingBalance - releasedAmount);
    currentUser.sellerAvailableBalance += releasedAmount;

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'ESCROW_CRON_EXECUTED',
      targetEntity: `Wallet:${currentUser.id}`,
      actor: 'BullMQ Scheduled Cron',
      timestamp: new Date().toISOString(),
      details: `Đã tự động chuyển ${releasedAmount.toLocaleString()}đ từ số dư treo sang số dư khả dụng (Đã qua thời hạn bảo chứng 7 ngày).`,
    });
  }

  res.json({
    success: true,
    releasedCount: count,
    releasedAmount,
    sellerPendingBalance: currentUser.sellerPendingBalance,
    sellerAvailableBalance: currentUser.sellerAvailableBalance,
    message: count > 0
      ? `Cron job đã chuyển thành công ${releasedAmount.toLocaleString()}đ từ số dư treo sang khả dụng!`
      : 'Hiện chưa có khoản doanh thu treo nào đủ điều kiện hoặc đã được giải toả hết.',
  });
});

// 10. EQ REPORT & LEARNING SIGNALS
app.get('/api/eq/report/:childId', (req: Request, res: Response) => {
  const child = childrenProfiles.find((c) => c.id === req.params.childId) || childrenProfiles[0];
  const signals = playSessions.filter((s) => s.childId === child.id);

  const radarScores = eqService.calculateRadarScores(
    signals.map((s) => ({ eqSignal: s.eqSignal, verified: s.verifiedByParent }))
  );

  const report: EqReport = {
    childId: child.id,
    childName: child.name,
    period: 'Tháng này',
    totalStoriesRead: signals.length + 3,
    totalListeningMinutes: 48,
    radarScores,
    skillSignals: signals.map((s) => ({
      id: s.id,
      skill: s.skillDescription,
      storyTitle: 'Chuyến Phiêu Lưu Đến Xứ Sở Ánh Sao',
      verifiedByParent: s.verifiedByParent,
      timestamp: s.timestamp,
    })),
  };

  res.json(report);
});

app.post('/api/eq/record-signal', (req: Request, res: Response) => {
  const { childId, storyId, eqSignal, skillDescription, verifiedByParent } = req.body;
  const newSignal = {
    id: `ps_${Date.now()}`,
    childId: childId || childrenProfiles[0].id,
    storyId: storyId || stories[0].id,
    eqSignal: eqSignal || 'EMPATHY',
    skillDescription: skillDescription || 'Bé thể hiện sự đồng cảm sau khi nghe câu chuyện.',
    verifiedByParent: verifiedByParent ?? true,
    timestamp: new Date().toISOString(),
  };

  playSessions.unshift(newSignal);

  res.json({
    success: true,
    signal: newSignal,
  });
});

// 11. ADMIN & PLATFORM MONITORING
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json(auditLogs);
});

app.get('/api/admin/withdrawals', (req: Request, res: Response) => {
  res.json(withdrawalRequests);
});

app.post('/api/admin/withdrawals/:id/approve', (req: Request, res: Response) => {
  const reqIdx = withdrawalRequests.findIndex((r) => r.id === req.params.id);
  if (reqIdx !== -1) {
    withdrawalRequests[reqIdx].status = 'APPROVED';

    auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'APPROVE_WITHDRAWAL',
      targetEntity: `Withdrawal:${req.params.id}`,
      actor: 'Admin',
      timestamp: new Date().toISOString(),
      details: `Đã phê duyệt lệnh rút tiền ${withdrawalRequests[reqIdx].amountVnd.toLocaleString()}đ của ${withdrawalRequests[reqIdx].userName}.`,
    });

    return res.json({ success: true, request: withdrawalRequests[reqIdx] });
  }
  res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
});

// ==========================================
// VITE INTEGRATION IN DEV & SERVE STATIC IN PROD
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`StoryWeaver full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
