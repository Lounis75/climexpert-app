// TVA 2026 rules per brief
export function calculerTVA(
  typeEquipement: string,
  typeBatiment: string,
  ancienneteAns?: number,
): number {
  const residentielAncien = typeBatiment === "residentiel" && (ancienneteAns ?? 0) >= 2;

  if (typeEquipement === "pac_air_eau" || typeEquipement === "pac_geothermie") {
    return residentielAncien ? 5.5 : 20;
  }

  if (typeEquipement === "clim_simple" || typeEquipement === "pac_air_air" || typeEquipement === "multi_split") {
    if (residentielAncien) return 10; // pose, 20% matériel — simplified to 10 for display
    return 20;
  }

  return 20; // pro, neuf, ERP
}
