# 21.8.0 — Yerel geliştirme ve doğrulama

26 Ekim 2026 tarihinde `b15b2e0` üzerine hazırlanmıştır. Dal: `improve-reliability-usability-20261026`. Değişiklikler yereldir; GitHub'a gönderme, yayınlama veya canlı veritabanı değişikliği yapılmamıştır.

## Tamamlananlar

| İnceleme alanı | Bu pakette yapılan |
|---|---|
| İki sekmede kayıt kaybı | Web Locks tek yazıcı, salt okunur ikinci sekme, güncel kayıt ve eşitleme bayraklarıyla devralma; eski kopyaya karşı birleştirme/çakışma kontrolü |
| Başarısız cihaz kaydı | Eski kayıt akışlarında geri alma, formu koruma ve başarısızlığı sonlandıran arayüz koruması |
| Satış kuralları | Web ve MCP için ortak arınma/damızlık kontrolü; kaynak eşitliği testi |
| Windows test hataları | CRLF uyumlu import temizleme, metin dosyası satır sonu ayarları |
| Geri gezinme | Varsayılan history akışının gerçek tarayıcı testi; isteğe bağlı native yolun ayrı testi |
| Performans | Hayvan/kayıt indeksleri, yalnız değişen tartımları hesaplama, açık ekranı yenileme, arama gecikmesi, 100'er hayvan gösterimi |
| Günlük kullanım | Öncelikli işler üstte, özelleştirilebilir 1–4 kısayol, küpeyi yaz/okut ve son açılanlar |
| Tartım | Tarih seçimi, grup filtresi, giriş sayacı, kullanıcı/işletmeye bağlı taslak ve yeniden açmada devam |
| Eşitleme | Bekleyen değişiklik listesi, son başarılı gönderim zamanı; karşılaştırmalı kayıt/alan çakışma seçimi |
| İşletme yönetimi | Mevcut finans kayıtlarında alacak/borç durumu, kayıtlı tüketim/grup gelir dağılımı, açık varsayımlı sezon raporu |
| Görevler/geçmiş | Tarih ve sorumlu kişi, yarına erteleme, tamamlanma kaydı ve yeniden açma; web/MCP değişiklik geçmişi |
| Erişilebilirlik | Eksik alan adları, duyurulan durum mesajları; mevcut modal odak yönetimi korunur |
| Bakım/kurulum | Kaynak modülleri ve tek HTML eşitleyicisi, README, ortam kontrolü, yalıtılmış yerel sunucu, Windows/Linux CI tanımı |
| Eski yayınlar | Kaynakları koruyup yayın çıktısında eski adresleri güncel sürüme yönlendirme |

## Doğrulama kanıtları

Hedef akış: kullanıcının bir kayıt formunu açması → doğrulanmış cihaz yazması → yeniden açmada aynı kaydı görmesi. Sunucuyla ilgili domain kuralları, canlı sistem yerine yalıtılmış istemcilerle sınanmıştır.

| Sınır | Sonuç / kanıt |
|---|---|
| Kaynak → tek HTML | `node scripts/sync-web.cjs --check` başarılı |
| Yerel regresyonlar | Mevcut 22 dosya + reliability + business-tools: 24 dosya başarılı |
| Gerçek tarayıcı | `browser.cjs`: sekme kilidi/devralma, history geri dönüş, taslak/yeniden yükleme, form düğmesi üzerinden kota hatası başarılı |
| Alternatif native yol | `native-back-browser.cjs`: CloseWatcher destekli Chromium'da modal, ekran, çıkış devri ve tekrar açma başarılı; varsayılan ürün yolu history olarak kalır |
| HTTP → arayüz → kayıt | `preview-server.cjs`: sunucu başlatma, gerçek form tıklaması, ayrı localStorage anahtarı, yeniden yükleme başarılı |
| Özel kaynakların sunulmaması | `.git`, SQL, yedek, sunucu ve web kaynak yolları HTTP 404; desteklenmeyen yazma isteği 405 |
| Finans doğruluğu | Ödeme durumu gelir/gider toplamlarını değiştirmiyor; fazla ödeme ve açıklamasız azaltma reddediliyor; yem/satış dağıtımında toplam korunuyor |
| Çakışma/geçmiş | Farklı alanlar birleştiriliyor; seçim bağımsız alanları koruyor; eski geçmiş nesneleri sonraki düzenlemeyle değişmiyor |
| Mobil görünüm | 390×844 Chromium'da ana ekran/sürü/tartım ve yedi yeni yönetim paneli kontrol edildi; sayfa hatası ve yatay modal taşması yok |
| Canlı Supabase | Bağlanılmadı; veriler, şema ve kayıtlar değiştirilmedi. Canlı MCP yayını doğrulanmış değildir |
| Android/hardware | JDK 8 bulundu; JDK 17/Gradle/SDK eksikleri nedeniyle fiziksel Android, kamera, RFID ve ödeme/push teslimi doğrulanmış değildir |

## Performans

Tekil tanısal ölçümler: bu bilgisayarda masaüstü headless Chromium, 390×844 görünüm, CPU yavaşlatması yok, her hayvana 10 yapay tartım. Önceki ölçüm bütün panelleri yenileyen davranışı, yeni ölçüm açık ana ekranı yenileyen davranışı ölçer; bu, yapılan optimizasyonun amacıdır. Sürü listesi yeni sürümde ilk 100 kartı gösterir; arama ve toplam sayılar bütün hayvanları kapsar.

| Hayvan / kayıt | Önce genel yenileme | Yeni ana ekran | Önce sürü listesi | Yeni ilk 100 kart |
|---|---:|---:|---:|---:|
| 20 / 200 | 24 ms | 5 ms | 3 ms | 2 ms |
| 100 / 1.000 | 62 ms | 8 ms | 19 ms | 9 ms |
| 300 / 3.000 | 423 ms | 14 ms | 76 ms | 7 ms |
| 1.000 / 10.000 | 2.747 ms | 30 ms | 460 ms | 17 ms |

Telefon performansı veya kalıcı hizmet garantisi değildir. Gerçek cihazda tekrar ölçülmelidir. Tekrarlanabilir komut: `npm run benchmark`.

## Korunanlar ve sınırlar

Hayvan kimlikleri, geçmiş sürü ve finans kayıtları, TL kayıt anlamı, mevcut JSON veri kaynağı ve önceki HTML kaynakları korunur. Ödeme takibi mevcut kayda metadata ekler; ikinci bir gelir/gider kaydı üretmez. Geri alınan/silinen işlemlerin önceki değerleri yeni uygulama geçmişinde bulunur; bu, veri tabanı düzeyinde silme yasağı veya değiştirilemez denetim izi değildir.

Yetkili temel Supabase şeması olmadan tam başlangıç göçü eklenmedi. IndexedDB ve artımlı eşitleme henüz uygulanmadı; mevcut eşitleme bütün `farm_state` JSON'unu kullanmaya devam eder. Kamera kodu tarayıcı desteğine bağlıdır ve fiziksel okuyucu/telefon testi bekler. Otomatik cihaz dışı yedekleme ve değiştirilemez sunucu günlüğü ayrıca tasarlanmalıdır.

## Yerel inceleme

`npm start` ile bulutu kapalı önizleme açılır. Değişiklikleri canlıya taşımadan önce gerçek cihaz kontrolleri ve sunucu kaynaklarının yayın planı ayrı doğrulanmalıdır. Web arayüzü ve MCP fonksiyonu birlikte güncellenmelidir; yalnız web yayını MCP sunucusunu güncellemez.
