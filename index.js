'use strict';

/**
 * Define validators for JSON schema types 
 */
var validators = {
  'string': validateStringType,
  'number': validateNumberType,
  'integer': validateNumberType,
  'object': validateObject,
  'array': validateArray,
  'boolean': validateBooleanType
};

function validateDateTimeType(schema, payload, property) {
  if(payload[property] && isNaN(Date.parse(payload[property]))) {
    return property;
  }
}

function validateStringType(schema, payload, property, format) {
  if(format === 'date-time') {
    return validateDateTimeType(schema, payload, property);
  }
  
  if((typeof payload[property] === 'string' &&
      !payload[property].length) ||
    (typeof payload[property] !== 'string' &&
      payload[property])) {
        return property;
      }   
}

function validateNumberType(schema, payload, property) {
  if(payload[property] && typeof payload[property] !== 'number') {
    return property;
  }
}

function validateObjectType(schema, payload, property) {
  if(payload[property] && typeof payload[property] !== 'object') {
    return property;
  }
}

function validateObject(schema, payload, property) {
  var propertyError = validateObjectType(schema, payload, property);
  var subSchema = schema.properties[property];
  if(propertyError) {
    return propertyError;
  }
  else {
    return validate(subSchema, payload[property]);
  }
}

function validateArrayType(schema, payload, property) {
  if(payload[property] && !Array.isArray(payload[property])) {
    return property;
  }
}

function validateArray(schema, payload, property) {
  var propertyError = validateArrayType(schema, payload, property);
  if(propertyError) return [propertyError];
  else return validateArrayItems(schema, payload, property);
}

function validateArrayItems(schema, payload, property) {
  var subSchema = schema.properties[property];
  var errors = [];
  if(payload[property]) {
    payload[property].forEach(function (item) {
      var error = validate(subSchema.items, item);
      if(error && error.length) errors.push(error);
    });
    return errors;
  }
}

function validateBooleanType(schema, payload, property) {
  if(typeof payload[property] !== 'undefined' && payload[property] !== null && typeof payload[property] !== 'boolean') {
    return property;
  }
}


function validateRequiredProperties(schema, payload) {
  var errors = [];
  schema.required.forEach(function (property) {
    if(typeof payload[property] === 'undefined' || payload[property] === null) errors.push(property);
  });
  return errors;
}

function validateDataTypes(schema, payload) {
  var errors = [];
  Object.keys(schema.properties).forEach(function (property) {
    var type = schema.properties[property].type,
      format = schema.properties[property].format,
      error = validators[type](schema, payload, property, format);
    if(error && error.length) errors.push(error);
  });
  return errors;
}

/**
 * Validates and returns an array of errors
 * @param {object} schema   The schema to validate the payload against
 * @param {object} payload  The payload to validate 
 * @return {Array}          An array of the fields that are not valid
 */
function validate(schema, payload) {
  return validateRequiredProperties(schema, payload)
    .concat(validateDataTypes(schema, payload));
}

module.exports = validate;