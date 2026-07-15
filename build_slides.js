const pptxgen = require("pptxgenjs");

const CHERRY = "990011";
const CHERRY_DARK = "5C000A";
const NAVY = "2F3C7E";
const OFFWHITE = "FCF6F5";
const WHITE = "FFFFFF";
const TEXT_DARK = "262626";
const GREY = "6B6B6B";
const GREEN = "2E7D32";

const HEADER_FONT = "Cambria";
const BODY_FONT = "Calibri";

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
pres.author = "Product Analyst Candidate";
pres.title = "Reducing Checkout Drop-Off and Refund-Driven Churn on Zomato";

// ---------------------------------------------------------------
// Slide 1: Title
// ---------------------------------------------------------------
let s1 = pres.addSlide();
s1.background = { color: CHERRY_DARK };

s1.addText("PRODUCT ANALYTICS CASE STUDY", {
  x: 0.7, y: 1.5, w: 10, h: 0.4,
  fontFace: BODY_FONT, fontSize: 14, color: "F2C9CE", charSpacing: 3, bold: true,
});
s1.addText("Reducing Checkout Drop-Off & Refund-Driven Churn on Zomato", {
  x: 0.7, y: 2.0, w: 11.5, h: 1.8,
  fontFace: HEADER_FONT, fontSize: 40, color: WHITE, bold: true, valign: "top",
});
s1.addText("A funnel and retention analysis built with SQL and Python — finding the highest-leverage fix in the checkout flow.", {
  x: 0.7, y: 3.75, w: 9.5, h: 0.8,
  fontFace: BODY_FONT, fontSize: 16, color: "F2C9CE", italic: true,
});

s1.addShape(pres.shapes.OVAL, { x: 0.7, y: 5.3, w: 0.14, h: 0.14, fill: { color: WHITE } });
s1.addText("Tools: SQL (SQLite) · Python (pandas, matplotlib) · Synthetic data modeled on public Zomato review patterns, mid-2026", {
  x: 1.0, y: 5.15, w: 10.5, h: 0.5,
  fontFace: BODY_FONT, fontSize: 12, color: OFFWHITE,
});

s1.addText("Prepared for: Product Analyst application", {
  x: 0.7, y: 6.7, w: 8, h: 0.4,
  fontFace: BODY_FONT, fontSize: 11, color: "C98A90",
});

// ---------------------------------------------------------------
// Slide 2: Problem & Metrics Framework
// ---------------------------------------------------------------
let s2 = pres.addSlide();
s2.background = { color: OFFWHITE };

s2.addText("The Problem", {
  x: 0.6, y: 0.45, w: 8, h: 0.6,
  fontFace: HEADER_FONT, fontSize: 30, color: TEXT_DARK, bold: true,
});
s2.addText("Public 2026 reviews repeatedly surface three complaints — refund delays, stale-address cancellations, and false 'delivered' status. These read as support issues, but they behave like retention problems.", {
  x: 0.6, y: 1.15, w: 6.0, h: 1.5,
  fontFace: BODY_FONT, fontSize: 14, color: TEXT_DARK, valign: "top",
});

const questions = [
  "Where exactly do users drop off before placing an order?",
  "Which post-order failure hurts repeat behavior the most?",
  "What's the smallest fix with the largest retention payoff?",
];
questions.forEach((q, i) => {
  const y = 2.85 + i * 0.62;
  s2.addShape(pres.shapes.OVAL, { x: 0.6, y: y, w: 0.4, h: 0.4, fill: { color: CHERRY } });
  s2.addText(String(i + 1), { x: 0.6, y: y, w: 0.4, h: 0.4, align: "center", valign: "middle", fontFace: BODY_FONT, fontSize: 15, color: WHITE, bold: true });
  s2.addText(q, { x: 1.15, y: y - 0.02, w: 5.6, h: 0.5, fontFace: BODY_FONT, fontSize: 13.5, color: TEXT_DARK, valign: "middle" });
});

// Metrics framework table, right side
s2.addText("Metrics Framework", {
  x: 7.0, y: 0.45, w: 5.6, h: 0.5,
  fontFace: HEADER_FONT, fontSize: 20, color: NAVY, bold: true,
});

