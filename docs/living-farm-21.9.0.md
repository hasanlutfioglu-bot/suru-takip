# Yaşayan çiftlik — 21.9.0

Ana sayfadaki mera, özgün SVG çizimleriyle bölümlere ayrılmış bir çiftliğe dönüştü: mera, anne–kuzu alanı, büyütme/yemlik, bakım ve kantar, araç girişi. Koyun, koç ve kuzu için farklı boyut ve duruşlar; ayakta, otlayan ve yatan pozlar vardır. Etkileşimli figürler gerçek hayvan kartlarını açar. Küpe araması, görünür 24 figür arasında olmasa bile eşleşen aktif hayvanı sahneye alır ve vurgular. Büyük görünüm mobilde kendi içinde kaydırılır.

## Saat ve yerleşim

- Cihazın yerel saati kullanılır. Varsayılan sabah 06, gündüz 08, akşam 18, gece 21; cihazda saklanan bu sınırlar ayarlanabilir. Saatte konum/gün doğumu bilgisi iddia edilmez. Açık ekran dakikada bir ve yeniden görünür olduğunda güncellenir.
- Sabah/gündüz hareket, akşam yavaş toplanma ve dinlenme, gece yatma uygulanır. Ay, yıldızlar ve ışıklı pencereler gece görünümünü tamamlar. Önizleme modu açıkça etiketlenir ve yeniden açılışta otomatik saate döner.
- Anne yalnız kayıtlı `motherId` veya çelişkisiz doğum–yavru bağlantısıyla eşleşir; aktif olmayan anne çizilmez. Bağlantı yoksa rastgele anne seçilmez. Yavru anne yanında yerleşir ve aynı aile hareket zamanlamasını kullanır.
- Büyütme alanına yalnız sütten kesim kaydı, geçerli sütten kesim tarihi veya açık besi/büyütme grubu olan kuzular alınır. Yaş tek başına sütten kesim kanıtı değildir. Eksik/çelişkili bağlantılar açıklanır. Takipte durumu küçük bir işaretle gösterilir; hastalık veya karantina varsayılmaz.
- En fazla 24 aktif hayvan figürü; oranlar sınırlandırılırken tek bir nadir hayvan birden fazla gerçek kimlik gibi çoğaltılmaz. Temsili kapsam ve gerçek alan sayıları görünürdür. İşlem aktörleri bu canlı sayımdan ayrıdır.

## İşlem canlandırmaları

Yerel kaydın doğrulanıp başarıyla saklanmasından sonra bir sunum kuyruğu oluşur. Sağlıkta veteriner/bakım karakteri, yemlemede yemlik ve ilgili hayvanların yaklaşması, tartımda kantara gidiş ve kaydedilmiş kilo, sütten kesimde büyütme alanına geçiş, doğumda anne yanında belirginleşme, satışta araç gelişi–yükleme–ayrılış vardır. Grup işlemleri tek olayda toplanır; en fazla dört geçici hayvan aktörüyle temsil edilebilir. Satılan hayvan aktif sayımdan hemen çıkar; taşıma figürü yeni bir kayıt değildir.

Veteriner ve araç, işlemin temsili karakterleridir; uygulama kaydından fiziksel olarak kimin geldiği veya bir canlının gerçek konumu çıkarılmaz. Sağlık sahnesi tanı, ilaç veya doz önermez.

Başlangıç, buluttan durumun yüklenmesi, yedek geri yükleme ve CSV aktarımı eski işlemleri kendiliğinden oynatmaz. Olaylar listesinden son 30 grup elle yeniden izlenebilir; yeniden izleme kayıt, satış veya gelir oluşturmaz. Kayıt değişir/silinir ya da satış geri alınırsa geçersiz canlandırma iptal edilir. Kayıt saklanamazsa olay kuyruğu oluşturulmaz. Çiftlik/hesap bağlamı değişince geçici sahne durumu temizlenir.

## Hareket ve veri koruma

Durdur/başlat, tamamen gizleme ve işletim sisteminin hareket azaltma tercihi korunur. Ekran dışında, başka sayfada, normal bir pencere açıkken ve sekme gizliyken olay süresi ilerlemez. Büyütülmüş sahne açıkken oynatma sürdürülebilir. CSS dönüşümleri hareketi sağlar; yalnız olay evreleri için iptal edilebilir zamanlayıcı ve görünür saat için dakikalık kontrol vardır.

Çiftlik verisine yeni alan/migrasyon veya Supabase değişikliği gerekmez. Sunum tercihleri yalnız cihazda saklanır. Mevcut kayıt yazma, stok, satış, arınma süresi ve eşitleme kuralları korunur.

## Doğrulama

Hesap ve kontrol testleri: anne/yavru, çelişki ve eksik bağlantı, sütten kesim/grup, saat sınırları, arama, doğum/yemleme/tartım/veteriner/satış aktörleri, durdurma, silme/geri alma, grup tekrar izleme, aktarım, HTML kaçışı ve çiftlik ayrımı.

Chromium: gerçek sağlık ve satış formları → saklanan kayıt → doğru aktör; geri alma, yeniden açılışta oynamama, elle tekrar izleme, kota hatasında işlem oluşmaması, gece yatma, küpeden karta erişim, büyütme ve 320/390/768/1440 px taşma kontrolleri. Mevcut regresyon paketi de çalıştırılır. Veriler sentetiktir; canlı Supabase okunmaz veya yazılmaz. Masaüstü sentetik benchmark örneğinde 1.000 hayvan / 10.000 kayıtta ana sayfa üretimi yaklaşık 51 ms ölçüldü; bu fiziksel telefon performansı garantisi değildir.
