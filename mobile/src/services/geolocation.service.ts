import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export interface ProximidadeResult {
  valida: boolean;
  distancia: number;
  mensagem: string;
}

/**
 * Serviço de Geolocalização para RDO Digital
 * RF06: Validação de proximidade à obra
 */
export class GeolocationService {
  private static readonly TOLERANCIA_METROS = 100; // 100 metros de tolerância
  private static readonly TIMEOUT_MS = 15000;
  private static readonly RAIO_TERRA_METROS = 6371000; // Raio da Terra em metros

  /**
   * Solicita permissão de localização ao usuário
   * Android: solicita explicitamente
   * iOS: permissão é solicitada automaticamente na primeira tentativa
   */
  static async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permissão de Localização',
            message:
              'O app JB Pinturas precisa acessar sua localização para registrar RDOs e validar que você está na obra.',
            buttonPositive: 'Permitir',
            buttonNegative: 'Negar',
            buttonNeutral: 'Perguntar Depois',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('Erro ao solicitar permissão de localização:', err);
        return false;
      }
    }
    
    // iOS solicita automaticamente
    return true;
  }

  /**
   * Obtém a posição atual do dispositivo (MOCK VERSION)
   * @throws Error se não conseguir obter localização
   */
  static async getCurrentPosition(): Promise<GeolocationCoords> {
    // Verifica permissão primeiro
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Permissão de localização negada');
    }

    // Mock: retorna coordenadas padrão
    return {
      latitude: -23.5505,  // São Paulo
      longitude: -46.6333,
    };
  }

  /**
   * Calcula distância entre duas coordenadas usando fórmula de Haversine
   * @returns Distância em metros
   */
  static calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return this.RAIO_TERRA_METROS * c;
  }

  /**
   * Valida se o usuário está próximo da obra
   * RF06: Validação de proximidade com tolerância de 100m
   */
  static async validarProximidade(
    obraLat: number,
    obraLon: number,
    toleranciaMetros?: number
  ): Promise<ProximidadeResult> {
    try {
      const tolerancia = toleranciaMetros || this.TOLERANCIA_METROS;
      const posicaoAtual = await this.getCurrentPosition();
      
      const distancia = this.calcularDistancia(
        posicaoAtual.latitude,
        posicaoAtual.longitude,
        obraLat,
        obraLon
      );

      const distanciaArredondada = Math.round(distancia);
      const valida = distanciaArredondada <= tolerancia;

      let mensagem: string;
      if (valida) {
        mensagem = `Você está a ${distanciaArredondada}m da obra ✓`;
      } else {
        mensagem = `Você está a ${distanciaArredondada}m da obra. É necessário estar a menos de ${tolerancia}m.`;
      }

      return {
        valida,
        distancia: distanciaArredondada,
        mensagem,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtém localização e valida em uma única operação
   * Usado para otimizar fluxo de criação de RDO
   */
  static async obterEValidarLocalizacao(
    obraLat: number,
    obraLon: number
  ): Promise<{ coords: GeolocationCoords; proximidade: ProximidadeResult }> {
    const coords = await this.getCurrentPosition();
    const distancia = this.calcularDistancia(
      coords.latitude,
      coords.longitude,
      obraLat,
      obraLon
    );

    const distanciaArredondada = Math.round(distancia);
    const valida = distanciaArredondada <= this.TOLERANCIA_METROS;

    const proximidade: ProximidadeResult = {
      valida,
      distancia: distanciaArredondada,
      mensagem: valida
        ? `Localização validada (${distanciaArredondada}m) ✓`
        : `Distância muito grande: ${distanciaArredondada}m (máx: ${this.TOLERANCIA_METROS}m)`,
    };

    return { coords, proximidade };
  }

  /**
   * Formata coordenadas para exibição
   */
  static formatarCoordenadas(latitude: number, longitude: number): string {
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'L' : 'O';
    
    return `${Math.abs(latitude).toFixed(6)}° ${latDir}, ${Math.abs(longitude).toFixed(6)}° ${lonDir}`;
  }

  /**
   * Verifica se as coordenadas são válidas
   */
  static validarCoordenadas(latitude?: number | null, longitude?: number | null): boolean {
    if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
      return false;
    }
    
    return (
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }
}
