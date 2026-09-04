# Kurulum ve devreye alma

Bu belge, uygulamayı bir belediye sunucusunda çalışır hâle getirmek içindir.
Adımlar Linux (Ubuntu/Debian) içindir; Windows notları sonda.

## 1. Ne gerekiyor

| | En az | Önerilen |
| --- | --- | --- |
| İşletim sistemi | Ubuntu 22.04 / Debian 12 | aynı |
| Node.js | 20 | **22 LTS** (24 ile kurulmaz, aşağıya bakın) |
| Bellek | 2 GB | 4 GB (OCR ve yerel model kullanılacaksa 8 GB+) |
| Disk | 20 GB | 100 GB (evrak ekleri zamanla büyür) |
| Ağ | İç ağdan erişim | Vatandaş takibi için ayrıca dış erişim |

Veritabanı ayrı bir sunucu istemez; her şey `veri/` klasöründeki tek SQLite
dosyası ve ek dosyalarıdır.

> **Node 24 ile kurulmaz.** `better-sqlite3` hazır ikili dosyalarını Node 22'ye
> kadar yayımlıyor; Node 24'te npm kaynaktan derlemeye çalışır ve Windows'ta
> Visual Studio C++ araçlarını, Linux'ta build-essential'ı ister. Hata
> `gyp ERR! find VS` veya `Could not find any Visual Studio installation`
> biçiminde görünür. Çözüm: **Node 22 LTS** kurun, `node_modules` ile
> `package-lock.json` dosyalarını silip `npm install` komutunu tekrarlayın.

## 2. Kurulum

```bash
sudo useradd -r -m -d /opt/imar-evrak imar
sudo -u imar -s

cd /opt/imar-evrak
git clone <depo-adresi> uygulama     # veya dosyaları kopyalayın
cd uygulama/imar-evrak

npm ci                # bağımlılıklar
npm run build         # arayüzü derler
npm run ocr-kur       # taranmış belgeler için Türkçe dil verisi (~4,5 MB)
```

İnternet erişimi olmayan sunucuda: `npm ci` ve `npm run ocr-kur` başka bir
makinede çalıştırılıp `node_modules/` ile `veri/tessdata/` kopyalanır.

## 3. Ayar dosyası

`/etc/imar-evrak.env` (yalnızca `imar` kullanıcısı okuyabilsin):

```bash
PORT=3200
IMAR_DB=/opt/imar-evrak/veri/imar-evrak.db
IMAR_TAKIP_ADRESI=https://belediye.gov.tr/imar-takip
TRUST_PROXY=1          # nginx arkasında istemci IP'si ve Secure çerez için
IMAR_HTTPS=1           # çerezi her zaman Secure yap

# İlk açılışta admin şifresi (kurulumdan sonra bu satır silinebilir)
IMAR_ADMIN_SIFRE=güçlü-bir-şifre

# Yapay zekâ incelemesi (kendi sunucunuzdaki model)
IMAR_AI=ollama
IMAR_AI_MODEL=llama3.1
IMAR_AI_URL=http://127.0.0.1:11434

# Bildirimler
IMAR_EPOSTA=acik
IMAR_SMTP_URL=smtp://imar:sifre@posta.belediye.gov.tr:587
IMAR_EPOSTA_GONDEREN=imar@belediye.gov.tr
IMAR_SMS=acik
IMAR_SMS_URL=https://sms-saglayici/api/gonder
IMAR_SMS_GOVDE={"numara":"{{hedef}}","mesaj":"{{mesaj}}","baslik":"{{baslik}}"}
IMAR_SMS_BASLIK=BELEDIYE

# Kurum sorguları — protokol tamamlanınca açılır (bkz. entegrasyon.md)
IMAR_TAKBIS=kapali
IMAR_YAMBIS=kapali
```

```bash
sudo chown imar:imar /etc/imar-evrak.env
sudo chmod 600 /etc/imar-evrak.env
```

## 4. Servis olarak çalıştırma

`/etc/systemd/system/imar-evrak.service`:

```ini
[Unit]
Description=Imar Evrak Takip
After=network.target

[Service]
Type=simple
User=imar
WorkingDirectory=/opt/imar-evrak/uygulama/imar-evrak
EnvironmentFile=/etc/imar-evrak.env
ExecStart=/usr/bin/npx tsx server/index.ts
Restart=always
RestartSec=5
# Güvenlik sıkılaştırma
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/opt/imar-evrak/veri

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now imar-evrak
sudo journalctl -u imar-evrak -f      # ilk açılışta admin şifresi burada yazar
```

