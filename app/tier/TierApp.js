'use client';

import { useState, useEffect, useCallback } from 'react';
import { tierOptions } from '../../lib/tierConfig';

export default function TierApp({ initialItems = [] }) {
  // ควบคุม index ให้แสดงทีละรายการ
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({});

  const currentItem = initialItems[currentIndex];

  // ฟังก์ชันดึงข้อมูลผลโหวตล่าสุดจาก API
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

  // ดึงข้อมูล Real-time ทุกๆ 1.5 วินาที
  useEffect(() => {
    fetchResults(); // โหลดครั้งแรกตอนเปิดหน้า
    const interval = setInterval(fetchResults, 1500);
    return () => clearInterval(interval);
  }, [fetchResults]);

  // ฟังก์ชันกดโหวต
  const handleVote = async (tierId) => {
    if (!currentItem) return;

    // ยิง API บันทึกผลโหวต
    await fetch('/api/tier/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: currentItem.id, tierId }),
    });
    
    fetchResults(); // อัปเดตคะแนนทันทีที่โหวตเสร็จ

    // เลื่อนไปคันถัดไป
    if (currentIndex < initialItems.length) {
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

  // กรณีโหวตครบทุกรายการแล้ว
  if (currentIndex >= initialItems.length || !currentItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-white">
        <h2 className="text-3xl font-bold mb-4 tracking-wider">จัดอันดับครบทุกคันแล้ว!</h2>
        <p className="text-gray-400">ขอบคุณที่ร่วมประเมิน</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full max-w-3xl mx-auto font-sans">
      
      {/* Header แสดงจำนวนความคืบหน้า */}
      <div className="mb-8 text-gray-500 text-sm tracking-widest">
        จัดแล้ว <span className="text-white font-bold">{currentIndex}</span> / {initialItems.length} คัน
      </div>

      {/* Main Card */}
      <div className="bg-[#121212] border border-[#2A2A2A] p-6 md:p-10 rounded-lg shadow-2xl w-full text-center">
        
        {/* รูปภาพ (ไม่มีการแสดงชื่อ) */}
        <div className="h-48 md:h-64 bg-[#1E1E1E] border border-[#333] rounded mb-8 flex items-center justify-center overflow-hidden relative">
          {currentItem.image ? (
            <img 
              src={currentItem.image} 
              alt="Item Image" 
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-gray-600 text-lg uppercase tracking-widest">? IMAGE PREVIEW ?</span>
          )}
        </div>

        {/* คะแนนเฉลี่ย Real-time */}
        <div className="mb-10">
          <div className="text-gray-500 text-xs mb-2 uppercase tracking-widest">Average Score (Real-time)</div>
          <div className="text-5xl font-black text-white drop-shadow-md transition-all">
            {getAverageScore(currentItem.id)} <span className="text-xl text-gray-600 font-normal">/ 5.0</span>
          </div>
        </div>

        {/* ปุ่มจัดอันดับ */}
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