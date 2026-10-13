# Sürü ekranı 21.6.0

Önceki çalışan sürüm: 21.5.3, commit `2ae5d1721a608ccd8d77d8b67da753c917129b21`.
Kodun tam git bundle yedeği ve Supabase farm_state anlık JSON yedeği alınmıştır.
Gerçek kayıt yedeği özel dosya olarak saklanır; depoya veya Pages paketine eklenmez.

## Veri kaynağı ve bağlantılar

Canlı uygulama Supabase `farm_state.data` JSON kaydını kullanır. `animals` ve
`records` ilişkisel tabloları bu sürünün kayıt kaynağı değildir. Hayvan kimlikleri
`id`, doğum bağlantıları `motherId`/`childIds`, tartım ve sağlık `animalId`,
satışlar `animalIds` ile mevcut sistemde ilişkilidir. Şema, RLS, kullanıcılar,
çiftlik üyelikleri ve senkronizasyon formatı değiştirilmemiştir.

Üst kutular aktif hayvanları sayar; anaç koyun sayısı anaç adaylarını dışarıda
tutar. Kuzu kategorisi hâlâ kuzu türünde olan anaç adayı/koçluk rezervlerini de
içerebilir; bu amaç filtreleri ayrı türler değildir. Tümü arşivi de içerir;
başlangıç filtresi Aktif'tir. Eksik değerler sıralamada sonda kalır.

12 aylık geçiş yalnız geçerli doğum tarihi ve bilinen cinsiyete dayanır. Kimliği
değiştirmeden dişiyi Koyun/Anaç Adayı, ayrılmış erkeği Koç yapar. Çıkmış
hayvanları ve satılık erkekleri dönüştürmez. Geçiş geçmişe bir promotion kaydı
yazar ve tekrar çalıştırıldığında ikinci hayvan veya ikinci geçiş üretmez.
İşlem uygulama açılırken ve mevcut render/save döngüsünde çalışır; kapalı
uygulamada çalışan bağımsız bir sunucu zamanlayıcısı değildir.

Tek hayvan tartımı artık aktif koyun ve koçları da aynı submitAnimal kayıt
yolundan kabul eder. Toplu kuzu tartımı mevcut biçiminde kalır. Hayvan detayı
mevcut doğum verimliliği ve geçmişi, çocuklar, tartım, sağlık, bağlı finans ve
durum kayıtlarını gösterir. Kuzu finans/tahmini yem payı ve gelişim analizi
mevcut Kuzu Gelişime Git bağlantısından açılır. Tahmini değer gerçek gelire
eklenmez; bağlantısı bulunmayan genel çiftlik giderleri hayvana mal edilmez.

## Geri dönüş

1. Sorunlu sürümü yayımlayan commit'i `git revert` ile geri alın. Başka yeni
   commit'leri veya kullanıcının güncel kayıtlarını geri sarmayın.
2. `npm test` çalıştırın; geri dönüşte sw.js CACHE değerini yeni ve benzersiz
   bir geri dönüş anahtarına yükseltin. Böylece daha yeni sürümün önbelleği
   kullanılmaz. GitHub Pages mevcut iş akışıyla yeniden yayımlar.
3. Ekran geri dönüşü için Supabase verisi geri yüklenmez. Daha sonra oluşmuş
   gerçek kayıtlar korunur. Veri kurtarma zorunluysa önce güncel kaydı ayrıca
   yedekleyin; eski snapshot'ı körlemesine yazmayın. Kullanıcının açık onayıyla,
   yalnız zarar görmüş alanları karşılaştırarak ve güncel sürüm koşullu yazımı
   kullanarak kurtarın. Snapshot tarihinden sonraki kayıtları koruyun.

## Doğrulama

Mevcut npm test zinciri korunur. `tests/herd-redesign.cjs` üst sayaçlar, 14
filtre, 9 sıralama, hatırlama, arama, bağlı detaylar, tek hayvan satış seçimi,
yetişkin tartımı, İngilizce görünüm, salt okunur işlemlerde kayıtların aynı
kalması, 12 ay sınırı, terminal durumlar, belirsiz/geçersiz doğum tarihi,
kimlik/geçmiş korunması, tekrar çalıştırma ve viewer korumasını test eder.

Yalıtılmış yerel Chromium oturumunda yapay test kayıtlarıyla 320, 360, 390 ve
430 piksel ekranlar kontrol edildi. Dokunulabilir kartlar, filtre ve sıralama
seçimleri, arama, detay açılması, İngilizce kontrollerin genişliğe sığması ve
çalışma zamanı hatası olmaması geçti. Gerçek Supabase'e test kaydı yazılmadı.
320 pikselde alt menü taşması yalnız Sürü ekranı açıkken uygulanan CSS ile
düzeltildi. Diğer ekranların görünümü korunur.

Service worker ağdan güncel HTML alır; offline app shell ve kullanıcı verisinin
önbelleğe alınmaması korunur. CACHE anahtarı yükseltildi; açık eski sürümde
worker değişimi için yenileme düğmesi gösterilir. Daha önce açık olan 21.5.3
sayfası bu yeni düğme kodunu içermez: o ilk güncellemede sayfayı bir kez yeniden
açmak/yenilemek gerekir; tarayıcıdaki çalışma halindeki JS uzaktan değişmez.
