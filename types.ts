export type ViewState = 'home' | 'upload' | 'dashboard' | 'history';
export interface CustomerData {
  CustomerID: string;
  Recency: number;
  Frequency: number;
  Monetary: number;
  Cluster: number;
}

export interface ClusterSummary {
  Cluster: number;
  Recency: number;
  Frequency: number;
  Monetary: number;
  Count: number;
  AI_Marketing_Name?: string;
  AI_Description?: string;
  AI_Action?: string;
}


export interface KMeansMetrics {
  inertia: number;
  silhouette_score?: number;
  cluster_distribution: number[];
  feature_importance?: {
    Recency: number;
    Frequency: number;
    Monetary: number;
  };
}

export interface AnalysisResponse {
  status: string;
  analysis_id: string;
  k_used: number;
  summary: ClusterSummary[];
  raw_data: CustomerData[];
  // 👇 Nouveaux champs pour métriques
  kmeans_metrics?: KMeansMetrics;
  file_info?: {
    name: string;
    size: number;
    rows_processed: number;
    separator: string;
    upload_date: string;
  };
}

export interface HistoryItem {
  _id: string;
  created_at: string;
  k_used: number;
  file_info: {
    name: string;
    rows_processed: number;
    upload_date: string;
  };
  summary: ClusterSummary[]; // Pour afficher un aperçu rapide
}

export const CLUSTER_COLORS = [
  '#4F46E5', // Indigo
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];