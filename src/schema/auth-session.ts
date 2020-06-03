import { Table } from 'types'
import { transformColumnsToJsonSchema } from 'utils/dbwrapper/util'

const AUTH_SESSION_TABLE: Table = {
  table_name: 'auth_session',
  list_roles: [],
  schema: transformColumnsToJsonSchema({
    required: ['user_id'],
    properties: {
      user_id: {
        type: 'string',
      },
      device_type: {
        type: 'string',
        enum: ['Web', 'Mobile'],
        default: 'Mobile',
      },
    },
  }),
  index: [{ name: 'user_v1', value: { user_id: 1 } }],
}

export default AUTH_SESSION_TABLE
