# Google Play yenileme, iptal ve iade bildirimleri

## Sunucuda hazır olan

`play-notifications` Supabase Edge endpoint'i, Google'ın RS256 imzasını resmi JWKS üzerinden doğrular. İmza, issuer, audience, servis hesabı e-postası, email_verified ve süre kontrol edilir. Kaynak doğrulanmadan veri tabanına dokunulmaz. Bildirim sırasını güvenilir kabul etmez; satın alma durumunu Google Developer API'den tekrar okur. İşlem server-only SQL fonksiyonu ile atomiktir. Eski/yerine geçmiş token aktif hakkı geri alamaz. Ağ/Google/DB hatasında 503 döner; Pub/Sub tekrar denemelidir.

**Gateway Supabase JWT kontrolü yalnız bu endpoint için kapalıdır** çünkü Google OIDC tokenı Supabase kullanıcı tokenı değildir. Bunun yerine endpoint içinde Google imzası ve izin verilen servis hesabı kontrol edilir. Gerekli ayarlar yoksa 503 ve kapalı davranış. Kullanıcı satın alma/silme endpoint'lerinde Supabase JWT kontrolü açıktır.

## Console ve secrets kurulumu (Hasan ile)

1. Aynı Google Cloud projesinde Pub/Sub topic oluştur.
2. Google Play bildirim yayımlayıcısı `google-play-developer-notifications@system.gserviceaccount.com` için yalnız gerekli topic yayın yetkisini ver.
3. Play Console uygulama para kazanma ayarlarında topic tam adını gir; abonelik ve voided purchase bildirimlerini etkinleştir.
4. Pub/Sub push subscription oluştur. Endpoint: `https://nqbfyahiijdkrroojlct.supabase.co/functions/v1/play-notifications`.
5. Push authentication etkinleştir; bu iş için seçtiğin Google servis hesabını kullan. Audience'i endpoint URL'siyle tam eşleştir. Google'ın talep ettiği Pub/Sub service agent Token Creator iznini aynı hesap için tanımla; geniş owner rolleri verme.
6. Supabase Secrets:
   - `PLAY_RTDN_AUDIENCE`: seçtiğin audience URL'si.
   - `PLAY_RTDN_SERVICE_ACCOUNT_EMAIL`: push auth servis hesabı e-postası (yalnız kimlik).
   - `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`: Developer API yetkili hizmet hesabının JSON'u. Bu hesap push auth hesabıyla aynı olmak zorunda değildir.
7. Pub/Sub retry ve dead-letter takibini yapılandır; test notification gönder. Başarı 200/test:true.
8. Play lisans test hesabıyla yenileme/iptal/grace/hold/expiry ve refund-with-revoke test et. Refund-without-revoke, Google'da hak kaldırmıyorsa uygulama Google'ın aktif durumunu korur; bu ayrımı ticari iade politikasında netleştir.
9. Bilinmeyen satın alma tokenı otomatik yeni çiftlik kurmaz; ilk satın alma veya geri yükleme ile sahibinin çiftliği eşleşmelidir. Destek/missed-event sürecini ve gerektiğinde geri yüklemeyi test et.

Ham satın alma tokenı veritabanında saklanmıyor; bu nedenle scheduled Google reconciliation henüz yok. RTDN'nin ulaştığını/yeniden denendiğini izlemek gerekir. Bu kurulum yapılmadan otomatik yenileme/iade entegrasyonu çalışıyor sayılmaz.

## Resmi kaynaklar

- https://docs.cloud.google.com/pubsub/docs/authenticate-push-subscriptions
- https://developer.android.com/google/play/billing/rtdn-reference
- https://developer.android.com/google/play/billing/lifecycle/subscriptions
- https://developer.android.com/google/play/billing/security
