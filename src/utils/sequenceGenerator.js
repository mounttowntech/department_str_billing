module.exports = async (Model, field, prefix) => {
  const count = await Model.countDocuments();
  return `${prefix}-${String(count + 1).padStart(6, "0")}`;
};
