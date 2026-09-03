# İmar Evrak Takip

Belediye imar müdürlüğüne gelen evrakların (ruhsat, iskân, imar durumu,
şikâyet…) kaydı, durum takibi ve süre kontrolü için web uygulaması.

İki kipte çalışır ve kipi kendisi seçer:

| Kip | Ne zaman | Veri nerede | Giriş |
| --- | --- | --- | --- |
| **Sunucu** | `npm run basla` ile sunucu çalışıyorsa | ortak SQLite dosyası | kullanıcı adı + şifre |
| **Yerel** | sunucu yoksa (tek dosyalık sürüm, Artifact, dosyadan açma) | tarayıcı `localStorage` | yok |

Dosya ekleri yalnızca sunucu kipinde saklanır; yerel kipte ekler bölümü
bunu belirtir.

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
- **Belge kontrol listesi:** evrak türüne göre istenen belgeler listelenir
  (ör. yapı ruhsatında tapu, imar durumu, mimari/statik proje, zemin etüdü,
  yapı denetim sözleşmesi…). Teslim alınanlar işaretlenir, "7/14 zorunlu
  belge" göstergesi ilerlemeyi gösterir; kimin ne zaman işaretlediği yazar.
  Listeler `src/belgeler.ts` içinden düzenlenir.
- **Belgenin kendisi listeden yüklenir:** her satırın sağındaki "dosya
  yükle" ile o belgenin taraması eklenir; dosya satırın altında görünür ve
  madde **kendiliğinden teslim alınmış** sayılır. Son dosyası silinirse
  madde yeniden eksiğe döner. Elle işaretleme, fiziksel teslim alınıp
  taranmamış belgeler için kalır ("elle işaretlendi" notuyla ayrılır).
- **Eksik belge yazısı:** işaretlenmemiş zorunlu belgelerden, başvurana
  verilecek resmi yazı üretilir (kurum başlığı, sayı/konu, ada-parsel,
  numaralı eksik listesi, 30 gün süre kaydı) ve yazdırılır. Koşullu
  belgeler yazıya girmez. Kurum adı bir kez yazılır, tarayıcıda saklanır.
- **Otomatik ön inceleme (yapay zekâ ajanı):** her yüklenen belge arka planda
  okunur; ada/parsel, başvuran, tarih, imza, belge türü kontrol edilir ve
  memura bulgu listesi çıkarılır. **Karar memurundur** — sistem hiçbir belgeyi
  onaylamaz, yalnızca işaretler. Ayrıntı için "Yapay zekâ incelemesi".
- **Memur kararı:** teslim alınan her belge için *uygun* / *uygun değil*
  (gerekçesiyle) kaydı. Karar işlem geçmişine yazılır.
- **Hazırlık özeti:** evrakın en üstünde "dosya karara hazır mı" kutusu —
  teslim alınmayan, uygun bulunmayan, engel çıkan ve karar bekleyen belgeler
  ayrı ayrı sayılır. Listede de rozet olarak görünür (*Karara hazır*,
  *3 eksik belge*, *2 engel*…).
- **Kurum sorgusu (TAKBİS / YAMBİS):** tapu kayıt örneği ve müteahhit yetki
  belgesi, kaynağından sorgulanabilir; sonuç evrak kaydıyla karşılaştırılır
  (ada/parsel tutmuyorsa engel, başvuran malik değilse uyarı, yetki belgesi
  süresi dolmuşsa engel). Bağlantı **kapalı gelir**; kurum protokolü
  tamamlandığında yalnızca ayar girilir — bkz. `docs/entegrasyon.md`.
- **Parsel geçmişi:** evrak detayında aynı ada/parsele ait diğer başvurular
  listelenir ("bu parselde 2026'da ruhsat verilmiş, sonra şikâyet gelmiş").
  Tıklayınca o kayda geçilir; "listede göster" ile parselin tüm evrakları
  ana listede süzülür.
- **Hatırlatmalar ve bildirimler:** hedef süreye 3 gün kalanlar sorumlusuna,
  süresi aşılanlar sorumlusuna ve müdüre e-posta ile bildirilir; pazartesi
  sabahı müdüre haftalık özet gider. Eksik belge ve sonuçlanma durumlarında
  vatandaşa SMS gönderilir. Bkz. "Bildirimler".
