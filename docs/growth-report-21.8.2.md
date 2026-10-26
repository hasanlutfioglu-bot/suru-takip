# Kuzu gelişimi ve ölçüme dayalı rapor — 21.8.2

Kuzu Gelişim ekranı ana sayfanın renkleri, tipografisi ve boşluklarıyla yenilendi. Dar ekranlarda altı sütunlu tablo yerine etiketli kartlar, masaüstünde tablo gösterilir. Satırlar klavyeyle açılır. Hayvan detayındaki grafik yalnız kaydedilmiş tartımları gösterir; noktalar arasındaki çizgi bir tahmin değildir. Raporlar ekranından gelişim raporuna bağlantı bulunur.

## Hesapların kapsamı

- ADG = (son kg − önceki kg) × 1000 / gün. Aktif kuzuların son iki farklı tarihli tartımı kullanılır. Aynı günün son kaydı alınır; pozitif olmayan ağırlıklar, gelecek tarihler ve bilinen doğum tarihinden önceki tartımlar dışlanır. Eski kayıtlar değiştirilmez.
- Raporun 30/90 gün veya tüm tarih seçimi ve cinsiyet filtresi vardır. Her iki tartım da seçilen dönemde olmalıdır. Her kuzu ortalamaya eşit ağırlıkla bir kez girer. Ortanca, minimum/maksimum ve n ayrı gösterilir. Negatif artışlar korunur; eksik çiftler sıfır sayılmaz.
- Son tartımı 21 günden eski kuzular güncellik göstergesinde ayrı değerlendirilir. Bu süre uygulamanın iş takip aralığıdır. Eski tartımlar dönem hesabına girebilir; arayüz bunu açıklar.
- Gruplar son tartımdaki 30 günlük yaş aralığı, cinsiyet ve kayıtlı sürü grubuna göre ayrılır. Küçük örneklem uyarısı vardır. Detaydaki ağırlık karşılaştırması kendisi hariç en az üç benzer ve güncel tartımlı kuzu gerektirir. Grup indeksleri tek geçişte oluşturulur.
- Sabit yaş bantları uygulama takip eşiği olarak adlandırılır; bilimsel normal aralık veya tanı değildir. Irk, doğum tipi, anne yaşı ve besleme düzeltmeleri yapılmaz; sonuçlar genetik değerlendirme değildir.
- 50 kg işletme hedefidir. Pozitif artış varsa süre sabit hız varsayımıyla hesaplanır. Tek tartımda 230 g/gün varsayımı açıkça etiketlenir. Ölçülen hız sıfır veya negatifse pozitif varsayımla hedef tarihi üretilmez. Tahmini satış değerleri gerçekleşmiş gelir değildir.

## Kaynaklar

Sheep Ireland, [Weighing Report](https://www.sheep.ie/weighing-report/): örneklem, ADG, cinsiyet ve yetiştirme gruplarıyla raporlama. Teagasc, [Maximising lamb thrive](https://teagasc.ie/news--events/daily/maximising-lamb-thrive/): sistem ve yetiştirme koşullarına bağlı büyüme hedefleri. Bu kaynaklar uygulamanın mevcut sabit yaş eşiklerini doğrulayan bir referans olarak sunulmaz.

## Doğrulama

Yeni hesap testleri: negatif/sıfır artış, aynı tarih, gelecek/doğum öncesi kayıt, dönem ve cinsiyet filtresi, ortalama/ortanca, örneklem, grup karşılaştırması, grafik, HTML kaçışı ve kayıtların değişmemesi. İzole Chromium önizlemesinde 320, 390, 768 ve 1440 px genişliklerde kontrol yapılır. Canlı Supabase kullanılmaz.
