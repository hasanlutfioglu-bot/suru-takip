# Sürü Takip 21.7.0

Bu sürüm mevcut 21.6.0 uygulamasını geliştirir. Hayvan kimlikleri, eski kayıtlar,
farm_state JSON kaynağı, üyelik sınırları ve eşitleme akışı korunur. Gerçek sürüye
örnek kayıt veya veri dönüşümü yazılmamıştır.

## Kullanım

- Sürü > ⋯: toplu sağlık/aşı, gruplar, CSV aktarımı; tür, sıralama ve grup
  seçimleri açılan kontrol alanında bulunur.
- Hayvan kartı: Özet, Geçmiş, İşlemler. İşlemlerden soy bilgileri, profil fotoğrafı,
  üreme/gebelik ve sütten kesim açılır. Aynı kayıt iki ayrı geçmiş listesinde tekrarlanmaz.
- Kayıt Ekle: toplu sağlık, üreme, sütten kesim ve yem tüketimi eklendi.
- Ana sayfa: bu ay gelir eksi gider, satışa hazır kuzular ve bugünkü işler.
  Doğum oranı ve tahmini satış değeri Diğer Göstergeler içinde korunur.
- Raporlar: temel göstergeler önce, ayrıntılı analizler açılan bölümlerde.
- Hızlı tartım: sayısal klavye, önceki kilo, sonraki hayvana geçiş ve erişilebilir
  kaydet düğmesi. Mevcut aylık/satılacak kuzu ayrımı korunur.

## Kayıtların anlamı

Toplu sağlık, seçilen her hayvana ayrı health kaydı yazar. İlaç/doz kullanıcı
bilgisidir; uygulama doz veya arınma süresi önermez. Girilen et arınma günü
uygulama tarihinden hesaplanır. Son arınma tarihi dahil uyarı ve satış koruması
vardır. Hatalı bilgiler mevcut sağlık kaydından düzenlenebilir.

breeding ve pregnancy kayıtları hayvan bazında üreme durumunu belirler. Koç katımı
147 günlük tahmini tarih oluşturur; kullanıcı farklı tahmini tarih girebilir.
Gebelik, kontrol sonucu olmadan doğrulanmış sayılmaz. Yeni doğum önceki gebelik
uyarısını kapatır. Mevcut sürü koç takvimi ayrıca çalışmaya devam eder.

Yeni doğumda yalnız bilinen baba seçilir. Aile bağlantıları kendisine veya
soyundan gelen hayvana işaret edemez; ebeveyn yavrudan önce doğmuş olmalıdır.
Doğumla bağlanan anne, soy düzenlemesinde değiştirilmez.

weaning kaydı isteğe bağlı tarihlenmiş tartım oluşturur. Geri alma bu kayıtla
oluşturulan tartımı da kaldırır. Var olan aynı gün tartımı ikinci kez oluşturulmaz.

feeding kaydı seçilen hayvanlara verilen toplam miktarı stoktan düşer. Birim
stokta kullanılan birimdir; belirsiz/karışık birimler tüketimde kabul edilmez.
Birim maliyet verilirse toplam tüketim maliyeti seçilen hayvanlara eşit dağılır.
Bu dağıtım ölçülmüş bireysel tüketim değildir. Satın alma gideri finans içinde
tekrar yazılmaz. Kalan gün, son 7 takvim gününün kaydedilmiş tüketim ortalamasıdır.
Tüketilmiş stok alışını düzeltmek/silmek için önce ilgili tüketimleri geri almak
 gerekir; böylece negatif veya hayali stok oluşmaz.

Profil fotoğrafları cihazda 160x160 JPEG olarak yeniden kodlanır; metadata taşınmaz.
Fotoğraf başına en fazla 24.000, sürü genelinde 500.000 karakter sınırı vardır.
Fotoğraflar mevcut yedek/eşitleme kaydına dahildir, çevrimdışı görüntülenir.

## CSV aktarımı

Excel'den CSV UTF-8 olarak kaydedilmiş dosyalar kabul edilir. Doğrudan XLSX
okunmaz. Başlıklar: kupe,tur,cinsiyet,dogum,kilo,anne,baba,grup; İngilizce
karşılıklar da desteklenir. Tarih YYYY-MM-DD, anne ve baba küpe numarasıdır.
Baştaki sıfırlar korunur. 1–500 hayvan, tekrarlı küpe, tarih, ebeveyn döngüsü ve
paket sınırları kontrol edilir. Önizleme kayıt yapmaz; aktarımda tekrar kontrol
edilir. Eski kayıtlar değiştirilmez. Aktarım geri alınırken sonraki bağlantılar
varsa işlem durdurulur.

## Para birimi ve bildirimler

Tüm Menüler > Para Birimi ve Kur: kayıt ve veri girişleri TL kalır. Raporların
GBP/EUR/USD görünümü, kullanıcının tarihli TL/döviz kuru üzerinden hesaplanır.
Otomatik güncel kur alınmaz; kur bilinmiyorsa TL gösterilir.

Tüm Menüler > Telefon Bildirimleri: Google girişi, seçili çiftlik ve cihazda
bildirim izni gerekir. iPhone'da Safari'den ana ekrana eklenmiş uygulama gerekir.
Bildirimler son eşitlenen kayıtlardan, kullanıcı saat diliminde seçilen saatte
hazırlanır. Yerel/offline değişiklikler eşitlenince sunucuya ulaşır. Bir cihaz için
her gün en fazla bir görev bildirimi; test bildirimi ayrı ve dakikada bir ile sınırlıdır.
Telefon teslimi cihaz/tarayıcı desteği ve kullanıcı iznine bağlıdır.

flock-reminders Edge Function, doğrulanmış kullanıcıyla üyelik kontrolü yapar.
Zamanlayıcı ayrı gizli token ile doğrulanır. VAPID özel anahtarı ve abonelikler
istemciye açık değildir; yeni tablolar RLS ve erişim iptaliyle yalnız sunucudan
kullanılır. Push hedefleri bilinen tarayıcı servisleriyle sınırlandırılır.
pg_cron saatte bir tetiklenir; sırası gelen cihazlara görev varsa bildirim gönderilir.
Üyelik kaybedilen/sona eren abonelikler temizlenir. Oturum kapatmak cihazdaki
aboneliği kapatır. Gizli anahtarlar git deposuna yazılmaz.

## Doğrulama ve geri dönüş

`npm test` eski regresyonları, operations, reminders ve push-security testlerini
çalıştırır. Yeni testler toplu işlemlerde atomiklik, eski finansın korunması,
izinler, soy bağlantıları, stok geri alma, CSV kimlikleri ve bildirim yetkilendirmesini
kontrol eder. Mobil tarayıcı kontrolleri yapay verilerle yalıtılmış oturumda yapılır.
Gerçek telefonun bildirim teslimi, izin verilmeden doğrulanmış kabul edilmez.

Ekran geri dönüşü gerektiğinde ilgili commit revert edilir ve sw.js cache anahtarı
yenilenir. Güncel farm_state geri sarılmaz. Yeni kayıtlar ve fotoğraflar korunur.
Bildirimler durdurulacaksa yalnız `flock-daily-reminders` cron görevi kapatılır;
hayvan kayıtları silinmez.
