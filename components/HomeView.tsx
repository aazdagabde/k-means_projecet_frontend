import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Rocket, BrainCircuit, GraduationCap, Building2, UserCheck, 
  Clock, ArrowRight, FileText, Loader2, Database, Sparkles 
} from 'lucide-react';
import { Button } from './Button'; 
import { HistoryItem, AnalysisResponse } from '../types';

interface HomeViewProps {
  onStart: () => void;
  onLoadHistory: (data: AnalysisResponse) => void;
  onGoToHistoryPage: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStart, onLoadHistory, onGoToHistoryPage }) => {
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentHistory();
  }, []);

  const fetchRecentHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/history?limit=3');
      if (Array.isArray(res.data)) {
        setRecentHistory(res.data);
      }
    } catch (e) {
      console.error("Erreur historique", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleHistoryClick = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/history/${id}`);
      onLoadHistory(res.data);
    } catch (e) {
      alert("Impossible de charger cette analyse.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- BACKGROUND DECORATION --- */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] bg-blue-100/40 rounded-full blur-[80px]" />
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center flex-grow">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-8 mt-16 mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-indigo-100 shadow-sm text-indigo-600 rounded-full text-sm font-semibold mb-2 transition-transform hover:scale-105 cursor-default">
            <Sparkles size={16} className="text-amber-400 fill-amber-400" />
            <span>Powered by K-Means Algorithm</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900">
            SmartSeg <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x">AI</span>
          </h1>
          
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            La solution ultime pour la segmentation marketing. <br className="hidden md:block"/>
            Transformez vos données brutes en <span className="font-semibold text-slate-800">stratégies ciblées</span>.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              onClick={onStart} 
              className="text-lg px-8 py-6 rounded-xl shadow-xl shadow-indigo-200/50 hover:shadow-indigo-300/50 transition-all hover:-translate-y-1 bg-gradient-to-r from-indigo-600 to-purple-600 border-none ring-0"
            >
              <Rocket className="mr-2" size={22} /> Nouvelle Analyse
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={onGoToHistoryPage} 
              className="text-lg px-8 py-6 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <Database className="mr-2" size={20} /> Historique
            </Button>
          </div>
        </div>

        {/* --- SECTION HISTORIQUE RÉCENT --- */}
        <div className="w-full max-w-5xl mb-24">
          <div className="flex items-center justify-between px-2 mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Clock size={20}/> 
              </div>
              Analyses Récentes
            </h3>
            {recentHistory.length > 0 && (
              <button 
                onClick={onGoToHistoryPage} 
                className="group flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50"
              >
                Voir tout 
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1"/>
              </button>
            )}
          </div>

          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-white shadow-sm">
              <Loader2 className="animate-spin text-indigo-500 mb-3" size={32}/>
              <span className="text-slate-400 text-sm font-medium">Chargement de vos données...</span>
            </div>
          ) : recentHistory.length === 0 ? (
            <div className="text-center p-12 bg-white/60 backdrop-blur-md rounded-3xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-200 transition-colors">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <FileText size={24} />
              </div>
              <p className="font-medium">Aucune analyse récente.</p>
              <p className="text-sm mt-1">Lancez votre première segmentation dès maintenant !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentHistory.map((item, idx) => {
                const fileName = item.file_info?.name || "Analyse sans nom";
                const rowCount = item.file_info?.rows_processed || 0;
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "-";

                return (
                  <div 
                    key={item._id} 
                    onClick={() => handleHistoryClick(item._id)}
                    className="group relative bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white shadow-sm hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {loadingId === item._id && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                        <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                        <span className="text-xs font-bold text-indigo-900">Chargement...</span>
                      </div>
                    )}
                    
                    {/* Décoration de carte */}
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        <FileText size={20} />
                      </div>
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        <BrainCircuit size={12} />
                        K = {item.k_used || "?"}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-lg mb-1 truncate" title={fileName}>
                      {fileName}
                    </h4>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <UserCheck size={12} /> {rowCount} clients
                      </span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock size={12} /> {dateStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- ACADEMIC FOOTER --- */}
        <div className="mt-auto pb-8 w-full animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg shadow-indigo-100/50 rounded-2xl p-6 mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
              
              <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 text-center md:text-left">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mb-1">
                  <UserCheck size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Réalisé par</div>
                  <div className="font-bold text-slate-800">Abdellah Aazdag</div>
                  <div className="font-medium text-slate-600">Bousslama Salma</div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 text-center md:text-left md:border-l md:border-slate-100 md:pl-8">
                 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mb-1">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Formation</div>
                  <div className="font-bold text-slate-800">Filière ITIRC</div>
                  <div className="text-slate-500">ENSA Oujda</div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 text-center md:text-left md:border-l md:border-slate-100 md:pl-8">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mb-1">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Encadrement</div>
                  <div className="font-bold text-slate-800">Pr. Madani</div>
                  <div className="text-slate-500">Projet Data Mining</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      
      </div>
    </div>
  );
};