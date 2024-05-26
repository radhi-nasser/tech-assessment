const { ConditionNotSupported } = require("./errors");
const { isArray, isObject } = require("./utils");

class EligibilityService {
  /**
   * Check if a field exist in cart data.
   *
   * @param cart
   * @param fieldName
   * @return {boolean}
   */
  #doesFieldExist(cart, fieldName) {
    return Object.keys(cart).includes(fieldName);
  }

  /**
   * Handle IN condition.
   *
   * @param cart
   * @param fieldName
   * @param values
   * @return {boolean}
   */
  #handleINCondition(cart, fieldName, value) {
    return value.some((e) => e == cart[fieldName]);
  }

  /**
   * Handle AND condition.
   *
   * @param cart
   * @param fieldName
   * @param values
   * @return {boolean}
   */
  #handleANDCondition(cart, fieldName, values) {
    return Object.keys(values).every((key) => {
      const newCart = { [key]: values[key] };
      return this.#checkField(cart, fieldName, newCart);
    });
  }

  /**
   * Handle OR condition.
   *
   * @param cart
   * @param fieldName
   * @param values
   * @return {boolean}
   */
  #handleORCondition(cart, fieldName, values) {
    return Object.keys(values).some((key) => {
      const newCart = { [key]: values[key] };
      return this.#checkField(cart, fieldName, newCart);
    });
  }

  /**
   * Handle Sub-object condition.
   *
   * @param cart
   * @param splittedFieldName
   * @param values
   * @return {boolean}
   */
  #handleSubObjectCondition(cart, splittedFieldName, value) {
    const fieldName = splittedFieldName[0];

    // Instead of accessing splittedFieldName[0] we do the following to handle multiple levels of sub objects
    const subFieldName = splittedFieldName.slice(1).join(".");

    if (!this.#doesFieldExist(cart, fieldName)) {
      return false;
    }

    const newCart = cart[fieldName];

    // The field is not an array, so we need to compare the value directly
    if (!isArray(newCart)) {
      return this.#checkField(newCart, subFieldName, value);
    }

    // The field is an array, so we need to check the value of each element
    return newCart.some((e) => this.#checkField(e, subFieldName, value));
  }

  /**
   * Compare cart data with one criterion to compute eligibility.
   *
   * @param cart
   * @param fieldName
   * @param value
   * @return {boolean}
   */
  #checkField(cart, fieldName, value) {
    // Handle sub-object if found
    const splittedFieldName = fieldName.split(".");
    if (splittedFieldName.length > 1) {
      return this.#handleSubObjectCondition(cart, splittedFieldName, value);
    }

    // Criteria field does not exist in cart data
    if (!this.#doesFieldExist(cart, fieldName)) {
      return false;
    }

    // Equal condition
    if (!isObject(value)) {
      // A comparison with only double equal sign to be able to handle typeless checking: 20, "20" and 20.0 are all equal
      return cart[fieldName] == value;
    }

    // Other conditions
    for (const condition of Object.keys(value)) {
      switch (condition) {
        case "lt":
          return cart[fieldName] < value[condition];
        case "lte":
          return cart[fieldName] <= value[condition];
        case "gt":
          return cart[fieldName] > value[condition];
        case "gte":
          return cart[fieldName] >= value[condition];
        case "in":
          return this.#handleINCondition(cart, fieldName, value[condition]);
        case "and":
          return this.#handleANDCondition(cart, fieldName, value[condition]);
        case "or":
          return this.#handleORCondition(cart, fieldName, value[condition]);
        default:
          throw new ConditionNotSupported();
      }
    }
  }

  /**
   * Compare cart data with criteria to compute eligibility.
   * If all criteria are fulfilled then the cart is eligible (return true).
   *
   * @param cart
   * @param criteria
   * @return {boolean}
   */
  isEligible(cart, criteria) {
    if (Object.keys(criteria).length === 0) {
      return true;
    }

    // In case we have an empty cart and we have criteria defined this should fail
    if (Object.keys(cart).length === 0) {
      return false;
    }

    for (const fieldName of Object.keys(criteria)) {
      if (!this.#checkField(cart, fieldName, criteria[fieldName])) {
        return false;
      }
    }

    return true;
  }
}

module.exports = {
  EligibilityService,
};