- **Vatandaş takibi:** her başvuruya rastgele bir takip kodu üretilir, alındı
  belgesine (kare kodla birlikte) basılır; vatandaş `/takip` sayfasından kod ve
  telefonunun son dört hanesiyle dosyasının durumunu ve eksik belgelerini
  görür. Bkz. "Vatandaş takip ekranı".
- **Kaynağından doğrulama:** e-Devlet/kurum belgelerinde (tapu, SGK, vergi,
  EKB, YAMBİS…) barkod-doğrulama kodu alanı; kod kaydedilir, e-Devlet sorgu
  sayfasına bağlantı verilir, teyit eden personel ve tarih geçmişe yazılır.
- **Diğer ekler:** kontrol listesine girmeyen belgeler (tutanak, yazışma,
  fotoğraf) evraka doğrudan eklenir (pdf, jpg/png/tiff, doc/docx, xls/xlsx, dwg/dxf, zip; dosya başına
  25 MB, en çok 10 dosya). Ekleme ve silme işlem geçmişine yazılır; eki
  yükleyen kişi veya müdür silebilir. **Yalnızca sunucu kipinde.**
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

## Yapay zekâ incelemesi

Bir belge yüklendiğinde sıraya alınır ve şu üç aşamadan geçer:

1. **Metin çıkarma** — PDF'in metin katmanı okunur (`pdfjs`). Metin katmanı
   yoksa (taranmış belge) sayfalar görüntüye çevrilip **OCR** ile okunur;
   fotoğraf/tarama dosyaları da doğrudan OCR'dan geçer.
2. **Kural kontrolleri** — model gerektirmez, her zaman çalışır:
   - belgedeki ada/parsel evrak kaydıyla uyuşuyor mu (**engel** seviyesinde),
   - başvuran adı belgede geçiyor mu,
   - dosya beklenen belge türüne benziyor mu (yanlış satıra yükleme),
   - belge tarihi güncel mi (tapu 30, SGK/vergi 60, imar durumu 365 gün),
   - elektronik imza alanı var mı, belge tek sayfa mı, dosya çok küçük mü,
   - aynı dosya bu evraka daha önce yüklenmiş mi (sha256 karşılaştırması),
   - belgede e-Devlet doğrulama kodu / barkod var mı (bulunursa memura yazılır).

   Karşılaştırmalar Türkçe harflere duyarsızdır: OCR "Yılmaz"ı "Yilmaz"
   okuduğunda veya belge büyük harfle yazıldığında eşleşme kaçmaz.
3. **Model incelemesi** — açıksa, belge metni ve başvuru kaydı modele verilir;
   model bulgu üretir (belge türü, çelişki, eksik bölüm, imza/kaşe/müellif
   bilgisi). Yönerge modele açıkça *"onay verme, yalnızca bildir"* der.

Bulgular üç seviyede toplanır: **bilgi** (nötr tespit), **uyarı** (memur
bakmalı), **engel** (bu hâliyle kabul edilmemeli). Dosyanın altında rozet
olarak görünür; memur okur ve **uygun / uygun değil** kararını verir.

### OCR (taranmış belgeler)

Dil verisi bir kez kurulur:

```bash
npm run ocr-kur          # veri/tessdata/tur.traineddata (~4,5 MB)
```

İnterneti kapalı kurumlarda dosya başka bir makinede indirilip
`veri/tessdata/` altına kopyalanabilir; başka bir şey gerekmez. Dosya
yoksa OCR sessizce devre dışı kalır ve belge "taranmış, kontrol edilemedi"
olarak işaretlenir.

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `IMAR_OCR` | açık | `kapali` yazılırsa OCR hiç çalışmaz |
| `IMAR_OCR_DIL` | `tur` | Tesseract dil kodu |
| `IMAR_OCR_DIL_YOLU` | `veri/tessdata` | Dil verisi klasörü |
| `IMAR_OCR_SAYFA` | `3` | PDF'te okunacak azami sayfa |

Uzun projelerde tüm sayfaların taranması dakikalar sürer; bu yüzden ilk
sayfalar okunur ve kaç sayfanın atlandığı metne not düşülür.

### Model sağlayıcısını seçme

| `IMAR_AI` | Ne yapar | Veri nereye gider |
| --- | --- | --- |
| `kapali` (varsayılan) | yalnızca kural kontrolleri | hiçbir yere |
| `ollama` | belediye sunucusundaki yerel model | kurum içinde kalır |
| `claude` | Anthropic API | **kurum dışına çıkar** |
| `deneme` | modelsiz sahte sağlayıcı (geliştirme/test) | hiçbir yere |

