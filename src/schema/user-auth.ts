import { Table } from 'types'
import { transformColumnsToJsonSchema } from 'utils/dbwrapper/util'

const USER_AUTH_TABLE: Table = {
  table_name: 'user_auth',
  list_roles: [],
  schema: transformColumnsToJsonSchema({
    required: ['user_id', 'password'],
    properties: {
      user_id: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  }),
  index: [{ name: 'user_v1', value: { user_id: 1 } }],
}

export default USER_AUTH_TABLE
