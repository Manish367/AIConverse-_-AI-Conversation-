import React from 'react';

export default function CompareResults({ results }) {
  if (!results) return null;
  return (
    <div className="mt-4">
      <div className="row g-3">
        {Object.entries(results).map(([m, text]) => (
          <div key={m} className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <strong>{m}</strong>
              </div>
              <div className="card-body">
                <div style={{ whiteSpace: 'pre-wrap' }}>{String(text)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
