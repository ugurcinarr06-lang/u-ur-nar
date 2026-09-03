# TAKBİS / YAMBİS entegrasyonu — hazırlık notu

Bu belge, kurum servislerine erişim izni geldiğinde **kod yazmadan** bağlantıyı
açabilmek için hazırlanmıştır. Uygulamadaki entegrasyon katmanı yazılmış ve
test edilmiş durumdadır; eksik olan tek şey kurumların verdiği adres, kimlik
bilgisi ve yanıt şemasıdır.

## Şu anki durum

| Bağlantı | Varsayılan | Ne yapıyor |
| --- | --- | --- |
| TAKBİS (tapu) | `kapali` | Ada/parsel ile taşınmaz ve malik sorgusu |
| YAMBİS (müteahhit) | `kapali` | Yetki belgesi numarası ile geçerlilik sorgusu |

`deneme` seçeneği örnek verilerle çalışır; arayüz, denetim kaydı ve
karşılaştırma mantığı bugün de denenebilir.

**Önemli:** TAKBİS ve YAMBİS kapalı sistemlerdir. Bu koda gerçek istek/yanıt
şekilleri **varsayılarak** yazılmamıştır; alan eşlemesi yapılandırmadan
okunur. Kurum size hangi JSON'u dönerse dönsün, alan yollarını ortam
değişkenine yazmanız yeterlidir.

## 1. Kurumlardan istenecekler

### TAKBİS — Tapu ve Kadastro Genel Müdürlüğü (TKGM)

Belediyeler tapu kayıtlarına TKGM ile yapılan **veri paylaşım protokolü**
üzerinden erişir. Yazı işleri/bilgi işlem müdürlüğü aracılığıyla başvurulur.

Başvuruda netleştirilmesi gerekenler:

1. **Servis adresi** (test ve canlı ayrı ayrı)
2. **Kimlik doğrulama yöntemi**: API anahtarı mı, kurumsal kullanıcı adı/şifre
   mi, istemci sertifikası (mTLS) mi, OAuth mu?
3. **IP kısıtı**: sunucunun sabit IP'sinin beyaz listeye eklenmesi
4. **Sorgu tipi**: il/ilçe/mahalle/ada/parsel ile taşınmaz sorgulama
5. **Yanıt şeması**: örnek bir başarılı yanıt ve bir "kayıt yok" yanıtı
   (JSON mu XML mi olduğu dâhil)
6. **Kota/hız sınırı**: günlük sorgu adedi, saniyedeki istek sınırı
7. **Loglama yükümlülüğü**: kurumun istediği denetim kaydı biçimi

### YAMBİS — Çevre, Şehircilik ve İklim Değişikliği Bakanlığı

Yapı müteahhitliği yetki belgesi sorgulaması. Aynı başlıklar sorulur; ek
olarak:

- Sorgunun **yetki belgesi numarası** ile mi, **vergi/TC numarası** ile mi
  yapılacağı
- Yanıtta belge durumu ("Faal", "Askıda", "İptal") ve geçerlilik tarihinin
  hangi alanlarda döndüğü

## 2. Uygulamanın kullandığı alanlar

Kurum yanıtında bu bilgiler varsa eşleştirin; olmayanları boş bırakın.

**TAKBİS**

| Bizdeki alan | Ne için kullanılıyor |
| --- | --- |
| ada, parsel | Evrak kaydıyla karşılaştırma (uyuşmazsa **engel**) |
| malik listesi | Başvuranın malik olup olmadığı (değilse **uyarı**) |
| mahalle | Bilgi |
| nitelik, yüzölçümü | Memura özet |
| takyidat/beyanlar | İpotek, haciz, şerh varsa **uyarı** |

**YAMBİS**

| Bizdeki alan | Ne için kullanılıyor |
| --- | --- |
| unvan | Memura özet |
| yetki belge no | Kayıt ve doğrulama referansı |
| geçerlilik tarihi | Geçmişse **engel** |
| durum | "Faal" değilse **engel** |
| grup/sınıf | Bilgi |

## 3. Bağlantı geldiğinde yapılacak ayar

Örnek (kurumun gerçek alan adlarına göre yolları değiştirin):

