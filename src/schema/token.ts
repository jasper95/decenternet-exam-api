import { Table } from 'types'
import { transformColumnsToJsonSchema } from 'utils/dbwrapper/util'

const TOKEN_TABLE: Table = {
  table_name: 'token',
  list_roles: [],
  schema: transformColumnsToJsonSchema({
    required: ['type'],
    properties: {
      type: {
        type: 'string',
      },
      expiry: {
        type: 'string',
        format: 'date-time',
      },
      used: {
        type: 'boolean',
        default: false,
      },
    },
  }),
  index: [{ name: 'type_v1', value: { type: 1 } }],
}

export default TOKEN_TABLE
