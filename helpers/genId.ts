export const genId = (idLength?: number) => {
  const arr = new Uint8Array((idLength || 20) / 2);
  window.crypto.getRandomValues(arr);
  return Array.from(arr, (dec) => dec.toString(16).padStart(2, "0")).join("");
};
