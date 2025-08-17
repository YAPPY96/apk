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
  
  detectEvent(
    screenX: number, 
    screenY: number, 
    displayWidth: number, 
    displayHeight: number, 
    scale: number = 1, 
    translateX: number = 0, 
    translateY: number = 0
  ): EventData | null {
    try {
      // 画面の中心座標を計算
      const centerX = displayWidth / 2;
      const centerY = displayHeight / 2;
      
      // タッチ位置を画面中心からの相対位置に変換
      const touchRelativeX = screenX - centerX;
      const touchRelativeY = screenY - centerY;
      
      // 変換（平行移動とスケール）を逆算してオリジナル座標を求める
      // 1. 平行移動を取り除く
      const adjustedX = touchRelativeX - translateX;
      const adjustedY = touchRelativeY - translateY;
      
      // 2. スケールを取り除く（逆スケール）
      const originalRelativeX = adjustedX / scale;
      const originalRelativeY = adjustedY / scale;
      
      // 3. 画面座標に戻す
      const originalScreenX = originalRelativeX + centerX;
      const originalScreenY = originalRelativeY + centerY;
      
      // 4. SVG座標系に変換（0-210mm, 0-297mm）
      const svgX = (originalScreenX / displayWidth) * this.svgWidth;
      const svgY = (originalScreenY / displayHeight) * this.svgHeight;
      
      console.log('Coordinate transformation:', {
        input: { screenX, screenY },
        transform: { scale, translateX, translateY },
        center: { centerX, centerY },
        touchRelative: { touchRelativeX, touchRelativeY },
        adjusted: { adjustedX, adjustedY },
        originalRelative: { originalRelativeX, originalRelativeY },
        originalScreen: { originalScreenX, originalScreenY },
        svg: { svgX, svgY }
      });
      
      // SVG範囲外の場合は null を返す
      if (svgX < 0 || svgX > this.svgWidth || svgY < 0 || svgY > this.svgHeight) {
        console.log('Touch outside SVG bounds');
        return null;
      }
      
      // イベントエリアとの衝突判定
      for (const event of this.events) {
        const { x, y, width, height } = event.position;
        
        console.log(`Checking event "${event.title}":`, {
          eventArea: { x, y, width, height },
          touchPoint: { svgX, svgY },
          isInside: svgX >= x && svgX <= x + width && svgY >= y && svgY <= y + height
        });
        
        if (svgX >= x && svgX <= x + width && svgY >= y && svgY <= y + height) {
          console.log(`✓ Event detected: ${event.title}`);
          return event;
        }
      }
      
      console.log('No event found at this location');
      return null;
    } catch (error) {
      console.error('Error in detectEvent:', error);
      return null;
    }
  }
  
  getAllEvents(): EventData[] {
    return this.events;
  }
}