const metricRows = [
  [{ text: "Metric", options: { bold: true, color: WHITE, fill: { color: NAVY } } },
   { text: "Definition", options: { bold: true, color: WHITE, fill: { color: NAVY } } }],
  ["Checkout conversion", "Carts reaching checkout / total carts"],
  ["Complaint rate", "Orders with a complaint / total orders"],
  ["Refund TTR", "Hours from request to resolution"],
  ["30-day repeat rate", "Reorder within 30 days / total orders"],
];
s2.addTable(metricRows, {
  x: 7.0, y: 1.1, w: 5.6, colW: [2.2, 3.4],
  fontFace: BODY_FONT, fontSize: 11.5, color: TEXT_DARK,
  border: { pt: 0.75, color: "E3D2D4" },
  autoPage: false,
  rowH: 0.55,
});

s2.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 7.0, y: 4.55, w: 5.6, h: 1.7, rectRadius: 0.08,
  fill: { color: WHITE }, shadow: { type: "outer", color: "000000", blur: 8, offset: 3, angle: 90, opacity: 0.12 },
});
s2.addText("North-star metric for this analysis:", {
  x: 7.3, y: 4.75, w: 5.0, h: 0.35, fontFace: BODY_FONT, fontSize: 12, color: GREY,
});
s2.addText("30-day repeat order rate", {
  x: 7.3, y: 5.1, w: 5.0, h: 0.5, fontFace: HEADER_FONT, fontSize: 22, color: CHERRY, bold: true,
});
s2.addText("Chosen because it ties directly to revenue and is sensitive to both funnel and support friction.", {
  x: 7.3, y: 5.65, w: 5.0, h: 0.5, fontFace: BODY_FONT, fontSize: 11, color: TEXT_DARK, italic: true,
});

// ---------------------------------------------------------------
// Slide 3: Funnel Analysis (native chart)
// ---------------------------------------------------------------
let s3 = pres.addSlide();
s3.background = { color: WHITE };

s3.addText("Where Users Drop Off", {
  x: 0.6, y: 0.4, w: 9, h: 0.6,
  fontFace: HEADER_FONT, fontSize: 28, color: TEXT_DARK, bold: true,
});
s3.addText("App Open \u2192 Order Placed, n = 4,000 sessions", {
  x: 0.6, y: 0.98, w: 9, h: 0.4,
  fontFace: BODY_FONT, fontSize: 13, color: GREY,
});

const funnelLabels = ["App Open", "Browsed", "Added to Cart", "Reached Checkout", "Order Placed"];
const funnelValues = [4000, 3514, 2227, 1561, 1447];

s3.addChart(pres.charts.BAR, [
  { name: "Users", labels: funnelLabels, values: funnelValues },
], {
  x: 0.5, y: 1.55, w: 8.0, h: 5.4,
  barDir: "col",
  chartColors: [CHERRY],
  showLegend: false,
  showValue: true,
  dataLabelColor: TEXT_DARK,
  dataLabelPosition: "outEnd",
  dataLabelFontSize: 11,
  catAxisLabelFontFace: BODY_FONT,
  catAxisLabelFontSize: 11,
  valAxisLabelFontFace: BODY_FONT,
  valAxisHidden: false,
  barGapWidthPct: 35,
});

s3.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 8.85, y: 1.7, w: 3.9, h: 2.3, rectRadius: 0.08,
  fill: { color: OFFWHITE },
});
s3.addText("36.2%", {
  x: 9.1, y: 1.9, w: 3.4, h: 0.9, fontFace: HEADER_FONT, fontSize: 44, color: CHERRY, bold: true,
});
s3.addText("overall App Open \u2192 Order conversion", {
  x: 9.1, y: 2.75, w: 3.4, h: 0.6, fontFace: BODY_FONT, fontSize: 12, color: TEXT_DARK,
});

s3.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 8.85, y: 4.25, w: 3.9, h: 2.4, rectRadius: 0.08,
  fill: { color: OFFWHITE },
});
s3.addText("-29.9%", {
  x: 9.1, y: 4.45, w: 3.4, h: 0.8, fontFace: HEADER_FONT, fontSize: 34, color: NAVY, bold: true,
});
s3.addText("the single sharpest drop is Cart \u2192 Checkout \u2014 unusually large for a normally low-friction step.", {
  x: 9.1, y: 5.15, w: 3.4, h: 1.3, fontFace: BODY_FONT, fontSize: 12, color: TEXT_DARK, valign: "top",
});

// ---------------------------------------------------------------
// Slide 4: Two Key Findings side by side
// ---------------------------------------------------------------
let s4 = pres.addSlide();
s4.background = { color: WHITE };

