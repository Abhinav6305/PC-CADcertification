// Certificate templates and where the participant's name is drawn.
// x / y are fractions of the template width / height (y = text baseline).
// maxWidth is a fraction of template width; the name shrinks to fit it.
window.CERT_CONFIG = {
  event: "PSCAD : A Hands-on Workshop on Power System Simulation",
  dept: "Department of Electrical and Electronics Engineering",
  college: "St. Peter's Engineering College",
  dates: "5th & 6th October 2026",

  nameFont: "'Playfair Display', 'Times New Roman', serif",
  nameWeight: 700,
  nameColor: "#13245a",

  templates: {
    participation: {
      label: "Certificate of Participation",
      file: "assets/templates/participation.jpg",
      x: 0.5, y: 0.639, size: 0.058, maxWidth: 0.56,
    },
    "first-place": {
      label: "Certificate of Merit — First Place",
      file: "assets/templates/first-place.jpg",
      x: 0.5, y: 0.604, size: 0.056, maxWidth: 0.56,
    },
    "runner-up": {
      label: "Certificate of Merit — Runner Up",
      file: "assets/templates/runner-up.jpg",
      x: 0.5, y: 0.604, size: 0.056, maxWidth: 0.56,
    },
  },
};
