/* Reads the words off a picture of a station's sheet, in the browser: the picture never leaves the device. The reader
   (tesseract.js) loads its engine and its English word list from the jsDelivr CDN the first time, about 5 MB, then
   the browser keeps them. What it reads goes through readSheet (lib/ops/radio.ts) and is shown for checking before
   anything is saved: a phone photo of a printed sheet reads well, but small superscripts ("2nd", "10th") and red
   text can come out wrong. */

export async function scanPicture(file: File, onStep: (label: string, share: number) => void): Promise<string> {
  onStep("Opening the picture", 0.05);
  const bmp = await createImageBitmap(file);
  // the reader works best on text about 30 px high: make small photos bigger, and turn it all grey
  const k = Math.min(3, Math.max(1, 2400 / Math.max(bmp.width, bmp.height)));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("This browser cannot prepare the picture.");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  // the stations print changed times in red: keep each pixel's darkest channel, so red (and any coloured) ink turns
  // as dark as black ink, while the white paper stays white
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const v = Math.min(px[i], px[i + 1], px[i + 2]);
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  onStep("Getting the reader ready", 0.15);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onStep("Reading the sheet", 0.3 + m.progress * 0.7);
    },
  });
  try {
    // the sheet is one column of short lines
    await worker.setParameters({ tessedit_pageseg_mode: "4" as never });
    const { data } = await worker.recognize(c);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
