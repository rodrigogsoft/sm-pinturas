/**
 * Database Mock - WatermelonDB não instalado
 * Usando AsyncStorage como fallback
 */

export const database = {
  get: (collectionName: string) => ({
    query: () => ({
      fetch: async () => [],
      watch: (callback: Function) => callback([]),
    }),
  }),
};

// Mock collections
export const obrasCollection = database.get('obras');
export const colaboradoresCollection = database.get('colaboradores');
export const rdosCollection = database.get('rdos');
export const syncStatusCollection = database.get('sync_status');