## 5. Ters vekil (nginx) ve dış erişim

**İç ağ** — personel arayüzü, kurum ağıyla sınırlı:

```nginx
server {
    listen 443 ssl;
    server_name imar.belediye.local;
    ssl_certificate     /etc/ssl/certs/imar.crt;
    ssl_certificate_key /etc/ssl/private/imar.key;

    client_max_body_size 30m;          # 25 MB ek + pay

    location / {
        proxy_pass http://127.0.0.1:3200;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Dış (internet)** — yalnızca vatandaş takibi. Personel uçları dışarı
açılmaz:

```nginx
server {
    listen 443 ssl;
    server_name belediye.gov.tr;

    # Yalnızca bu iki yol dışarıya verilir
    location = /imar-takip {
        proxy_pass http://127.0.0.1:3200/takip;
        include proxy_params;
    }
    location = /api/takip {
        limit_req zone=takip burst=5 nodelay;
        proxy_pass http://127.0.0.1:3200/api/takip;
        include proxy_params;
    }
    location /assets/ {                 # arayüz dosyaları
        proxy_pass http://127.0.0.1:3200/assets/;
    }
    location / { return 404; }
}
```

`http` bloğunda hız sınırı bölgesi:

```nginx
limit_req_zone $binary_remote_addr zone=takip:10m rate=30r/m;
```

Uygulama içinde de IP başına 10 dakikada 20 deneme sınırı vardır; nginx
sınırı ilk savunma hattıdır. `X-Forwarded-For` başlığının doğru okunması
için uygulamaya `TRUST_PROXY=1` verin (bkz. Bilinen sınırlar).

## 6. Yedekleme

```bash
cd /opt/imar-evrak/uygulama/imar-evrak
npm run yedek                    # veri/yedekler/20260903T0350/
npm run yedek -- /mnt/yedek      # ağ/dış sürücüye
```

Sunucu çalışırken güvenlidir (SQLite'ın kendi yedekleme işlevi kullanılır).
Veritabanı, ekler ve OCR dil verisi birlikte kopyalanır; varsayılan olarak
son 14 yedek saklanır (`IMAR_YEDEK_ADEDI`).

Her gece 02:00'de almak için `crontab -u imar -e`:

```
0 2 * * * cd /opt/imar-evrak/uygulama/imar-evrak && /usr/bin/npm run yedek >> /opt/imar-evrak/yedek.log 2>&1
```

**Geri yükleme:** servisi durdurun, yedek klasöründeki `imar-evrak.db` ve
`ekler/` içeriğini `veri/` altına kopyalayın, servisi başlatın.

```bash
sudo systemctl stop imar-evrak
sudo -u imar cp -a /mnt/yedek/20260903T0350/. /opt/imar-evrak/veri/
sudo systemctl start imar-evrak
```

## 7. İlk açılış

1. `journalctl` çıktısındaki admin şifresiyle `https://imar.belediye.local`
   adresine girin.
2. **Hesap → Şifremi değiştir** ile şifreyi değiştirin.
3. **Hesap → Yeni personel ekle**: müdür ve memurları e-postalarıyla ekleyin
   (e-posta, süre hatırlatmaları için gereklidir).
4. `IMAR_ADMIN_SIFRE` satırını ayar dosyasından silin.
5. `src/belgeler.ts` içindeki belge listelerini belediyenizin uygulamasına
   göre gözden geçirin, gerekiyorsa düzenleyip `npm run build` çalıştırın.
6. **Harç tarifesini girin:** bir dosya açıp **Harç ve ücretler → tarife**
   ekranından, belediye meclisinizin tarife cetvelindeki birim fiyatları
   yazın; kullanmadığınız kalemleri "aktif" işaretinden çıkarın, eksik
   kalemleri "+ Kalem ekle" ile tanımlayın. "Yapı maliyetinin yüzdesi"
   tabanlı bir kalem kullanacaksanız Bakanlık tebliğindeki **yapı sınıfı m²
   birim maliyetlerini** de girin. Sonunda *"bu tarife belediyemizin
   yürürlükteki cetvelidir"* kutusunu işaretleyin — işaretlenmeden basılan
   tahakkuk fişlerinde "bilgi amaçlıdır" uyarısı çıkar. Tarifeyi yalnızca
   müdür değiştirebilir; yıl başında güncellemeyi unutmayın.