```bash
# Kendi sunucunuzdaki model (önerilen)
IMAR_AI=ollama IMAR_AI_MODEL=llama3.1 IMAR_AI_URL=http://127.0.0.1:11434 npm run basla
```

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `IMAR_AI` | `kapali` | Sağlayıcı seçimi |
| `IMAR_AI_URL` | `http://127.0.0.1:11434` | Ollama adresi |
| `IMAR_AI_MODEL` | ollama: `llama3.1`, claude: `claude-opus-5` | Model adı |
| `IMAR_AI_ZAMAN_ASIMI` | `120000` | Model için azami süre (ms) |

`claude` sağlayıcısı `ANTHROPIC_API_KEY` bekler ve **vatandaş belgelerini dış
bir servise gönderir**; KVKK açısından bilinçli bir karar olmadan açmayın.

İncelemeler tek sıradan yürür (aynı anda tek belge), yükleme isteği beklemez;
arayüz sonucu kendiliğinden tazeler. Bir belgeyi yeniden incelemek için dosya
satırındaki **yeniden incele** kullanılır (model sonradan açıldığında da işe
yarar).

**Sınırları açıkça söylemek gerekirse:** bu inceleme belgenin *gerçekliğini*
doğrulamaz. Tapu kaydının doğruluğu TAKBİS'ten, müteahhit yetkisi YAMBİS'ten,
e-Devlet çıktıları doğrulama kodundan teyit edilir. Buradaki kontrol, memurun
gözden kaçırabileceği tutarsızlıkları önüne getiren bir **ön elemedir**.

## Bildirimler

Sunucu saatte bir kuralları tarar, üretilen mesajları kuyruğa alır ve gönderir.
Aynı bildirim iki kez gitmez (her kaydın benzersiz anahtarı vardır: gecikme
haftada bir, yaklaşan süre günde bir hatırlatılır).

| Ne zaman | Kime | Kanal |
| --- | --- | --- |
| Hedef süreye 3 gün veya daha az kaldı | sorumlu personel | e-posta |
| Hedef süre aşıldı (haftada bir) | sorumlu + müdürler | e-posta |
| Pazartesi 08:00 haftalık özet | müdürler | e-posta |
| Durum "eksik belge"ye geçti | başvuran | SMS |
| Başvuru onaylandı / reddedildi | başvuran | SMS |

Vatandaşa giden mesaj kısa tutulur ve kişisel veri taşımaz: evrak no, eksik
belge sayısı, takip adresi ve takip kodu. Ayrıntı takip sayfasındadır.

Personelin e-postası **Hesap → Yeni personel ekle** ekranında girilir;
hatırlatmalar evraktaki "sorumlu" adıyla eşleşen personele gider. Müdür,
Hesap ekranından son 40 bildirimi görür, gönderilemeyenleri tekrar dener ve
"şimdi tara ve gönder" ile taramayı elle çalıştırabilir.

### Kanal ayarları

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `IMAR_EPOSTA` | `kapali` | `acik` \| `deneme` \| `kapali` |
| `IMAR_SMTP_URL` | — | `smtp://kullanici:sifre@posta.belediye.gov.tr:587` |
| `IMAR_EPOSTA_GONDEREN` | `imar@belediye.local` | Gönderen adresi |
| `IMAR_SMS` | `kapali` | `acik` \| `deneme` \| `kapali` |
| `IMAR_SMS_URL` | — | SMS sağlayıcısının HTTP ucu |
| `IMAR_SMS_GOVDE` | `{"numara":"{{hedef}}","mesaj":"{{mesaj}}"}` | Gövde şablonu |
| `IMAR_SMS_BASLIK` | — | Şablondaki `{{baslik}}` yerine konur |
| `IMAR_TAKIP_ADRESI` | `http://localhost:3200/takip` | Mesajlara yazılan takip adresi |
| `IMAR_BILDIRIM_ARALIGI` | `3600000` | Tarama sıklığı (ms); `0` kapatır |

SMS için sağlayıcıya özel kod yoktur: gövde şablonu ortam değişkeninden
geldiği için NetGSM, İletimerkezi gibi sağlayıcılara kod değiştirmeden
bağlanır. Kanal kapalıyken bildirimler yine üretilir ve "kanal-kapali" olarak
kaydedilir; kanal açılınca müdür ekranından tekrar denenebilir.

## Kurum sorguları (TAKBİS / YAMBİS)

