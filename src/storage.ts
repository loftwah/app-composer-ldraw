import { nextDraft, recoverDraft } from "./scene.mjs";

const DATABASE = "ldraw-local-v1";
let connection: Promise<IDBDatabase> | undefined;
function db() {
  return (connection ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onerror = () =>
      reject(
        new Error(
          "Browser storage is unavailable. Download an editable copy to keep your drawing.",
        ),
      );
    request.onsuccess = () => resolve(request.result);
  }));
}
export async function readDraft() {
  const database = await db();
  return new Promise<ReturnType<typeof recoverDraft>>((resolve, reject) => {
    const request = database
      .transaction("drafts")
      .objectStore("drafts")
      .get("current");
    request.onsuccess = () => {
      try {
        resolve(recoverDraft(request.result));
      } catch (error) {
        reject(error);
      }
    };
    request.onerror = () => reject(request.error);
  });
}
export async function writeDraft(
  scene: unknown,
  expectedRevision: number,
): Promise<number> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("drafts", "readwrite");
    const store = transaction.objectStore("drafts");
    const request = store.get("current");
    let revision = expectedRevision;
    let failure: unknown;
    request.onsuccess = () => {
      try {
        const record = nextDraft(request.result, expectedRevision, scene);
        revision = record.revision;
        store.put(record, "current");
      } catch (error) {
        failure = error;
        transaction.abort();
      }
    };
    transaction.oncomplete = () => resolve(revision);
    transaction.onabort = transaction.onerror = () =>
      reject(
        failure ??
          transaction.error ??
          new Error(
            "Local save failed. Download an editable copy to keep your drawing.",
          ),
      );
  });
}