7. `src/yapi.ts` içindeki yapı/parsel alanlarını, ruhsat ve imar durumu
   formlarınızla karşılaştırın; farklıysa düzenleyip `npm run build` yapın.
8. Bir deneme evrakı açıp alındı belgesini yazdırın, takip ekranından
   sorgulayın; yapı bilgilerini doldurup ruhsat çıktısını basın.

## 8. Şifre unutulduğunda

Sunucuya erişimi olan yönetici, uygulama klasöründe:

```bash
npm run sifre-sifirla                      # kayıtlı kullanıcıları listeler
npm run sifre-sifirla -- admin             # rastgele şifre üretir, ekrana yazar
npm run sifre-sifirla -- admin YeniSifre1  # belirlediğiniz şifreyi atar
```

Sıfırlanan hesabın **açık oturumları kapatılır**. Girdikten sonra
**Hesap → Şifremi değiştir** ile kendi şifrenizi koyun.

Bu betiği çalıştırabilen kişi zaten veritabanı dosyasını okuyabilir; bu yüzden
ek bir yetki açığı yaratmaz. Buradaki güvenlik sınırı **sunucu dosyalarına
erişim**tir — `veri/` klasörünü ve `/etc/imar-evrak.env` dosyasını yalnızca
`imar` kullanıcısına açık tutun.

## 9. Güncelleme

```bash
cd /opt/imar-evrak/uygulama
sudo -u imar git pull
cd imar-evrak && sudo -u imar npm ci && sudo -u imar npm run build
sudo systemctl restart imar-evrak
```

Veritabanı göçleri açılışta kendiliğinden çalışır; ayrı bir adım yoktur.
Güncelleme öncesi `npm run yedek` alın.

## 10. İzleme

```bash
systemctl status imar-evrak
journalctl -u imar-evrak -n 100
du -sh /opt/imar-evrak/veri/ekler      # ek dosyalarının büyümesi
```

Bildirimlerin gidip gitmediği **Hesap → Bildirimler** ekranından görülür;
hatalı gönderimler orada tekrar denenebilir.

## 11. Bilinen sınırlar

- **HTTPS'i siz zorunlu kılmalısınız.** Oturum çerezi, istek HTTPS üzerinden
  geldiğinde `Secure` bayrağı alır (ters vekil arkasında `TRUST_PROXY=1`
  gerekir; `IMAR_HTTPS=1` ile her zaman zorlanır). Yine de nginx'te
  `return 301 https://` ile düz HTTP'yi kapatın.
- **Disk kotası yok.** Ek başına 25 MB sınırı vardır, toplam boyut
  sınırlanmaz; `veri/ekler` büyümesini izleyin.
- **Personel uçlarında hız sınırı yok.** İç ağ varsayımıyla; dışarı
  açılacaksa nginx'te sınır koyun.
- **Yerel model donanım ister.** `IMAR_AI=ollama` için en az 8 GB bellek
  önerilir; yetersizse `IMAR_AI=kapali` bırakın, kural kontrolleri çalışmaya
  devam eder.
- **Harç tutarları belediyenindir.** Sistem tarife cetvelini bilmez, yalnızca
  hesap yöntemini bilir. Tarife girilmeden üretilen tahakkuklar sıfır çıkar ve
  "bilgi amaçlıdır" damgası taşır. Tarife yıl başında elle güncellenir;
  otomatik bir güncelleme kaynağı yoktur.
- **Belge çıktıları imza yerine geçmez.** Ruhsat, iskân ve imar durumu
  belgeleri dosyadaki bilgilerden doldurulur; hukuki geçerlilik ıslak/e-imza
  ile doğar. Belediyenizin form düzeni farklıysa ilgili bileşen
  (`src/components/RuhsatBelgesi.tsx` vb.) düzenlenir.

## Windows sunucuya kurulum

Uygulama Windows'ta da tam olarak çalışır. Aşağıdaki adımlar Windows Server
2016+ (veya Windows 10/11) için yazılmıştır.

### 1. Node.js kurun

