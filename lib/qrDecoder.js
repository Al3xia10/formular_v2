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

function attemptDecode(image) {
  const attempts = [
    {
      data: image.data,
      width: image.width,
      height: image.height,
    },
    ...buildCroppedVariants(image),
    ...buildDownscaledVariants(image),
  ];

  for (const candidate of attempts) {
    const decoded = jsQR(candidate.data, candidate.width, candidate.height, {
      inversionAttempts: "attemptBoth",
    });

    if (decoded?.data) {
      return decoded.data;
    }
  }

  return null;
}

function buildCroppedVariants(image) {
  const variants = [];
  const cropRatios = [0.9, 0.75, 0.6];

  for (const ratio of cropRatios) {
    const width = Math.max(200, Math.floor(image.width * ratio));
    const height = Math.max(200, Math.floor(image.height * ratio));
    const offsetX = Math.max(0, Math.floor((image.width - width) / 2));
    const offsetY = Math.max(0, Math.floor((image.height - height) / 2));
    variants.push(cropImage(image, offsetX, offsetY, width, height));
  }

  return variants;
}

function buildDownscaledVariants(image) {
  const maxSizes = [2200, 1800, 1400, 1100];
  const variants = [];

  for (const maxSize of maxSizes) {
    const largestSide = Math.max(image.width, image.height);
    if (largestSide <= maxSize) {
      continue;
    }

    const scale = maxSize / largestSide;
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    variants.push(resizeNearestNeighbor(image, width, height));
  }

  return variants;
}

function cropImage(image, startX, startY, cropWidth, cropHeight) {
  const output = new Uint8ClampedArray(cropWidth * cropHeight * 4);

  for (let y = 0; y < cropHeight; y += 1) {
    for (let x = 0; x < cropWidth; x += 1) {
      const sourceIndex = ((startY + y) * image.width + (startX + x)) * 4;
      const targetIndex = (y * cropWidth + x) * 4;

      output[targetIndex] = image.data[sourceIndex];
      output[targetIndex + 1] = image.data[sourceIndex + 1];
      output[targetIndex + 2] = image.data[sourceIndex + 2];
      output[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  return {
    data: output,
    width: cropWidth,
    height: cropHeight,
  };
}

function resizeNearestNeighbor(image, targetWidth, targetHeight) {
  const output = new Uint8ClampedArray(targetWidth * targetHeight * 4);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(
      image.height - 1,
      Math.floor((y / targetHeight) * image.height),
    );

    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(
        image.width - 1,
        Math.floor((x / targetWidth) * image.width),
      );
      const sourceIndex = (sourceY * image.width + sourceX) * 4;
      const targetIndex = (y * targetWidth + x) * 4;

      output[targetIndex] = image.data[sourceIndex];
      output[targetIndex + 1] = image.data[sourceIndex + 1];
      output[targetIndex + 2] = image.data[sourceIndex + 2];
      output[targetIndex + 3] = image.data[sourceIndex + 3];
    }
  }

  return {
    data: output,
    width: targetWidth,
    height: targetHeight,
  };
}

export function extractQrFromImageBuffer(buffer, mimeType = "") {
  const image = getImagePixels(buffer, mimeType);
  return attemptDecode(image);
}
