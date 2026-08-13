# Voyage AI Chatbot

Next.js 16 + Vercel AI SDK ile geliştirilmiş, Amazon Bedrock üzerinden çoklu modele erişen bir yapay zeka sohbet asistanı.

## Özellikler

- **Herhangi bir yayın kuruluşunun son haberleri** — `getNews` aracı, tanınan kuruluşlar için RSS beslemesi kullanır; tanımadığı herhangi bir site/kuruluş için Google News RSS'e otomatik geçer. ("BBC'nin son 5 haberini göster", "hurriyet.com.tr son haberleri" gibi.)
- **Resim girdisi** — Sohbete resim sürükleyip bırakabilir, yapıştırabilir veya seçebilirsin (görsel destekleyen modellerde).
- **Birden fazla model** — Tek bir AWS Bedrock hesabıyla Claude, Llama, Amazon Nova, Mistral, DeepSeek ve GPT-OSS arasında sohbet ortasında bile geçiş yapabilirsin.
- **Sohbet geçmişi** — Tüm sohbetler yerel bir SQLite veritabanında saklanır; kenar çubuğundan eski sohbetlere dönebilir, silebilirsin.
- **Karakter karakter streaming** — Yanıtlar token/kelime bazlı akışla, yazarken göründüğü gibi ekrana gelir.
- **(Bonus) LinkedIn profili okuma** — `getLinkedInProfile` aracı herkese açık bir LinkedIn profilinin metnini okumaya çalışır. LinkedIn oturum açmayı zorunlu kılarsa (authwall) bunu açıkça belirtir — bu, LinkedIn'in kendi kısıtlamasından kaynaklanan bilinen bir sınırdır.
- **(Bonus) YouTube video özeti** — `summarizeYoutubeVideo` aracı video başlığını ve altyazı transkriptini çeker; modelin kendisi bu transkripti okuyup sadık bir özet yazar.

## Teknoloji

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/amazon-bedrock`) — streaming, araç (tool) çağırma, çoklu adım
- **shadcn/ui** (Radix UI tabanlı) + `Streamdown` (stream-safe markdown render)
- **Drizzle ORM + @vercel/postgres** — bulut tabanlı (Neon) sohbet geçmişi
- **rss-parser** — haber aracı için

## Kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` dosyasını doldur — bkz. [Amazon Bedrock kurulumu](#amazon-bedrock-kurulumu) aşağıda.

```bash
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç. Kök sayfa otomatik olarak yeni bir sohbete yönlendirir.

## Amazon Bedrock kurulumu

Bu proje modellere **Amazon Bedrock** üzerinden erişir — tek bir AWS hesabıyla birden fazla sağlayıcının (Anthropic, Meta, Amazon, Mistral, DeepSeek, OpenAI) modeline erişim sağlar.

1. **Model erişimini aç.** AWS Bedrock konsolunda → *Model access* → kullanmak istediğin modelleri (en azından bir Claude modeli) etkinleştir. Bu genelde anında onaylanır.
   https://console.aws.amazon.com/bedrock/home#/modelaccess
2. **Kimlik bilgisi oluştur.** İki yoldan biri:
   - **Standart AWS erişim anahtarı**: IAM kullanıcısı için `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` oluştur (Bedrock `InvokeModel`/`InvokeModelWithResponseStream` izniyle).
   - **Bedrock API anahtarı** (daha basit, tek değer): AWS konsolunda Bedrock → *API keys* → oluştur, `AWS_BEARER_TOKEN_BEDROCK` olarak kullan.
3. `.env.local` içine yaz, `AWS_REGION` değerini modellerin etkin olduğu bölgeyle eşleştir (varsayılan `us-east-1`).

Model kataloğu `src/lib/ai/models.ts` içinde tanımlı — hesabında farklı modeller etkinse buradaki listeyi güncelleyebilirsin. Model ID'leri Bedrock'un cross-region inference profile formatındadır (`us.anthropic....` gibi); bir modele erişimin yoksa sohbet ekranında anlaşılır bir hata mesajı gösterilir.

## Veritabanı kurulumu (Vercel Postgres)

Sohbet geçmişi Vercel Postgres (Neon) üzerinde tutulur — yerel bir dosya değil, bulut tabanlı bir bağlantı gerektirir (hem local geliştirmede hem deploy'da).

1. Vercel dashboard'da projenin **Storage** sekmesinden **Create Database → Postgres** ile bir veritabanı oluştur. Bu, projeye otomatik olarak `POSTGRES_URL` (ve ilgili diğer) ortam değişkenlerini ekler.
2. Vercel'in verdiği `POSTGRES_URL` değerini kopyalayıp yerel `.env.local` dosyana ekle (aynı veritabanını local'de de kullanabilirsin, veya `vercel env pull .env.local` ile otomatik çekebilirsin).
3. Tablolar ilk sorguda otomatik oluşturulur (`src/lib/db/client.ts` içindeki `ensureSchema`) — ayrı bir migration adımı gerekmez.

## Bilinen sınırlar

- **LinkedIn**: Resmi bir API kullanılmıyor; herkese açık sayfa `r.jina.ai` üzerinden okunmaya çalışılıyor. LinkedIn oturum duvarı (authwall) gösterirse profil okunamaz — bu açıkça belirtilir.
- **YouTube özeti**: Videonun altyazı/transkripti (otomatik veya manuel) yoksa özetlenemez.
- **Sohbet geçmişi**: Tek kullanıcılı, Vercel Postgres (Neon) üzerinde tutulur — çoklu kullanıcı/giriş sistemi yoktur, kapsam dışı bırakıldı.

## Proje yapısı

```
src/
  app/
    api/chat/route.ts        # Ana streaming endpoint (model + araçlar)
    api/chat/[id]/route.ts   # Sohbet mesajlarını getir / sohbeti sil
    api/history/route.ts     # Kenar çubuğu için sohbet listesi
    chat/[id]/page.tsx       # Sohbet sayfası
  components/chat/           # Sohbet arayüzü bileşenleri
  lib/ai/                    # Model kataloğu, prompt, araçlar (news/linkedin/youtube)
  lib/db/                    # Drizzle şeması ve sorgular
```
