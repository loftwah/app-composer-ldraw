export function fitSize(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight?: number,
): { width: number; height: number };
export function maxArtworkSize(category: string): {
  width: number;
  height: number;
};
export function viewportCenter(appState: any): { x: number; y: number };
export function boundsOf(elements: any[]): {
  left: number;
  top: number;
  width: number;
  height: number;
};
export function translateElements(
  elements: any[],
  dx: number,
  dy: number,
): any[];
export function centerElements(elements: any[], appState: any): any[];
export function placeNearViewport(
  elements: any[],
  appState: any,
  existing?: readonly any[],
): any[];
export function isFullyVisible(elements: any[], appState: any): boolean;
export function remapScene(scene: any, prefix: string): any;
export function sceneElementsForAdd(
  scene: any,
  appState: any,
  prefix: string,
): any;
