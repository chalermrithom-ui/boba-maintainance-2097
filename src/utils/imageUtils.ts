export async function addLabelToImageFile(file: File, labelText: string): Promise<File> {
  if (!labelText || !labelText.trim() || !file.type.startsWith("image/")) {
    return file;
  }

  const cleanLabel = labelText.trim();
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Banner height proportional to image height (min 36px, max 120px)
      const bannerHeight = Math.max(36, Math.min(120, Math.round(canvas.height * 0.08)));
      const fontSize = Math.max(15, Math.round(bannerHeight * 0.42));

      // Draw semi-transparent dark banner background at bottom
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Slate-900 with 85% opacity
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

      // Accent border line at top of banner
      ctx.fillStyle = "#3b82f6"; // Blue accent line
      ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, Math.max(2, Math.round(bannerHeight * 0.05)));

      // Draw text label
      ctx.font = `bold ${fontSize}px sans-serif, "Segoe UI", Tahoma`;
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";

      const paddingLeft = Math.round(fontSize * 0.8);
      const textY = canvas.height - Math.round(bannerHeight / 2) + Math.round(bannerHeight * 0.02);

      ctx.fillText(`📌 ${cleanLabel}`, paddingLeft, textY);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const labeledFile = new File([blob], file.name || "labeled_image.jpg", {
            type: "image/jpeg",
          });
          resolve(labeledFile);
        },
        "image/jpeg",
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
