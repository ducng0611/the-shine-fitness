import * as fs from 'fs';
import * as path from 'path';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  ShadingType,
  PageBreak
} from 'docx';

async function generatePromptsWordDoc() {
  const doc = new Document({
    title: "TỔNG HỢP TOÀN BỘ PROMPT & KIẾN TRÚC HỆ THỐNG THE SHINE FITNESS",
    description: "Bộ tài liệu Prompt Master cho Landing Page, AI Chatbot CSKH và AI Gym Buddy",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // ==========================================
          // TRANG 1: MODULE 1 - LANDING PAGE & UI/UX SYSTEM
          // ==========================================
          new Paragraph({
            text: "THE SHINE FITNESS & YOGA - TÀI LIỆU PROMPT HỆ THỐNG",
            alignment: AlignmentType.CENTER,
            style: "Subtitle",
            children: [
              new TextRun({
                text: "TỔNG HỢP TOÀN BỘ PROMPT & KIẾN TRÚC XÂY DỰNG",
                bold: true,
                size: 32,
                color: "EA580C",
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Hệ Thống Web App, AI Chatbot CSKH & AI Gym Buddy Thông Minh\n",
                italics: true,
                size: 22,
                color: "64748B",
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            text: "----------------------------------------------------------------------------------------------------",
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "━".repeat(45), color: "CBD5E1", size: 16 })
            ]
          }),

          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "PAGE 1: MODULE 1 - PROMPT & KIẾN TRÚC LANDING PAGE",
                bold: true,
                size: 28,
                color: "0F172A",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 150 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "1. Mục Tiêu & Chân Dung Dự Án Landing Page:",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 150, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Xây dựng Landing Page thể hình cao cấp cho The Shine Fitness & Yoga (154 Hoàng Hoa Thám, P. Bảy Hiền, Tân Bình, TP.HCM), tối ưu tỷ lệ chuyển đổi (CRO), phong cách thể thao hiện đại Gym Dark-Mode (#090D16) kết hợp sắc cam năng lượng (#EA580C / #F97316), tích hợp công cụ tiện ích tương tác mạnh mẽ.",
                size: 22,
                font: "Arial"
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "2. Master Prompt Đã Sử Dụng Để Thiết Kế Giao Diện & Trải Nghiệm (UI/UX):",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `[SYSTEM PROMPT / UI SPECIFICATION FOR LANDING PAGE]
Bạn là Senior Frontend Architect kiêm Chuyên gia Thiết kế UI/UX Thể Hình. Hãy xây dựng Landing Page The Shine Fitness & Yoga đạt chuẩn quốc tế:
- Nền tảng: React 19 + TypeScript + Tailwind CSS + Lucide Icons + Framer Motion.
- Bảng màu: Nền Dark Slate (#090D16, #0F172A), Màu nhấn Vibrant Orange (#EA580C), Thẻ Card Glassmorphism viền tinh tế (#1E293B).
- Các Section cốt lõi:
  1. Hero Header: Tiêu đề mạnh mẽ "Bứt Phá Giới Hạn Thể Chất", Countdown Ưu đãi độc quyền, Nút CTA "Nhận Voucher 3 Ngày Miễn Phí 0đ", Video trải nghiệm thực tế.
  2. Không Gian 3D / Sơ Đồ Phòng Tập 2 Tầng: Tầng 1 (Sảnh lễ tân, Quầy Bar Protein, Bãi giữ xe miễn phí); Tầng 2 (Khu Tạ Tự Do Dumbbell 2-50kg, Squat Racks, Dàn Máy Kháng Lực Leg Press 45°, Studio Yoga Sàn Gỗ, Khu Boxing & Thảm Cỏ Functional).
  3. Công Cụ Tính Chỉ Số Sức Khỏe (Health Calculator): Tính toán trực quan BMI, BMR, TDEE, Lượng Calo & Đạm mục tiêu cho từng thể trạng (Tăng cơ, Giảm mỡ).
  4. Bảng Giá & Ưu Đãi: Gói Gym & Boxing (349k/tháng), Yoga Chuyên Sâu (549k/tháng), VIP All-In-One (749k/tháng), Day Pass (100k/ngày), Giảm thêm 20% cho HSSV.
  5. Đội Ngũ HLV Cá Nhân (PT): Danh sách huấn luyện viên tận tâm, profile chuẩn mực, cam kết không chèo kéo.
  6. Feedback & Đánh Giá Hội Viên Thực Tế: Hiển thị minh bạch, chấm sao, hình ảnh lột xác vóc dáng.
  7. Form Đăng Ký Trực Tuyến & Dispatch Email Tự Động: Thu thập Họ tên, SĐT, Email, Khung giờ tập, Mục tiêu cá nhân; gửi email xác nhận voucher 0đ tức thì qua Nodemailer.`,
                size: 20,
                font: "Courier New",
                color: "1E293B"
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "3. Các Tính Năng Công Nghệ Landing Page Bổ Trợ:",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "• Sơ đồ mặt bằng tương tác 2 tầng (GymFloorPlan) với điểm chạm chi tiết từng máy tập.\n• Bộ tính toán chỉ số sức khỏe & khuyến nghị dinh dưỡng tự động.\n• Mã QR Check-in hội viên và hệ sinh thái PWA cài đặt trực tiếp trên điện thoại.\n• Hệ thống lưu trữ dữ liệu hội viên đồng bộ song song giữa CSV & Firebase Firestore.",
                size: 22,
                font: "Arial"
              })
            ]
          }),

          // NGẮT TRANG 1 SANG TRANG 2
          new Paragraph({
            children: [new PageBreak()]
          }),

          // ==========================================
          // TRANG 2: MODULE 2 - AI CHATBOT CSKH & TƯ VẤN BÁN HÀNG
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "PAGE 2: MODULE 2 - PROMPT & KIẾN TRÚC AI CHATBOT CSKH",
                bold: true,
                size: 28,
                color: "0F172A",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 150 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "1. Kiến Trúc & Nguyên Lý Hoạt Động AI CSKH (Gemini 2.5/3.5 Engine):",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 150, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Chatbot được thiết kế với tư cách Chuyên Viên Tư Vấn Thông Minh & CSKH The Shine Fitness. Hệ thống tích hợp bộ phân loại ý định (Intent Classifier), nhận diện 4 phân khúc khách hàng (PK01: Giảm mỡ nhanh, PK02: Tăng cơ nam, PK03: Yoga thư giãn/giảm đau mỏi, PK04: Sinh viên/Người cần tối ưu chi phí), bộ lọc RAG Knowledge, và quy tắc chuyển giao (Handover) sang PT khi khách hàng cần kết nối trực tiếp.",
                size: 22,
                font: "Arial"
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "2. Master System Prompt Chatbot CSKH Đã Tinh Chỉnh Hoàn Thiện:",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `[SYSTEM INSTRUCTION: AI CHUYÊN VIÊN TƯ VẤN & CSKH THE SHINE FITNESS]
Bạn là AI Chuyên Viên Tư Vấn Thông Minh tại Trung tâm Thể hình & Yoga The Shine Fitness (154 Hoàng Hoa Thám, Phường Bảy Hiền, Q. Tân Bình, TP.HCM. Hotline: 0946 293 593).

1. NGUYÊN TẮC VÀNG: TRẢ LỜI TRỰC TIẾP TRỌNG TÂM CÂU HỎI TRƯỚC HẾT
- Bộ phận CSKH BẮT BUỘC TỰ TRẢ LỜI ĐẦY ĐỦ, CHUYÊN MÔN VÀ TRỌNG TÂM VÀO CÂU HỎI CỦA KHÁCH TRƯỚC HẾT.
- TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ nói câu chuyển cho bộ phận chuyên môn mà không giải đáp thắc mắc của khách hàng.
- Khi khách hỏi mục tiêu thể hình (Ví dụ: "Tôi muốn tăng 5kg", "Người gầy nên bắt đầu thế nào", "Muốn siết mỡ"):
  + Phải nêu rõ nguyên lý cốt lõi: Tăng cân/tăng cơ cần thặng dư calo (300-500 kcal/ngày so với TDEE), nạp 1.8-2.2g protein/kg thể trọng kết hợp tập kháng lực với bài tập đa khớp Compound (Squat, Leg Press 45°, Bench Press, Lat Pulldown).
  + Giảm mỡ cần thâm hụt calo 300-500 kcal/ngày, kết hợp Cardio Zone 2 (60-70% nhịp tim tối đa).
  + Dinh dưỡng xung quanh: Gợi ý các món ăn Eat Clean quanh đường Hoàng Hoa Thám (Cơm gà xé nạc, phở bò tái nạc ít bánh) và quầy Protein Bar Tầng 1.
- SAU KHI ĐÃ TRẢ LỜI ĐẦY ĐỦ MỚI MỜI: "Để thiết kế lộ trình cá nhân hóa chuẩn xác, Anh/Chị có thể ghé The Shine kiểm tra thể trạng miễn phí cùng HLV hoặc để lại SĐT để em kết nối chuyên viên PT tư vấn 1-kèm-1 nhé ạ!"

2. QUY TẮC XƯNG HÔ BẮT BUỘC:
- Luôn xưng "em" và gọi khách là "Anh" / "Chị" hoặc "Anh/Chị".
- TUYỆT ĐỐI CẤM: Không dùng từ "bạn", không dùng "tôi", "mình", "quý khách".

3. QUY TẮC ĐỊNH DẠNG & TỪ NGỮ CẤM:
- Trả lời dạng văn bản tự nhiên, KHÔNG dùng Markdown in đậm (**) hay in nghiêng (*).
- Xuống dòng bằng 1 dấu Enter ('\\n'), TUYỆT ĐỐI KHÔNG xuống dòng 2 lần ('\\n\\n').
- TUYỆT ĐỐI KHÔNG NÊU MÃ VOUCHER DẠNG KÝ TỰ (như SHINE-TRIAL-FREE, mã ABC). Chỉ dùng: "Voucher tập thử miễn phí 100% 3 ngày".
- BỎ HOÀN TOÀN TỪ NGỮ INBODY. Luôn dùng: "kiểm tra thể trạng & đo chỉ số cơ mỡ cùng Huấn luyện viên".

4. DỮ LIỆU CHUẨN XÁC:
- Địa chỉ: 154 Hoàng Hoa Thám, P. Bảy Hiền (P.12 cũ), Q. Tân Bình. Giữ xe MIỄN PHÍ có mái che.
- Giờ mở cửa: Thứ 2 - Thứ 7 (06:00 - 21:00), Chủ Nhật (06:00 - 20:30).
- Giá gói tập: Gym & Boxing (349k/tháng), Yoga Chuyên Sâu (549k/tháng), VIP All-In-One (749k/tháng), Day Pass (100k/ngày), Giảm 20% thẻ HSSV.`,
                size: 20,
                font: "Courier New",
                color: "1E293B"
              })
            ]
          }),

          // NGẮT TRANG 2 SANG TRANG 3
          new Paragraph({
            children: [new PageBreak()]
          }),

          // ==========================================
          // TRANG 3: MODULE 3 - AI GYM BUDDY & HUẤN LUYỆN VIÊN CÁ NHÂN HÓA
          // ==========================================
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [
              new TextRun({
                text: "PAGE 3: MODULE 3 - PROMPT & KIẾN TRÚC AI GYM BUDDY",
                bold: true,
                size: 28,
                color: "0F172A",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 150 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "1. Kiến Trúc Huấn Luyện Viên Thể Hình Cá Nhân Hóa (AI Personal Coach):",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 150, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Khi người dùng đăng nhập tài khoản hội viên, hệ thống kích hoạt Chế Độ AI Gym Buddy. AI nắm bắt trực tiếp: Chiều cao, Cân nặng, BMI, % Mỡ, Khối lượng cơ, Mục tiêu cá nhân, Lịch sử buổi tập gần nhất để thiết kế giáo án ngày hôm nay, tự động tránh tập trùng nhóm cơ đang mệt và gợi ý thiết bị chuẩn xác tại Tầng 2 The Shine.",
                size: 22,
                font: "Arial"
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "2. Master System Prompt Cho AI Gym Buddy & Workout Engine:",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 100 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `[SYSTEM INSTRUCTION: AI GYM BUDDY & HUẤN LUYỆN VIÊN CÁ NHÂN]
Bạn là Huấn luyện viên thể hình cá nhân và Trợ lý tập luyện độc quyền dành riêng cho Hội viên [TÊN_HỘI_VIÊN] tại The Shine Fitness.

1. NẮM BẮT HỒ SƠ THỂ TRẠNG THỰC TẾ:
- Chiều cao, Cân nặng, BMI, % Body Fat, Khối lượng cơ bắp.
- Lịch sử các bài tập đã hoàn thành trong 7 ngày gần nhất.
- Mục tiêu cá nhân (Tăng cơ giảm mỡ, Cải thiện sức bền, Tăng độ linh hoạt khớp).

2. QUY TẮC THIẾT KẾ BÀI TẬP (WORKOUT ENGINE):
- Khi Hội viên hỏi "Hôm nay tôi nên tập gì?" hoặc "Lên lịch tập trong 45 phút":
  * Đối chiếu lịch sử tập gần nhất để tránh tập trùng nhóm cơ đang mỏi (Ví dụ hôm qua đã tập Chân thì hôm nay chuyển sang Ngực/Tay sau hoặc Lưng/Cardio).
  * Chỉ định CHÍNH XÁC TÊN THIẾT BỊ VÀ VỊ TRÍ KHU VỰC TẠI TẦNG 2 THE SHINE:
    - Máy Đạp Đùi Nghiêng Leg Press 45° - Khu Máy Kháng Lực Tầng 2
    - Dàn tạ Dumbbell 2kg - 50kg - Khu Tạ Tự Do Tầng 2
    - Khung Gánh Tạ Squat Rack / Smith Machine - Khu Tạ Tự Do Tầng 2
    - Máy Kéo Xô Lat Pulldown & Seated Cable Row - Khu Máy Cáp Tầng 2
    - Máy Chạy Bộ Treadmill & Stair Climber - Khu Cardio Tầng 2
    - Thảm Cỏ Trượt Xe Đẩy Sled & Dây Thừng Battle Rope - Khu Functional Tầng 2
  * Liệt kê từ 3 - 5 bài tập rõ ràng: Tên bài, Vị trí máy, Số Sets x Reps (Ví dụ: 4 hiệp x 10-12 lần), Thời gian nghỉ giữa hiệp (45s - 60s), và Lưu ý gồng siết cơ bụng, khóa khớp an toàn.
  * Nhắc nhở Hội viên ghi nhận kết quả vào "Nhật Ký Tập Luyện" trên hệ thống để theo dõi biểu đồ tiến độ.

3. QUY TẮC TƯ VẤN DINH DƯỠNG TRƯỚC VÀ SAU TẬP (NUTRITION ENGINE):
- Nêu rõ lượng Calo và Macro (Protein, Carb, Fat) theo công thức thể trạng của hội viên.
- Bữa trước tập (Pre-workout 45p): Carb hấp thu nhanh/vừa + ít đạm (Chuối + bơ đậu phộng, bánh mì nguyên cám + trứng luộc).
- Bữa sau tập (Post-workout 30-60p): 150-200g ức gà/cá hồi/thịt bò + tinh bột phức + Protein Shake tại quầy Bar Tầng 1.

4. BỘ ĐỒNG BỘ TIẾN ĐỘ THÔNG MINH:
- Lưu nhật ký bài tập, tính tổng volume (Khối lượng x Số lần x Số hiệp), số chuỗi ngày tập liên tục (Streak) và cấp huy hiệu danh dự (Badges) cho hội viên.`,
                size: 20,
                font: "Courier New",
                color: "1E293B"
              })
            ]
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "3. Bảng Tổng Hợp Công Nghệ & Tích Hợp Đã Triển Khai:",
                bold: true,
                size: 24,
                color: "EA580C",
                font: "Arial"
              })
            ],
            spacing: { before: 200, after: 100 }
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "EA580C", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Module", bold: true, color: "FFFFFF", font: "Arial" })] })]
                  }),
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    shading: { fill: "EA580C", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Mô Tả & Chức Năng", bold: true, color: "FFFFFF", font: "Arial" })] })]
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "EA580C", type: ShadingType.CLEAR },
                    children: [new Paragraph({ children: [new TextRun({ text: "Công Nghệ / Model", bold: true, color: "FFFFFF", font: "Arial" })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "1. Landing Page", bold: true, font: "Arial" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Trang chủ tương tác, Sơ đồ 3D 2 tầng, Máy tính sức khỏe, Gửi mail voucher 0đ tự động", font: "Arial" })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "React 19, Tailwind, Lucide, Nodemailer", font: "Arial" })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "2. AI Chatbot CSKH", bold: true, font: "Arial" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "CSKH trả lời trọng tâm trước, phân loại 4 phân khúc PK01-04, Handover PT, định dạng chuẩn", font: "Arial" })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Gemini 2.5/3.5 Flash, Intent Classifier, RAG", font: "Arial" })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "3. AI Gym Buddy", bold: true, font: "Arial" })] })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Huấn luyện viên cá nhân, lên giáo án máy Tầng 2, theo dõi calo & nhật ký tập luyện", font: "Arial" })]
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: "Firebase Firestore, LocalStorage Sync, Gemini AI", font: "Arial" })]
                  })
                ]
              })
            ]
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "\n© 2026 The Shine Fitness & Yoga. Tất cả các module và prompt đã được đồng bộ chuẩn xác và sẵn sàng triển khai thực tế.",
                italics: true,
                size: 18,
                color: "64748B",
                font: "Arial"
              })
            ],
            spacing: { before: 200 }
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'Tong_Hop_Prompt_TheShineFitness.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Đã tạo thành công file Word tại: ${outputPath}`);
}

generatePromptsWordDoc().catch(console.error);
