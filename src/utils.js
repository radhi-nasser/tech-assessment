const isObject = (e) => {
  return typeof e === "object";
};

const isArray = (e) => {
  return Array.isArray(e);
};

module.exports = {
  isObject,
  isArray,
};
