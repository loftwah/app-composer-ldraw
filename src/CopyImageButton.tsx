import { useState } from "react";

export async function imageFileAsPng(file: string): Promise<Blob> {
  const response = await fetch(file);
  if (!response.ok) throw new Error("Image unavailable");
  const image = await createImageBitmap(await response.blob());
  try {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("PNG conversion unavailable");
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("PNG conversion failed"));
      }, "image/png");
    });
  } finally {
    image.close();
  }
}

export function CopyImageButton({
  image,
  fallback,
}: {
  image: () => Blob | Promise<Blob>;
  fallback: string;
}) {
  const [copying, setCopying] = useState(false);
  const [status, setStatus] = useState("");

  async function copy() {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setStatus(`Image copying is unavailable in this browser. ${fallback}`);
      return;
    }

    setCopying(true);
    setStatus("");
    try {
      // Start the write in the click handler, while user activation is live.
      const png = Promise.resolve(image());
      // A synchronous clipboard failure can leave the conversion in flight.
      void png.catch(() => undefined);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      setStatus("PNG copied to clipboard.");
    } catch {
      setStatus(`Could not copy the image. ${fallback}`);
    } finally {
      setCopying(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => void copy()} disabled={copying}>
        {copying ? "Copying…" : "Copy image"}
      </button>
      <span className="copy-image-status" role="status">
        {status}
      </span>
    </>
  );
}
