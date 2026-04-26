# 🗳️ Vote Binary — เว็บโหวตซ้าย/ขวา

เว็บโหวตที่ต้อง login ด้วย Discord ก่อน + มีหน้ายืนยันก่อนกดโหวต + เปลี่ยนใจได้

## ✨ Features

- 🔒 **Login ด้วย Discord** (OAuth2 — ไม่ต้องเชิญ bot เข้า server)
- ✅ **หน้ายืนยันก่อนโหวต** — กันเผลอกดผิด
- 🔄 **เปลี่ยนใจได้** — กดรีเซ็ตแล้วโหวตใหม่
- 🖼️ **มีรูปประกอบ** ทั้งสองฝั่ง
- 📊 **ผลโหวตอัปเดตอัตโนมัติ** ทุก 5 วินาที
- 🌐 **ใช้ได้ทุกคนที่มี Discord** (ไม่จำกัด)

## 🚀 ขั้นตอนการ Deploy (ใช้เวลา ~10 นาที)

### 1. สร้าง Discord Application

1. ไปที่ https://discord.com/developers/applications
2. กด **"New Application"** → ตั้งชื่อ → กด **Create**
3. ไปที่แท็บ **OAuth2** ทางซ้ายมือ
4. คัดลอก:
   - **Client ID**
   - **Client Secret** (กดปุ่ม "Reset Secret" เพื่อสร้างใหม่)
5. ในส่วน **Redirects** กด **Add Redirect** แล้วใส่ (เปลี่ยนยังไม่ต้อง — ใส่ทีหลังได้):
   ```
   https://YOUR-APP.vercel.app/api/auth/callback
   ```

### 2. Push code ขึ้น GitHub

```bash
cd vote-app
git init
git add .
git commit -m "initial"
# สร้าง repo ใหม่บน GitHub แล้ว push
git remote add origin https://github.com/YOUR-USERNAME/vote-app.git
git push -u origin main
```

### 3. Deploy ขึ้น Vercel

1. ไปที่ https://vercel.com/ → **Sign in with GitHub**
2. กด **Add New** → **Project** → เลือก repo ที่เพิ่ง push
3. กด **Deploy** (ยังจะ error ก็ไม่เป็นไร เดี๋ยวเราจะใส่ env)

### 4. สร้าง KV Database (ฟรี)

1. ใน Vercel project → ไปแท็บ **Storage**
2. กด **Create Database** → เลือก **KV** (Redis-compatible)
3. ตั้งชื่อ → กด **Create**
4. กด **Connect** → เลือก project → **Connect** อีกครั้ง
   - Vercel จะเพิ่ม env vars ของ KV ให้อัตโนมัติ ✅

### 5. ใส่ Environment Variables

ไปแท็บ **Settings → Environment Variables** ใส่:

| Key | Value |
|-----|-------|
| `DISCORD_CLIENT_ID` | จาก Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | จาก Discord Developer Portal |
| `APP_URL` | URL ของ Vercel เช่น `https://your-app.vercel.app` |
| `SESSION_SECRET` | random string ยาว ๆ (ใช้ `openssl rand -hex 32` หรือพิมพ์มั่วก็ได้ 64 ตัวอักษร) |

### 6. กด Redeploy

แท็บ **Deployments** → กด `...` ที่ deployment ล่าสุด → **Redeploy**

### 7. กลับไปอัปเดต Redirect ใน Discord

หลัง deploy เสร็จ Vercel จะให้ URL เช่น `https://my-vote-app.vercel.app`
- กลับไปที่ Discord Developer Portal → OAuth2 → Redirects
- เปลี่ยน redirect URL ให้ตรงกับ URL จริง:
  ```
  https://my-vote-app.vercel.app/api/auth/callback
  ```
- กด **Save Changes**

🎉 **เสร็จ!** เปิด URL ของ Vercel ได้เลย

---

## 🎨 เปลี่ยนคำถาม / รูป / ชื่อ

แก้ไฟล์ **`lib/config.js`** :

```js
export const POLL_CONFIG = {
  question: 'พิซซ่า หรือ ก๋วยเตี๋ยว?',
  left: {
    name: 'PIZZA',
    imageUrl: 'https://link-รูปพิซซ่า.jpg'
  },
  right: {
    name: 'NOODLES',
    imageUrl: 'https://link-รูปก๋วยเตี๋ยว.jpg'
  }
};
```

แล้ว push ขึ้น GitHub — Vercel จะ deploy ใหม่ให้อัตโนมัติ

---

## 🔧 Run บนเครื่อง (สำหรับทดสอบ)

```bash
npm install
cp .env.example .env.local
# แก้ค่าใน .env.local
npm run dev
```

แล้วเปิด http://localhost:3000

> หมายเหตุ: ตอน dev ต้องเพิ่ม redirect `http://localhost:3000/api/auth/callback` ใน Discord ด้วย (เพิ่มได้หลายอัน)

---

## 📊 ดู / รีเซ็ต / Export ข้อมูล

ใช้ **Vercel KV CLI** หรือ **Storage tab** บน Vercel ดูข้อมูลได้เลย

Keys ใน database:
- `count:left` — จำนวนคนโหวตซ้าย
- `count:right` — จำนวนคนโหวตขวา
- `vote:{discord_id}` — โหวตของแต่ละคน (`"left"` หรือ `"right"`)

อยากรีเซ็ตทั้งหมด? ใช้ Vercel KV CLI:
```bash
vercel kv flush
```

---

## 💰 ค่าใช้จ่าย

ทั้งหมด **ฟรี** ภายใต้ free tier:
- Vercel: 100 GB bandwidth/เดือน
- Vercel KV: 30k requests/วัน, 256 MB storage
- Discord OAuth: ฟรี

สำหรับโหวตเล็ก ๆ ใน Discord เกินพอครับ
