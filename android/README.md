# Sürü Takip Android

Google Android Browser Helper ile Trusted Web Activity. Mevcut HTTPS uygulamasını tarayıcı bağlamında açar; Google OAuth ve aynı tarayıcıdaki sürü depolaması korunur. Destekleyen tarayıcı gerekir; WebView kullanılmaz. Android 7+ (API 24), hedef API 36.

## Derleme
JDK 17, Android SDK platform 36, Gradle 8.13 gerekir. Android Studio ile bu klasörü açabilir veya `gradle -p android :app:assembleDebug :app:bundleRelease :app:lintDebug` çalıştırabilirsin.

GitHub Actions Android build iş akışı test APK ve imzasız AAB üretir. Debug APK test içindir; Play Store'a yüklenmez. AAB imzasızdır, yayın anahtarıyla imzalanmadan yüklenmez. Anahtar veya parolalar repoya konulmaz.

## Yayın engelleri
- Site doğrulaması **origin kökünde** `https://hasanlutfioglu-bot.github.io/.well-known/assetlinks.json` ister. Bu projenin `/suru-takip/.well-known/` yolu yeterli değildir. Kullanıcının root Pages reposu veya özel alan adı gerekir.
- Play App Signing sertifikası SHA-256 alınmalı ve kök doğrulama dosyasına eklenmeli. Henüz bir anahtar oluşturulmadı, doğrulama yapılmadı. Doğrulama öncesi tarayıcı adres çubuğu görünür.
- Google OAuth gerçek Android cihazda denenmeli. Chrome'daki giriş, farklı varsayılan tarayıcıya taşınmayabilir.
- Play Console geliştirici hesabı, imzalama, gerçek cihaz testi, veri güvenliği beyanı, gizlilik politikası, hesap silme akışı ve mağaza görselleri tamamlanmalı. APK üretimi mağaza onayı anlamına gelmez.

Resmi referanslar:
https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities
https://developer.android.com/build/releases/agp-8-13-0-release-notes
https://support.google.com/googleplay/android-developer/answer/11926878
