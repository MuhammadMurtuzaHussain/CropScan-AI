import React, { useEffect, useState } from 'react';
import { connect, analyzeSample, analyzeFile, sampleUrl } from './api.js';
import { MODE_COPY, verdictView, matchesTruth } from './lib.js';
import Result from './Result.jsx';

export default function App() {
  const [conn, setConn] = useState(null);
  const [fatal, setFatal] = useState(null);
  const [preview, setPreview] = useState(null);
  const [truth, setTruth] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [crop, setCrop] = useState('');

  useEffect(() => { connect().then(setConn).catch((e) => setFatal(e.message)); }, []);

  async function run(promise, src, id, tr) {
    setBusy(true); setError(null); setResult(null); setPreview(src); setActiveId(id); setTruth(tr ?? null);
    try { setResult(await promise); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  const pickSample = (s) => run(analyzeSample(conn, s.id), sampleUrl(s), s.id, s.truth);
  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (f) run(analyzeFile(f, crop), URL.createObjectURL(f), null, null);
    e.target.value = '';
  };

  if (fatal) return <main className="wrap"><p className="error">Could not start: {fatal}</p></main>;
  if (!conn) return <main className="wrap"><p className="muted">Connecting…</p></main>;

  const copy = MODE_COPY[conn.mode];
  const canUpload = conn.mode === 'live';

  return (
    <main className="wrap">
      <header>
        <div>
          <h1><span aria-hidden>🌿</span> CropScan AI</h1>
          <p className="lede">Photograph a crop leaf and get a cautious read on visible disease signs, checked by code before you see it.</p>
        </div>
        <span className={`badge ${conn.mode}`} title={copy.note}>{copy.badge}{conn.health?.model && conn.mode === 'live' ? ` · ${conn.health.model}` : ''}</span>
      </header>
      <p className="note">{copy.note}</p>

      <div className="grid">
        <section aria-label="Choose an image">
          <label className="field">
            <span>Crop</span>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} disabled={!canUpload}>
              <option value="">Not sure (auto-detect, less reliable)</option>
              {conn.crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className={`drop ${canUpload ? '' : 'disabled'}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} disabled={!canUpload || busy} />
            <strong>{canUpload ? 'Upload a leaf photo' : 'Uploads need a local model'}</strong>
            <span>{canUpload ? 'JPEG, PNG or WebP, up to 8 MB' : 'Pick a sample below'}</span>
          </label>

          <h2>Sample images</h2>
          <p className="muted small">Real leaf photos from the CC0 PlantVillage dataset, each with its true label. The crop is set from the label.</p>
          <ul className="samples">
            {conn.samples.map((s) => (
              <li key={s.id}>
                <button className={activeId === s.id ? 'active' : ''} disabled={busy} onClick={() => pickSample(s)} title={s.truth}>
                  <img src={sampleUrl(s)} alt={s.truth} loading="lazy" width="96" height="96" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-live="polite" aria-label="Result">
          {!preview && !busy && <div className="empty">Pick a sample or upload a photo to start.</div>}
          {preview && <img className="preview" src={preview} alt="Selected leaf" />}
          {busy && <p className="muted">Analysing… a local model can take 10–30 seconds on the first image.</p>}
          {error && <p className="error">{error}</p>}
          {result && <Result result={result} view={verdictView(result)} match={matchesTruth(result, truth)} truth={truth} />}
        </section>
      </div>

      <footer>
        <p>Open source (MIT). Model: Gemma 4 via Ollama. Sample images: PlantVillage, CC0. <strong>Not agronomic advice.</strong></p>
      </footer>
    </main>
  );
}
