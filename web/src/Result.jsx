import React from 'react';

const LABEL = { healthy: 'Healthy', issue_suspected: 'Disease', unclear: 'Unclear', not_a_plant: 'Not a leaf' };

export default function Result({ result, view, match, truth }) {
  const failed = result.checks.filter((c) => !c.passed);
  return (
    <article className={`result ${view.tone}`}>
      <p className="disclaimer" role="note">{result.disclaimer}</p>
      <h2>{view.headline}</h2>
      <p className="meta">
        Confidence: <strong>{result.confidence}</strong>
        <span className="tip" title="The model's own rating, adjusted by code checks. It is not a calibrated probability."> (self-reported)</span>
        {result.crop && <>{' · '}Crop: {result.crop} ({result.cropSource !== 'grower' ? 'model guess' : truth ? 'from the sample label' : 'you chose'})</>}
        {' · '}{result.source === 'recorded' ? `Recorded ${result.model} run` : `Live ${result.model}`}
      </p>

      {result.signs.length > 0 && (
        <>
          <h3>What the model says it sees</h3>
          <ul>{result.signs.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </>
      )}

      <h3>{result.verdict === 'issue_suspected' ? 'General guidance' : 'Next steps'}</h3>
      <ul>{result.advice.map((a, i) => <li key={i}>{a}</li>)}</ul>

      <details open={failed.length > 0}>
        <summary>{failed.length ? `${failed.length} code check${failed.length > 1 ? 's' : ''} flagged this answer` : 'All code checks passed'}</summary>
        <ul className="checks">
          {result.checks.map((c) => (
            <li key={c.id} className={c.passed ? 'pass' : 'fail'}><span aria-hidden>{c.passed ? '✓' : '✕'}</span> {c.note}</li>
          ))}
        </ul>
      </details>

      {truth && (
        <p className={`truth ${match ? 'hit' : 'miss'}`}>
          Ground truth: <code>{truth}</code> → {match ? 'verdict matches' : `verdict (${LABEL[result.verdict]}) does not match`}
        </p>
      )}
    </article>
  );
}
