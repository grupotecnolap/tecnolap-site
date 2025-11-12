// scripts/build-feed.js
// Convierte data/*.json (laptops, etc.) a /data/catalog/facebook-feed.csv para Facebook Catalog
// Requiere Node 18+

const fs = require("fs");
const path = require("path");

const SITE = "https://grupotecnolap.com/";    // tu dominio
const INPUT_DIR = path.join(process.cwd(), "data");
const OUT_DIR   = path.join(process.cwd(), "data", "catalog");
const OUT_FILE  = path.join(OUT_DIR, "facebook-feed.csv");

// ======= Parámetros de precio =======
const USD_TO_PEN = 3.80;     // <--- ajusta el tipo de cambio
const APLICAR_IGV = true;    // si tu JSON tiene precios sin IGV y quieres publicarlos con IGV
const IGV = 0.18;            // 18% en Perú
// ====================================

// Cabecera CSV (campos recomendados por FB)
const HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",   // URLs separadas por comas
  "brand",
  "mpn",
  "google_product_category",
  "product_type",
  "custom_label_0"           // ej. tu "segmento" (consumo/empresarial)
];

// Pequeño helper CSV
function csvEscape(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function pricePen(usd, igvIncluidoFlag) {
  if (usd == null) return "";
  let pen = usd * USD_TO_PEN;
  // si el JSON dice igvIncluido:false y queremos publicarlo con IGV
  if (APLICAR_IGV && igvIncluidoFlag === false) pen = pen * (1 + IGV);
  return `${pen.toFixed(2)} PEN`;
}

function buildLink(productId) {
  // Página de producto (sugerencia: crea producto.html que lea ?id=...)
  return `${SITE}producto.html?id=${encodeURIComponent(productId)}`;
}

function absUrl(rel) {
  if (!rel) return "";
  if (/^https?:\/\//i.test(rel)) return rel;
  // asegúrate que tus rutas empiezan sin "./"
  return SITE + (rel.startsWith("/") ? rel.slice(1) : rel);
}

function joinExtraImages(imgs) {
  if (!Array.isArray(imgs)) return "";
  // omite la primera (image_link) y concatena el resto
  const extras = imgs.slice(1).map(absUrl).filter(Boolean);
  return extras.join(",");
}

function description(desc, specs, detalles) {
  const parts = [];
  if (desc) parts.push(desc);
  if (Array.isArray(specs) && specs.length) parts.push(specs.join(" • "));
  if (detalles) parts.push(detalles);
  let txt = parts.join(" | ");
  // Facebook permite descripciones largas; por higiene la acotamos a ~2000
  if (txt.length > 2000) txt = txt.slice(0, 1997) + "...";
  return txt;
}

function mapCategory(cat) {
  // Mapea tu "cat" a la categoría de Google (texto está bien)
  switch ((cat || "").toLowerCase()) {
    case "laptops":
      return "Electronics > Computers > Laptops";
    case "impresoras":
      return "Electronics > Print, Copy, Scan > Printers & Copiers";
    case "ups":
      return "Electronics > Electronics Accessories > Power > UPS";
    default:
      return "Electronics";
  }
}

function productType(cat) {
  // product_type para segmentar (luego puedes crear sets por tipo)
  return (cat || "").trim() || "General";
}

function toRow(p) {
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
    custom_label_0: p.segmento || ""
  };

  return HEADERS.map(h => csvEscape(row[h])).join(",");
}

function isProductArray(json) {
  return Array.isArray(json) && json.length && typeof json[0] === "object" && "id" in json[0];
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = fs.readdirSync(INPUT_DIR);
  const products = [];

  for (const file of entries) {
    if (!file.endsWith(".json")) continue;
    // evita templates u otros archivos no-prods
    if (["templates.json", "social-queue.json"].includes(file)) continue;

    const full = path.join(INPUT_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(full, "utf8"));
      if (isProductArray(data)) {
        data.forEach(p => products.push(p));
      }
    } catch (e) {
      console.warn("Saltando (no JSON válido):", file);
    }
  }

  const lines = [HEADERS.join(",")];
  for (const p of products) lines.push(toRow(p));

  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf8");
  console.log(`OK → ${OUT_FILE} (${products.length} productos)`);
}

main();
