export const MAX_SCENE_BYTES: number;
export const MAX_ELEMENTS: number;
export function validateScene(input: unknown): any;
export function nextDraft(
  current: any,
  expectedRevision: number,
  scene: unknown,
): any;
export function recoverDraft(record: any): {
  scene: any;
  revision: number;
  recovered: boolean;
};
