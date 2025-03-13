import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface Plantation {
  id: number;
  nom: string;
  superficie: number;
  date_plantation: string;
  nombre_arbres: number;
  localisation: string;
  description: string;
}

export interface Operation {
  id: number;
  plantation: number;
  type_operation: string;
  date: string;
  description: string;
  cout: number;
}

export interface Production {
  id: number;
  plantation: number;
  date_recolte: string;
  quantite: number;
  poids_total: number;
  qualite: string;
  stock_disponible: number;
}

export interface Vente {
  id: number;
  production: number;
  date_vente: string;
  client: string;
  quantite: number;
  prix_unitaire: number;
  montant_total: number;
}

export interface MouvementCaisse {
  id: number;
  date: string;
  type_mouvement: 'ENTREE' | 'SORTIE';
  montant: number;
  description: string;
}

// Services
const createService = <T>(endpoint: string) => {
  return {
    getAll: () => api.get<T[]>(`/${endpoint}/`),
    get: (id: number) => api.get<T>(`/${endpoint}/${id}/`),
    create: (data: Omit<T, 'id'>) => api.post<T>(`/${endpoint}/`, data),
    update: (id: number, data: Partial<T>) => api.put<T>(`/${endpoint}/${id}/`, data),
    delete: (id: number) => api.delete(`/${endpoint}/${id}/`),
  };
};

export const plantationService = {
  ...createService<Plantation>('plantations'),
};

export const operationService = {
  ...createService<Operation>('operations'),
};

export const productionService = {
  ...createService<Production>('productions'),
  getStatistiquesGlobales: () => api.get(`${API_URL}/productions/statistiques/`),
};

export const venteService = {
  ...createService<Vente>('ventes'),
  getChiffreAffaires: () => api.get(`${API_URL}/ventes/chiffre-affaires/`),
};

export const mouvementCaisseService = {
  ...createService<MouvementCaisse>('mouvements-caisse'),
  getBilan: () => api.get(`${API_URL}/mouvements-caisse/bilan/`),
}; 