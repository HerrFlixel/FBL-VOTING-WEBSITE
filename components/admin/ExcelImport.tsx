'use client'

import { useState } from 'react'

interface ExcelImportProps {
  league: 'herren' | 'damen'
}

export default function ExcelImport({ league }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Bitte wähle eine Datei aus')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Konvertiere File zu Base64
      const reader = new FileReader()
      reader.onerror = () => {
        setError('Fehler beim Lesen der Datei')
        setLoading(false)
      }
      reader.onload = async (e) => {
        try {
          const result = e.target?.result as string
          if (!result) {
            throw new Error('Datei konnte nicht gelesen werden')
          }
          
          // Entferne den Data-URL-Präfix (z.B. "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,")
          const base64 = result.includes(',') ? result.split(',')[1] : result
          
          if (!base64) {
            throw new Error('Datei ist leer oder konnte nicht konvertiert werden')
          }
          
          const response = await fetch('/api/players/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fileBase64: base64,
              league
            })
          })

          if (!response.ok) {
            const data = await response.json().catch(() => ({ error: 'Unbekannter Fehler' }))
            throw new Error(data.error || `Fehler beim Importieren (Status: ${response.status})`)
          }

          const data = await response.json()
          setResult(data)
          setFile(null)
          // Reset file input
          const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
          if (fileInput) fileInput.value = ''
        } catch (err: any) {
          setError(err.message || 'Fehler beim Importieren')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Importieren')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-heading text-gray-900 mb-4">
        Spieler importieren - {league === 'herren' ? 'Herren' : 'Damen'}
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Excel-Datei auswählen
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Ausgewählte Datei: {file.name}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            Import erfolgreich! {result.created} Spieler erstellt, {result.updated} Spieler aktualisiert.
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`
            px-6 py-2 rounded-lg font-heading text-white
            ${!file || loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
            }
          `}
        >
          {loading ? 'Importiere...' : 'Importieren'}
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-heading text-sm text-gray-900 mb-2">Erwartete Spalten:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Position in der scorerliste</li>
          <li>• Spielername</li>
          <li>• Verein</li>
          <li>• S = Spiele</li>
          <li>• T = Tore</li>
          <li>• V = Vorlagen</li>
          <li>• P = Punkte</li>
          <li>• 2' = 2 min Strafen</li>
          <li>• 2'+2' = 2 + 2 min Strafen</li>
          <li>• 10' = 10 min Strafen</li>
          <li>• MS = Match Strafen</li>
        </ul>
      </div>
    </div>
  )
}

