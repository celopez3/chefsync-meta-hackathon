import { useRef, useState } from "react";

export type LocalPhoto = { file: File; url: string };

function CameraIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function PhotosIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-4.5-4.5L6 21" />
    </svg>
  );
}

/**
 * Exactly two ways in: take a photo, or pick from the camera roll.
 * Adding a photo auto-runs detection in App — there is no Scan step.
 * "Take a photo" uses capture="environment": on a phone that opens the
 * rear camera app directly; on desktop it falls back to a file picker.
 */
export default function MultiImageUploader({
  photos, onChange, disabled,
}: { photos: LocalPhoto[]; onChange: (p: LocalPhoto[]) => void; disabled?: boolean }) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const full = photos.length >= 4;

  function add(files: FileList | File[]) {
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    const next = [...photos, ...imgs.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, 4);
    onChange(next);
  }
  function remove(i: number) {
    URL.revokeObjectURL(photos[i].url);
    onChange(photos.filter((_, x) => x !== i));
  }

  return (
    <section aria-label="Add photos" id="snap">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={`rounded-[28px] p-4 shadow-[0_12px_28px_rgba(33,15,4,0.10)] ring-1 transition-colors sm:p-6 ${drag ? "bg-[#f9e7d7] ring-[#934b00]" : "bg-[#faf0dd] ring-[#e7d6b8]"}`}
      >
        <p className="font-[family-name:var(--font-display)] text-[26px] font-black leading-tight text-[#210f04]">What are we cooking with?</p>
        <p className="mt-1 text-[15px] font-medium text-stone-600">Take a photo of the ingredients in front of you, or of the receipt from your shop. We scan it automatically. Up to 4 photos.</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button type="button" disabled={disabled || full} onClick={() => cameraInput.current?.click()}
            className="flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-[26px] border-2 border-[#210f04] bg-[#690500] p-4 font-black text-white shadow-[0_10px_24px_rgba(33,15,4,0.16)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none">
            <CameraIcon />
            <span className="text-base leading-tight">Take a photo</span>
            <span className="text-xs font-bold text-white/85">Ingredients or receipt</span>
          </button>
          <button type="button" disabled={disabled || full} onClick={() => galleryInput.current?.click()}
            className="flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-[26px] border-2 border-[#210f04] bg-white p-4 font-black text-[#210f04] shadow-[0_10px_24px_rgba(33,15,4,0.16)] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:shadow-none">
            <PhotosIcon />
            <span className="text-base leading-tight">Pick from photos</span>
            <span className="text-xs font-bold text-stone-500">Your camera roll</span>
          </button>
        </div>
        {full && <p className="mt-2 text-center text-sm font-bold text-[#452103]">That’s 4 photos — remove one to add another.</p>}

        <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
        <input ref={galleryInput} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </div>

      {photos.length > 0 && (
        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible">
          {photos.map((p, i) => (
            <figure key={p.url} className="w-36 shrink-0 snap-start overflow-hidden rounded-[26px] bg-white shadow-[0_8px_20px_rgba(33,15,4,0.10)] ring-1 ring-[#e7d6b8] sm:w-auto">
              <img src={p.url} alt={`Kitchen photo ${i + 1}`} className="h-28 w-full object-cover" />
              <figcaption className="flex min-h-11 items-center justify-between px-3 text-xs font-bold text-stone-600">
                Photo {i + 1}
                <button type="button" onClick={() => remove(i)} className="flex min-h-11 items-center px-1 font-black text-[#690500]">Remove</button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
