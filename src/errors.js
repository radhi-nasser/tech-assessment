class ConditionNotSupported extends Error {
  constructor(...args) {
    super(ConditionNotSupported.name, ...args);
  }
}

module.exports = {
  ConditionNotSupported,
};
