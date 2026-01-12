import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Search, Calendar, Database, FileText, 
  Loader2, ChevronRight, Filter, BarChart3, Clock 
} from 'lucide-react';
import { Button } from './Button';
import { HistoryItem, AnalysisResponse } from '../types';

interface HistoryViewProps {
  onBack: () => void;
  onLoadAnalysis: (data: AnalysisResponse) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onLoadAnalysis }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/history?limit=50');
      setHistory(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/history/${id}`);
      onLoadAnalysis(res.data);
    } catch (e) {
      alert("Erreur de chargement");
    } finally {
      setLoadingId(null);
    }
  };

  const filteredHistory = history.filter(h => 
    h.file_info.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      
      {/* --- BACKGROUND DECORATION (Cohérent avec Home) --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl px-6 py-8 flex flex-col h-screen">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between mb-8 animate-slide-up">
          <div className="flex items-center gap-6">
            <Button 
              variant="secondary" 
              onClick={onBack} 
              className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-md rounded-xl w-12 h-12 p-0 flex items-center justify-center transition-all hover:-translate-x-1"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Historique</h1>
              <p className="text-slate-500 font-medium">Vos 50 dernières segmentations</p>
            </div>
          </div>
          
          {/* Stats rapides (Optionnel) */}
          <div className="hidden md:flex gap-4">
            <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-lg border border-white shadow-sm text-sm font-medium text-slate-600">
              {history.length} Analyses au total
            </div>
          </div>
        </div>

        {/* --- MAIN CARD --- */}
        <div className="flex-grow flex flex-col bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-slate-200/50 overflow-hidden animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          {/* TOOLBAR */}
          <div className="p-6 border-b border-slate-100/60 bg-white/40 flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="relative w-full max-w-lg group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder="Rechercher un fichier..." 
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold">
                <Filter size={16} />
                <span>{filteredHistory.length} résultats</span>
             </div>
          </div>

          {/* LIST CONTENT */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
            {loading ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                 <Loader2 className="animate-spin text-indigo-500" size={40} />
                 <span className="font-medium">Récupération des données...</span>
               </div>
            ) : filteredHistory.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-70">
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <Database size={32} />
                 </div>
                 <p className="text-lg font-medium">Aucune analyse ne correspond à votre recherche.</p>
               </div>
            ) : (
              filteredHistory.map((item, index) => (
                <div 
                  key={item._id} 
                  onClick={() => handleLoad(item._id)}
                  className="group relative bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/40 hover:-translate-y-[2px] transition-all cursor-pointer"
                  style={{ animation: `slideUp 0.3s ease-out forwards ${index * 0.05}s`, opacity: 0 }}
                >
                   {/* Loading Overlay for specific item */}
                   {loadingId === item._id && (
                     <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                       <Loader2 className="animate-spin text-indigo-600" size={24} />
                     </div>
                   )}

                   {/* Icon Box */}
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100 group-hover:scale-110 transition-transform shadow-sm">
                      <FileText size={22} />
                   </div>

                   {/* Main Info */}
                   <div className="flex-grow min-w-0">
                      <h4 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors truncate">
                        {item.file_info.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                         <span className="flex items-center gap-1">
                            <Clock size={12} /> {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' })}
                         </span>
                         <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                         <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                           {item.file_info.rows_processed.toLocaleString()} lignes
                         </span>
                         <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                           K = {item.k_used}
                         </span>
                      </div>
                   </div>

                   {/* Visual Data Representation */}
                   <div className="hidden lg:flex flex-col items-end gap-1 min-w-[150px]">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                        <BarChart3 size={10} /> Répartition
                      </div>
                      <div className="flex gap-1 h-8 items-end p-1 bg-slate-50 rounded-lg border border-slate-100">
                        {item.summary.map((s, idx) => {
                          const heightPercent = Math.max(20, (s.Count / item.file_info.rows_processed) * 100);
                          return (
                            <div 
                              key={idx} 
                              className="w-3 rounded-t-sm bg-indigo-500 hover:bg-purple-500 transition-colors relative group/bar" 
                              style={{ 
                                height: `${heightPercent}%`,
                                opacity: 0.3 + (s.Count / item.file_info.rows_processed) 
                              }}
                            >
                               {/* Tooltip on hover */}
                               <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 pointer-events-none whitespace-nowrap z-20">
                                 {s.Count}
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   {/* Action Icon */}
                   <div className="pl-4">
                     <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <ChevronRight size={18} />
                     </div>
                   </div>

                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer spacing */}
        <div className="h-6"></div>
      </div>
    </div>
  );
};