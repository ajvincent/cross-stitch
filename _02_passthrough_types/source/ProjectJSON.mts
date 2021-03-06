import {
  default as Ajv,
  JSONSchemaType,
  ErrorObject
} from "ajv";

//import Ajv from "ajv";
/*
_02_passthrough_types/source/ProjectJSON.mts(98,17): error TS2351: This expression is not constructable.
  Type 'typeof import("/home/ajvincent/code-generation/cross-stitch/node_modules/ajv/dist/ajv")' has no construct signatures.
*/

export type ComponentLocationData = {
  "type": "component",
  readonly "file": string
};

/**
 * I can't deprecate this yet.  I had planned on making decorators specify the sequence keys
 * inline in modules, but at this time (July 29, 2022), decorators are not capable of doing this.
 */
export type SequenceKeysData = {
  "type": "sequence",
  readonly "subkeys": ReadonlyArray<string>
};

export type KeysAsProperties = {
  readonly [key: string]: ComponentLocationData | SequenceKeysData
};

type ComponentGeneratorData = {
  readonly sourceTypeLocation: string;
  readonly sourceTypeAlias: string;
  readonly targetDirLocation: string;
  readonly baseClassName: string;
  readonly entryTypeAlias: string;
};

type IntegrationTargetData = {
  readonly directory: string;
  readonly leafName: string;
};

export type BuildData = {
  readonly schemaDate: 20220729;

  readonly keys: KeysAsProperties;
  readonly startComponent?: string;

  readonly componentGenerator: ComponentGeneratorData;

  readonly sourceDirectories?: ReadonlyArray<string>;
  readonly integrationTargets?: IntegrationTargetData[];
};

export type BuildDataArray = ReadonlyArray<BuildData>;

//#region subschemas

const ComponentLocationSchema: JSONSchemaType<ComponentLocationData> = {
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["component"]
    },
    "file": {
      "type": "string",
      "pattern": ".\\.mjs$"
    }
  },
  "required": ["type", "file"],
  "additionalProperties": false,
};

const SequenceKeysSchema: JSONSchemaType<SequenceKeysData> = {
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "enum": ["sequence"]
    },
    "subkeys": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1,
    }
  },
  "required": ["type", "subkeys"],
  "additionalProperties": false,
};

const ComponentGeneratorSchema: JSONSchemaType<ComponentGeneratorData> = {
  "type": "object",
  "properties": {
    "sourceTypeLocation": {
      "type": "string",
      "minLength": 1
    },

    "sourceTypeAlias": {
      "type": "string",
      "minLength": 1
    },

    "targetDirLocation": {
      "type": "string",
      "minLength": 1
    },

    "baseClassName": {
      "type": "string",
      "minLength": 1
    },

    "entryTypeAlias": {
      "type": "string",
      "minLength": 1
    },
  },

  "required": [
    "sourceTypeLocation",
    "sourceTypeAlias",
    "targetDirLocation",
    "baseClassName",
    "entryTypeAlias",
  ],
  "additionalProperties": false,
};

const IntegrationTargetSchema: JSONSchemaType<IntegrationTargetData> = {
  "type": "object",
  "properties": {
    "directory": {
      "type": "string",
      "minLength": 1
    },

    "leafName": {
      "type": "string",
      "minLength": 1
    }
  },

  "required": ["directory", "leafName"],
  "additionalProperties": false,
  "nullable": true
}
// #endregion subschemas

const BuildDataSchema : JSONSchemaType<BuildData> = {
  "type": "object",

  "properties": {
    "schemaDate": {
      "type": "number",
      "enum": [20220729]
    },

    "keys": {
      "type": "object",
      "required": [],
      "additionalProperties": {
        "oneOf": [ ComponentLocationSchema, SequenceKeysSchema ],
      },
    },

    "startComponent": {
      "type": "string",
      "minLength": 1,
      "nullable": true,
    },

    "componentGenerator": ComponentGeneratorSchema,

    "sourceDirectories": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
      },
      "minItems": 1,
      "nullable": true,
    },

    "integrationTargets": {
      "type": "array",
      "nullable": true,
      "items": IntegrationTargetSchema,
      "minItems": 1
    }
  },

  "required": [
    "keys",
    "componentGenerator",
    "schemaDate",
  ],

  "additionalProperties": false
}

const BuildDataArraySchema: JSONSchemaType<BuildDataArray> = {
  "type": "array",
  "minItems": 1,
  "items": BuildDataSchema
};

const ajv = new Ajv();
const SchemaValidator = ajv.compile(BuildDataArraySchema);

export function StaticValidator(data: unknown) : data is BuildDataArray
{
  // Do we have valid data?
  const pass = SchemaValidator(data);
  if (!pass) {
    const errors = SchemaValidator.errors ?? [] as ErrorObject[];

    throw new Error("data did not pass schema", {
      cause: new AggregateError(errors.map(e => new Error(e.message)))
    });
  }

  return data.every(buildData => StaticValidatorOne(buildData));
}

function StaticValidatorOne(data: BuildData) : true
{
  const entries = Object.entries(data.keys);
  const components = new Map<string, ComponentLocationData>,
        sequences = new Map<string, SequenceKeysData>,
        keys = new Set<string>;

  // Fill the components and sequences maps.
  entries.forEach(([key, item]) => {
    keys.add(key);
    if (item.type === "component")
      components.set(key, item);
    else
      sequences.set(key, item);
  });

  // Ensure there are no duplicate or missing subkeys.
  {
    const pendingKeys = new Set(keys.values());
    sequences.forEach(value => {
      value.subkeys.forEach(subkey => {
        if (!pendingKeys.has(subkey))
          throw new Error(`Missed subkey (maybe a duplicate?) : "${subkey}"`);
        pendingKeys.delete(subkey);
      });
    });
  }

  // Do we have a valid start component?
  if (data.startComponent && !keys.has(data.startComponent))
    throw new Error(`Start component name "${data.startComponent}" does not have a component or sequence!`);

  return true;
}
