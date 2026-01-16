// Era histórica bíblica
export type BiblicalEra = {
    id: string
    name: string
    startYear?: number
    endYear?: number
  }
  
  // Lugar geográfico fixo
  export type BiblicalPlace = {
    id: string
    name: string
    latitude: number
    longitude: number
    modernCountry?: string
  }
  
  // Relação Lugar ↔ Era ↔ Bíblia
  export type PlaceEraReference = {
    id: string
    placeId: string
    eraId: string
    description?: string
    scriptureRefs?: string[]
  }
  
  // Marker mínimo para mapa
  export type MapMarker = {
    id: string
    title: string
    latitude: number
    longitude: number
  }
  
  // ===== ATLAS VISUAL (SEU CASO ATUAL) =====
  
  export type AtlasItem = {
    id: string
    titulo: string
    descricao_tecnica?: string
    imagem_url?: string
  }
  
  export type AtlasEtapa = {
    id: string
    atlas_id: string
    origem: string
    destino: string
    descricao_etapa?: string
    imagem_url?: string
    ordem?: number
    cor_da_linha?: string
  }
  