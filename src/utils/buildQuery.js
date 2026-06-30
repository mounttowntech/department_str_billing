module.exports = (query, searchFields = []) => {
  const filter = {};
  if (query.search && searchFields.length) {
    filter.$or = searchFields.map((f) => ({
      [f]: { $regex: query.search, $options: "i" },
    }));
  }
  if (query.status) filter.status = query.status;
  return filter;
};
