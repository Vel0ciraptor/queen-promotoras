import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

export default function ImportarExcelModal({ onClose, onImportado }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [step, setStep] = useState('select'); // select | preview | importing | done
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState([]);
  const [allData, setAllData] = useState([]);
  const [detectedCols, setDetectedCols] = useState([]);
  const [result, setResult] = useState(null);

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);

        if (json.length === 0) {
          toast.error('El archivo está vacío');
          return;
        }

        setAllData(json);
        setPreview(json.slice(0, 5));
        setDetectedCols(Object.keys(json[0]));
        setStep('preview');
      } catch {
        toast.error('No se pudo leer el archivo. Asegúrate de que sea .xlsx, .xls o .csv');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setStep('importing');
    try {
      const { data } = await api.post('/clientes/import', { clientes: allData });
      setResult(data);
      setStep('done');
      if (data.errores.length === 0) {
        toast.success(`¡${data.importadas} clientes importadas!`);
      } else {
        toast.warning(`${data.importadas} importadas, ${data.errores.length} con error`);
      }
      onImportado();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      let detail = 'Error al importar';
      if (status === 413) detail = 'El archivo es demasiado grande. Intenta con menos filas.';
      else if (status === 403) detail = 'No tienes permiso de administrador.';
      else if (status === 400) detail = msg || 'Datos inválidos en el archivo.';
      else if (status >= 500) detail = msg || err.response?.data?.details || 'Error del servidor.';
      else if (msg) detail = msg;
      toast.error(detail);
      setStep('preview');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ color: 'var(--pink-strong)', fontSize: '1.25rem' }}>📄 Importar desde Excel</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight: 'unset' }}>
            <X size={18} />
          </button>
        </div>

        {step === 'select' && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFile}
              style={{ display: 'none' }}
            />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed var(--border)', borderRadius: '1rem', padding: '2.5rem 1rem',
                cursor: 'pointer', transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--pink-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Upload size={40} style={{ color: 'var(--pink-strong)', marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Seleccionar archivo</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formatos: .xlsx, .xls, .csv</p>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface)', borderRadius: '0.75rem', padding: '1rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Columnas esperadas:</p>
              <p>Nombre, Ci, Teléfono, Monto, Veces que compro</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>También acepta: C.I, C.I., Carnet, Telefono (sin tilde), Celular, Monto de Compra, VECES COMPRADAS</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              <FileSpreadsheet size={16} style={{ color: 'var(--pink-strong)' }} />
              <span style={{ fontWeight: 700 }}>{fileName}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {allData.length} fila{allData.length !== 1 ? 's' : ''}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Columnas detectadas:</span>
              {detectedCols.map(col => (
                <span key={col} style={{
                  fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '0.5rem',
                  background: ['Nombre','Ci','Teléfono','Monto','Veces que compro'].includes(col) ? '#D1FAE5' : '#FEF3C7',
                  color: ['Nombre','Ci','Teléfono','Monto','Veces que compro'].includes(col) ? '#065F46' : '#92400E',
                  fontWeight: 600
                }}>{col}</span>
              ))}
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface)' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nombre</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Ci</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left' }}>Teléfono</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Monto</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Veces que compro</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.4rem 0.5rem' }}>{row.Nombre || row.nombre || '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>{row.Ci || row.ci || row['C.I'] || '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>{row.Teléfono || row.telefono || '—'}</td>
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>{row.Monto || row.monto || 0}</td>
                      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: 'var(--text-muted)' }}>{row['Veces que compro'] || row['VECES COMPRADAS'] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {allData.length > 5 && (
                <p style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ... y {allData.length - 5} fila{allData.length - 5 !== 1 ? 's' : ''} más
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setStep('select'); setAllData([]); setPreview([]); }}>
                Volver
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleImport}>
                ✅ Importar {allData.length} cliente{allData.length !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div className="animate-spin" style={{
              width: 48, height: 48, border: '4px solid var(--border)', borderTopColor: 'var(--pink-strong)',
              borderRadius: '50%', margin: '0 auto 1rem'
            }} />
            <p style={{ fontWeight: 700 }}>Importando {allData.length} clientes...</p>
          </div>
        )}

        {step === 'done' && result && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <CheckCircle size={48} style={{ color: '#10B981', marginBottom: '0.75rem' }} />
            <p style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }}>¡Importación completada!</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {result.importadas} cliente{result.importadas !== 1 ? 's' : ''} importada{result.importadas !== 1 ? 's' : ''}
            </p>

            {result.columnas_detectadas?.length > 0 && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Columnas leídas: {result.columnas_detectadas.join(', ')}
              </div>
            )}

            {result.errores.length > 0 && (
              <div style={{ textAlign: 'left', background: '#FEF3C7', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1rem', maxHeight: 150, overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#92400E' }}>
                  <AlertTriangle size={14} /> {result.errores.length} fila{result.errores.length !== 1 ? 's' : ''} con error
                </div>
                {result.errores.map((err, i) => (
                  <p key={i} style={{ fontSize: '0.75rem', color: '#92400E', margin: '0.25rem 0' }}>
                    Fila {err.fila}: {err.error}
                  </p>
                ))}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
