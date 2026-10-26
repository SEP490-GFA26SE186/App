// apps/mobile/src/dev/demo/curatedStories.ts
// Fixture UI Preview (dữ liệu mẫu). KHÔNG được import vào màn hình thật hay luồng dữ liệu BE (ADR-016).
// Trước đây nằm trong ParentHomeScreen; giữ lại để phát triển UI ở Phase B, xóa ở D4 (cần duyệt).
export const CURATED_DEMO_STORIES = [
  {
    id: 'd1',
    title: 'Bé Gái Và Cây Đũa Thần Nở Hoa',
    cover: '/s1.jpg',
    pages: 6,
    theme: 'Lòng trắc ẩn',
    time: '5p',
    rating: '5.0',
    emoji: '🌸',
  },
  {
    id: 'd2',
    title: 'Chú Rồng Con Và Giấc Mơ Bay Cao',
    cover: '/s2.jpg',
    pages: 8,
    theme: 'Kiên trì',
    time: '6p',
    rating: '4.9',
    emoji: '🐉',
  },
  {
    id: 'd3',
    title: 'Nàng Tiên Cá Dưới Đại Dương',
    cover: '/s3.jpg',
    pages: 7,
    theme: 'Bảo vệ biển',
    time: '5p',
    rating: '5.0',
    emoji: '🧜‍♀️',
  },
  {
    id: 'd4',
    title: 'Lâu Đài Cát Của Hai Bạn Sóc',
    cover: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
    pages: 6,
    theme: 'Chia sẻ',
    time: '5p',
    rating: '5.0',
    emoji: '🐿️',
  },
];
