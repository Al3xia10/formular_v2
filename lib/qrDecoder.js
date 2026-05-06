import jpeg from "jpeg-js";
import jsQR from "jsqr";
import { PNG } from "pngjs";

function decodePng(buffer) {
  const image = PNG.sync.read(buffer);
  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
  };
}

function decodeJpeg(buffer) {
  const image = jpeg.decode(buffer, {
    useTArray: true,
    formatAsRGBA: true,
  });

  return {
    data: new Uint8ClampedArray(image.data),
    width: image.width,
    height: image.height,
  };
}

function getImagePixels(buffer, mimeType = "") {
  const normalizedMimeType = mimeType.toLowerCase();

  if (normalizedMimeType.includes("png")) {
    return decodePng(buffer);
  }

  if (
    normalizedMimeType.includes("jpeg") ||
    normalizedMimeType.includes("jpg") ||
    normalizedMimeType.includes("pjpeg")
  ) {
    return decodeJpeg(buffer);
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return decodePng(buffer);
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    return decodeJpeg(buffer);
  }

  throw new Error("Fișierul imaginii trebuie să fie JPG sau PNG.");
}

export function extractQrFromImageBuffer(buffer, mimeType = "") {
  const image = getImagePixels(buffer, mimeType);
  const result = jsQR(image.data, image.width, image.height);
  return result?.data || null;
}
