import { readerEditions } from "./ebookContent";

type ProductSeed = {
  slug: string;
  productType: "ebook" | "course";
  status: "published";
  title: string;
  subtitle: string;
  description: string;
  category: string;
  coverUrl: string;
  accent: "lime" | "violet" | "rose" | "cyan";
  priceSatang: number;
  currency: string;
  unitCount: number;
  durationLabel: string;
  content: string;
};

/** Initial Thai catalog. Inserts are idempotent and never overwrite admin edits. */
export const defaultProducts: ProductSeed[] = [
  {
    slug: "atlas-of-attention",
    productType: "ebook",
    status: "published",
    title: "แผนที่แห่งสมาธิ",
    subtitle: "ออกแบบความตั้งใจให้กลับมาอยู่กับงานสำคัญ",
    description: "คู่มือเชิงปฏิบัติสำหรับจัดความสัมพันธ์กับเวลา งาน และสิ่งรบกวนอย่างมีเจตนา",
    category: "โฟกัสและระบบงาน",
    coverUrl: "/manus-storage/atlas-of-attention-cover_def02da8.png",
    accent: "lime",
    priceSatang: 79000,
    currency: "thb",
    unitCount: 8,
    durationLabel: "อ่านประมาณ 72 นาที",
    content: JSON.stringify({ kind: "ebook", ...readerEditions["atlas-of-attention"] }),
  },
  {
    slug: "interface-intelligence",
    productType: "ebook",
    status: "published",
    title: "อินเทอร์เฟซที่เข้าใจคน",
    subtitle: "คิดประสบการณ์ดิจิทัลให้ชัด ลื่น และเป็นมนุษย์",
    description: "เลนส์เชิงออกแบบเพื่อทำให้ผลิตภัณฑ์ดิจิทัลสื่อสารกับผู้คนอย่างเป็นธรรมชาติ",
    category: "การออกแบบผลิตภัณฑ์",
    coverUrl: "/manus-storage/interface-intelligence-cover-v2_837bf46f.png",
    accent: "cyan",
    priceSatang: 99000,
    currency: "thb",
    unitCount: 10,
    durationLabel: "อ่านประมาณ 96 นาที",
    content: JSON.stringify({ kind: "ebook", ...readerEditions["interface-intelligence"] }),
  },
  {
    slug: "creative-compass",
    productType: "ebook",
    status: "published",
    title: "เข็มทิศความคิดสร้างสรรค์",
    subtitle: "เปลี่ยนความคลุมเครือให้เป็นก้าวถัดไปที่มั่นใจ",
    description: "เพื่อนคู่คิดฉบับกระชับสำหรับเปลี่ยนโจทย์สร้างสรรค์ที่ยังไม่ชัดให้ไปต่อได้จริง",
    category: "ทิศทางสร้างสรรค์",
    coverUrl: "/manus-storage/creative-compass-cover-v2_930d2424.png",
    accent: "rose",
    priceSatang: 59000,
    currency: "thb",
    unitCount: 6,
    durationLabel: "อ่านประมาณ 54 นาที",
    content: JSON.stringify({ kind: "ebook", ...readerEditions["creative-compass"] }),
  },
  {
    slug: "digital-workflow-course",
    productType: "course",
    status: "published",
    title: "คอร์สออกแบบระบบงานดิจิทัล",
    subtitle: "สร้างระบบทำงานที่เบา ชัด และกลับมาใช้ได้ทุกวัน",
    description: "คอร์สออนไลน์แบบเรียนด้วยตนเอง 6 บทสำหรับวางระบบงานส่วนตัวและทีมให้เดินหน้าได้อย่างยั่งยืน",
    category: "คอร์สออนไลน์",
    coverUrl: "/manus-storage/interface-intelligence-cover-v2_837bf46f.png",
    accent: "violet",
    priceSatang: 249000,
    currency: "thb",
    unitCount: 6,
    durationLabel: "เรียนรวมประมาณ 4 ชั่วโมง",
    content: JSON.stringify({
      kind: "course",
      intro: "คอร์สนี้พาคุณวางระบบงานที่ลดการตัดสินใจซ้ำ และทำให้เรื่องสำคัญขยับได้ทุกสัปดาห์",
      modules: [
        { title: "ตั้งภาพของงานที่ดี", duration: "32 นาที", summary: "แยกงานสำคัญออกจากงานเร่งด่วนด้วยกรอบตัดสินใจที่ใช้ได้จริง" },
        { title: "วางพื้นที่รับข้อมูล", duration: "38 นาที", summary: "สร้างจุดรับข้อมูลเดียว ลดการสลับแอปและการตกหล่น" },
        { title: "ออกแบบจังหวะทบทวน", duration: "42 นาที", summary: "เปลี่ยนการวางแผนเป็นระบบทบทวนที่กลับมาใช้ได้แม้งานยุ่ง" },
        { title: "จัดการงานร่วมกัน", duration: "40 นาที", summary: "กำหนดความชัดเจนสำหรับงานที่มีหลายคนโดยไม่เพิ่มการประชุม" },
        { title: "ทำให้ระบบเบาพอ", duration: "36 นาที", summary: "ตัดขั้นตอนที่ไม่จำเป็นและรักษาระบบที่ทำให้คุณอยากกลับมาใช้" },
        { title: "แผน 30 วัน", duration: "28 นาที", summary: "เปลี่ยนหลักคิดของคอร์สเป็นแผนลงมือทำในบริบทของคุณ" },
      ],
    }),
  },
];
