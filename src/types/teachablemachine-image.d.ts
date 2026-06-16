declare module '@teachablemachine/image' {
  export interface Prediction {
    className: string;
    probability: number;
  }

  export interface CustomMobileNet {
    predict(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Prediction[]>;
  }

  export function load(modelUrl: string, metadataUrl?: string): Promise<CustomMobileNet>;
}