```bash
IMAR_TAKBIS=http
IMAR_TAKBIS_URL=https://servis.tkgm.gov.tr/…/tasinmazSorgu
IMAR_TAKBIS_YONTEM=POST
IMAR_TAKBIS_BASLIKLAR='{"Authorization":"Bearer <kurum-anahtarı>"}'
IMAR_TAKBIS_GOVDE='{"il":"{{il}}","ilce":"{{ilce}}","mahalle":"{{mahalle}}","ada":"{{ada}}","parsel":"{{parsel}}"}'
# Yanıttaki alan yolları — nokta ile iç içe, dizide sıra numarası:
IMAR_TAKBIS_ALAN_ADA=veri.tasinmaz.adaNo
IMAR_TAKBIS_ALAN_PARSEL=veri.tasinmaz.parselNo
IMAR_TAKBIS_ALAN_MAHALLE=veri.tasinmaz.mahalleAdi
IMAR_TAKBIS_ALAN_NITELIK=veri.tasinmaz.cinsi
IMAR_TAKBIS_ALAN_YUZOLCUMU=veri.tasinmaz.alan
IMAR_TAKBIS_ALAN_TAKYIDAT=veri.beyanlar
IMAR_TAKBIS_ALAN_MALIK=veri.malikListesi          # dizi
IMAR_TAKBIS_ALAN_MALIK_AD=adSoyad                 # dizideki her öğenin ad alanı

IMAR_YAMBIS=http
IMAR_YAMBIS_URL=https://yambis.csb.gov.tr/…/yetkiBelgesiSorgu
IMAR_YAMBIS_GOVDE='{"belgeNo":"{{belgeNo}}"}'
IMAR_YAMBIS_ALAN_UNVAN=sonuc.unvan
IMAR_YAMBIS_ALAN_BELGE_NO=sonuc.yetkiBelgeNo
IMAR_YAMBIS_ALAN_GECERLILIK=sonuc.gecerlilikTarihi
IMAR_YAMBIS_ALAN_DURUM=sonuc.durum
IMAR_YAMBIS_ALAN_SINIF=sonuc.grup

IMAR_IL=Ankara
IMAR_ILCE=Çankaya
IMAR_KURUM_ZAMAN_ASIMI=30000
```

İstek gövdesindeki `{{il}}`, `{{ilce}}`, `{{mahalle}}`, `{{ada}}`,
`{{parsel}}`, `{{belgeNo}}` yerlerine evrak kaydındaki değerler konur.
`{{...}}` şablonu adres alanında da çalışır (GET ile sorgulayan servisler
için: `IMAR_TAKBIS_YONTEM=GET` ve adrese parametreleri yazın).

### Doğrulama adımları

1. `IMAR_TAKBIS=deneme` ile arayüzün çalıştığını görün.
2. Kurumun test ortamına `http` ile bağlanın, bir ada/parsel sorgulayın.
3. Sonuçtaki alanlar boş geliyorsa yalnızca `..._ALAN_...` yollarını
   düzeltin — kod değişmez.
4. Müdür ekranındaki sorgu kaydında **ham yanıt** saklanır; yol hatasını
   oradan görebilirsiniz.

### Servis XML (SOAP) dönüyorsa

Bugünkü adaptör **JSON** yanıt bekler. Kurum XML/SOAP kullanıyorsa iki yol
vardır: (a) kurumun JSON uçları varsa onlar tercih edilir, (b) yoksa
`server/kurum/saglayici.ts` içine bir XML çözümleyici eklenmesi gerekir —
bu, tek dosyalık bir iştir ve gerçek şema geldiğinde yapılmalıdır.
Şemayı bilmeden yazmak, yanlış varsayım üretir.

## 4. Sorgu ne yapar, ne yapmaz

- Sorgu sonucu **belgeyi onaylamaz**. Yalnızca "kaynağından doğrulandı"
  işaretini koyar ve bulgu üretir; uygun/uygun değil kararı memurundur.
- Ada/parsel uyuşmazlığı ve bulunamayan kayıt **engel** sayılır, belge
  doğrulanmış işaretlenmez.
- Başvuranın malik listesinde olmaması **uyarıdır** — vekâleten başvuru ve
  hissedarlık meşru durumlardır, memur değerlendirir.

## 5. KVKK ve denetim

- Her sorgu `kurum_sorgulari` tablosuna yazılır: kim sorguladı, ne zaman,
  hangi girdiyle, sonuç ve **ham yanıt**. Kurum protokollerinin istediği
  denetim izi budur.
- Sorgu yetkisi giriş yapmış personeldedir; kayıt listesini müdür görür.
- Kurumdan gelen kişisel veri (malik adı) yalnızca karşılaştırma ve memura
  gösterim için kullanılır, vatandaş takip ekranına **çıkmaz**.
- Protokolde saklama süresi sınırı varsa `kurum_sorgulari.ham` alanı için
  düzenli temizlik görevi tanımlanmalıdır.

## 6. Deneme senaryoları (bağlantı yokken)

`IMAR_TAKBIS=deneme IMAR_YAMBIS=deneme` ile:

| Girdi | Sonuç |
| --- | --- |
| Parsel 999 | Kayıt bulunamadı (engel) |
| Parsel 888 | Malik farklı (uyarı) |
| Parsel 777 | Takyidat var (uyarı) |
| Diğer parseller | Malik "Mehmet Yılmaz", eşleşme başarılı |
| Yetki belge no sonu `0` | Süresi dolmuş (engel) |
| Diğer belge numaraları | Faal, geçerli |
