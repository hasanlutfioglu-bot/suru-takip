# Sürü Takip — Sabah yayın hazırlığı

Amaç: Play Store'da imzalı ve ödeme/giriş/silme akışları doğrulanmış Android uygulaması. Aşağıdaki sıra dış hesap erişimi gerektiren işleri azaltır.

## Hasan ile birlikte yapılacak sıra

1. **Play Console hesabı**: geliştirici hesabı mevcut mu, kimlik/iletişim doğrulaması tamam mı? Uygulamanın paket adı `com.hasanlutfioglu.surutakip`. Hesap türüne göre Console'un istediği kapalı test şartlarını izleyelim; gün/sayı garantisi vermeyelim.
2. **Geliştirici bilgileri**: mağazada görünen ad, destek/gizlilik e-postası ve gerekli adres. Son gizlilik metnini bu bilgiler ve sağlayıcı saklama süreleriyle tamamlayalım.
3. **Domain**: root GitHub Pages reposu veya özel domain seçelim. TWA dosyası origin kökünde `/.well-known/assetlinks.json` olmalı; `/suru-takip/.well-known/` yeterli değil. Sertifika değerini uydurmayalım.
4. **Play App Signing**: Play'deki app signing SHA-256 sertifikasını alalım. Upload key ve app signing key farklı olabilir. Özel anahtar/parola sohbet veya GitHub kaynak dosyalarına yazılmayacak.
5. **İmzalı AAB**: Android Studio veya CI güvenli secrets ile release signing. Mevcut CI çıktısı imzasız AAB/test APK; doğrudan üretim yayını sayılmaz. Önce internal/closed test yüklemesi.
6. **Ürünler**: `suru_pro_monthly` ve `suru_pro_yearly` abonelikleri, base plan/ülke/fiyat/vergiler. Uygulamadaki 99/990 TL seçimi niyet fiyatıdır; ödeme sheet'inde Google ürün fiyatı kullanılır.
7. **Google Play Developer API**: hizmet hesabını ilgili uygulamaya yetkilendir; `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` değerini sadece Supabase Secrets'e ekle. JSON anahtarını bana sohbet içinde gönderme.
8. **RTDN**: `docs/play-notifications-setup.md` adımlarını yapalım. Kimliği doğrulanan Pub/Sub push, test bildirimi ve sunucu yanıtını kontrol etmeden “yenileme çalışıyor” demeyelim.
9. **Gerçek telefon**: Play test kanalından yükle; Chrome/TWA origin doğrulaması, Google giriş ve sürü açılması. Satın al/geri yükle/uygulamayı yeniden aç/yenileme/ödeme sorunu/iptal/iade ve hak kaldırma akışları.
10. **Silme testi**: üretim sürüsü yerine özel bir test Google hesabı. Yedek indir, sil, yeni girişte eski sürünün gelmediğini ve eski oturumun bulut verisine erişemediğini doğrula. Paylaşılan çiftlikte çözüm yolunu ayrıca tamamlayalım.
11. **Mağaza formu**: veri güvenliği, içerik derecelendirmesi, hedef kitle, gizlilik URL'si, hesap silme URL'si, ikon/feature graphic/gerçek ekran görüntüleri. Hazırlanan metin taslağı `store/listing-tr.md`.
12. **Pilot**: iki cihazla offline düzenleme/yeniden bağlanma, uzun listeler, küçük ekran ve yedekten dönüş. Sonra üretime geçiş.

## Hazırlanan teknik yollar

- Web uygulaması: `https://hasanlutfioglu-bot.github.io/suru-takip/v21.html`
- Hesap silme bilgisi/başlatma: `https://hasanlutfioglu-bot.github.io/suru-takip/delete-account.html`
- Veri akışı bilgisi: `https://hasanlutfioglu-bot.github.io/suru-takip/data-info.html` (tam hukuki gizlilik politikasının yerine geçmez)
- Bildirim sunucusu: `https://nqbfyahiijdkrroojlct.supabase.co/functions/v1/play-notifications`

## Açık kararlar

İletişim ve resmî geliştirici bilgileri, domain, sertifika, Play ürünleri/izinleri, gerçek cihaz testleri, paylaşılan çiftlik sahiplik devri/destek yolu ve sağlayıcı saklama süreleri. Bunlar eksikse mağaza onayı veya satışa tam hazır olma iddiası yok.
