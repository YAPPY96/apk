// components/map/LocationService.ts
import * as Location from 'expo-location';

// 画像上のピクセル座標と緯度経度の対応表
export const pixelToLatLon = [
  { pixel: { x: 80.56, y: 20.00 }, latLon: { lat: 35.159542, lon: 136.923436 } },
  { pixel: { x: 16.11, y: 583.33 }, latLon: { lat: 35.156372, lon: 136.923083 } },
  { pixel: { x: 593.89, y: 542.78 }, latLon: { lat: 35.156549, lon: 136.927038 } },
  { pixel: { x: 398.33, y: 135.56 }, latLon: { lat: 35.158874, lon: 136.925713 } }
];

export interface LocationInfo {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PixelPosition {
  x: number;
  y: number;
}

export interface LocationStatusCallback {
  onLoadingStart?: () => void;
  onLoadingEnd?: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onError?: (error: string) => void;
  onSuccess?: (location: LocationInfo) => void;
}

export class LocationService {
  private originalImageWidth: number;
  private originalImageHeight: number;
  private svgWidth: number;
  private svgHeight: number;
  private statusCallbacks?: LocationStatusCallback;

  constructor(
    originalImageWidth: number = 610, // 元の画像のピクセル幅
    originalImageHeight: number = 604, // 元の画像のピクセル高さ
    svgWidth: number = 210, // SVGの座標系の幅
    svgHeight: number = 297,  // SVGの座標系の高さ
    statusCallbacks?: LocationStatusCallback
  ) {
    this.originalImageWidth = originalImageWidth;
    this.originalImageHeight = originalImageHeight;
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
    this.statusCallbacks = statusCallbacks;
  }

  /**
   * コールバック関数を設定
   */
  setStatusCallbacks(callbacks: LocationStatusCallback) {
    this.statusCallbacks = callbacks;
  }

  /**
   * デバイスの位置情報を取得
   */
  async getCurrentLocation(): Promise<LocationInfo | null> {
    try {
      this.statusCallbacks?.onLoadingStart?.();

      // 位置情報の権限を確認・要求
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('位置情報の権限が拒否されました');
        this.statusCallbacks?.onPermissionDenied?.();
        this.statusCallbacks?.onError?.('位置情報の権限が拒否されました');
        this.statusCallbacks?.onLoadingEnd?.();
        return null;
      }

      this.statusCallbacks?.onPermissionGranted?.();

      // 現在位置を取得
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // タイムアウトを15秒に延長
      });

      const locationInfo = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      };

      this.statusCallbacks?.onSuccess?.(locationInfo);
      this.statusCallbacks?.onLoadingEnd?.();

      return locationInfo;
    } catch (error) {
      console.error('位置情報の取得に失敗:', error);
      const errorMessage = error instanceof Error ? error.message : '位置情報の取得に失敗しました';
      this.statusCallbacks?.onError?.(errorMessage);
      this.statusCallbacks?.onLoadingEnd?.();
      return null;
    }
  }

  /**
   * 緯度経度からピクセル座標を推定（バイリニア補間）
   */
  latLonToPixel(lat: number, lon: number): PixelPosition | null {
    try {
      // 補間のための4つの基準点を使用
      const points = pixelToLatLon;
      
      if (points.length < 3) {
        console.error('補間には最低3点必要です');
        return null;
      }

      // 簡単な線形補間（重み付き平均）を使用
      let totalWeight = 0;
      let weightedX = 0;
      let weightedY = 0;

      for (const point of points) {
        // 距離を計算（ユークリッド距離の逆数を重みとして使用）
        const latDiff = lat - point.latLon.lat;
        const lonDiff = lon - point.latLon.lon;
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
        
        // 距離が非常に小さい場合（ほぼ一致）、その点の座標をそのまま返す
        if (distance < 0.0001) {
          return {
            x: point.pixel.x,
            y: point.pixel.y
          };
        }

        const weight = 1 / (distance + 0.0001); // 0除算を防ぐため小さな値を加算
        totalWeight += weight;
        weightedX += point.pixel.x * weight;
        weightedY += point.pixel.y * weight;
      }

      const pixelX = weightedX / totalWeight;
      const pixelY = weightedY / totalWeight;

      // 画像範囲内かチェック
      if (pixelX < 0 || pixelX > this.originalImageWidth || 
          pixelY < 0 || pixelY > this.originalImageHeight) {
        console.log('計算された位置が画像範囲外です');
        return null;
      }

      return { x: pixelX, y: pixelY };
    } catch (error) {
      console.error('座標変換エラー:', error);
      return null;
    }
  }

  /**
   * 元画像のピクセル座標をSVG座標系に変換
   */
  pixelToSvgCoordinate(pixelPos: PixelPosition): PixelPosition {
    return {
      x: (pixelPos.x / this.originalImageWidth) * this.svgWidth,
      y: (pixelPos.y / this.originalImageHeight) * this.svgHeight
    };
  }

  /**
   * 緯度経度からSVG座標系の位置を計算
   */
  latLonToSvgCoordinate(lat: number, lon: number): PixelPosition | null {
    const pixelPos = this.latLonToPixel(lat, lon);
    if (!pixelPos) return null;
    
    return this.pixelToSvgCoordinate(pixelPos);
  }

  /**
   * SVG座標系から画面座標系への変換（画面表示用）
   */
  svgToScreenCoordinate(
    svgPos: PixelPosition,
    displayWidth: number,
    displayHeight: number,
    scale: number = 1,
    translateX: number = 0,
    translateY: number = 0
  ): PixelPosition {
    // SVGのアスペクト比計算
    const screenAspectRatio = displayWidth / displayHeight;
    const svgAspectRatio = this.svgWidth / this.svgHeight;

    let renderedWidth = displayWidth;
    let renderedHeight = displayHeight;
    let offsetX = 0;
    let offsetY = 0;

    // preserveAspectRatio="xMidYMid meet" の挙動を再現
    if (screenAspectRatio > svgAspectRatio) {
      renderedWidth = displayHeight * svgAspectRatio;
      offsetX = (displayWidth - renderedWidth) / 2;
    } else {
      renderedHeight = displayWidth / svgAspectRatio;
      offsetY = (displayHeight - renderedHeight) / 2;
    }

    // SVG座標を画面座標に変換
    const screenX = (svgPos.x / this.svgWidth) * renderedWidth + offsetX;
    const screenY = (svgPos.y / this.svgHeight) * renderedHeight + offsetY;

    // スケールと移動を適用
    const transformedX = (screenX - displayWidth / 2) * scale + displayWidth / 2 + translateX;
    const transformedY = (screenY - displayHeight / 2) * scale + displayHeight / 2 + translateY;

    return {
      x: transformedX,
      y: transformedY
    };
  }

  /**
   * 現在位置がマップの範囲内かどうかをチェック
   */
  isLocationInBounds(lat: number, lon: number): boolean {
    const svgPos = this.latLonToSvgCoordinate(lat, lon);
    return svgPos !== null;
  }
}