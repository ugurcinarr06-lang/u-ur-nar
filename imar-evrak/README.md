# İmar Evrak Takip

Belediye imar müdürlüğüne gelen evrakların (ruhsat, iskân, imar durumu,
şikâyet…) kaydı, durum takibi ve süre kontrolü için web uygulaması.

İki kipte çalışır ve kipi kendisi seçer:

| Kip | Ne zaman | Veri nerede | Giriş |
| --- | --- | --- | --- |
| **Sunucu** | `npm run basla` ile sunucu çalışıyorsa | ortak SQLite dosyası | kullanıcı adı + şifre |
| **Yerel** | sunucu yoksa (tek dosyalık sürüm, Artifact, dosyadan açma) | tarayıcı `localStorage` | yok |

Açılışta `/api/ben` denenir; cevap gelirse ortak veritabanı, gelmezse
tarayıcı depolaması kullanılır. Arayüz her iki kipte aynıdır.

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

### Kurum kullanımı (ortak veritabanı + giriş)

```bash
cd imar-evrak
npm install
npm run basla          # arayüzü derler ve sunucuyu başlatır
```

`http://localhost:3200` adresini aç. İlk çalıştırmada bir **admin** hesabı
oluşturulur ve şifresi konsola bir kez yazılır — not al, girdikten sonra
**Hesap → Şifremi değiştir** ile değiştir. Şifreyi kendin belirlemek için:
`IMAR_ADMIN_SIFRE=... npm run basla`.

Diğer personeli müdür hesabı **Hesap → Yeni personel ekle** ile açar.
Uygulamayı ağdaki bir bilgisayarda çalıştırırsan diğerleri
`http://<bilgisayar-adı>:3200` üzerinden aynı listeyi görür.

**Ortam değişkenleri**

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `PORT` | `3200` | Sunucu portu |
| `IMAR_DB` | `veri/imar-evrak.db` | Veritabanı dosyası (ağ sürücüsü de olabilir) |
| `IMAR_ADMIN_SIFRE` | rastgele | İlk kurulumdaki admin şifresi |

### Geliştirme

İki terminal: `npm run sunucu` (API, 3200) ve `npm run dev` (arayüz, 3100).
Vite `/api` isteklerini sunucuya yönlendirir; `http://localhost:3100` aç.

Arayüz Tailwind CSS ile derlenir; çalışması için internet gerekmez
(CDN bağımlılığı yoktur), belediye iç ağında da açılır.

Derleme: `npm run build` (önce `tsc --noEmit` ile tip kontrolü yapar),
çıktıyı önizleme: `npm run preview`.

### Tek dosyalık sürüm

`npm run build:tek` komutu CSS ve JS'i tek bir HTML dosyasına gömer:
`dist-tek/index.html`. Bu dosya sunucu istemez — çift tıklayarak açılabilir,
USB ile taşınabilir veya bir iç ağ paylaşımına konabilir.

## Yetkiler

| | Memur | Müdür |
| --- | --- | --- |
| Evrak açma, düzenleme, işlem/not ekleme | ✓ | ✓ |
| Evrak silme | — | ✓ |
| Personel ekleme/silme | — | ✓ |
| Kendi şifresini değiştirme | ✓ | ✓ |

Her işlem, yapan kişinin adıyla evrakın geçmişine yazılır.

## Veri nerede duruyor

**Sunucu kipinde:** `veri/imar-evrak.db` (SQLite). Yedekleme bu dosyayı
kopyalamaktır; sunucu kapalıyken kopyalamak en temizi. Oturumlar 12 saat
sonra düşer, şifreler scrypt ile özetlenir.

**Yerel kipte:** tarayıcıdaki `localStorage` (`imar-evrak/v1`). Kayıtlar o
bilgisayarda, o tarayıcıda kalır; tarayıcı verisi temizlenirse silinir —
düzenli olarak **Yedek al** ile JSON indirin. İlk açılışta üç örnek kayıt
gelir, silinebilir.

İki kip arasında veri **Yedek al / Yedek yükle** ile taşınır (yükleme
yalnızca yerel kipte açıktır).

## Dosya yapısı

```
index.html                 Uygulama girişi
server/
  index.ts                 Express API + derlenmiş arayüzü sunar
  db.ts                    SQLite şeması, ilk kurulum
  auth.ts                  scrypt şifre özeti, oturum sabitleri
src/
  main.tsx                 React kökü
  index.css                Tailwind girişi + yazdırma stilleri
  App.tsx                  Durum yönetimi, filtreleme, dışa aktarma
  types.ts                 Evrak, İşlem, Filtre tipleri
  data.ts                  Durum/tür sabitleri, örnek veri
  storage.ts               localStorage okuma-yazma, yedek çözümleme
  utils.ts                 Tarih/gün hesapları, evrak no, CSV, indirme
  veri/
    depo.ts                Sunucu/yerel veri katmanı, oturum çağrıları
  components/
    Giris.tsx              Giriş ekranı
    Kullanicilar.tsx       Hesap ve personel yönetimi
    Ozet.tsx               Özet kartları
    Filtreler.tsx          Arama ve filtre çubuğu
    EvrakListesi.tsx       Tablo
    EvrakDetay.tsx         Yan panel: bilgiler, işlem yap, geçmiş
    EvrakFormu.tsx         Yeni kayıt / düzenleme formu
    Rozet.tsx              Durum ve gecikme rozetleri
```

## Sonraki adımlar

- Evraka dosya eki (proje pdf'i, dilekçe taraması, tutanak fotoğrafı).
- Türe göre eksik belge kontrol listesi ve "eksik belge yazısı" çıktısı.
- Gecikme hatırlatmaları (e-posta/SMS) ve müdüre haftalık özet.
- Başvuru sahibi için takip numarasıyla salt-okunur durum sorgulama.
- Parsel bazlı geçmiş: aynı ada/parseldeki tüm evraklar bir arada.
- Eksik belge istendiğinde süre sayacının durması.
