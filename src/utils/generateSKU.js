module.exports = ({
  category = "GEN",
  productName = "ITEM",
  brand = "BRD",
  unit = "",
}) => {
  const c = category.slice(0, 3).toUpperCase();
  const p = productName.replace(/\s+/g, "").slice(0, 5).toUpperCase();
  const b = brand.replace(/\s+/g, "").slice(0, 3).toUpperCase();
  return `${c}-${p}-${b}-${Date.now().toString().slice(-5)}${unit ? "-" + unit.toUpperCase() : ""}`;
};
