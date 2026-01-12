import React, { useState, useMemo } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { 
  ArrowLeft, Users, Layers, Activity, Database, Sparkles, Target,
  Filter, Maximize2, Microscope, Download, Zap, TrendingUp, TrendingDown, Minus, Loader2, FileText, CheckCircle,
  Cpu, Target as TargetIcon, Scale
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas'; 
import { Button } from './Button';
import { AnalysisResponse, CLUSTER_COLORS, CustomerData } from '../types';

interface DashboardViewProps {
  data: AnalysisResponse;
  onReset: () => void;
}

// --- CONFIGURATION STYLE ---
const FONT_FAMILY = 'Inter, system-ui, sans-serif';

// --- FONCTION DE NETTOYAGE POUR LE PDF ---
const cleanTextForPDF = (text: string | undefined): string => {
  if (!text) return "";
  return text
    .replace(/•/g, "-")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "") // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, "") // Symbols & Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, "") // Transport & Map Symbols
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, "") // Supplemental Symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, "")   // Dingbats
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, "") // Flags
    // Nettoyage supplémentaire pour être sûr
    .trim();
};

// --- INDICATEUR DE TENDANCE ---
const TrendIndicator = ({ value, globalAvg, label, isInverse = false }: { value: number, globalAvg: number, label: string, isInverse?: boolean }) => {
  const diff = ((value - globalAvg) / globalAvg) * 100;
  const isGood = isInverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 5;

  let colorClass = isGood ? "text-emerald-700 bg-emerald-50 border-emerald-100" : "text-rose-700 bg-rose-50 border-rose-100";
  let Icon = isGood ? TrendingUp : TrendingDown;
  if (isInverse) Icon = isGood ? TrendingDown : TrendingUp;
  if (isNeutral) { colorClass = "text-slate-600 bg-slate-50 border-slate-100"; Icon = Minus; }

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${colorClass} w-fit mt-2 shadow-sm`}>
      <Icon size={10} strokeWidth={3} />
      <span>{diff > 0 ? '+' : ''}{diff.toFixed(0)}% <span className="opacity-70 font-normal">vs moy.</span></span>
    </div>
  );
};

// Helper function pour convertir hex en RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const DashboardView: React.FC<DashboardViewProps> = ({ data, onReset }) => {
  const totalCustomers = data.summary.reduce((acc, curr) => acc + curr.Count, 0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // --- MOYENNES GLOBALES ---
  const globalAverages = useMemo(() => {
    const totalMonetary = data.raw_data.reduce((acc, curr) => acc + curr.Monetary, 0);
    const totalFreq = data.raw_data.reduce((acc, curr) => acc + curr.Frequency, 0);
    const totalRecency = data.raw_data.reduce((acc, curr) => acc + curr.Recency, 0);
    return {
      monetary: totalMonetary / totalCustomers,
      frequency: totalFreq / totalCustomers,
      recency: totalRecency / totalCustomers
    };
  }, [data.raw_data, totalCustomers]);

  // --- ÉTATS ---
  const [visibleClusters, setVisibleClusters] = useState<number[]>(data.summary.map(c => c.Cluster));
  const [useLogScale, setUseLogScale] = useState(false);

  const toggleCluster = (clusterId: number) => {
    if (visibleClusters.includes(clusterId)) {
      setVisibleClusters(visibleClusters.filter(id => id !== clusterId));
    } else {
      setVisibleClusters([...visibleClusters, clusterId]);
    }
  };

  const optimizedData = useMemo(() => {
    let filtered = data.raw_data.filter(d => visibleClusters.includes(d.Cluster));
    if (filtered.length > 1500) {
      return filtered.filter((item, index) => {
        const clusterSize = data.summary.find(s => s.Cluster === item.Cluster)?.Count || 0;
        if (clusterSize < 300) return true; 
        return index % 3 === 0;
      });
    }
    return filtered;
  }, [data.raw_data, visibleClusters, data.summary]);

  // --- 📄 MOTEUR PDF ULTRA-HD ---
  const generatePDF = async () => {
    setIsPdfLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

    try {
        // --- 1. PAGE DE GARDE PREMIUM ---
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(0, 0, 210, 297, 'F');
        
        doc.setFillColor(67, 56, 202); // Indigo 700
        doc.rect(0, 100, 210, 2, 'F'); 
        doc.rect(0, 102, 60, 40, 'F'); 
        
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(42);
        doc.setFont('helvetica', 'bold');
        doc.text("RAPPORT", 70, 115);
        doc.setTextColor(67, 56, 202);
        doc.text("D'ANALYSE", 70, 130);
        
        doc.setFontSize(14);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text("SEGMENTATION CLIENT & INTELLIGENCE ARTIFICIELLE", 70, 142);

        doc.setFontSize(10);
        doc.text(`Date du rapport : ${today}`, 20, 250);
        doc.text(`Volume de données : ${totalCustomers} clients traités`, 20, 256);
        doc.text(`Algorithme : K-Means Clustering (K=${data.k_used})`, 20, 262);
        
        // --- 2. DÉTAILS TECHNIQUES K-MEANS ---
        doc.addPage();
        
        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text("DÉTAILS TECHNIQUES K-MEANS", 10, 10);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("1. Métriques de l'Algorithme", 15, 35);

        if (data.kmeans_metrics) {
          const metrics = data.kmeans_metrics;
          
          const metricsData = [
            ['Inertie (Cohérence)', metrics.inertia.toFixed(2)],
            ['Score Silhouette', metrics.silhouette_score ? metrics.silhouette_score.toFixed(3) : 'N/A'],
            ['Clusters', data.k_used.toString()]
          ];
          
          autoTable(doc, {
            startY: 45,
            head: [['MÉTRIQUE', 'VALEUR']],
            body: metricsData,
            headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold', fontSize: 10 },
            theme: 'grid'
          });

          if (metrics.feature_importance) {
            const finalY = (doc as any).lastAutoTable.finalY + 15;
            doc.setFontSize(14);
            doc.setTextColor(30, 41, 59);
            doc.text("2. Importance des Variables RFM", 15, finalY);

            const featureData = [
              ['Récence', `${(metrics.feature_importance.Recency * 100).toFixed(1)}%`],
              ['Fréquence', `${(metrics.feature_importance.Frequency * 100).toFixed(1)}%`],
              ['Montant (Monetary)', `${(metrics.feature_importance.Monetary * 100).toFixed(1)}%`]
            ];
            
            autoTable(doc, {
              startY: finalY + 10,
              head: [['VARIABLE', 'IMPACT']],
              body: featureData,
              headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 10 },
              theme: 'grid'
            });
          }
        }

        // --- 3. VISUALISATION HD ---
        doc.addPage();
        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text("VISUALISATION DES DONNÉES", 10, 10);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text("3. Cartographie des Segments", 15, 35);

        const scatterElement = document.getElementById('scatter-chart-capture');
        if (scatterElement) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139);
          doc.text("Matrice RFM : Dépenses (X) vs Fréquence (Y)", 15, 45);
          
          const canvasScatter = await html2canvas(scatterElement, { 
            scale: 4, 
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
          });
          const imgScatter = canvasScatter.toDataURL('image/png');
          doc.addImage(imgScatter, 'PNG', 15, 50, 180, 100);
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text("4. Répartition du Portefeuille", 15, 160);

        const pieElement = document.getElementById('pie-chart-capture');
        if (pieElement) {
          const canvasPie = await html2canvas(pieElement, { 
            scale: 4, 
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true 
          });
          const imgPie = canvasPie.toDataURL('image/png');
          doc.addImage(imgPie, 'PNG', 40, 170, 130, 80);
        }

        // Tableau
        doc.addPage();
        doc.setFillColor(67, 56, 202);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text("SYNTHÈSE CHIFFRÉE", 10, 10);

        const tableData = data.summary.map(c => [
            cleanTextForPDF(c.AI_Marketing_Name || `Cluster ${c.Cluster}`), 
            c.Count,
            `${((c.Count / totalCustomers) * 100).toFixed(1)}%`,
            `$${c.Monetary.toFixed(0)}`,
            c.Frequency.toFixed(1),
            `${c.Recency.toFixed(0)}j`
        ]);

        autoTable(doc, {
            startY: 30,
            head: [['SEGMENT', 'EFFECTIF', 'PART %', 'MONTANT MOY.', 'FREQ. MOY.', 'RÉCENCE MOY.']],
            body: tableData,
            headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 10 },
            columnStyles: { 0: { fontStyle: 'bold', textColor: [30, 41, 59] }, 3: { halign: 'right' } },
            theme: 'grid'
        });

        // --- 4. STRATÉGIES DÉTAILLÉES ---
        let yPos = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text("5. Recommandations Stratégiques", 15, yPos);
        yPos += 15;

        data.summary.forEach((cluster, idx) => {
            if (yPos > 240) { 
              doc.addPage(); 
              yPos = 30; 
              doc.setFillColor(67, 56, 202);
              doc.rect(0, 0, 210, 15, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(8);
              doc.text("STRATÉGIES PAR SEGMENT", 10, 10);
            }

            const segmentColor = CLUSTER_COLORS[idx % CLUSTER_COLORS.length];
            const rgbColor = hexToRgb(segmentColor);
            
            // Cadre
            doc.setDrawColor(rgbColor?.r || 67, rgbColor?.g || 56, rgbColor?.b || 202);
            doc.setLineWidth(0.5);
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(15, yPos, 180, 60, 2, 2, 'FD');
            
            // Bandeau gauche
            doc.setFillColor(rgbColor?.r || 67, rgbColor?.g || 56, rgbColor?.b || 202);
            doc.rect(15, yPos, 3, 60, 'F');

            // Titre nettoyé
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(rgbColor?.r || 67, rgbColor?.g || 56, rgbColor?.b || 202);
            const nameClean = cleanTextForPDF(cluster.AI_Marketing_Name || `Segment ${cluster.Cluster}`);
            doc.text(nameClean.toUpperCase(), 22, yPos + 8);

            // Stats
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 116, 139);
            doc.text(`Effectif: ${cluster.Count} clients`, 22, yPos + 16);

            // Description nettoyée
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105);
            const descClean = cleanTextForPDF(cluster.AI_Description);
            const splitDesc = doc.splitTextToSize(descClean, 165);
            doc.text(splitDesc, 22, yPos + 25);

            // Action nettoyée (SANS EMOJI)
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(22, 163, 74); // Green
            const actionClean = cleanTextForPDF(cluster.AI_Action);
            const splitAction = doc.splitTextToSize(`ACTION : ${actionClean}`, 165);
            
            doc.text(splitAction, 22, yPos + 48);

            yPos += 70;
        });

        // Numérotation
        const pageCount = doc.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Page ${i} / ${pageCount} - Rapport SmartSeg AI`, 105, 290, { align: 'center' });
        }

        doc.save(`SmartSeg_K${data.k_used}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (e) {
        console.error("Erreur génération PDF:", e);
        alert("Erreur lors de la génération du PDF.");
    } finally {
        setIsPdfLoading(false);
    }
  };

  // --- RENDU CHART HELPERS ---
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as CustomerData;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-4 border border-slate-200 shadow-xl rounded-xl text-sm z-50 ring-1 ring-slate-100/50">
          <p className="font-bold text-slate-800 mb-1 font-sans">ID: #{p.CustomerID}</p>
          <div className="flex items-center gap-2 mb-3">
             <span className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm" style={{backgroundColor: CLUSTER_COLORS[p.Cluster % CLUSTER_COLORS.length]}}></span>
             <p className="text-slate-500 font-medium text-xs uppercase tracking-wider">Cluster {p.Cluster}</p>
          </div>
          <div className="space-y-1.5 text-slate-600 border-t border-slate-100 pt-2 font-mono text-xs">
            <p className="flex justify-between gap-4"><span>Dépenses:</span> <b className="text-slate-900">${p.Monetary.toFixed(0)}</b></p>
            <p className="flex justify-between gap-4"><span>Freq:</span> <b className="text-slate-900">{p.Frequency}</b></p>
            <p className="flex justify-between gap-4"><span>Récence:</span> <b className="text-slate-900">{p.Recency}j</b></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5 + (percent < 0.05 ? 40 : 0);
    const x = cx + radius * Math.cos(-midAngle * RADIAN) * (percent < 0.05 ? 1.4 : 1.1);
    const y = cy + radius * Math.sin(-midAngle * RADIAN) * (percent < 0.05 ? 1.4 : 1.1);
    if (percent < 0.01) return null;
    return (
      <text x={x} y={y} fill="#1e293b" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight="700" fontFamily={FONT_FAMILY}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Composant pour afficher les métriques K-Means
  const KMeansMetricsDisplay = () => {
    if (!data.kmeans_metrics) return null;
    
    const metrics = data.kmeans_metrics;
    const silhouetteScore = metrics.silhouette_score;
    const silhouetteQuality = silhouetteScore 
      ? silhouetteScore > 0.7 ? "Excellente" 
        : silhouetteScore > 0.5 ? "Bonne" 
        : silhouetteScore > 0.25 ? "Passable" 
        : "Faible"
      : "Non calculé";

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Cpu className="text-indigo-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Métriques K-Means (K={data.k_used})
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Performance de l'algorithme de clustering
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Inertie</div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {metrics.inertia.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">(plus bas = mieux)</div>
          </div>
          
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Silhouette</div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {silhouetteScore ? silhouetteScore.toFixed(3) : 'N/A'}
            </div>
            <div className={`text-[10px] font-semibold mt-1 ${
              silhouetteScore ? 
                silhouetteScore > 0.7 ? 'text-emerald-600' 
                : silhouetteScore > 0.5 ? 'text-emerald-500'
                : silhouetteScore > 0.25 ? 'text-amber-500'
                : 'text-rose-500'
              : 'text-slate-400'
            }`}>
              {silhouetteQuality}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Clusters</div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              {data.k_used}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">groupes distincts</div>
          </div>
          
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Importance RFM</div>
            {metrics.feature_importance && (
              <div className="text-xs text-slate-700 mt-1 space-y-1">
                <div className="flex justify-between">
                  <span>R:</span>
                  <span className="font-bold">{(metrics.feature_importance.Recency * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>F:</span>
                  <span className="font-bold">{(metrics.feature_importance.Frequency * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>M:</span>
                  <span className="font-bold">{(metrics.feature_importance.Monetary * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {metrics.feature_importance && (
          <div className="mt-4 pt-4 border-t border-blue-100">
            <div className="text-xs text-slate-600">
              <span className="font-semibold">Variable la plus discriminante : </span>
              {Object.entries(metrics.feature_importance)
                .reduce((a, b) => (a[1] as number) > (b[1] as number) ? a : b)[0]
              } ({
                (Math.max(...Object.values(metrics.feature_importance).map(v => v as number)) * 100).toFixed(0)
              }% d'impact)
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Navbar Pro */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm/30 backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
              variant="secondary" 
              onClick={onReset} 
              className="py-1.5 px-3 text-sm rounded-full border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-colors hover:shadow-sm group"
            >
              <ArrowLeft size={14} className="mr-1 group-hover:-translate-x-0.5 transition-transform"/> 
              Retour
            </Button>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-1.5 rounded-lg text-white shadow-lg shadow-indigo-200">
                 <Sparkles size={16}/>
              </div>
              SmartSeg AI <span className="text-slate-300 font-light mx-1">|</span> 
              <span className="text-slate-500 font-medium text-sm">
                Analytics Suite • K={data.k_used}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-100">
                <Users size={14} className="text-indigo-600"/>
                <span className="text-xs font-bold text-indigo-700">{totalCustomers} Clients</span>
                <span className="text-xs text-indigo-500 font-medium">• K={data.k_used}</span>
             </div>
             <Button 
                onClick={generatePDF} 
                disabled={isPdfLoading}
                className="bg-gradient-to-r from-slate-900 to-indigo-900 hover:from-slate-800 hover:to-indigo-800 text-white text-xs px-4 py-2 rounded-lg flex gap-2 shadow-xl shadow-slate-200 hover:shadow-2xl transition-all hover:-translate-y-0.5 group relative overflow-hidden"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                {isPdfLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin relative z-10" />
                    <span className="relative z-10">Génération PDF HD...</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} className="relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="text-left relative z-10">
                      <p className="font-bold">Exporter Rapport Complet</p>
                      <p className="text-[10px] text-slate-300">PDF HD avec métriques K-Means</p>
                    </div>
                  </>
                )}
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow p-6 max-w-7xl mx-auto w-full space-y-8 animate-fade-in pb-20">
        
        {/* KPI Cards avec métriques K-Means */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Métriques K-Means */}
          <div className="lg:col-span-2">
            <KMeansMetricsDisplay />
          </div>
          
          {/* Fichier Info */}
          {data.file_info && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Database className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">Source des Données</h3>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-medium">Fichier:</span>
                      <span className="font-mono text-slate-800 truncate max-w-[150px]" title={data.file_info.name}>
                        {data.file_info.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Clients traités:</span>
                      <span className="font-bold text-slate-800">{data.file_info.rows_processed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Séparateur:</span>
                      <span className="font-mono text-slate-800">"{data.file_info.separator}"</span>
                    </div>
                    {data.file_info.size && (
                      <div className="flex justify-between">
                        <span className="font-medium">Taille:</span>
                        <span className="text-slate-800">{(data.file_info.size / 1024).toFixed(2)} KB</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 STRATÉGIES MARKETING */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
             <div className="h-8 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Segments Stratégiques</h2>
                <p className="text-xs text-slate-500">
                  Analysés par K-Means et enrichis par Gemini 2.5 Flash
                </p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.summary.map((cluster, idx) => (
              <div 
                key={cluster.Cluster} 
                className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-xl hover:border-indigo-100 transition-all duration-300 cursor-pointer group relative overflow-hidden ${!visibleClusters.includes(cluster.Cluster) ? 'opacity-40 grayscale' : ''}`}
                onClick={() => toggleCluster(cluster.Cluster)}
              >
                {/* Accent couleur en haut */}
                <div 
                  className="absolute top-0 left-0 w-full h-1 transition-all duration-300 group-hover:h-1.5" 
                  style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                ></div>

                <div className="flex justify-between items-start mb-4 pt-2">
                  <div className="flex items-center gap-3">
                     <div 
                       className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all duration-300 group-hover:scale-110"
                       style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }}
                     >
                        {cluster.Cluster}
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors">
                         {cluster.AI_Marketing_Name || `Segment ${cluster.Cluster}`}
                       </h3>
                       <p className="text-xs text-slate-500 font-medium">
                         {((cluster.Count / totalCustomers) * 100).toFixed(1)}% du parc • {cluster.Count} clients
                       </p>
                     </div>
                  </div>
                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${visibleClusters.includes(cluster.Cluster) ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {visibleClusters.includes(cluster.Cluster) ? (
                      <CheckCircle size={16} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300"></div>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3 min-h-[60px] group-hover:text-slate-700 transition-colors">
                  {cluster.AI_Description || "Analyse en cours..."}
                </p>

                {/* Métriques Clés */}
                <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50/50 rounded-xl border border-slate-100 mb-6 group-hover:bg-slate-50/80 transition-colors">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Panier</span>
                    <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                      ${cluster.Monetary.toFixed(0)}
                    </span>
                    <TrendIndicator value={cluster.Monetary} globalAvg={globalAverages.monetary} label="M" />
                  </div>
                  <div className="flex flex-col items-center border-l border-slate-200/50">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Fréq.</span>
                    <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                      {cluster.Frequency.toFixed(1)}
                    </span>
                    <TrendIndicator value={cluster.Frequency} globalAvg={globalAverages.frequency} label="F" />
                  </div>
                  <div className="flex flex-col items-center border-l border-slate-200/50">
                    <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-1">Récence</span>
                    <span className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">
                      {cluster.Recency.toFixed(0)}j
                    </span>
                    <TrendIndicator value={cluster.Recency} globalAvg={globalAverages.recency} label="R" isInverse />
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-50 group-hover:border-indigo-50 transition-colors">
                   <div className="flex gap-3 items-start">
                      <TargetIcon size={16} className="text-indigo-600 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-semibold text-indigo-900 leading-snug group-hover:text-indigo-800 transition-colors">
                        {cluster.AI_Action || "Aucune action définie."}
                      </p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📊 VISUALISATION AVANCÉE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Scatter Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Microscope size={20} className="text-indigo-500" />
                  Matrice RFM : Dépenses vs Fréquence
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Visualisation des clusters K-Means dans l'espace RFM
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setUseLogScale(false)} 
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${!useLogScale ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Linéaire
                  </button>
                  <button 
                    onClick={() => setUseLogScale(true)} 
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${useLogScale ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Logarithmique
                  </button>
                </div>
              </div>
            </div>

            {/* Zone de Capture Graphique */}
            <div id="scatter-chart-capture" className="h-[450px] w-full bg-white rounded-xl relative border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    type="number" 
                    dataKey="Monetary" 
                    name="Dépenses" 
                    unit="$" 
                    scale={useLogScale ? "log" : "linear"} 
                    domain={useLogScale ? [dataMin => Math.max(1, dataMin), 'auto'] : ['auto', 'auto']} 
                    allowDataOverflow 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontFamily={FONT_FAMILY} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="Frequency" 
                    name="Fréquence" 
                    scale={useLogScale ? "log" : "linear"} 
                    domain={useLogScale ? [dataMin => Math.max(1, dataMin), 'auto'] : ['auto', 'auto']} 
                    allowDataOverflow 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontFamily={FONT_FAMILY} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
                  {data.summary.map((cluster, index) => (
                    visibleClusters.includes(cluster.Cluster) && (
                      <Scatter 
                        key={index} 
                        name={cluster.AI_Marketing_Name} 
                        data={optimizedData.filter(d => d.Cluster === cluster.Cluster)} 
                        fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} 
                        isAnimationActive={true}
                        animationDuration={800}
                        animationEasing="ease-in-out"
                        r={useLogScale ? 4 : 5} 
                        fillOpacity={0.8}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    )
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Légende interactive */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-700 mb-2">Clusters visibles</div>
                {data.summary.map((cluster, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCluster(cluster.Cluster);
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all hover:shadow-sm ${
                      visibleClusters.includes(cluster.Cluster) 
                        ? 'bg-white border-slate-200 shadow-xs' 
                        : 'opacity-40 grayscale border-transparent'
                    }`}
                  >
                    <div 
                      className="w-2 h-2 rounded-full transition-transform hover:scale-125" 
                      style={{ backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length] }} 
                    />
                    <span className="text-slate-600 max-w-[80px] truncate">
                      {cluster.AI_Marketing_Name?.split(' ')[0] || `C${cluster.Cluster}`}
                    </span>
                    <span className="text-[9px] text-slate-400 ml-auto">
                      {cluster.Count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pie Chart et Statistiques */}
          <div className="space-y-6">
            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-500" /> 
                Répartition des Clusters
              </h3>
              
              <div id="pie-chart-capture" className="h-[300px] w-full relative bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={data.summary} 
                      dataKey="Count" 
                      nameKey="AI_Marketing_Name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={80} 
                      outerRadius={100} 
                      paddingAngle={4} 
                      cornerRadius={6}
                      label={renderCustomizedLabel} 
                      isAnimationActive={true}
                      animationDuration={1000}
                    >
                      {data.summary.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]} 
                          strokeWidth={2} 
                          stroke="#fff" 
                          opacity={visibleClusters.includes(entry.Cluster) ? 1 : 0.2} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Centre du Pie Chart */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <div className="text-3xl font-bold text-slate-800 tracking-tight">{totalCustomers}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                    Clients totaux
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 flex-grow overflow-y-auto custom-scrollbar pr-2 max-h-[200px]">
                {data.summary.map((cluster, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => toggleCluster(cluster.Cluster)}
                    className={`flex items-center justify-between text-sm p-3 rounded-lg cursor-pointer transition-all border ${
                      visibleClusters.includes(cluster.Cluster) 
                        ? 'hover:bg-slate-50 border-slate-200' 
                        : 'opacity-40 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full shadow-sm transition-transform hover:scale-125" 
                        style={{backgroundColor: CLUSTER_COLORS[idx % CLUSTER_COLORS.length]}}
                      ></div>
                      <div>
                        <span className="text-slate-600 font-medium truncate max-w-[120px] block">
                          {cluster.AI_Marketing_Name || `Cluster ${cluster.Cluster}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {((cluster.Count / totalCustomers) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                      {cluster.Count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Moyennes */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100">
              <h4 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Scale size={16} />
                Moyennes Globales RFM
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-700">Panier moyen:</span>
                  <span className="font-bold text-indigo-900">${globalAverages.monetary.toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-700">Fréquence moyenne:</span>
                  <span className="font-bold text-indigo-900">{globalAverages.frequency.toFixed(1)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-indigo-700">Récence moyenne:</span>
                  <span className="font-bold text-indigo-900">{globalAverages.recency.toFixed(0)} jours</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <div className="text-xs text-indigo-600">
                  <span className="font-semibold">Méthodologie :</span> K-Means clustering avec {data.k_used} centroïdes
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};