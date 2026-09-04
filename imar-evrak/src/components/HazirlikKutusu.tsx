import type { Hazirlik } from '../hazirlik';

function Liste({ baslik, maddeler, renk }: { baslik: string; maddeler: string[]; renk: string }) {
  if (maddeler.length === 0) return null;
  return (
    <div className="mt-2">
      <p className={`text-xs font-medium ${renk}`}>
        {baslik} ({maddeler.length})
      </p>
      <ul className="mt-0.5 list-disc pl-5 text-xs text-slate-700">
        {maddeler.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

/** Evrakın karar için hazır olup olmadığını ve nedenlerini gösterir. */
export function HazirlikKutusu({ hazirlik }: { hazirlik: Hazirlik }) {
  const { hazir, tamamSayisi, zorunluSayisi } = hazirlik;

  return (
    <div
      className={`hazirlik-kutusu rounded-xl border p-4 ${
        hazir ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {hazir ? 'Dosya karara hazır' : 'Dosya henüz hazır değil'}
        </h3>
        <span className="text-xs tabular-nums text-slate-600">
          {tamamSayisi}/{zorunluSayisi} belge tamam
        </span>
      </div>

      {hazir ? (
        <p className="mt-1 text-xs text-emerald-800">
          Zorunlu belgelerin tamamı teslim alındı ve uygun bulundu. Karar sizin.
        </p>
      ) : (
        <>
          <Liste
            baslik="Uygun bulunmadı"
            maddeler={hazirlik.uygunsuzlar}
            renk="text-rose-700"
          />
          <Liste
            baslik="İncelemede engel çıktı, karar bekliyor"
            maddeler={hazirlik.engeller}
            renk="text-rose-700"
          />
          <Liste baslik="Teslim alınmadı" maddeler={hazirlik.eksikler} renk="text-amber-700" />
          <Liste
            baslik="Teslim alındı, memur kararı bekliyor"
            maddeler={hazirlik.bekleyenKararlar}
            renk="text-sky-700"
          />
        </>
      )}

      {(hazirlik.uyariSayisi > 0 || hazirlik.incelemeSuruyor) && (
        <p className="mt-2 text-xs text-slate-500">
          {hazirlik.incelemeSuruyor && 'Bazı belgeler hâlâ inceleniyor. '}
          {hazirlik.uyariSayisi > 0 &&
            `${hazirlik.uyariSayisi} uyarı bulgusu var (karara engel değil).`}
        </p>
      )}
    </div>
  );
}
