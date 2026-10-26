# Raporlar — 21.8.3

Raporlar bölümünde önce dönem tarihleri ve kayıt sayıları, ardından kayıtlı gelir − gider sonucu gösterilir. Kapsam ve güncellik açıklaması açılabilir. Genel, Finans, Sürü ve Arşiv aynı renk ve tipografi sistemini kullanır. Doğum oranları, takip sinyalleri, gider dağılımı ve kayıt ayrıntıları isimlendirilmiş bölümlerdedir.

## Düzeltilen hesaplar

- Önceki dönem, seyrek kayıtların ilk/son tarihinden türetilmez. Aylık rapor önceki takvim ayı, yıllık rapor önceki takvim yılı, iki ucu belirli özel aralık veya doğum dönemi ise hemen önceki eşit gün sayılı aralıkla karşılaştırılır. Devam eden dönem ile tamamlanmış önceki dönemin farkı açıkça belirtilir. Tüm zamanlar ve tek ucu açık aralıklarda karşılaştırma uydurulmaz. Önceki dönemde finans kaydı yoksa fark gösterilmez.
- Gider özetleri, grafik ve kategori detayları ortak sınıflandırma kullanır. Önce kayıtlı kategori, ardından açıklama/stok kalemi ve not incelenir. Tarla ilaçlaması veteriner giderine ikinci kez girmez. Gelir ve gider kırılımları birbirine eklenmez.
- Dönem içi kuzu artışı artık not metnine bağımlı değildir. Geçerli tartım alanlarından dönem içindeki ilk/son farklı tarihli ölçüm ve gün farkıyla hesaplanır; aynı gün kayıtları birleştirilir. Son iki tartıma dayanan Kuzu Gelişim ekranından farkı açıklanır.
- Güncel gelişim göstergesinde iki tartımı bulunmayan kuzu "normal" sayılmaz. Benzer grup kıyasları Kuzu Gelişim ile aynı grup kurallarını kullanır. Ölçülen sıfır artış veri yok şeklinde gösterilmez.
- Satış hazırlığı sayımında koçluk için ayrılanlar dışlanır. Sayım kutuları hayvan listesini, değer kutuları değer hesabını açar; 30 kg altındaki yaşça hazır kuzuların sayımda bulunup değer hesabında bulunmaması açıklanır.

## Anlam ve kapsam

Kayıtlı finans sonucu tahsilat veya net kâr olarak sunulmaz; stok alışları giderdir. Tahmini kuzu satış değeri farklı renkle ve gerçekleşmiş gelirden ayrı gösterilir. Bugünkü sürü, stok ve satış hazırlığı dönem sonu envanteri değildir.

Doğum kaydı olmayan anaç için kesin "doğurmadı" ifadesi kaldırıldı. Anaç oranının paydası aktif anaçlarla dönemde doğurmuş eski/eksik kartlı annelerin birleşimidir. Koça verilen anaç sayısı bilinmediği için bu oranın üreme başarısını ölçmediği açıklanır. Uzun aralıkta aynı annenin birden fazla doğumunun kuzu/anaç göstergesine etkisi belirtilir.

Finans grafiğinde para ölçeği, yıl içeren ay etiketleri, nokta tutarları ve açılabilir aylık tablo vardır. Son altı takvim ayı seçili bitiş ayına bağlanır; gelecek aylar dışlanır. Bu grafik seçili aralığın toplamı gibi sunulmaz.

## Doğrulama

Yeni hesap testi: eşit aralık, artık yıl, seyrek kayıt, açık tarih, kategori toplamları/detayları, notsuz sayısal tartım, eksik veri ve geçmiş grafik kapsamı. Yeni Chromium testi: dört rapor sekmesi × 320/390/768/1440 px, kapsam ve tablo açılması, kategori detayı, tarayıcı hataları ve kayıtların değişmemesi. Mevcut regresyon paketi de çalıştırılır. Testler izole ve sentetik verilidir; canlı Supabase verisine erişmez.
