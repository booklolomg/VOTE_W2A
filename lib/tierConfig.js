// ============================================
// 🎨 แก้ตรงนี้ — รายชื่อรถถัง + ชื่อ tier
// ============================================
export const TIER_CONFIG = {
  title: 'WAR THUNDER TIER LIST',
  question: 'จัดอันดับรถถัง',

  // 5 ระดับ tier (เรียงจากดีสุด → แย่สุด)
  tiers: [
    { id: 'must',   name: 'ของต้องมี',    color: '#7CFC7C' },
    { id: 'worth',  name: 'คุ้มค่า',       color: '#FFF97C' },
    { id: 'niche',  name: 'เฉพาะทาง',     color: '#FFB56B' },
    { id: 'meh',    name: 'ดีกว่าไม่มี',   color: '#FF7C7C' },
    { id: 'skip',   name: 'คันอื่นดีกว่า', color: '#E8E8E8' }
  ],

  // รายชื่อรถถัง — แก้/เพิ่ม/ลบได้เลย
  // imageUrl ใส่ก็ได้ ไม่ใส่ก็ได้ (เว้นเป็น '' ถ้าไม่มีรูป)
  tanks: [
    { id: 'tank1', name: 'Tiger II',   imageUrl: '' },
    { id: 'tank2', name: 'IS-3',       imageUrl: '' },
    { id: 'tank3', name: 'M26 Pershing', imageUrl: '' },
    { id: 'tank4', name: 'Leopard 1',  imageUrl: '' },
    { id: 'tank5', name: 'T-54',       imageUrl: '' },
    { id: 'tank6', name: 'Centurion Mk 3', imageUrl: '' }
  ]
};
