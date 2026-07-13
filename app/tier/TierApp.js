'use client';

import { useState, useEffect, useCallback } from 'react';
import { tierOptions } from '../../lib/tierConfig';

export default function TierApp(props) {
  // 1. แก้ไขให้รองรับชื่อ Prop ทุกรูปแบบที่อาจส่งมาจาก page.js (เช่น items หรือ initialItems)
  const itemsList = props.initialItems || props.items || [];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({});

  const currentItem = itemsList[currentIndex];

  // ฟังก์ชันดึงข้อมูลผลโหวตล่าสุดแบบ Real-time
  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch('/api/tier/results');
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
    }
  }, []);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 1500); // อัปเดตทุก 1.5 วินาที
    return () => clearInterval(interval);
  }, [fetchResults]);

  // ฟังก์ชันส่งผลโหวต
  const handleVote = async (tierId) => {
    if (!currentItem) return;

    await fetch('/api/tier/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: currentItem.id, tierId }),
    });
    
    fetchResults();

    if (currentIndex < itemsList.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ฟังก์ชันคำนวณค่าเฉลี่ย
  const getAverageScore = (itemId) => {
    if (!results || !results[itemId]) return "0.00";
    
    const itemVotes = results[itemId];
    let totalScore = 0;
    let totalVotes = 0;

    tierOptions.forEach(option => {
      const votes = itemVotes[option.id] || 0;
      totalScore += votes * option.weight;
      totalVotes += votes;
    });

    return totalVotes === 0 ? "0.00" : (totalScore / totalVotes).toFixed(2);
  };

  // 2. หน้าจอแจ้งเตือน (กรณีที่ระบบยังหาตัวแปรรายชื่อรถถังไม่เจอ)
  if (itemsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-[#121212] border border-red-900/50 rounded-lg max-w-xl mx-auto mt-10">
        <h2 className="text-red-400 text-xl font-bold mb-3">⚠️ ไม่พบข้อมูลรายชื่อรถถัง (Items List Empty)</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          เนื่องจากในหน้า <code className="text-yellow-400 bg-gray-900 px-1.5 py-0.5 rounded">app/tier/page.js</code> อาจจะไม่ได้ส่งค่าเข้ามา หรือใช้ชื่อตัวแปรไม่ตรงกัน
        </p>
        <div className="text-left bg-black/40 p-3 rounded text-xs text-gray-500 font-mono w-full">
          <p className="text-emerald-400">// วิธีแก้ใน app/tier/page.js ให้ส่งค่าแบบนี้:</p>
          <p>&lt;TierApp initialItems={"{yourTankData}"} /&gt;</p>
        </div>
      </div>
    );
  }

  // 3. กรณีโหวตครบทุกรายการแล้วจริง ๆ
  if (currentIndex >= itemsList.length || !currentItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-white">
        <h2 className="text-3xl font-bold mb-4 tracking-wider">จัดอันดับครบทุกคันแล้ว!</h2>
        <p className="text-gray-400">ขอบคุณที่ร่วมประเมิน</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-3xl mx-auto font-sans">
      
      <div className="mb-8 text-gray-500 text-sm tracking-widest">
        จัดแล้ว <span className="text-white font-bold">{currentIndex}</span> / {itemsList.length} คัน
      </div>

      <div className="bg-[#121212] border border-[#2A2A2A] p-6 md:p-10 rounded-lg shadow-2xl w-full text-center">
        
        {/* กล่องแสดงรูปภาพ (ไม่แสดงชื่อรถถังตามที่สั่ง) */}
        <div className="h-48 md:h-64 bg-[#1E1E1E] border border-[#333] rounded mb-8 flex items-center justify-center overflow-hidden relative">
          {currentItem.image ? (
            <img 
              src={currentItem.image} 
              alt="Tank Preview" 
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-gray-600 text-sm uppercase tracking-widest">ไม่มีรูปภาพรถถัง</span>
          )}
        </div>

        {/* คะแนนเฉลี่ย Real-time */}
        <div className="mb-10">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-widest">Average Score (Real-time)</div>
          <div className="text-5xl font-black text-white drop-shadow-md">
            {getAverageScore(currentItem.id)} <span className="text-xl text-gray-600 font-normal">/ 5.0</span>
          </div>
        </div>

        {/* ปุ่มเลือกอันดับ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tierOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              className="py-3 px-2 text-xs md:text-sm font-bold rounded transition-all duration-200 hover:brightness-110 active:scale-95"
              style={{ 
                backgroundColor: option.color, 
                color: option.textColor,
                border: `1px solid ${option.borderColor}`
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}