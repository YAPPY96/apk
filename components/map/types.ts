// components/map/types.ts
export interface EventData {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}