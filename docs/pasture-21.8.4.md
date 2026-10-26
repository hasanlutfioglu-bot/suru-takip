# Güncel sürüye bağlı mera görünümü — 21.8.4

Ana sayfadaki sabit iki hayvanlı çizimin yerinde güncel sürü kayıtlarına göre oluşan, hafif hareketli SVG mera görünümü bulunur. Koyun, boynuzlu koç ve küçük kuzu figürleri farklıdır. Yürüme, baş eğme ve küçük bacak hareketleri CSS dönüşümleriyle sağlanır. Yeni sunucu, bağımlılık, dış görsel veya animasyon zamanlayıcısı yoktur.

## Sayım

Satıldı, Öldü ve Kesildi durumları dışlanır. Diğer hayvanlar mevcut ana sayfa sürü sayımıyla aynı aktiflik kuralına göre sayılır. Boş sürüde hayvan çizilmez. 24 hayvana kadar her figür bir aktif kaydı temsil eder; figürler belirli hayvan kimliği veya gerçek konum göstermez. Türü bilinmeyen kayıtlar soru işaretli, soluk figürle gösterilir.

24 üzerindeki sürülerde en fazla 24 figür çizilir. Her mevcut tür en az bir figürle temsil edilir; kalan yerler türlerin paylarına göre dağıtılır. Temsili görünüm ve gerçek toplam açıkça yazılır. Bu, bir figürün sabit sayıda hayvana eşit olduğu bir ölçek değildir. Ana toplam ve tür sayıları gerçek kayıt sayılarıdır. Ekleme, doğum, satış, ölüm ve geri alma sonrası mevcut render akışı görüntüyü günceller. Sayım değişmiyorsa hayvan SVG düğümleri yeniden kurulmaz.

## Hareket ve erişilebilirlik

Durdur/başlat düğmesi vardır; tercih yalnız cihazın `suru_pasture_paused` anahtarında saklanır. Çiftlik kaydı değiştirilmez. İşletim sisteminin `prefers-reduced-motion` tercihi hareketi kapatır ve çalışma sırasında da izlenir. Başka ekranda, ekran dışında veya sekme gizliyken animasyon duraklar. SVG başlık ve açıklaması güncel tür sayılarını ve temsili kapsamı ekran okuyucuya verir; tek tek dekoratif figürler tekrar okunmaz.

## Doğrulama

Hesap testi: aktif/durum dışlama, türler, satış ve boş sürü sonrası güncelleme, 10.000 hayvanda 24 figür sınırı, nadir türlerin görünmesi, dağılım toplamları, bilinmeyen tür, sabit DOM, kayıtların değişmemesi ve İngilizce etiketler.

Chromium testi: gerçek çalışan/duran CSS animasyonu, durdurmanın yeniden yükleme sonrası korunması, pasif ekran ve ekran dışı duraklama, hareket azaltma tercihi, 320/390/768/1440 px taşma kontrolü ve çiftlik verisinin aynı kalması. Tüm testler sentetik ve izole verilidir; Supabase verisine erişilmez.
