# İmar Evrak Takip

Belediye imar müdürlüğüne gelen evrakların (ruhsat, iskân, imar durumu,
şikâyet…) kaydı, durum takibi ve süre kontrolü için tek sayfalık web
uygulaması. Sunucu gerektirmez; veriler kullanıcının tarayıcısında
(`localStorage`) saklanır, yedek dosyasıyla taşınır.

## Neler var

- **Evrak kaydı:** otomatik yıl bazlı evrak no (`2026/0044`), konu, tür,
  geliş tarihi, başvuran, ada/parsel/pafta/mahalle, sorumlu personel.
- **Durum akışı:** Yeni kayıt → İncelemede → Eksik evrak → Onaylandı /
  Reddedildi → Arşiv. Her değişiklik nota bağlanır.
- **İşlem geçmişi:** her evrakın altında tarih–durum–not–personel dökümü.
- **Süre takibi:** türe göre varsayılan hedef gün (ör. imar durumu 15 gün),
  kalan gün rozeti ve gecikmiş dosya uyarısı.
- **Arama ve filtre:** evrak no / konu / başvuran / ada-parsel araması,
  durum–tür–personel filtreleri, "sadece süresi geçenler".
- **Özet kartları:** toplam, açık dosya, eksik evrak, süresi geçen
  (tıklayınca ilgili filtre uygulanır).
- **Dışa aktarma:** filtrelenmiş listeyi Excel uyumlu CSV olarak indirme,
  JSON yedek alma/geri yükleme, listeyi yazdırma. (Sayfa bir Claude Artifact
  olarak açıldığında indirmeler `downloads` yeteneği üzerinden kullanıcı
  onayına sunulur; normal tarayıcıda doğrudan iner.)

## Çalıştırma

**Gereksinim:** Node.js 20+

```bash
cd imar-evrak
npm install
npm run dev
```

Tarayıcıda `http://localhost:3100` adresini aç.

Arayüz Tailwind CSS ile derlenir; çalışması için internet gerekmez
(CDN bağımlılığı yoktur), belediye iç ağında da açılır.

Derleme: `npm run build` (önce `tsc --noEmit` ile tip kontrolü yapar),
çıktıyı önizleme: `npm run preview`.

### Tek dosyalık sürüm

`npm run build:tek` komutu CSS ve JS'i tek bir HTML dosyasına gömer:
`dist-tek/index.html`. Bu dosya sunucu istemez — çift tıklayarak açılabilir,
USB ile taşınabilir veya bir iç ağ paylaşımına konabilir.

## Veri nerede duruyor

Tüm kayıtlar tarayıcıdaki `localStorage` içinde `imar-evrak/v1` anahtarında
tutulur. Bu yüzden:

- Kayıtlar **o bilgisayarda, o tarayıcıda** kalır; kullanıcılar arasında
  paylaşılmaz.
- Tarayıcı verisi temizlenirse kayıtlar silinir — düzenli olarak
  **Yedek al** ile JSON dosyası indirin.
- Birden çok personelin aynı listeyi görmesi gerekiyorsa bir sunucu/veritabanı
  katmanı eklenmelidir (bkz. Sonraki adımlar).

İlk açılışta üç örnek kayıt gelir; silinebilir.

## Dosya yapısı

```
index.html                 Uygulama girişi
src/
  main.tsx                 React kökü
  index.css                Tailwind girişi + yazdırma stilleri
  App.tsx                  Durum yönetimi, filtreleme, dışa aktarma
  types.ts                 Evrak, İşlem, Filtre tipleri
  data.ts                  Durum/tür sabitleri, örnek veri
  storage.ts               localStorage okuma-yazma, yedek çözümleme
  utils.ts                 Tarih/gün hesapları, evrak no, CSV, indirme
  components/
    Ozet.tsx               Özet kartları
    Filtreler.tsx          Arama ve filtre çubuğu
    EvrakListesi.tsx       Tablo
    EvrakDetay.tsx         Yan panel: bilgiler, işlem yap, geçmiş
    EvrakFormu.tsx         Yeni kayıt / düzenleme formu
    Rozet.tsx              Durum ve gecikme rozetleri
```

## Sonraki adımlar

- Kullanıcı girişi ve personel bazlı yetki (şu an işlem geçmişine sabit
  "İmar Personeli" yazılır).
- Ortak veritabanı (ör. Vercel + Postgres) ile çok kullanıcılı kullanım.
- Evraka dosya eki (proje pdf'i, tutanak fotoğrafı).
- Otomatik tebligat/SMS bilgilendirme ve gecikme hatırlatmaları.
