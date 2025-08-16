// components/map/EventDetector.ts
import { EventData } from './types';

export class EventDetector {
  private events: EventData[];
  private svgWidth: number;
  private svgHeight: number;
  
  constructor(events: EventData[], svgWidth: number = 210, svgHeight: number = 297) {
    this.events = events;
    this.svgWidth = svgWidth;
    this.svgHeight = svgHeight;
  }
  
  detectEvent(screenX: number, screenY: number, displayWidth: number, displayHeight: number, scale: number = 1, translateX: number = 0, translateY: number = 0): EventData | null {
    // スクリーン座標をSVG座標に変換
    // 1. 画面の中心を基準とした座標に変換
    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    
    // 2. タッチ位置を中心基準の座標に変換
    const touchFromCenterX = screenX - centerX;
    const touchFromCenterY = screenY - centerY;
    
    // 3. 平行移動の影響を取り除く
    const adjustedTouchX = touchFromCenterX - translateX;
    const adjustedTouchY = touchFromCenterY - translateY;
    
    // 4. スケールの影響を取り除く
    const originalTouchX = adjustedTouchX / scale;
    const originalTouchY = adjustedTouchY / scale;
    
    // 5. 画面座標に戻す
    const finalScreenX = originalTouchX + centerX;
    const finalScreenY = originalTouchY + centerY;
    
    // 6. SVG座標に変換 (mm単位)
    const svgX = (finalScreenX / displayWidth) * this.svgWidth;
    const svgY = (finalScreenY / displayHeight) * this.svgHeight;
    
    // デバッグ用ログ（開発時のみ）
    console.log('Touch detection:', {
      original: { screenX, screenY },
      transformed: { svgX, svgY },
      scale,
      translate: { translateX, translateY }
    });
    
    // イベントエリアとの衝突判定
    for (const event of this.events) {
      const { x, y, width, height } = event.position;
      if (svgX >= x && svgX <= x + width && svgY >= y && svgY <= y + height) {
        console.log('Event detected:', event.title);
        return event;
      }
    }
    
    return null;
  }
  
  getAllEvents(): EventData[] {
    return this.events;
  }
}