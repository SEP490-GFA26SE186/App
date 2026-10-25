// apps/mobile/src/services/demoData.ts
// Demo data matching seed_demo.js for offline fallback / demo testing
import {
  UserAccount,
  ChildProfile,
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
} from '../../../../packages/shared-types';

export const DEMO_PARENT_USER: UserAccount = {
  id: 'usr_demo_parent_01',
  email: 'me.lanhuong@storyweaver.vn',
  fullName: 'Mẹ Lan Hương',
  phone: '0901234567',
  role: 'PARENT',
  kidModePinHash: '1234',
  creditBalance: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
};

export const DEMO_CHILDREN: ChildProfile[] = [
  {
    id: 'ch_demo_bin',
    parentId: 'usr_demo_parent_01',
    name: 'Bé Bin',
    nickname: 'Bin',
    age: 6,
    gender: 'MALE',
    birthDate: '2020-05-01',
    readingLevel: 'BEGINNER',
    favoriteThemes: ['Động vật', 'Vũ trụ', 'Gia đình'],
    favoriteTopics: ['Chia sẻ đồ chơi', 'Tự giác ngủ đúng giờ'],
  },
];

export const DEMO_CHARACTERS: FamilyCharacter[] = [
  {
    id: 'char_demo_bin',
    parentId: 'usr_demo_parent_01',
    name: 'Bé Bin',
    relationRole: 'HERO',
    appearanceDescription: 'Bé trai 6 tuổi, tóc ngắn đen, áo thun xanh lá cây năng động.',
    personalityTraits: ['Tò mò', 'Tốt bụng', 'Hay cười'],
  },
  {
    id: 'char_demo_ba',
    parentId: 'usr_demo_parent_01',
    name: 'Bà',
    relationRole: 'GRANDMOTHER',
    appearanceDescription: 'Bà nội tóc bạc búi gọn, đeo kính lão, mặc áo bà ba nâu hiền từ.',
    personalityTraits: ['Ấm áp', 'Kể chuyện hay', 'Yêu thương cháu'],
  },
];

export const DEMO_TEMPLATES: PedagogicalTemplate[] = [
  {
    id: 'tpl_01',
    title: 'Học Cách Chia Sẻ Đồ Chơi',
    category: 'EMOTIONAL_INTELLIGENCE',
    targetAgeGroup: '3-6',
    targetAgeMin: 3,
    targetAgeMax: 6,
    eqGoals: ['Thấu cảm', 'Chia sẻ niềm vui'],
    icon: '🤝',
    description: 'Giúp bé nhận ra niềm vui nhân đôi khi cùng bạn bè chơi món đồ chơi yêu thích.',
  },
  {
    id: 'tpl_02',
    title: 'Dũng Cảm Đi Ngủ Đúng Giờ',
    category: 'DAILY_HABITS',
    targetAgeGroup: '3-6',
    targetAgeMin: 3,
    targetAgeMax: 7,
    eqGoals: ['Vượt qua sợ hãi bóng tối', 'Tự lập'],
    icon: '🌙',
    description: 'Hóa thân bé thành dũng sĩ tí hon tự tin ngủ ngon trong căn phòng phép thuật.',
  },
  {
    id: 'tpl_03',
    title: 'Biết Ơn Bữa Cơm Gia Đình',
    category: 'MORAL_VALUES',
    targetAgeGroup: '4-8',
    targetAgeMin: 4,
    targetAgeMax: 8,
    eqGoals: ['Trân trọng thực phẩm', 'Gắn kết gia đình'],
    icon: '🍚',
    description: 'Hành trình các hạt ngọc trời từ cánh đồng đến mâm cơm ấm áp của mẹ.',
  },
];

export const DEMO_STORIES: Story[] = [
  {
    id: 'story_demo_01',
    creatorId: 'usr_demo_parent_01',
    title: '[Demo] Bé Bin & Chiếc Ô Bảy Sắc Cầu Vồng',
    summary: 'Bé Bin học cách che ô cho chú chim sẻ nhỏ ướt cánh dưới cơn mưa rào mùa hạ.',
    coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    theme: 'Chia sẻ & Yêu thương',
    targetAgeGroup: '3-6',
    status: 'PUBLISHED',
    priceVnd: 0,
    priceCredits: 0,
    createdAt: new Date().toISOString(),
    pages: [
      {
        id: 'p_01',
        pageNumber: 1,
        text: 'Một buổi chiều mùa hạ, mây đen ùn ùn kéo đến, mang theo những giọt mưa rào rộn rã ngoài hiên. Bé Bin thích thú mở bung chiếc ô màu vàng óng.',
        illustrationUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
        choices: [
          {
            id: 'ch_1',
            label: 'Chạy ra đón hạt mưa mát lạnh',
            targetNextPageNumber: 2,
            eqSignal: 'EMPATHY',
          },
        ],
      },
      {
        id: 'p_02',
        pageNumber: 2,
        text: 'Dưới gốc cây bàng, một chú chim sẻ nhỏ đang co ro run rẩy vì ướt cánh. Bé Bin nhẹ nhàng tiến lại gần và nghiêng chiếc ô che cho bạn.',
        illustrationUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'p_03',
        pageNumber: 3,
        text: 'Cơn mưa tạnh dần, ánh cầu vồng bảy sắc rực rỡ hiện lên. Chú chim nhỏ cất tiếng hót líu lo như nói lời cảm ơn người bạn nhỏ tốt bụng.',
        illustrationUrl: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'story_demo_02',
    creatorId: 'usr_demo_parent_01',
    title: '[Demo] Bé Bin Tập Làm Hiệp Sĩ Giúp Bà',
    summary: 'Bé Bin ngoan ngoãn giúp Bà tìm chiếc kính lão bị rơi và nhận một cái ôm ấm áp.',
    coverImageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
    theme: 'Hiếu thảo & Giúp đỡ người thân',
    targetAgeGroup: '4-7',
    status: 'PUBLISHED',
    priceVnd: 0,
    priceCredits: 0,
    createdAt: new Date().toISOString(),
    pages: [
      {
        id: 'p_21',
        pageNumber: 1,
        text: 'Bà đang tìm kính lão để đọc sách thì thấy Bé Bin lon ton chạy lại: "Bà ơi, để cháu tìm giúp bà nhé!".',
        illustrationUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'p_22',
        pageNumber: 2,
        text: 'Bé Bin cúi xuống gầm bàn trà và phát hiện chiếc kính đang nằm êm đềm trên tấm thảm len. Bé cẩn thận nhặt lên đưa cho Bà bằng hai tay.',
        illustrationUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'p_23',
        pageNumber: 3,
        text: 'Bà mỉm cười xoa đầu Bé Bin: "Cháu ngoan của bà giỏi quá!". Trái tim Bé Bin ngập tràn niềm vui hạnh phúc.',
        illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
];
