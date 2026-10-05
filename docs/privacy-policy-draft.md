# Sürü Takip — Gizlilik Politikası Taslağı

**Mağaza yayını için onay bekleyen taslaktır. Son politika olarak yayımlanmaz.**

Veri sorumlusu/geliştirici: Hasan Lutfioğlu. Destek ve gizlilik iletişimi: **hasanlutfioglu@gmail.com**. Resmî işletme adı, adres ve geçerli hukuk alanı yayın öncesi doğrulanmalıdır.

## Teknik olarak doğrulanan veri akışı

- Google girişinden kullanıcı kimliği, ad, e-posta ve profil bilgileri.
- Çiftlik adı, hayvan/küpe/doğum/soy bilgileri, hayvan sağlığı ve tartımlar.
- İşletme gelir-gideri, stok, takvim ve kullanıcı notları.
- Çevrimdışı tarayıcı kopyası, kurtarma yedekleri ve oturum bilgileri.
- Supabase Auth ve Postgres üzerinden hesap/veri barındırma.
- Google Play satın alma kodu doğrulaması; sunucuda tek çiftliğe bağlanan SHA-256 satın alma özeti. Ham kod kalıcı veri alanına yazılmıyor.
- Tarayıcının ses tanıma hizmeti isteğe bağlı kullanılıyor; uygulama kendi ses kaydını depolamıyor. Tarayıcı sağlayıcısının işleme biçimi ayrıca açıklanmalı.
- Bu sürümde OpenAI API entegrasyonu yok. “Sesli Komutlar” uygulama içi komut yorumlayıcısıdır.
- Reklam/analitik SDK'sı mevcut kaynakta görülmedi. Yeni SDK eklenirse beyan güncellenmeli.

## Amaçlar

Hesap oluşturma, hesabın çiftliğine erişim, cihazlar arasında eşitleme, çevrimdışı çalışma, rapor üretimi, satın alma doğrulaması ve kötüye kullanımın önlenmesi.

## Silme ve saklama

Hesap silme aktif veritabanında hesabı ve yalnız kullanıcıya ait çiftlikleri FK zinciriyle atomik siler. Paylaşılan çiftlikler için sahiplik devri/üyelik çözümü gereklidir. Bu cihazdaki hesaba ait önbellek/kurtarma kayıtları temizlenir; diğer cihazlar ve kullanıcı tarafından indirilen yedekler ayrıca temizlenir. Google/Play hesabı ve Play ödeme kayıtları ayrı hizmetlerdir.

**Yayın öncesi doğrulanacak:** Supabase proje bölgesi, yedek/sistem logları saklama süresi, silinmiş aktif verilerin yedeklerden temizlenme takvimi, iletişim ve hak talebi kanalı, yasal muhasebe kaydı yükümlülüğü, uluslararası aktarımlar ve çocuklara yönelik kullanım yaklaşımı. Bu süre ve hukuki dayanakları uydurarak politika yayımlamıyoruz.

## Play Data Safety için başlangıç eşlemesi

| Veri | Kaynak/amaç | Son formdan önce karar |
|---|---|---|
| Ad, e-posta, kullanıcı kimliği | Google giriş, hesap yönetimi | Zorunlu/isteğe bağlı alanları ve hizmet sağlayıcı istisnalarını Console tanımıyla doğrula |
| Finans bilgileri / kullanıcı içeriği | İşletme gelir-gideri ve notlar | Console kategorisini işletme verisinin içeriğine göre seç |
| Uygulama etkinliği | Kullanıcının kayıtları/komutları | Ses tanıma sağlayıcısının akışını cihazda doğrula |
| Ödeme | Google Play işler; kart numarası uygulamaya gelmez | Satın alma geçmişi kimliği ve finans beyanını ayır |

“Veri toplanmıyor” işaretlenemez: hesap ve sürü buluta gidiyor. “Hiçbir veri paylaşılmıyor” seçimi, hizmet sağlayıcı istisnalarının Console'daki güncel anlamı incelenmeden yapılmamalı.