Belge metnini okumak bir belgenin **gerçekliğini** kanıtlamaz; asıl doğrulama
kaynağından yapılır. Uygulamada bunun için hazır bir katman vardır:

- Kontrol listesindeki **Tapu kayıt örneği** satırında "TAKBİS'ten sorgula",
  **Müteahhit yetki belgesi** satırında "YAMBİS'ten sorgula" düğmesi çıkar.
- Sonuç evrak kaydıyla karşılaştırılır ve bulgu üretilir; engel yoksa belge
  "kaynağından doğrulandı" olarak işaretlenir. **Karar yine memurundur.**
- Her sorgu denetim kaydına yazılır: kim, ne zaman, hangi girdiyle, sonuç ve
  ham yanıt (`kurum_sorgulari` tablosu). Kaydı müdür `/api/kurum-sorgulari`
  ile görür.
- Kurumdan gelen malik bilgisi vatandaş takip ekranına **çıkmaz**.

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `IMAR_TAKBIS` / `IMAR_YAMBIS` | `kapali` | `http` \| `deneme` \| `kapali` |
| `IMAR_*_URL`, `_YONTEM`, `_BASLIKLAR`, `_GOVDE` | — | Servis adresi ve istek şablonu |
| `IMAR_*_ALAN_*` | — | Yanıttaki alan yolları (`veri.tasinmaz.adaNo` gibi) |
| `IMAR_IL`, `IMAR_ILCE` | — | Sorguya eklenen sabit bilgiler |
| `IMAR_KURUM_ZAMAN_ASIMI` | `30000` | Zaman aşımı (ms) |

Gerçek istek/yanıt şekilleri **varsayılmamıştır**: alan eşlemesi
yapılandırmadan okunur, böylece kurum hangi biçimde dönerse dönsün kod
değişmez. Ayrıntı, kuruma sorulacaklar ve KVKK notları için
[`docs/entegrasyon.md`](docs/entegrasyon.md).

## Vatandaş takip ekranı

Amaç, "benim dosya ne oldu" telefonlarını azaltmak. Vatandaş hesap açmaz,
kimlik bilgisi vermez:

- Evrak kaydı açılırken **takip kodu** üretilir (ör. `C87E-QNMR-59LC`):
  12 karakter, karışan harfler (I, O, 0, 1) çıkarılmış, sıralı evrak
  numarasından bağımsız — deneme yanılma ile bulunamaz.
- Kod, **alındı belgesine** basılır. Belgede takip sayfasının adresini taşıyan
  bir kare kod da vardır (telefonla okutulunca sayfa açılır). Detay panelinden
  "alındı belgesi" ile yazdırılır.
- Vatandaş `http://<sunucu>/takip` adresinde kodu ve **telefonunun son dört
  hanesini** girer. Kayıtta telefon yoksa yalnızca kod sorulur.

**Vatandaşın gördüğü:** evrak no, konu, işlem türü, başvuru tarihi, sade durum
(*Başvurunuz alındı / İnceleniyor / Eksik belge var / Onaylandı / Reddedildi*),
**eksik belge listesi**, uygun bulunmayan belgeler ve gerekçeleri, kalan süre,
son işlem tarihi.

**Görmediği:** personel adları, iç notlar, açıklama alanı, yapay zekâ
bulguları, yüklenen dosyalar, başka hiçbir kayıt. Vatandaş ucu (`POST
/api/takip`) ayrı ve daraltılmıştır; personel API'si oturum ister.

**Güvenlik:** yanlış kod, yanlış hane ve olmayan kayıt **aynı** yanıtı verir
(hangi kodun var olduğu sızmaz); IP başına 10 dakikada 20 deneme sınırı vardır.

**Yayına alma:** vatandaş sayfası ayrı bir pakettir (`takip.html`), personel
arayüzünün kodunu içermez. İnternete açarken **yalnızca `/takip` ve
`POST /api/takip`** yolları dışarı verilmeli; `/api/evraklar` ve diğer uçlar iç
ağda kalmalıdır. Ters vekil (nginx vb.) ile bu ayrım yapılır.

## Yetkiler

| | Memur | Müdür |
| --- | --- | --- |
| Evrak açma, düzenleme, işlem/not ekleme | ✓ | ✓ |
| Dosya ekleme | ✓ | ✓ |
| Belge işaretleme, eksik belge yazısı | ✓ | ✓ |
| Belge kararı (uygun / uygun değil) | ✓ | ✓ |
| Ek silme | yalnızca kendi yüklediğini | tümünü |
| Evrak silme | — | ✓ |
| Personel ekleme/silme | — | ✓ |
| Kendi şifresini değiştirme | ✓ | ✓ |

