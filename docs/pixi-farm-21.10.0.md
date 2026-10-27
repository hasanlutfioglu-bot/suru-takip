# 21.10.0 — Yerel PixiJS çiftlik çizimi

- PixiJS 8.22.0, MIT lisansı ile projeye yerel olarak eklendi. Abonelik veya harici çizim servisi gerekmez. Bağımlılığın minified dağıtımı assets/farm altında; lisansı aynı klasördedir.
- Kayıt kimliğini koruyan ayrı gövde, baş ve dört bacak; yürüme döngüsü, yumuşak dönüş, otlama ve gece yatma. Anne ve emen kuzu aynı hareket çizgisini kullanır. Yakın aileler için bölge sınırlarını koruyan yerel mesafe düzeltmesi uygulanır; bu fizik simülasyonu değildir.
- Yaşa göre boyut, tek ortak yoğunluk ölçeği, tüm aktif hayvanların gösterimi ve yalnız kullanıcı onayıyla besiye geçiş korunur. Yedi hayvanı otomatik seçen bir kural eklenmedi.
- Mevcut traktör, çiftçi, veteriner, kayıt canlandırmaları ve konuşmalar SVG katmanında korunur. Yeni motor bu katmanla aynı koordinatları kullanır.
- 30 FPS sınırı; sayfa görünmezken, durdurmada, azaltılmış hareket tercihinde ve gece hayvan çizim döngüsü durur. Büyütülmüş görünüm kapanınca WebGL kaynakları bırakılır.
- Ekran okuyucu/klavye için yerel kayıt düğmeleri; WebGL veya yerel kitaplık yüklenemezse mevcut SVG görünümü. Çevrimdışı önbelleğe yerel kitaplık eklendi.
- Gerçek Chromium/WebGL testi: 121 kimlik, yedi onaylı besi kuzusu, anne–kuzu hareket birliği, yaş oranları, durdurma/gece/azaltılmış hareket, mobil genişlikler, büyütme/kapatma, bağlam kaybı ve verinin değişmemesi.
- Canlı Supabase bağlantısı veya veri değişikliği yapılmadı. Testler yalıtılmış yerel örneklerle çalışır.
