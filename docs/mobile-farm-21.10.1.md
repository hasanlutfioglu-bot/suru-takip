# 21.10.1 — Mobil çiftlik görünürlüğü

- Fotoğraftaki küçük sahne için telefonda 700 px genişlikte kaydırılabilen yakın görünüm ve Mera / Anne–kuzu / Besi alan düğmeleri eklendi. Tümü düğmesi bütün çiftliği ekrana sığdırır. Masaüstü varsayılanı Tümü olarak kalır.
- Boyutlar ve koordinatlar hayvanlar, arka plan ve mevcut kayıt aktörlerinde aynı sahne genişliğinden hesaplanır; yakınlaştırma yaş oranını veya hayvanın bölgesini değiştirmez.
- Pixi arka planı CSS background-image/multiply yerine aynı çizim yüzeyinde bir görsel olarak çizilir. Akşam hafif sıcak, gece okunabilir mavi ton kullanır. SVG yedek görünümde de karartma azaltıldı. Belge only light tercihiyle otomatik tarayıcı karartmasına karşı açık paleti belirtir.
- Mobil alan başlıkları ve açıklamaları büyütüldü; kaydırma ipucu eklendi. Yakın görünüm telefon sayfasını yatay taşırmaz.
- Chromium mobil genişliği ve zorlanmış koyu görünüm bayraklarıyla görsel kontrol yapıldı. Gerçek Samsung cihazına uzaktan erişim yapılmadı.
- Pixi testi alan seçimi/kaydırma, Tümü ile geri dönüş, SVG/canvas genişlik eşitliği ve akşam arka planının CSS karışımından bağımsızlığını doğrular. Önceki hareket, tüm kimlikler, aile/yaş oranları ve veri değişmezliği denetimleri korunur.
- Supabase verileri değiştirilmedi.
