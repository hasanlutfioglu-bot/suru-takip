# 21.8.1 — Görsel düzen

Bu sürüm arayüzün görünümünü yeniler. Hayvan, finans ve bulut veri modeli değişmez; mevcut cihaz/işletme anahtarları korunur.

- Kırık beyaz, orman yeşili ve sıcak sarıyla tutarlı renk sistemi.
- Koyu sürü özeti ve çevrimdışı çalışan SVG çiftlik çizimi.
- Aynı çizgi dilinde simgeler, simgeli hızlı işlemler ve daha düzenli hayvan kartları.
- Profil fotoğrafı bulunan hayvanlar için listede küçük fotoğraf.
- Mobilde yüzen gezinme çubuğu; geniş ekranda yan gezinme ve iki sütunlu özet.
- Rapor, menü ve formlarda ortak yazı, boşluk, kenar ve düğme düzeni.
- Eski stil kuralları bir `legacy` katmanında tutulur. Yeni tasarımın kaynağı `web/theme.css`, sunum yardımcıları `web/presentation.js` dosyasındadır. `npm run build` kaynakları tek HTML dosyasına eşitler.
- Uzak font, fotoğraf veya yeni CDN bağımlılığı eklenmez.

Görsel kontrol yapay verilerle mobil ve masaüstünde yapılır. Tarayıcı regresyonu 320, 768 ve 1440 piksel genişliklerde her gezinme seçiminde yalnız ilgili ekranın göründüğünü ve sayfanın yatay taşmadığını denetler. Türkçe/İngilizce geçişi korunur.

Kontroller sırasında tartım analizinin gecikmeli açılmasıyla başka bir formun üzerine gelebilen yarış durumu da düzeltildi: analiz yalnız aynı işletme açıkken ve başka bir modal açılmamışken gösterilir.

Canlı Supabase kayıtlarına veya sunucu yapılandırmasına bu sürüm için değişiklik gerekmez.
