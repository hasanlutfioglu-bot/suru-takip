# Sürü Takip

Koyun/kuzu kayıtları, tartım, üreme, sağlık, yem ve finans için çevrimdışı çalışabilen web uygulaması. Güncel sürüm: **21.8.1**.

## Kurulum ve yerel önizleme

Node.js 24 veya üzeri ve npm gerekir:

```sh
npm ci
npx playwright install chromium --only-shell
npm run check:environment
npm start
```

Önizleme: `http://127.0.0.1:4173/v21.html`.

`npm start` varsayılan olarak bulutu kapatır, farklı bir cihaz kayıt anahtarı kullanır ve yerel özellik incelemesi için PRO ekranlarını açar. Gerçek sürü kayıtları örnek verilerle doldurulmaz. Önizlemede oluşturulan kayıtlar yalnız o tarayıcının önizleme alanındadır. Sunucu yalnız localhost'ta dinler; veritabanı betikleri, Git, yedekler ve sunucu kaynakları sunulmaz.

Bulut bağlantısı gerekiyorsa geliştirici açıkça `npm start -- --cloud` kullanmalıdır. Bu seçenek canlı servislerin kullanılmasına izin verir; normal yerel geliştirme ve test için gerekli değildir.

Bu bilgisayardaki Codex ortamında npm doğrudan komut olarak bulunmuyorsa aynı komutlar `pnpm.cmd --package=npm dlx npm ...` üzerinden çalıştırılabilir. Örneğin `pnpm.cmd --package=npm dlx npm run test:all`.

## Kontroller

```sh
npm test                 # 24 yerel regresyon dosyası ve kaynak eşitliği
npm run test:browser     # 3 gerçek Chromium/HTTP test grubu
npm run test:all         # İkisi birlikte
npm run benchmark       # Yalıtılmış yapay sürülerle performans ölçümü
npm run build           # Kaynakları eşitle ve _site/ yayın klasörünü oluştur
```

Linux'ta tarayıcı sistem bağımlılıkları için `npx playwright install chromium --only-shell --with-deps` kullanılabilir. CI hem Windows hem Linux'ta çalışacak şekilde yapılandırılmıştır. Buradaki yerel doğrulama Windows'ta yapılmıştır; GitHub CI'ın çalışması için değişikliklerin ayrıca GitHub'a gönderilmesi gerekir.

Testler canlı Supabase'e veri yazmaz. Tarayıcı testleri ağ isteklerini yalıtır; finans, hesap silme ve ödeme servisleri sahte istemcilerle sınanır. Fiziksel telefon, ödeme sağlayıcısı ve push teslimi bu testlerin yerine geçmez.

## Kaynakların düzeni

- `v21.html`: çevrimdışı dağıtılan uygulama; eski ekranların kaynağı burada bulunur.
- `web/`: yeni cihaz koruması, geçmiş, çakışma incelemesi, tartım taslakları, işletme raporları ve küpe arama modülleri.
- `supabase/functions/_shared/`: web ile MCP'nin ortak satış ve değişiklik geçmişi kuralları.
- `scripts/sync-web.cjs`: işaretlenmiş modülleri tek HTML dosyasına gömer. `web/` veya ortak modül değiştirildikten sonra `npm run build` çalıştırılmalıdır. `npm test` iki kopya ayrışmışsa başarısız olur.
- `supabase/functions/`: sunucu fonksiyonları; yerel değişiklikler bunları kendiliğinden yayımlamaz.
- `db/`: mevcut kurulum üzerine uygulanan SQL betikleri; **tam bir sıfırdan kurulum şeması değildir**.
- `android/`: Android TWA projesi; gereksinimleri kendi README dosyasındadır.
- `_site/`: oluşturulan yayın dosyaları, Git'e dahil edilmez. Eski sürüm adresleri güncel uygulamaya yönlendirilir; eski kaynaklar depoda korunur.

## Kayıt güvenliği ve yeni özellikler

- Destekleyen tarayıcıda Web Locks ile tek düzenleyen sekme kullanılır. İkinci sekme salt okunurdur; ilk sekme kapanınca güncel kayıt ve bekleyen eşitleme bilgileriyle devralır. Web Locks bulunmayan ortamlarda son cihaz kopyası kontrol edilir; bağımsız değişiklikler birleştirilir, çakışma yazmayı durdurur.
- Kalıcı yazma/validasyon hatasında işlem geri alınır; form açık kalır. İsteğe bağlı cihaz bağlamı yazmasının başarısız olması, başarılı asıl kaydı başarısız saydırmaz.
- Tartım taslağı kullanıcı/işletme alanına bağlıdır. Grup filtresi yalnız görünümü değiştirir; bütün girilen tartımlar kaydedilir. Taslak, hayvanın ve tarihin geçerliliği kaydetme sırasında yeniden denetlenmeden kayda dönüşmez.
- Alacak/borç ekranı mevcut finans kaydına ödeme durumu ekler; aynı tutarı ikinci kez gelir/gider yazmaz. Eski, izlenmeyen kayıtlar ödenmiş kabul edilmez.
- Sezon oranları eksik yavru bağlantılarından tahmin edilmez. Grup maliyeti net kâr değildir; ekranda kullanılan dağıtım varsayımı açıklanır.
- Değişiklik geçmişi yedek ve eşitlemeye dahildir. Bu, sunucuda değiştirilemez bir güvenlik denetim kaydı değildir. Geçmiş zamanla büyür; uzun vadeli depolama mimarisi aşağıdaki yol haritasındadır.
- QR/barkod kamera özelliği destekleyen tarayıcı ve izin gerektirir. `suru:tag:KÜPE` veya düz küpe değeri okunabilir. Klavye gibi çalışan okuyucu ve elle giriş alternatifi bulunur. Fiziksel RFID/Bluetooth entegrasyonu yapılmış sayılmaz.

## Canlı sistem ve sonraki aşamalar

Bu sürümü incelemek/test etmek için canlı veritabanı göçü gerekmez. Mevcut Supabase verileri değiştirilmemiştir. Sunucu tarafındaki MCP düzeltmesinin canlıya geçmesi, ilgili Edge Function'ın ayrıca yayımlanmasını gerektirir.

Yetkili temel şema, mevcut fonksiyonlar, RLS ve yetkiler doğrulanmadan yeni bir başlangıç şeması uydurulmamalıdır. Şema, veri içermeyen yetkili bir dışa aktarımdan üretildiğinde yerel başlangıç göçleri ve veritabanı testleri tamamlanabilir. Ödeme, OAuth, cron veya push sırları depoya konulmamalıdır.

IndexedDB işlem kuyruğu, artımlı bulut eşitlemesi, sunucuda değiştirilemez denetim izi ve cihaz dışı yedekleme ayrı mimari geçişlerdir. Mevcut JSON kaydı/kimlikleri bu aşamada değiştirilmemiştir. Fiziksel Android testleri için JDK 17, Gradle 8.13, SDK 36 ve gerçek cihaz gereklidir.

Ayrıntılar: [21.8.0 geliştirme ve doğrulama notları](docs/improvements-21.8.0.md).
