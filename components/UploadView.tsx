import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Upload, FileText, Settings, Loader2, AlertCircle, Info, 
  FileSpreadsheet, Cpu, CheckCircle, X, HardDrive, 
  TableProperties, Sparkles, ScanLine, ArrowRight 
} from 'lucide-react';
import { Button } from './Button';
import { AnalysisResponse } from '../types';

interface UploadViewProps {
  onSuccess: (data: AnalysisResponse) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState<',' | ';'>(',');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [k, setK] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileInfo, setFileInfo] = useState<{size: string; rows?: number} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const detectSeparator = (content: string): ',' | ';' => {
    const firstLines = content.split('\n').slice(0, 5).join('\n');
    const commaCount = (firstLines.match(/,/g) || []).length;
    const semiCount = (firstLines.match(/;/g) || []).length;
    return semiCount > commaCount ? ';' : ',';
  };

  const validateAndProcessFile = (uploadedFile: File) => {
    // Validation du type
    if (uploadedFile.type !== "text/csv" && !uploadedFile.name.endsWith('.csv')) {
      setError("Le fichier doit être au format CSV.");
      return;
    }
    
    // Lecture pour métadonnées et détection
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').length - 1; 
      
      // Détection auto du séparateur
      const detectedSep = detectSeparator(text);
      setSeparator(detectedSep);
      setIsAutoDetected(true);

      setFileInfo({
        size: `${(uploadedFile.size / 1024).toFixed(2)} KB`,
        rows: rows
      });
    };
    // On ne lit que les 10 premiers KO pour la perf
    reader.readAsText(uploadedFile.slice(0, 10240)); 
    
    setError(null);
    setFile(uploadedFile);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileInfo(null);
    setIsAutoDetected(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('delimiter', separator);
    formData.append('k', k.toString());

    try {
      const response = await axios.post<AnalysisResponse>('http://127.0.0.1:8000/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        onSuccess(response.data);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 500) {
        setError("Erreur serveur : Vérifiez le format du fichier.");
      } else if (err.response?.status === 422) {
        setError("Données invalides. Vérifiez les colonnes obligatoires (CustomerID, InvoiceDate, etc.).");
      } else {
        setError("Erreur de connexion avec le serveur.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[400px] h-[400px] bg-indigo-200/40 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl w-full z-10 animate-slide-up">
        
        {/* Header Text */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Nouvelle Segmentation</h2>
          <p className="text-slate-500">Importez vos données clients pour générer des clusters via l'IA.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* LEFT COLUMN: Upload Area */}
          <div className="md:col-span-3 space-y-6">
            <div 
              className={`relative h-full min-h-[400px] bg-white/70 backdrop-blur-xl rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer group shadow-xl shadow-slate-200/50
                ${dragActive 
                  ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
                  : file 
                    ? 'border-indigo-200 bg-white/90' 
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-white/80'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleChange}
              />
              
              {file ? (
                <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in relative">
                  <button 
                    onClick={removeFile}
                    className="absolute top-0 right-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                    <FileSpreadsheet size={48} className="text-indigo-600" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 text-center break-all max-w-full px-4">
                    {file.name}
                  </h3>
                  
                  {fileInfo && (
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                      <span className="flex items-center gap-1.5">
                        <HardDrive size={14} /> {fileInfo.size}
                      </span>
                      <div className="w-1 h-4 bg-slate-300 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <TableProperties size={14} /> ~{fileInfo.rows} lignes
                      </span>
                    </div>
                  )}

                  <div className="mt-8 flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                    <CheckCircle size={18} />
                    <span>Prêt pour l'analyse</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">Glisser-déposer votre CSV</h3>
                  <p className="text-sm text-slate-500 mb-6">ou cliquez pour parcourir vos fichiers</p>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <Info size={12} />
                    <span>Requis : CustomerID, InvoiceDate, Amount</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Settings */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Configuration Card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white p-6 shadow-xl shadow-slate-200/50 flex-grow">
              <div className="flex items-center gap-2 mb-6 text-indigo-900 font-bold uppercase tracking-wider text-xs">
                <Settings size={14} /> Configuration
              </div>

              {/* Separator Selection */}
              <div className="mb-8">
                <label className="text-sm font-semibold text-slate-700 mb-3 block flex items-center justify-between">
                  <span>Séparateur CSV</span>
                  {isAutoDetected && (
                     <span className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 animate-pulse">
                       <ScanLine size={10} /> Détecté
                     </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setSeparator(','); setIsAutoDetected(false); }}
                    className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${separator === ',' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                  >
                    <span className="font-mono text-lg opacity-80">,</span>
                    <span>Virgule</span>
                  </button>
                  <button
                    onClick={() => { setSeparator(';'); setIsAutoDetected(false); }}
                    className={`py-3 px-2 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2
                      ${separator === ';' 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                  >
                    <span className="font-mono text-lg opacity-80">;</span>
                    <span>Point-virgule</span>
                  </button>
                </div>
              </div>

              {/* K Slider */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-sm font-semibold text-slate-700 block">
                    Nombre de Clusters (K)
                  </label>
                  <div className="text-2xl font-black text-indigo-600 leading-none">
                    {k}
                  </div>
                </div>
                
                <div className="relative h-6 flex items-center">
                   <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={k}
                    onChange={(e) => setK(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-2">
                  <span>Simple (2)</span>
                  <span>Complexe (8)</span>
                </div>

                <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-start gap-2">
                   <Cpu size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                   <p className="text-xs text-indigo-800 leading-relaxed">
                     <span className="font-bold">Astuce :</span> K=3 ou 4 est généralement idéal pour une segmentation marketing (VIP, Loyaux, Occasionnels).
                   </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex gap-3 animate-shake">
                <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                <div className="text-sm text-red-700">
                  <span className="font-bold block mb-1">Erreur</span>
                  {error}
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !file}
              className="w-full py-5 rounded-2xl text-lg font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50 disabled:shadow-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all transform hover:-translate-y-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin" /> Analyse...
                </div>
              ) : (
                <div className="flex items-center justify-between w-full px-2">
                  <span>Lancer l'analyse</span>
                  <div className="bg-white/20 p-1 rounded-lg">
                    <Sparkles size={20} className="text-white" />
                  </div>
                </div>
              )}
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
};