import React, { useState } from 'react';
import { HomeView } from './components/HomeView';
import { UploadView } from './components/UploadView';
import { DashboardView } from './components/DashboardView';
import { HistoryView } from './components/HistoryView'; // ✅ Import ajouté
import { AnalysisResponse, ViewState } from './types';

const App: React.FC = () => {
  // On ajoute 'history' au state (au cas où types.ts n'est pas encore maj)
  const [currentView, setCurrentView] = useState<ViewState | 'history'>('home');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);

  // 1. Démarrer une nouvelle analyse
  const handleStart = () => {
    setCurrentView('upload');
  };

  // 2. Succès après upload ou chargement depuis l'historique
  const handleAnalysisSuccess = (data: AnalysisResponse) => {
    setAnalysisResult(data);
    setCurrentView('dashboard');
  };

  // 3. Retour à l'accueil (Reset)
  const handleReset = () => {
    setAnalysisResult(null);
    setCurrentView('home');
  };

  // 4. Aller à la page Historique complet
  const handleGoToHistory = () => {
    setCurrentView('history');
  };

  // Simple Router Switch
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomeView 
            onStart={handleStart} 
            onLoadHistory={handleAnalysisSuccess}   
            onGoToHistoryPage={handleGoToHistory}   
          />
        );
      
      case 'upload':
        return <UploadView onSuccess={handleAnalysisSuccess} />;
      
      case 'dashboard':
        return analysisResult ? (
          <DashboardView data={analysisResult} onReset={handleReset} />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 gap-4">
            <p>Erreur: Aucune donnée disponible.</p>
            <button onClick={handleReset} className="text-indigo-600 hover:underline">Retour à l'accueil</button>
          </div>
        );

      case 'history': 
        return (
          <HistoryView 
            onBack={handleReset} 
            onLoadAnalysis={handleAnalysisSuccess} 
          />
        );

      default:
        return <HomeView 
          onStart={handleStart} 
          onLoadHistory={handleAnalysisSuccess} 
          onGoToHistoryPage={handleGoToHistory} 
        />;
    }
  };

  return (
    <div className="antialiased text-slate-800 bg-slate-50 min-h-screen">
      {renderView()}
    </div>
  );
};

export default App;