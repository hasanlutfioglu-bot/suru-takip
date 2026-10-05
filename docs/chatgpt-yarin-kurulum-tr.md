# Sürü Takip — ChatGPT bağlantısını tamamlama

Kontrol: 6 Ekim 2026, Kıbrıs.

## Doğrulanan durum

- Canlı `flock-mcp` servisi ACTIVE, sürüm 2. Korumalı kaynak keşif adresi doğru JSON döndürüyor.
- Canlı Auth yanıtı: `feature_disabled / OAuth server is disabled`.
- Mevcut `npm test` gruplarının tamamı geçti. Gerçek ChatGPT oturumu ve Android cihaz testi henüz yapılmadı.
- Kod yalnız Hasan'ın doğrulanmış kullanıcı kimliğine pilot erişim veriyor; diğer kullanıcılara açık değil.

## Bilgisayarda ilk adım

https://supabase.com/dashboard/project/nqbfyahiijdkrroojlct

1. Authentication → OAuth Server bölümünden OAuth sunucusunu etkinleştirin.
2. Authentication → URL Configuration içindeki mevcut Site URL değerini kontrol edin; ana uygulamanın girişini bozacak biçimde değiştirmeyin.
3. Authorization Path, Site URL ile birleştiğinde aşağıdaki izin ekranına ulaşmalı. Site URL zaten `/suru-takip` içeriyorsa tekrar eklemeyin.
4. Google giriş dönüşünde `authorization_id` korunmalı; gereken dönüş adresi izin listesinde olmalı.

İzin ekranı: https://hasanlutfioglu-bot.github.io/suru-takip/oauth-consent.html

## ChatGPT'de bağlantı oluşturma

ChatGPT Plugins → + → Create custom MCP server. Hesap/workspace kuralları erişimi etkileyebilir.

- Ad: Sürü Takip
- Açıklama: Kendi sürünüzün hayvan, doğum, tartım, sağlık ve gelir-gider kayıtlarını okuyun; önerilen kayıtları onaylayarak ekleyin.
- Sunucu: https://nqbfyahiijdkrroojlct.supabase.co/functions/v1/flock-mcp
- Kimlik doğrulama: OAuth, kapsam `openid`.
- Endpoint bu tam URL'de çalışıyor; ayrıca `/mcp` eklemeyin.

ChatGPT yönetim ekranının gösterdiği TAM redirect URI kullanılmalı, tahmini callback yazılmamalı. Supabase'de ayrı bir OAuth istemcisi kaydedilip kimliği ve gerekiyorsa istemci sırrı ChatGPT ile eşleştirilir. Dinamik kayıt kurulumu geçmek için sınırsız açılmaz.

Sunucudaki `FLOCK_MCP_CLIENT_IDS` sırrı kayıtlı istemci kimliğini içermeli. Boşsa veri araçları `oauth_not_configured` döndürür. Oturumlar ve gizli anahtarlar kaynak dosyalarına/ekran görüntülerine konmaz.

## Gerçek bağlantıda kabul kontrolleri

Önce “Yetkili olduğum sürüleri göster”, aktif hayvanlar, seçilen koyunun doğum geçmişi ve bu ayın kayıtlı gelir-gideri okunur. Sonuçlar mevcut kayıtlarla karşılaştırılır; gerçek sürüye deneme kaydı girilmez.

Ayrı deneme sürüsünde tartım önerisi gösterilir. Onay öncesi yazma olmadığı, onaydan sonra bir kayıt oluştuğu ve yeniden denemenin çift kayıt üretmediği kontrol edilir. Telefonda eşzamanlı değişiklik varsa eski veriyle üzerine yazılmamalı.

Gerçek OAuth tokeninin imzası, issuer, kaynak/audience, süre, kapsam ve istemci kimliği doğrulanır. Kontroller kaldırılarak bağlantı çalıştırılmaz. `openid` için asimetrik imzalama gereksinimi mevcut girişler etkilenmeden incelenir.

İkinci deneme hesabının başka sürüyü okuyamadığı/yazamadığı, izleyicinin kayıt ekleyemediği ve üyeliği kaldırılan kişinin erişiminin kesildiği doğrulanır. Sonra pilot sınırı kontrollü genişletilir; herkes kendi hesabını ve yetkilerini kullanır.

Herkese dağıtım OpenAI plugin yayınlama sürecine ve desteklenen hesaplara bağlıdır. Gerçek yayın/kurulum adresi doğrulanmadan uygulamaya bağlantı düğmesi eklenmez. Android mağaza yayını ChatGPT bağlantısının herkese açıldığı anlamına gelmez.

## Maliyet

Yeni ücretli hizmet veya API anahtarı satın alınmadı. Supabase OAuth sunucusunun ayrı ücreti yok; kullanıcılar proje MAU kullanımına sayılır. ChatGPT erişimi ve sunucu limitleri herkese ücretsiz kullanım sözü verilmeden doğrulanmalı.

## Resmi kaynaklar

- https://developers.openai.com/plugins/deploy/connect-chatgpt
- https://developers.openai.com/plugins/build/auth
- https://supabase.com/docs/guides/auth/oauth-server/getting-started
