import * as fs from 'fs';
import * as path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  PageBreak,
  ShadingType,
  Header,
  Footer,
  PageNumber
} from 'docx';

async function generateDoc() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt
            color: '2D3748',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'THE SHINE FITNESS & YOGA CENTER — TÀI LIỆU HỆ THỐNG PROMPT',
                    size: 16,
                    color: '718096',
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Trang ',
                    size: 18,
                    color: '718096',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    bold: true,
                    color: 'D97706',
                  }),
                  new TextRun({
                    text: ' / ',
                    size: 18,
                    color: '718096',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '718096',
                  }),
                  new TextRun({
                    text: '  •  Hệ Thống Master Prompt Toàn Diện',
                    size: 16,
                    color: 'A0AEC0',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ==========================================
          // TRANG 1: MODULE 1 - LANDING PAGE MASTER PROMPT
          // ==========================================
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'TỔNG HỢP TOÀN BỘ MASTER PROMPT & KIẾN TRÚC HỆ THỐNG',
                bold: true,
                size: 28,
                color: 'B45309',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [
              new TextRun({
                text: 'Dự Án: The Shine Fitness & Yoga Center  |  Đơn vị triển khai: AI Studio Tech Engine',
                italics: true,
                size: 18,
                color: '4B5563',
              }),
            ],
          }),

          // Box Title Trang 1
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: '1E293B' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: '📄 TRANG 1: MODULE 1 – MASTER PROMPT & KIẾN TRÚC LANDING PAGE HI-TECH',
                            bold: true,
                            size: 22,
                            color: 'FBBF24',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '1. Mục Tiêu Thiết Kế & Định Vị Thương Hiệu (Design System & Branding)',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Phong cách cốt lõi: ',
                bold: true,
              }),
              new TextRun({
                text: 'Giao diện Dark Mode sang trọng, đẳng cấp chuẩn 5 sao Luxury Fitness. Điểm nhấn là màu Vàng Gold (#D97706 / #F59E0B) kết hợp Đen Onyx (#0B0F19, #111827) và hiệu ứng Glassmorphism hiện đại.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Trải nghiệm người dùng: ',
                bold: true,
              }),
              new TextRun({
                text: 'Tương tác mượt mà với Micro-animations, sơ đồ mặt bằng 3D Interactive Floor Plan (Tầng 1 Gym & Cardio, Tầng 2 Yoga & Pilates & Boxing, Tầng 3 Sauna & Relax Pool).',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Bộ công cụ tính toán tích hợp: ',
                bold: true,
              }),
              new TextRun({
                text: 'Công cụ tính BMR/TDEE & Macro cá nhân hóa, Bộ chuyển đổi gói tập & bảng so sánh quyền lợi hội viên trực quan, Đăng ký trải nghiệm 3 ngày miễn phí nhận ngay mã QR voucher.',
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '2. Master Prompt Khởi Tạo Giao Diện Landing Page (Code Prompt)',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 24, color: 'D97706' },
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          new TextRun({
                            text: 'PROMPT TRIỂN KHAI LANDING PAGE (SAAS & HIGH CONVERSION FITNESS APP):\n\n' +
                              '"Hãy xây dựng một trang Landing Page thể hình cao cấp "The Shine Fitness & Yoga Center" với tiêu chuẩn giao diện thế hệ mới:\n' +
                              '1. Hero Section: Headline bùng nổ "Khơi Dậy Năng Lượng - Định Hình Bản Lĩnh", CTA Đăng Ký Tập Thử 3 Ngày Nhận QR Code, video background và chỉ số tăng trưởng (5000+ Hội viên, 98% Hài lòng, 15+ Master Trainer).\n' +
                              '2. Sơ đồ tương tác 3D cơ sở vật chất (3D Multi-Floor Navigator): Mô phỏng 3 tầng tập luyện với các khu vực máy tập Hammer Strength, khu Yoga ngắm hoàng hôn, quầy Bar dinh dưỡng và phòng xông hơi muối Himalaya.\n' +
                              '3. Bảng giá & Qói tập thông minh: Bộ lọc gói 1 tháng, 6 tháng, 12 tháng (Silver, Gold, Diamond VIP) với tính năng chuyển đổi tỷ giá và cam kết hoàn tiền 100%.\n' +
                              '4. Bộ tính TDEE / Thể trạng thời gian thực: Cho phép hội viên nhập Tuổi, Chiều cao, Cân nặng, Cường độ tập -> Trả về lượng Calo mục tiêu và gợi ý thực đơn mẫu.\n' +
                              '5. Tích hợp form đặt lịch & Gửi Email xác nhận tự động qua SMTP/Gmail với giao diện voucher sang trọng kèm mã vạch / QR check-in."',
                            size: 19,
                            color: '334155',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 160, after: 100 },
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3. Bộ Thành Phần Cấu Trúc (Landing Page Components Architecture)',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tên Component', bold: true, size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Chức Năng & Điểm Nổi Bật', bold: true, size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'HeroSection.tsx', bold: true, color: 'D97706' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Hiệu ứng gradient gold glow, countdown ưu đãi, badge xếp hạng phòng tập, video teaser.' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'FloorPlan3D.tsx', bold: true, color: 'D97706' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Chuyển đổi 3 tầng trực quan với hình ảnh thực tế, định vị thiết bị tập & tiện ích hồi phục.' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'TdeeCalculator.tsx', bold: true, color: 'D97706' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Tính toán chỉ số năng lượng tiêu hao chuẩn Mifflin-St Jeor và phân bổ Đạm / Tinh bột / Chất béo.' })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'TrialBookingModal.tsx', bold: true, color: 'D97706' })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Form đăng ký chọn khung giờ và mục tiêu cá nhân, sinh mã QR voucher và gửi email xác nhận.' })],
                  }),
                ],
              }),
            ],
          }),

          // NGẮT TRANG SANG TRANG 2
          new Paragraph({
            children: [new PageBreak()],
          }),

          // ==========================================
          // TRANG 2: MODULE 2 - AI CHATBOT CSKH NÂNG CẤP
          // ==========================================
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: '1E293B' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: '💬 TRANG 2: MODULE 2 – AI CHATBOT CSKH & TƯ VẤN VIÊN THÔNG MINH (24/7)',
                            bold: true,
                            size: 22,
                            color: 'FBBF24',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '1. Quy Tắc Ứng Xử Nâng Cấp: "Giải Đáp Trọng Tâm Trước – Điều Phối Chuyên Môn Sau"',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Nguyên tắc vàng: ',
                bold: true,
              }),
              new TextRun({
                text: 'Khi khách hàng hỏi về lịch học, giá gói, bài tập, chính sách bảo lưu hoặc PT... CSKH phải lập tức cung cấp câu trả lời giải quyết trực tiếp thắc mắc trước, tuyệt đối không được thoái thác trách nhiệm hoặc đùn đẩy ngay lập tức.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Định dạng Markdown chuẩn hóa: ',
                bold: true,
              }),
              new TextRun({
                text: 'Sử dụng in đậm (**từ khóa**), in nghiêng (*lưu ý*), danh sách gạch đầu dòng rõ ràng, không bị dính chữ hay lỗi cú pháp thô ráp.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Chuyển tiếp chuyên gia tinh tế: ',
                bold: true,
              }),
              new TextRun({
                text: 'Sau khi đã giải đáp đầy đủ chi tiết, Chatbot chủ động gợi ý kết nối Bộ phận Chuyên môn (HLV Trưởng / Bác sĩ Thể thao / Quản lý CSKH) để hỗ trợ sâu hơn.',
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '2. System Prompt Nâng Cấp Dành Riêng Cho Gemini AI Chatbot CSKH',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 24, color: '2563EB' },
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          new TextRun({
                            text: 'SYSTEM PROMPT CHATBOT CSKH (UPGRADED VERSION):\n\n' +
                              '"Bạn là Trợ lý CSKH Cao cấp của The Shine Fitness & Yoga Center.\n' +
                              'NHIỆM VỤ CỐT LÕI:\n' +
                              '1. TRẢ LỜI TRỌNG TÂM TRƯỚC: Luôn luôn phân tích và trả lời đầy đủ, chính xác câu hỏi của khách hàng dựa trên dữ liệu phòng tập (Giá gói, Lịch Yoga, Đội ngũ PT, Tiện ích Tầng 1-2-3, Chính sách bảo lưu/chuyển nhượng).\n' +
                              '2. KẾT NỐI BỘ PHẬN CHUYÊN MÔN SAU: Sau khi giải đáp trọng tâm, hãy đưa ra đề xuất kết nối với Chuyên gia phù hợp (HLV Cá nhân 1-1, Bác sĩ phục hồi chức năng, hoặc Trưởng quầy Lễ tân) nếu khách hàng cần lộ trình may đo riêng.\n' +
                              '3. ĐỊNH DẠNG HOÀN HẢO:\n' +
                              '   - Sử dụng **in đậm** cho con số, thời gian, mức giá, địa điểm.\n' +
                              '   - Dùng gạch đầu dòng ngắn gọn, có icon sinh động (🏋️, 🧘, ⏰, 💎).\n' +
                              '   - Tuyệt đối không để sót các ký tự markdown bị lỗi hoặc text dính liền nhau.\n' +
                              '4. KÊU GỌI HÀNH ĐỘNG (CTA): Chủ động mời khách nhận mã tập thử 3 ngày miễn phí hoặc để lại số điện thoại để nhận ưu đãi tháng này."',
                            size: 19,
                            color: '1E293B',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 160, after: 100 },
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3. Ma Trận Kịch Bản Xử Lý Tình Huống CSKH (Customer Support Matrix)',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Tình Huống Khách Hỏi', bold: true, size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Bước 1: CSKH Trả Lời Trọng Tâm', bold: true, size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Bước 2: Kết Nối Chuyên Môn', bold: true, size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Bị đau lưng / Thoát vị đĩa đệm có tập được không?' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Hoàn toàn được. Bộ môn Yoga Phục hồi tại Tầng 2 và bài tập Core/Glute trên máy trợ lực sẽ giúp giảm áp lực cột sống.' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Chuyển thông tin cho Master PT chuyên ngành Rehab để test cơ 1-1 miễn phí.' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Hỏi giá gói Diamond VIP 12 tháng' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Gói Diamond có giá ưu đãi 12.500.000đ/năm, full quyền lợi Gym, Yoga, Bơi xông hơi & 5 buổi PT.' })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Kết nối Chuyên viên Tư vấn Gói Hội Viên để áp dụng Voucher giảm thêm 15%.' })] }),
                ],
              }),
            ],
          }),

          // NGẮT TRANG SANG TRANG 3
          new Paragraph({
            children: [new PageBreak()],
          }),

          // ==========================================
          // TRANG 3: MODULE 3 - AI GYM BUDDY & HUẤN LUYỆN VIÊN CÁ NHÂN
          // ==========================================
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: '1E293B' },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 120, after: 120 },
                        children: [
                          new TextRun({
                            text: '🏋️ TRANG 3: MODULE 3 – AI GYM BUDDY (HUẤN LUYỆN VIÊN & DINH DƯỠNG CÁ NHÂN HÓA)',
                            bold: true,
                            size: 22,
                            color: 'FBBF24',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '1. Tính Năng Thông Minh Của Module AI Gym Buddy',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Lập lịch tập tự động theo mục tiêu: ',
                bold: true,
              }),
              new TextRun({
                text: 'Tùy chỉnh lịch tập (Tăng cơ Hypertrophy, Giảm mỡ Fat Loss, Thon gọn Toning, Sức bền Endurance) phân chia chuẩn theo Push/Pull/Legs hoặc Upper/Lower.',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Định vị thiết bị thực tế tại phòng tập: ',
                bold: true,
              }),
              new TextRun({
                text: 'Chỉ định chính xác vị trí máy tập (Ví dụ: Máy Lat Pulldown khu Tầng 1, Thảm tập Yoga khu Panorama Tầng 2) kèm thông số Khối lượng (Kg) x Số lần (Reps) x Số hiệp (Sets).',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: 'Thực đơn dinh dưỡng thuần Việt: ',
                bold: true,
              }),
              new TextRun({
                text: 'Tính toán chính xác khẩu phần Đạm, Tinh bột, Chất béo từ các món ăn quen thuộc (Ức gà, bò, cá hồi, trứng luộc, yến mạch, khoai lang, Whey Protein).',
              }),
            ],
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '2. Master Prompt Động Cơ Huấn Luyện AI Gym Buddy',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
                    borders: {
                      left: { style: BorderStyle.SINGLE, size: 24, color: '10B981' },
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          new TextRun({
                            text: 'MASTER PROMPT AI GYM BUDDY (FITNESS & NUTRITION ENGINE):\n\n' +
                              '"Bạn là AI Gym Buddy - Bạn Đồng Hành Luyện Tập Cá Nhân Hóa Độc Quyền tại The Shine Fitness.\n' +
                              'KHI HỘI VIÊN YÊU CẦU LÊN GIÁO ÁN:\n' +
                              '1. THU THẬP THÔNG TIN PROFILE: Giới tính, Chiều cao, Cân nặng, Số năm tập luyện, Mục tiêu (Tăng cơ, Giảm mỡ, Giữ dáng), Tần suất tập (3-6 buổi/tuần).\n' +
                              '2. XUẤT GIÁO ÁN CHUẨN KHOA HỌC:\n' +
                              '   - Khởi động động (Dynamic Warm-up): 5-7 phút.\n' +
                              '   - Bài tập chính: Tên bài tập tiếng Việt + quốc tế (Ví dụ: Nằm ghế đẩy tạ đòn - Barbell Bench Press).\n' +
                              '   - Thông số chi tiết: Khối lượng % 1RM, Số hiệp (Sets), Số lần (Reps), Thời gian nghỉ giữa hiệp (Rest: 60-90s).\n' +
                              '   - Vị trí máy tập tại The Shine: Chỉ rõ khu vực (Tầng 1 Zone A/B/C).\n' +
                              '3. GỢI Ý DINH DƯỠNG PRE & POST WORKOUT:\n' +
                              '   - Trước tập: Ăn gì cách 60 phút (Chuối + Yến mạch / Cà phê đen).\n' +
                              '   - Sau tập: Bổ sung Protein + Carb nhanh (1 muỗng Whey Isolate + Cơm gạo lứt thịt bò).\n' +
                              '4. HỆ THỐNG GAMIFICATION & MOTIVATION: Khích lệ hội viên duy trì chuỗi tập (Streak) và cấp huy hiệu danh dự."',
                            size: 19,
                            color: '065F46',
                            font: 'Courier New',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({
            spacing: { before: 160, after: 100 },
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({
                text: '3. Cơ Chế Lưu Trữ & Đồng Bộ Dữ Liệu Tập Luyện (Data Pipeline)',
                bold: true,
                size: 22,
                color: '1E3A8A',
              }),
            ],
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Thành Phần', bold: true, size: 20 })] })],
                  }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' },
                    children: [new Paragraph({ children: [new TextRun({ text: 'Chi Tiết Kỹ Thuật & Luồng Xử Lý', bold: true, size: 20 })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'State Management', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Quản lý trạng thái Profile, Workout Logs, Daily Calorie Goal và Lịch sử trò chuyện qua React Hooks & LocalStorage / Firestore DB.' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Workout Tracking', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Tính toán tổng khối lượng Volume (Kg x Reps x Sets) sau mỗi buổi tập, tự động vẽ biểu đồ tiến độ Recharts.' })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: 'Export & Backup', bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: 'Hỗ trợ xuất giáo án ra Word (.docx) hoặc chia sẻ mã QR kế hoạch luyện tập để đồng bộ sang điện thoại cá nhân.' })] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  
  // Save to multiple locations to ensure access
  const rootPath = path.resolve('Tong_Hop_Prompt_TheShineFitness.docx');
  const publicPath = path.resolve('public/Tong_Hop_Prompt_TheShineFitness.docx');
  const publicAltPath = path.resolve('public/Lich_Su_Prompt_Va_Output.docx');
  
  fs.writeFileSync(rootPath, buffer);
  fs.writeFileSync(publicPath, buffer);
  fs.writeFileSync(publicAltPath, buffer);

  console.log(`Successfully generated 3-page Word document at:`);
  console.log(`- ${rootPath}`);
  console.log(`- ${publicPath}`);
  console.log(`- ${publicAltPath}`);
}

generateDoc().catch(console.error);
