import { calculerDureeTotale, getDuреeDeplacement } from "@/lib/creneaux-pure";
import { calculerTVA } from "@/lib/tva";

// ── Durée de déplacement ──────────────────────────────────────────────────────
describe("getDuреeDeplacement", () => {
  test("Paris intra-muros (75) -> 30 min", () => {
    expect(getDuреeDeplacement("75008")).toBe(30);
  });
  test("Petite couronne 92 -> 45 min", () => {
    expect(getDuреeDeplacement("92100")).toBe(45);
  });
  test("Petite couronne 93 -> 45 min", () => {
    expect(getDuреeDeplacement("93300")).toBe(45);
  });
  test("Petite couronne 94 -> 45 min", () => {
    expect(getDuреeDeplacement("94000")).toBe(45);
  });
  test("Grande couronne 77 -> 60 min", () => {
    expect(getDuреeDeplacement("77100")).toBe(60);
  });
  test("Grande couronne 78 -> 60 min", () => {
    expect(getDuреeDeplacement("78000")).toBe(60);
  });
  test("Grande couronne 91 -> 60 min", () => {
    expect(getDuреeDeplacement("91000")).toBe(60);
  });
  test("Grande couronne 95 -> 60 min", () => {
    expect(getDuреeDeplacement("95000")).toBe(60);
  });
  test("Inconnu -> 45 min par défaut", () => {
    expect(getDuреeDeplacement("69000")).toBe(45);
  });
});

// ── Durée totale ──────────────────────────────────────────────────────────────
describe("calculerDureeTotale", () => {
  test("Code postal 75 -> déplacement 30 min", () => {
    expect(calculerDureeTotale("75008", 240)).toBe(270); // 4h + 30min
  });
  test("Code postal 77 -> déplacement 60 min", () => {
    expect(calculerDureeTotale("77100", 240)).toBe(300); // 4h + 60min
  });
  test("Code postal 92 -> déplacement 45 min", () => {
    expect(calculerDureeTotale("92100", 120)).toBe(165); // 2h + 45min
  });
  test("Durée 0 -> seulement déplacement", () => {
    expect(calculerDureeTotale("75001", 0)).toBe(30);
  });
});

// ── TVA ───────────────────────────────────────────────────────────────────────
describe("calculerTVA", () => {
  test("PAC air-eau résidentiel >2 ans -> 5.5%", () => {
    expect(calculerTVA("pac_air_eau", "residentiel", 5)).toBe(5.5);
  });
  test("PAC géothermie résidentiel >2 ans -> 5.5%", () => {
    expect(calculerTVA("pac_geothermie", "residentiel", 10)).toBe(5.5);
  });
  test("PAC air-eau neuf <2 ans -> 20%", () => {
    expect(calculerTVA("pac_air_eau", "residentiel", 1)).toBe(20);
  });
  test("Clim simple résidentiel >2 ans -> 10%", () => {
    expect(calculerTVA("clim_simple", "residentiel", 5)).toBe(10);
  });
  test("PAC air-air résidentiel >2 ans -> 10%", () => {
    expect(calculerTVA("pac_air_air", "residentiel", 3)).toBe(10);
  });
  test("Clim simple neuf <2 ans -> 20%", () => {
    expect(calculerTVA("clim_simple", "neuf_moins_2_ans", 1)).toBe(20);
  });
  test("Clim simple professionnel -> 20%", () => {
    expect(calculerTVA("clim_simple", "professionnel", 10)).toBe(20);
  });
  test("Multi-split ERP -> 20%", () => {
    expect(calculerTVA("multi_split", "erp", 5)).toBe(20);
  });
});
