// scripts/build-feed.js
// Convierte data/*.json a /data/catalog/facebook-feed.csv
// Node 18+

const fs = require("fs");
const path = require("path");

const SITE = "https://grupotecnolap.com/";
const INPUT_DIR = path.join(process.cwd(), "data");
const OUT_DIR   = path.join(process.cwd(), "data", "catalog");
const OUT_FILE  = path.join(OUT_DIR, "facebook-feed.csv");

// ======= Precio =======
const USD_TO_PEN = 3.80;   // <--- cambia aquí tu TC real
const APLICAR_IGV = true;
const IGV = 0.18;
// ======================

const HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "mpn",
  "google_product_category",
  "product_type",
  "custom_label_0",   // segmento (consumo/empresarial)
  "custom_label_1",   // promoId
  "custom_label_2",   // minicodigo
  "custom_label_3"    // codigo interno
];

function csvEscape(v){
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}

function pricePen(usd, igvIncl){
  if (usd == null) return "";
  let pen = usd * USD_TO_PEN;
  if (APLICAR_IGV && igvIncl === false) pen *= (1 + IGV);
  return `${pen.toFixed(2)} PEN`;
}

const absUrl = rel =>
  !rel ? "" : /^https?:\/\//i.test(rel) ? rel : SITE + (rel.startsWith("/") ? rel.slice(1) : rel);

const buildLink = id => `${SITE}producto.html?id=${encodeURIComponent(id)}`;

const joinExtraImages = imgs =>
  Array.isArray(imgs) ? imgs.slice(1).map(absUrl).filter(Boolean).join(",") : "";

function description(desc, specs, detalles){
  const parts = [];
  if (desc) parts.push(desc);
  if (Array.isArray(specs) && specs.length) parts.push(specs.join(" • "));
  if (detalles) parts.push(detalles);
  let txt = parts.join(" | ");
  if (txt.length > 2000) txt = txt.slice(0,1997) + "...";
  return txt;
}

function mapCategory(cat){
  switch((cat||"").toLowerCase()){
    case "laptops": return "Electronics > Computers > Laptops";
    case "impresoras": return "Electronics > Print, Copy, Scan > Printers & Copiers";
    case "ups": return "Electronics > Electronics Accessories > Power > UPS";
    default: return "Electronics";
  }
}

const productType = cat => (cat||"").trim() || "General";

function toRow(p){
  const igvIncl = p?.precioCalc?.igvIncluido;
  const usd     = p?.precioCalc?.usd;

  const row = {
    id: p.id,
    title: p.nombre,
    description: description(p.desc, p.specs, p.detalles),
    availability: (p.stockLima && p.stockLima > 0) ? "in stock" : "out of stock",
    condition: "new",
    price: pricePen(usd, igvIncl),
    link: buildLink(p.id),
    image_link: absUrl(p.img || (Array.isArray(p.imgs) ? p.imgs[0] : "")),
    additional_image_link: joinExtraImages(p.imgs || []),
    brand: p.marca || "",
    mpn: p.fabricanteCod || p.codigo || "",
    google_product_category: mapCategory(p.cat),
    product_type: productType(p.cat),
    custom_label_0: p.segmento || "",
    custom_label_1: p.promoId || "",
    custom_label_2: p.minicodigo || "",
    custom_label_3: p.codigo || ""
  };

  return HEADERS.map(h => csvEscape(row[h])).join(",");
}

function isProductArray(json){
  return Array.isArray(json) && json.length && typeof json[0]==="object" && "id" in json[0];
}

function main(){
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, {recursive:true});

  const products = [];
  for (const file of fs.readdirSync(INPUT_DIR)){
    if (!file.endsWith(".json")) continue;
    if (["templates.json","social-queue.json"].includes(file)) continue;
    try{
      const data = JSON.parse(fs.readFileSync(path.join(INPUT_DIR,file),"utf8"));
      if (isProductArray(data)) data.forEach(p => products.push(p));
    }catch{ /* skip */ }
  }

  const lines = [HEADERS.join(",")];
  for (const p of products) lines.push(toRow(p));
  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
  console.log(`OK → ${OUT_FILE} (${products.length} productos)`);
}
main();
