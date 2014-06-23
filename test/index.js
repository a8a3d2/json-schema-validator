'use strict';
/*jshint expr:true */

var chai = require('chai');
var expect = chai.expect;
var proxyquire = require('proxyquire');

describe('validate', function() {
  var validate;
  var schema;
  var payload;

  beforeEach(function() {
    schema = {
      properties: {
        id: {
          type: 'string'
        },
        siteId: {
          type: 'string'
        },
        sampleTypeId: {
          type: 'string'
        },
        name: {
          type: 'string'
        },
        sampleUrls: { 
          type: 'array',
          items: { 
            type: 'object',
            properties: {
              id: { type: 'string' },
              limit: { type: 'number' },
              url: { type: 'string' }
            }, 
            required: [
              'id',
              'limit',
              'url'
            ]
          },
          minItems: 1,
          description: 'The URLs for a sample'
        },
        frequency: {
          type: 'number'
        },
        startTime: {
          type: 'string',
          format: 'date-time'
        },
        decisionSetId: {
          type: 'string'
        },
        createTime: {
          type: 'string',
          format: 'date-time'
        },
        deleted: {
          type: 'boolean'
        },
        endTime: {
          type: 'string',
          format: 'date-time'
        },
        nextScheduledRunTime: {
          type: 'string',
          format: 'date-time'
        },
        scheduledEndTime: {
          type: 'string',
          format: 'date-time'
        },
        scheduledRunTimeResults: {
          type: 'array',
          items: {
            type: 'object'
          }
        },
        scheduledRunTimes: {
          type: 'array',
          items: {
            type: 'string',
            format: 'date-time'
          }
        },
        slug: {
          type: 'string'
        }
      },
      required: [
        'siteId',
        'sampleTypeId',
        'name',
        'frequency',
        'startTime',
        'decisionSetId'
      ]
    };
    payload = {
      siteId: '123',
      sampleTypeId: 'e78d23c1-7440-48cf-8cad-a1e8629e27c1',
      name: 'test json',
      frequency: 30000,
      startTime: 'Thu May 08 2014 14:13:25 GMT+0200 (CEST)',
      decisionSetId: '124131'
    };

    validate = proxyquire(process.cwd() + '/index', {});
  });

  describe('#validate', function() {
    it('does not validate an object if it has a missing required field', function () {
      payload = {
        siteId: '123',
        sampleTypeId: '456',
        name: null,
        frequency: 3000,
        startTime: new Date(),
        decisionSetId: '101'
      };
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('validates the instance if it has the required fields', function () {
      var errors = validate(schema, payload);
      expect(errors).to.have.length(0);
    });   
    it('does not validate an object with malformed array type field', function () {
      payload.sampleUrls = 'dasdsadas';
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0); 
    }); 
    it('does not validate an object with malformed string type field', function () {
      payload.name = 131232131;
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('does not validate an object with malformed number type field', function () {
      payload.frequency = 'not a number obviously';
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0); 
    });
    it('does not validate an object with malformed boolean type field', function () {
      payload.deleted = 'true';
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('does not validate an object with malformed date time field', function () {
      payload.startTime = 'foo';
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('validates a required boolean even if it has the value false', function () {
      schema.required.push('started');
      payload.started = false;
      var errors = validate(schema, payload);
      expect(errors).to.have.length(0);
    });
    it('validates the sub schema', function () {
      payload.sampleUrls = [{
        id: '1234',
        limit: 10,
        url: 'http://test/1'
      }, {
        id: '3124',
        limit: 0,
        url: 'http//test/2'
      }];
      var errors = validate(schema, payload);
      expect(errors).to.have.length(0);
    });
    it('does not validate an object with wrong array items', function () {
      schema = {
        properties: {
          id: { type: 'string' },
          sampleUrls: {
            type: 'array',
            items: {
              properties: {
                id: { type: 'string' },
                limit: { type: 'number' },
                url: { type: 'string' }
              },
              required: [
                'id',
                'limit',
                'url'
              ]
            }
          },
          name: { type: 'string' }
        },
        required: [
          'name'
        ]
      };
      payload.name = null;
      payload.sampleUrls = [{
        id: -1,
        limit: 'fail fail fail'
      }, {
        id: '1234',
        limit: 10,
        url: 10203
      }];
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('will validate the sub schema when an item has an array with objects that have arrays themselves', function () {
      schema = {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          sampleUrls: {
            type: 'array',
            items: {
              properties: {
                id: { type: 'string' },
                limit: { type: 'number' },
                location: {
                  type: 'array',
                  items: {
                    properties: {
                      origin: { type: 'string' },
                      port: { type: 'string' }
                    },
                    required: [
                      'origin',
                      'port'
                    ]
                  }
                }
              },
              required: [
                'limit'
              ]
            }
          }
        },
        required: [
          'name'
        ]
      };
      payload = {
        name: 'ett exempel',
        sampleUrls: [{
          id: '123',
          limit: 20,
          location: [{
            origin: 'test',
            port: '80'
          }]
        }]
      };
      var errors = validate(schema, payload);
      expect(errors).to.have.length(0);
    });
    it('does not validate an invalid object that has an array with objects that have arrays themselves', function () {
      schema = {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          sampleUrls: {
            type: 'array',
            items: {
              properties: {
                id: { type: 'string' },
                limit: { type: 'number' },
                location: {
                  type: 'array',
                  items: {
                    properties: {
                      origin: { type: 'string' },
                      port: { type: 'string' }
                    },
                    required: [
                      'origin',
                      'port'
                    ]
                  }
                }
              },
              required: [
                'limit'
              ]
            }
          }
        },
        required: [
          'name'
        ]
      };
      payload = {
        name: 'ett exempel',
        sampleUrls: [{
          id: '123',
          limit: 30,
          location: [{
            origin: 'test',
            port: '80'
          }, {
            origin: 'test',
            port: 8080
          }]
        }, {
          id: '132',
          limit: 23,
          location: [{
            origin: 'foo',
            port: '80'
          }]
        }]
      };
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('does not validate an item with an empty string for a required field', function () {
      payload.name = '';
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('does not validate an item with an invalid object as a value for a property', function () {
      schema = {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          size: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              weight: { type: 'number' }  
            },
            required: [
              'length',
              'width',
              'height'
            ] 
          }
        },
        required: [
          'name'
        ]
      };
      payload = {
        name: 'test',
        size: {
          length: 30,
          height: '45',
          weight: '45 kg'
        }
      };
      var errors = validate(schema, payload);
      expect(errors).to.have.length.gt(0);
    });
    it('validates an item with valid object as a value for a property', function () {
      schema = {
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          size: {
            type: 'object',
            properties: {
              length: { type: 'number' },
              width: { type: 'number' },
              height: { type: 'number' },
              weight: { type: 'number' }  
            },
            required: [
              'length',
              'width',
              'height'
            ] 
          }
        },
        required: [
          'name'
        ]
      };
      payload = {
        name: 'test',
        size: {
          length: 30,
          width: 50,
          height: 45
        }
      };
      var errors = validate(schema, payload);
      expect(errors).to.have.length(0);     
    });
  });
});