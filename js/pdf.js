// Minimal dependency-free PDF writer: one or more full-page JPEG images.
// makeImagePdf([{ jpegBytes: Uint8Array, width, height }, ...]) -> Blob
(function () {
  function makeImagePdf(pages) {
    const enc = new TextEncoder();
    const chunks = [];
    const offsets = [];
    let length = 0;
    const push = (data) => {
      const bytes = typeof data === "string" ? enc.encode(data) : data;
      chunks.push(bytes);
      length += bytes.length;
    };

    const n = pages.length;
    // Object numbering: 1 catalog, 2 pages, then per page: page, content, image
    const pageObj = (i) => 3 + i * 3;
    const contentObj = (i) => 4 + i * 3;
    const imageObj = (i) => 5 + i * 3;
    const total = 2 + n * 3;

    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

    const startObj = (num) => { offsets[num] = length; push(num + " 0 obj\n"); };

    startObj(1);
    push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    startObj(2);
    const kids = pages.map((_, i) => pageObj(i) + " 0 R").join(" ");
    push("<< /Type /Pages /Kids [" + kids + "] /Count " + n + " >>\nendobj\n");

    pages.forEach((p, i) => {
      // Page size: 842pt wide (A4 landscape width), height keeps the image ratio
      const W = 842;
      const H = +(W * p.height / p.width).toFixed(2);

      startObj(pageObj(i));
      push("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + W + " " + H + "] " +
        "/Resources << /XObject << /Im" + i + " " + imageObj(i) + " 0 R >> >> " +
        "/Contents " + contentObj(i) + " 0 R >>\nendobj\n");

      const content = "q\n" + W + " 0 0 " + H + " 0 0 cm\n/Im" + i + " Do\nQ\n";
      startObj(contentObj(i));
      push("<< /Length " + enc.encode(content).length + " >>\nstream\n" + content + "endstream\nendobj\n");

      startObj(imageObj(i));
      push("<< /Type /XObject /Subtype /Image /Width " + p.width + " /Height " + p.height +
        " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + p.jpegBytes.length + " >>\nstream\n");
      push(p.jpegBytes);
      push("\nendstream\nendobj\n");
    });

    const xref = length;
    let x = "xref\n0 " + (total + 1) + "\n0000000000 65535 f \n";
    for (let i = 1; i <= total; i++) x += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
    push(x);
    push("trailer\n<< /Size " + (total + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF\n");

    return new Blob(chunks, { type: "application/pdf" });
  }

  window.makeImagePdf = makeImagePdf;
})();
