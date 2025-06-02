export enum AppView {
  PriceTracker = 'priceTracker',
  ScrapingHistory = 'scrapingHistory',
  BrandCleaner = 'brandCleaner',
  UserManagement = 'userManagement', 
  Scraping = 'scraping',
  Superuser = 'superuser',
}

export interface PriceRecord {
  retailer: string;
  upc: string; 
  descr: string; 
  price: number | null;
  currency: string;
  fetched_at: string;
  product_url?: string; 
  thumbnail_url?: string; 
  source?: 'AI_Suggestion' | 'SerpApi_Walmart' | 'Manual' | 'User_Input' | 'Proxy_Service';
}

export interface ElasticityDataPoint {
  q: number;
  p: number;
}

// User Management specific types
export interface User {
  id: string;
  name: string;
  email: string;
  profile: 'Administrador' | 'User'; 
  isActive: boolean;
}

// Retailer Management specific types
export interface Retailer {
  id: string;
  name: string;
  imageUrl: string;
  url: string;
  isActive: boolean;
}

// Scraping History specific types
export interface ScrapingHistoryEntry {
  id: string;
  comercio: string;
  categoria: string;
  producto: string;
  upc: string;
  sku: string;
  precio: string; 
  fechaHora: string;
}

// Scraping View specific types (more for form data structure now)
export interface ScrapingVariant {
  id: string;
  name: string;
  urlComercio: string;
  urlProducto: string;
  marcaProducto: string;
  categoria: string;
  unidadMedida: string;
  saborProducto: string;
  sku: string;
  upc: string;
}

export interface ScrapingProduct {
  id: string;
  name: string;
  variants: ScrapingVariant[];
}

export interface ScrapingRetailer {
  id: string;
  name: string;
  products: ScrapingProduct[];
}


// --- SerpApi related types (if still used elsewhere, otherwise can be removed) ---
// For now, keeping them as they were not explicitly requested to be removed with ScraperAPI.
// If SerpApi is also removed, these can go.
export interface SerpApiWalmartProduct {
  us_item_id?: string;
  product_id?: string;
  title: string;
  description?: string;
  thumbnail?: string;
  rating?: number;
  reviews?: number;
  seller_id?: string;
  seller_name?: string;
  sponsored?: boolean;
  primary_offer?: {
    offer_id?: string;
    offer_price: number;
    currency: string;
  };
  product_page_url: string;
  upc?: string; 
}

export interface SerpApiWalmartResponse {
  search_metadata?: {
    id?: string;
    status?: string;
    walmart_url?: string;
    total_time_taken?: number;
  };
  search_parameters?: {
    engine?: string;
    query?: string;
  };
  search_information?: {
    total_results?: number;
    query_displayed?: string;
  };
  organic_results?: SerpApiWalmartProduct[];
}