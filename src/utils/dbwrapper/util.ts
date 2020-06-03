import Ajv, { ErrorObject } from 'ajv'
import omitBy from 'lodash/omitBy'
import omit from 'lodash/omit'
import isNil from 'lodash/isNil'
import { Table, Sort, Identifiable } from 'types'
import { JSONSchema7 } from 'json-schema'
import { BadRequestError } from 'restify-errors'
import { ObjectID } from 'mongodb'

export const reverse_sort_columns = ['dob']

function formatValidationError({ errors }: { errors: ErrorObject[] }) {
  const [{ message, dataPath }] = errors
  throw new BadRequestError(`${dataPath.slice(1)} ${message}`)
}

export function objectIdToString<T>(data: T) {
  return Object.entries(data).reduce((acc: any, [key, val]) => {
    return {
      ...acc,
      [key]: val instanceof ObjectID ? val.toHexString() : val,
    }
  }, {})
}

export function objectStringToObjectID<T>(data: T) {
  return Object.entries(data).reduce((acc: any, [key, val]) => {
    return {
      ...acc,
      [key]: key.includes('_id') ? new ObjectID(val) : val,
    }
  }, {})
}

export async function validateSchema<T extends object>(
  params: { data: T; schema: JSONSchema7; action: 'create' | 'updateById' | 'updateByFilter' },
  ajv_opts = { removeAdditional: true },
): Promise<T> {
  const { data, schema, action = false } = params
  if (!schema) {
    return data
  }
  const ajv = new Ajv(ajv_opts)
  const validate = ajv.compile({
    $async: true,
    additionalProperties: false,
    ...schema,
    ...(action === 'updateById' && { required: ['id'] }),
    ...(action === 'updateByFilter' && { required: [] }),
  })
  const result = validate(removeNil(objectIdToString(data))) as Promise<T>
  return result.then((result: T) => objectStringToObjectID(result)).catch(formatValidationError)
}

export function validateJsonSchema<T extends object>(
  data: T,
  json_schema: JSONSchema7,
  opts = { removeAdditional: false },
) {
  const ajv = new Ajv(opts)
  const validate = ajv.compile({
    $async: true,
    additionalProperties: true,
    ...json_schema,
  })
  const result = validate(removeNil(data)) as Promise<T>
  return result.catch(formatValidationError)
}

export function attachId<T extends Identifiable>(data: T) {
  return data
    ? omit(
        {
          ...data,
          ...(data._id && { id: data._id }),
        },
        '_id',
      )
    : data
}
export function transformColumnsToJsonSchema(schema: JSONSchema7): JSONSchema7 {
  return {
    type: 'object',
    required: schema.required || [],
    properties: {
      id: {
        type: 'string',
      },
      created_date: {
        type: 'string',
        readOnly: true,
      },
      updated_date: {
        type: 'string',
        readOnly: true,
      },
      status: {
        type: 'string',
        default: 'Active',
        enum: ['active', 'inactive'],
      },
      ...schema.properties,
    },
  }
}

export function sortTables(tables: Table[]): Table[] {
  const source = tables.map(e => ({
    ...e,
    dependencies: e.columns.filter(col => col.foreign_key).map(col => col.reference_table),
  }))
  const mapped = source.reduce((mem: { [key: string]: Table & { dependencies: string[] } }, el) => {
    mem[el.table_name] = el
    return mem
  }, {})
  function inherited(i: string): string[] {
    return mapped[i].dependencies.reduce((mem, i) => {
      return [...mem, i, ...inherited(i)]
    }, [])
  }
  const ordered = source.sort((a, b) => {
    return !!~inherited(b.table_name).indexOf(a.table_name) ? -1 : 1
  })
  return ordered
}

// some sorting are reversed like birth date
export function transformSort(sort: Sort) {
  if (reverse_sort_columns.includes(sort.column)) {
    return {
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    }
  }
  return sort
}

function removeNil(data: object) {
  return omitBy(data, isNil)
}