Her işlem, yapan kişinin adıyla evrakın geçmişine yazılır.

## Veri nerede duruyor

**Sunucu kipinde:** `veri/imar-evrak.db` (SQLite) ve ekler için
`veri/ekler/`. İnceleme sonuçları da veritabanındadır. Yedekleme **`veri/` klasörünün tamamını** kopyalamaktır;
sunucu kapalıyken kopyalamak en temizi. Dosyalar diske üretilmiş adlarla
(`<uuid>.pdf`) yazılır, özgün adları veritabanında durur. Oturumlar 12 saat
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
  kurum/
    saglayici.ts           TAKBİS/YAMBİS için yapılandırmalı HTTP adaptörü
    sorgu.ts               Sorgu, karşılaştırma, denetim kaydı
    tipler.ts              Normalleştirilmiş sonuç tipleri
  bildirim/
    kurallar.ts            Süre, eksik belge ve sonuç bildirim kuralları
    kuyruk.ts              Bildirim kuyruğu, tekrar deneme
    saglayici.ts           SMTP ve HTTP (SMS) göndericileri
  db.ts                    SQLite şeması, göçler, ilk kurulum
  auth.ts                  scrypt şifre özeti, oturum sabitleri
  ai/
    inceleme.ts            İnceleme kuyruğu ve sonuç kayıtları
    metin.ts               PDF metin katmanı çıkarma, OCR'a düşme
    ocr.ts                 Tesseract işçisi, PDF sayfası → görüntü → metin
    kurallar.ts            Modelsiz kontroller (ada/parsel, tarih, imza…)
    saglayici.ts           Ollama / Claude / deneme sağlayıcıları
src/
  main.tsx                 React kökü
  index.css                Tailwind girişi + yazdırma stilleri
  App.tsx                  Durum yönetimi, filtreleme, dışa aktarma
  types.ts                 Evrak, İşlem, Filtre tipleri
  data.ts                  Durum/tür sabitleri, örnek veri
  belgeler.ts              Türe göre istenen belge listeleri
  hazirlik.ts              Dosya karara hazır mı hesabı
  parsel.ts                Aynı ada/parseldeki evrakları eşleştirme
  storage.ts               localStorage okuma-yazma, yedek çözümleme
  utils.ts                 Tarih/gün hesapları, evrak no, CSV, indirme
  veri/
    depo.ts                Sunucu/yerel veri katmanı, oturum çağrıları
  components/
    AlindiBelgesi.tsx      Takip kodu ve kare kod taşıyan alındı belgesi
    EksikBelgeYazisi.tsx   Yazdırılabilir eksik belge bildirimi
    TakipEkrani.tsx        Vatandaş sorgulama ekranı
    HazirlikKutusu.tsx     Dosya hazırlık özeti
    Inceleme.tsx           Otomatik inceleme rozeti ve bulgu listesi
    Giris.tsx              Giriş ekranı
    Kullanicilar.tsx       Hesap ve personel yönetimi
    Ozet.tsx               Özet kartları
    Filtreler.tsx          Arama ve filtre çubuğu
    EvrakListesi.tsx       Tablo
    EvrakDetay.tsx         Yan panel: bilgiler, belge listesi, ekler, geçmiş
    EvrakFormu.tsx         Yeni kayıt / düzenleme formu
    Rozet.tsx              Durum ve gecikme rozetleri
```

### Kaynağından doğrulama

Metin okuma bir belgenin **gerçekliğini** kanıtlamaz. Bunun için belgedeki
doğrulama kodu kullanılır: kod alana yazılır, memur e-Devlet sorgu sayfasında
teyit eder ve "doğrulandı" der; kim ne zaman doğruladı işlem geçmişine
yazılır. TAKBİS/YAMBİS gibi sistemlere doğrudan bağlanmak belediyenin
kurumsal entegrasyon iznine bağlıdır.

## Sonraki adımlar

- TAKBİS/YAMBİS bağlantısının açılması (kurumsal izin gerektirir; kod hazır,
  bkz. `docs/entegrasyon.md`).
- SOAP/XML dönen kurum servisleri için adaptöre XML desteği (gerçek şema
  geldiğinde).
- Eksik belge istendiğinde süre sayacının durması.
