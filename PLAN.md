# Voyage AI Chatbot — Plan

## Genel bakış

Next.js 16 + Vercel AI SDK tabanlı, çoklu model destekli bir sohbet asistanı. Sohbet geçmişi yerel SQLite'ta tutulur, Amazon Bedrock ve Google Gemini üzerinden modellere erişilir.

## Tamamlananlar

- [x] Proje lokalde çalışır hale getirildi (`npm run dev`, `http://localhost:3000`).
- [x] Google Gemini entegrasyonu eklendi (`@ai-sdk/google`), ücretsiz kotayla varsayılan model olarak ayarlandı (`gemini-flash-latest` / `gemini-pro-latest`).
- [x] Marka adı "Exposure AI" → "Voyage AI" olarak güncellendi (sayfa başlığı, kenar çubuğu, sohbet başlığı, README).

## Bilinen sınırlar

- **Anthropic API**: `ANTHROPIC_API_KEY` tanımlı ama hesapta kredi yok — Claude modelleri şu an çalışmıyor, kredi yüklenince otomatik aktif olur.
- **LinkedIn aracı**: Herkese açık sayfa okuma girişimi; LinkedIn authwall gösterirse profil okunamaz.
- **YouTube özeti**: Videoda altyazı/transkript yoksa özetlenemez.
- **Sohbet geçmişi**: Tek kullanıcılı, `~/.exposure-ai-chatbot/chat.db` altında tutuluyor (dizin adı marka değişikliğinden önceki haliyle bırakıldı — mevcut geçmişi kaybetmemek için kasıtlı).
- **Eski sohbet başlıkları**: Bazı geçmiş sohbet başlıklarında Türkçe karakter encode sorunu var (`k�saca` gibi) — kayıt sırasında oluşmuş, henüz düzeltilmedi.

## Önerilen sonraki adımlar

1. Bozuk karakterli eski sohbet başlıklarını düzelt (encoding sorununun kaynağını bul, gerekirse DB'deki kayıtları temizle/yeniden adlandır).
2. Test amaçlı biriken çok sayıda "merhaba" başlıklı sohbeti temizle (DB'den silme veya toplu silme özelliği).
3. `~/.exposure-ai-chatbot` veri dizinini `~/.voyage-ai-chatbot` olarak taşımak istenirse: mevcut `chat.db` dosyasını yeni dizine kopyala, sonra `src/lib/db/client.ts` içindeki varsayılan yolu güncelle.
4. Favicon / logo gibi görsel marka öğelerini "Voyage AI" kimliğine göre gözden geçir (şu an sadece metin değişti, ikon aynı `Sparkles` simgesi).
5. `package.json` içindeki proje adı (`ai-chatbot`) istenirse `voyage-ai-chatbot` olarak güncellenebilir (kozmetik, işlevi etkilemez).
6. Anthropic hesabına kredi yüklenirse Claude modellerinin hâlâ doğru çalıştığını test et.