s4.addText("Two Findings That Explain the Leak", {
  x: 0.6, y: 0.4, w: 11, h: 0.6,
  fontFace: HEADER_FONT, fontSize: 28, color: TEXT_DARK, bold: true,
});

// Left: stale address checkout conversion
s4.addText("Finding 1 \u2014 Stale Address Kills Checkout", {
  x: 0.6, y: 1.15, w: 5.8, h: 0.4,
  fontFace: BODY_FONT, fontSize: 14, color: CHERRY, bold: true,
});
s4.addChart(pres.charts.BAR, [
  { name: "Checkout conversion %", labels: ["Fresh address", "Stale address\n(30+ days)"], values: [76.1, 48.1] },
], {
  x: 0.6, y: 1.65, w: 5.8, h: 4.6,
  barDir: "col",
  chartColors: [GREEN, CHERRY],
  showLegend: false,
  showValue: true,
  dataLabelColor: TEXT_DARK,
  dataLabelPosition: "outEnd",
  dataLabelFontSize: 12,
  catAxisLabelFontFace: BODY_FONT,
  catAxisLabelFontSize: 11,
  valAxisMaxVal: 100,
  barGapWidthPct: 50,
});
s4.addText("28-point gap \u2014 affects ~22% of all carts", {
  x: 0.6, y: 6.35, w: 5.8, h: 0.4,
  fontFace: BODY_FONT, fontSize: 12, color: GREY, italic: true,
});

// Right: retention cliff
s4.addText("Finding 2 \u2014 Complaints Destroy Repeat Behavior", {
  x: 6.9, y: 1.15, w: 5.8, h: 0.4,
  fontFace: BODY_FONT, fontSize: 14, color: CHERRY, bold: true,
});
s4.addChart(pres.charts.BAR, [
  { name: "30-day repeat rate %", labels: ["No complaint", "False 'delivered'", "Missing/wrong item", "Refund delay", "Address cancel"], values: [53.3, 7.4, 7.7, 7.7, 3.0] },
], {
  x: 6.9, y: 1.65, w: 5.8, h: 4.6,
  barDir: "bar",
  chartColors: [GREEN, CHERRY, CHERRY, CHERRY, CHERRY],
  showLegend: false,
  showValue: true,
  dataLabelColor: TEXT_DARK,
  dataLabelPosition: "outEnd",
  dataLabelFontSize: 10.5,
  catAxisLabelFontFace: BODY_FONT,
  catAxisLabelFontSize: 10.5,
  valAxisMaxVal: 60,
});
s4.addText("Address-cancellation is the single worst segment \u2014 worse than a failed delivery", {
  x: 6.9, y: 6.35, w: 5.8, h: 0.4,
  fontFace: BODY_FONT, fontSize: 12, color: GREY, italic: true,
});

// ---------------------------------------------------------------
// Slide 5: Recommendation & Projected Impact
// ---------------------------------------------------------------
let s5 = pres.addSlide();
s5.background = { color: OFFWHITE };

s5.addText("Recommended Fix", {
  x: 0.6, y: 0.45, w: 8, h: 0.6,
  fontFace: HEADER_FONT, fontSize: 28, color: TEXT_DARK, bold: true,
});

s5.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 1.25, w: 7.0, h: 1.35, rectRadius: 0.08,
  fill: { color: WHITE }, shadow: { type: "outer", color: "000000", blur: 8, offset: 3, angle: 90, opacity: 0.1 },
});
s5.addText("Stale Address Confirmation Nudge", {
  x: 0.9, y: 1.4, w: 6.4, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY, bold: true,
});
s5.addText("One-tap \u201cDeliver to [address]? Yes / Edit\u201d shown before payment when the saved address hasn't been used in 30+ days.", {
  x: 0.9, y: 1.8, w: 6.4, h: 0.75, fontFace: BODY_FONT, fontSize: 12.5, color: TEXT_DARK, valign: "top",
});

s5.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 0.6, y: 2.85, w: 7.0, h: 1.35, rectRadius: 0.08,
  fill: { color: WHITE }, shadow: { type: "outer", color: "000000", blur: 8, offset: 3, angle: 90, opacity: 0.1 },
});
s5.addText("Automated Refund Path", {
  x: 0.9, y: 3.0, w: 6.4, h: 0.4, fontFace: BODY_FONT, fontSize: 15, color: NAVY, bold: true,
});
s5.addText("Auto-approved refund for address-triggered cancellations specifically \u2014 no chat queue, since fault is unambiguous.", {
  x: 0.9, y: 3.4, w: 6.4, h: 0.75, fontFace: BODY_FONT, fontSize: 12.5, color: TEXT_DARK, valign: "top",
});

