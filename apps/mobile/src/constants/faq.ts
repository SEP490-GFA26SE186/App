// apps/mobile/src/constants/faq.ts
// Câu hỏi thường gặp – nội dung tĩnh lấy từ Web/src/constants/landingContent.js (FAQS).
export const FAQS: { q: string; a: string }[] = [
  {
    q: 'Bé chưa biết chữ có dùng được không?',
    a: 'Được. Truyện có giọng đọc kể truyện tiếng Việt; câu hỏi và các lựa chọn cũng được đọc to, bé chỉ cần chạm để trả lời. Truyện ba mẹ tắt giọng đọc sẽ hiện nhãn “Chỉ có chữ”.',
  },
  {
    q: 'AI có biết tên thật của con tôi không?',
    a: 'Không. Trước khi gửi cho AI, tên của bé và người thân được thay bằng mã như {NV1}. Tên thật chỉ ghép lại khi hiển thị cho gia đình và khi đọc giọng.',
  },
  {
    q: 'Ai kiểm tra nội dung trước khi bé đọc?',
    a: 'Truyện của gia đình: ba mẹ đọc lại và bấm hoàn tất. Truyện mua trên Chợ: kiểm duyệt viên đọc 100% số trang theo checklist sư phạm. Phụ huynh có thể báo cáo truyện không phù hợp; đủ nhiều báo cáo, truyện tự tạm gỡ chờ xem lại.',
  },
  {
    q: 'Credit là gì, có mất phí không?',
    a: 'Credit dùng cho các lần AI viết truyện. Gói Miễn phí cấp credit mỗi tháng; gói Gia đình cấp nhiều hơn và mở tính năng bán truyện. Truyện tự viết không tốn credit.',
  },
  {
    q: 'Điểm EQ của con được tính thế nào?',
    a: 'Từ câu trả lời ở lượt đọc đầu tiên của mỗi truyện, theo năng lực CASEL của bài học. Mỗi năng lực cần ít nhất 5 câu trả lời mới hiện điểm, để tránh kết luận vội.',
  },
];
