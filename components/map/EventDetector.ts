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
      // 画面とSVGのアスペクト比を計算
      const screenAspectRatio = displayWidth / displayHeight;
      const svgAspectRatio = this.svgWidth / this.svgHeight;

      let renderedWidth = displayWidth;
      let renderedHeight = displayHeight;
      let offsetX = 0;
      let offsetY = 0;

      // preserveAspectRatio="xMidYMid meet" の挙動を再現
      if (screenAspectRatio > svgAspectRatio) {
        // 画面がSVGより横長の場合、SVGは画面の高さにフィットし、横に余白ができる
        renderedWidth = displayHeight * svgAspectRatio;
        offsetX = (displayWidth - renderedWidth) / 2;
      } else {
        // 画面がSVGより縦長の場合、SVGは画面の幅にフィットし、縦に余白ができる
        renderedHeight = displayWidth / svgAspectRatio;
        offsetY = (displayHeight - renderedHeight) / 2;
      }

      // 1. パンとズームの逆変換
      const transformedX = (screenX - (displayWidth / 2 + translateX)) / scale + (displayWidth / 2);
      const transformedY = (screenY - (displayHeight / 2 + translateY)) / scale + (displayHeight / 2);

      // 2. 余白を考慮した座標に変換
      const xRelativeToSvg = transformedX - offsetX;
      const yRelativeToSvg = transformedY - offsetY;

      // 3. SVGの座標系に変換
      const svgX = (xRelativeToSvg / renderedWidth) * this.svgWidth;
      const svgY = (yRelativeToSvg / renderedHeight) * this.svgHeight;

      console.log('Coordinate transformation:', {
        input: { screenX, screenY },
        rendered: { renderedWidth, renderedHeight, offsetX, offsetY },
        transformed: { transformedX, transformedY },
        relative: { xRelativeToSvg, yRelativeToSvg },
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