[nodejs.org](https://nodejs.org)'dan **22 LTS** sürümünü indirip kurun (`.msi`).
Kurulumdan sonra PowerShell'de doğrulayın:

```powershell
node --version   # v22.x.x görünmeli
```

### 2. Uygulamayı kopyalayın

USB'den veya paylaşımdan `imar-evrak` klasörünü sunucuya kopyalayın, örn.
`C:\imar-evrak\uygulama\imar-evrak`. Klasörün içinde `node_modules`, `dist`
ve `veri\tessdata` **zaten hazır olmalı** (geliştirme makinenizde
`npm install`, `npm run build`, `npm run ocr-kur` çalıştırıp öyle
kopyalayın) — sunucuda internet olmasa bile çalışır.

Sunucuda da internet varsa, kopyalamadan önce `node_modules` ve `dist`
klasörlerini silip orada `npm ci && npm run build` çalıştırmak daha
sağlamdır (o makineye özel, temiz bir kurulum olur).

### 3. Bir kez elle deneyin

PowerShell'i **yönetici olarak** açıp klasöre gidin:

```powershell
cd C:\imar-evrak\uygulama\imar-evrak
$env:IMAR_DB = "C:\imar-evrak\veri\imar-evrak.db"
$env:IMAR_ADMIN_SIFRE = "güçlü-bir-şifre"
npm run basla
```

`İmar Evrak sunucusu: http://localhost:3200` yazısını görün, tarayıcıda
deneyin, sonra `Ctrl+C` ile durdurun. Bu adım, servis kurulumundan önce
temel bir şeyin bozuk olmadığını doğrular.

### 4. NSSM ile kalıcı servis kurun

Terminal penceresi kapanınca uygulamanın da kapanmaması için
[NSSM](https://nssm.cc/download) kullanılır. `nssm.exe`'yi indirip PATH'e
ekleyin veya tam yolla çağırın:

```powershell
nssm install ImarEvrak
```

Açılan pencerede:

- **Path:** `node.exe`'nin tam yolu (`where node` ile bulunur, genelde
  `C:\Program Files\nodejs\node.exe`)
- **Startup directory:** `C:\imar-evrak\uygulama\imar-evrak`
- **Arguments:** `node_modules\tsx\dist\cli.mjs server\index.ts`
  (build zaten yapıldığı için her başlatmada `npm run build` çalıştırmaya
  gerek yok — doğrudan sunucuyu başlatır)
- **Environment** sekmesinde, her satıra bir tane olacak şekilde:
  ```
  PORT=3200
  IMAR_DB=C:\imar-evrak\veri\imar-evrak.db
  IMAR_ADMIN_SIFRE=güçlü-bir-şifre
  ```
  (İlk açılıştan sonra `IMAR_ADMIN_SIFRE` satırı silinebilir.)

"Install service" ile kaydedin, sonra:

```powershell
nssm start ImarEvrak
Get-Service ImarEvrak      # "Running" görünmeli
```

Sunucu yeniden başlasa bile servis otomatik ayağa kalkar. Günlükler için:
`nssm set ImarEvrak AppStdout C:\imar-evrak\gunluk.log` ve `AppStderr` aynı
şekilde ayarlanabilir.

### 5. Güvenlik duvarı

Yalnızca iç ağdan erişilecekse Windows Defender Güvenlik Duvarı'nda 3200
portunu **yalnızca kurum ağı için** açın:

```powershell
New-NetFirewallRule -DisplayName "İmar Evrak" -Direction Inbound `
  -LocalPort 3200 -Protocol TCP -Action Allow -Profile Domain,Private
```

Vatandaş takip sayfası dışarı açılacaksa (IIS/nginx ters vekille ayrı bir
konudur), yalnızca `/takip` ve `POST /api/takip` yollarının dışarı
verildiğinden emin olun — bkz. "5. Ters vekil" bölümündeki nginx örneği,
aynı mantık IIS URL Rewrite ile de kurulabilir.

### 6. Yedekleme (Görev Zamanlayıcı)

`scripts/yedek.mjs` saf JavaScript'tir, `tsx` gerektirmez — Görev
Zamanlayıcı'da doğrudan çalıştırılabilir:

- **Program:** `C:\Program Files\nodejs\node.exe`
- **Argümanlar:** `scripts\yedek.mjs`
- **Başlangıç konumu:** `C:\imar-evrak\uygulama\imar-evrak`
- **Ortam değişkeni:** `IMAR_DB=C:\imar-evrak\veri\imar-evrak.db` (görev
  özelliklerinde ortam değişkeni tanımlanamıyorsa, `yedek.mjs`'i çağıran
  küçük bir `.bat` dosyası içine `set IMAR_DB=...` satırıyla yazılabilir)

Her gece 02:00'de tetiklenecek şekilde tetikleyici eklenir.

### 7. Şifre sıfırlama

```powershell
cd C:\imar-evrak\uygulama\imar-evrak
npm run sifre-sifirla                      # kullanıcıları listeler
npm run sifre-sifirla -- admin             # yeni şifre üretir
```