s5.addText("Why this fix: it's the highest-leverage node in the funnel \u2014 the largest fixable checkout leak, tied for the slowest refund TTR, and the single worst retention outcome, all in one segment.", {
  x: 0.6, y: 4.45, w: 7.0, h: 1.1, fontFace: BODY_FONT, fontSize: 12.5, color: GREY, italic: true, valign: "top",
});

// Impact callouts
s5.addText("Projected Impact (illustrative)", {
  x: 8.0, y: 1.25, w: 4.7, h: 0.4, fontFace: HEADER_FONT, fontSize: 16, color: TEXT_DARK, bold: true,
});

const impacts = [
  ["+14 pts", "checkout conversion for stale-address segment (~22% of carts)"],
  ["+25 pts", "30-day repeat rate for address-cancellation segment"],
  ["~60\u201370", "additional repeat orders per 1,000 affected users / month"],
];
impacts.forEach((row, i) => {
  const y = 1.85 + i * 1.55;
  s5.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.0, y: y, w: 4.7, h: 1.3, rectRadius: 0.08, fill: { color: CHERRY } });
  s5.addText(row[0], { x: 8.25, y: y + 0.12, w: 4.2, h: 0.55, fontFace: HEADER_FONT, fontSize: 26, color: WHITE, bold: true });
  s5.addText(row[1], { x: 8.25, y: y + 0.68, w: 4.2, h: 0.55, fontFace: BODY_FONT, fontSize: 10.5, color: "F2C9CE" });
});

// ---------------------------------------------------------------
// Slide 6: A/B Test Design
// ---------------------------------------------------------------
let s6 = pres.addSlide();
s6.background = { color: CHERRY_DARK };

s6.addText("Validating It: A/B Test Design", {
  x: 0.6, y: 0.45, w: 10, h: 0.6,
  fontFace: HEADER_FONT, fontSize: 28, color: WHITE, bold: true,
});
s6.addText("H\u2080: The confirmation nudge increases checkout conversion for stale-address users without hurting repeat rate or checkout speed.", {
  x: 0.6, y: 1.1, w: 11.5, h: 0.5, fontFace: BODY_FONT, fontSize: 13.5, color: "F2C9CE", italic: true,
});

const abCols = [
  { title: "Setup", rows: [
    "Unit: User ID",
    "Eligible: stale-address carts only (~22%)",
    "Control: existing checkout flow",
    "Treatment: nudge + auto-refund",
  ]},
  { title: "Primary Metric", rows: [
    "Cart \u2192 Checkout conversion",
    "Baseline: 48.1%",
    "MDE: +10 pts (\u2192 58.1%)",
    "n \u2248 390 / arm (\u03B1=.05, power=.80)",
  ]},
  { title: "Guardrails", rows: [
    "30-day repeat rate \u2265 3.0% baseline",
    "Checkout time not materially slower",
    "No net order-volume regression",
    "Secondary: refund ticket volume \u2193",
  ]},
];

const colW = 3.75;
abCols.forEach((col, i) => {
  const x = 0.6 + i * (colW + 0.3);
  s6.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x, y: 1.9, w: colW, h: 4.6, rectRadius: 0.08, fill: { color: OFFWHITE } });
  s6.addText(col.title, { x: x + 0.25, y: 2.1, w: colW - 0.5, h: 0.45, fontFace: BODY_FONT, fontSize: 15, color: CHERRY, bold: true });
  const bulletItems = col.rows.map((r, idx) => ({ text: r, options: { bullet: true, breakLine: idx < col.rows.length - 1, color: TEXT_DARK, fontSize: 12.5 } }));
  s6.addText(bulletItems, { x: x + 0.25, y: 2.65, w: colW - 0.5, h: 3.7, fontFace: BODY_FONT, valign: "top", lineSpacingMultiple: 1.35 });
});

s6.addText("Ship if primary metric hits MDE with no guardrail regression \u2014 2\u20133 week test window at current volume.", {
  x: 0.6, y: 6.75, w: 11.5, h: 0.5, fontFace: BODY_FONT, fontSize: 12, color: "F2C9CE",
});

pres.writeFile({ fileName: "slides.pptx" }).then(() => console.log("done"));
