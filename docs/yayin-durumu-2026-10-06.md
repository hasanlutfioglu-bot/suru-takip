# Yayın Hazırlığı — 6 Ekim 2026

## Tamamlanan işler

- V21.4 web yayını başarılı; canlı kayıt menüsü kontrol edildi.
- Son mağaza açıklaması güncellendi; koçluk ayırma, durum bilgisi, hızlı tartım ve küpe ekleme anlatıldı.
- 512×512 ikon ve 1024×500 feature graphic mevcut.
- Türkçe kısa kullanım rehberi ve 90 saniyelik sessiz MP4 hazırlandı.
- Tüm npm test paketi geçti: menüler, kayıtlar, tartım, satış ve geri alma, doğum bağlantıları, yedek dönüşü, çevrimdışı kayıtlar, hesap izolasyonu, dil ve geri gezinme.
- Canlı tarayıcıda yerel DEMO-001 kuzu kaydı açıldı; 42 kg başlangıç ve 45,5 kg tartım kaydı tarih ile doğrulandı. Hayvan kartı ve yedekleme ekranları açıldı.
- Kullanıcının açıklamasıyla toplam doğrulandı: 38 hayvanın biri satıldı, 37 hayvan kaldı; bu konuda açık hata yok.

## Tamamlanmış sayılmayan kontroller

- Android SDK ve Gradle bu çalışma ortamında bulunmadığından yeni APK/AAB derlenmedi. İmzalı yayın paketi üretilmiş değildir.
- Gerçek Android telefon, küçük ekran dokunma alanları, Play ödeme ve satın alma geri yükleme testleri tamamlanmadı. Video tarayıcı ekranlarından hazırlanmıştır.
- Play Console geliştirici doğrulaması ve üretim erişimi bu oturumda görülmedi.
- Kök alan adı doğrulama dosyası ve Play uygulama imza sertifikası tamamlanmadı.
- Gizlilik taslağında sağlayıcı bölgesi ve yedek/log saklama süreleri doğrulanmadı; taslak final politika değildir.

## Bilgisayardan son sıra

1. Play Console hesabındaki doğrulama/eksik görevleri aç. Gelen e-posta yerine Console’daki mevcut durumu esas al.
2. Mevcut upload key’i güvenli ortamda kullan. Yeni anahtarı mevcut kayıtlı anahtarın yerine gelişigüzel oluşturma.
3. Android Studio’da android klasörünü aç; JDK 17, SDK 36, Gradle 8.13 ile signed bundle oluştur. Paket adı com.hasanlutfioglu.surutakip; mevcut versionCode 2, versionName 1.0.1. Console’da 2 kullanıldıysa yalnız yeni yükleme için versionCode artırılmalı.
4. Play App Signing SHA-256 sertifikasını al. https://hasanlutfioglu-bot.github.io/.well-known/assetlinks.json kök yolu doğru sertifikayı içermeli; /suru-takip/ alt yolu TWA doğrulaması için yeterli değil.
5. Internal/closed test kanalına imzalı AAB’yi yükle. Gerçek telefon üzerinden giriş, sürü, tartım, yedek ve varsa abonelik işlemlerini doğrula.
6. Son mağaza metinlerini, gerçek Android ekran görüntülerini, final gizlilik URL’sini, veri güvenliği ve içerik derecelendirmesini tamamla.
7. Hesaba uygulanıyorsa kapalı test şartlarını tamamlayıp üretim erişimine başvur. Yeni kişisel geliştirici hesaplarında 12 testçi / 14 gün şartı vardır; kendi hesabının Console ekranı esas alınır.

## Resmî kaynaklar

- https://support.google.com/googleplay/android-developer/answer/14151465
- https://support.google.com/googleplay/android-developer/answer/9845334
- https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
- https://developer.android.com/training/app-links/configure-assetlinks
