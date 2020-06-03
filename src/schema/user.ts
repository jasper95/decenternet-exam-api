import { Table } from 'types'
import { ADMIN_ROLES } from 'utils/decorators/RouteAccessRoles'
import { transformColumnsToJsonSchema } from 'utils/dbwrapper/util'

const USER_TABLE: Table = {
  table_name: 'user',
  list_roles: ADMIN_ROLES,
  schema: transformColumnsToJsonSchema({
    required: ['email', 'first_name', 'last_name', 'role'],
    properties: {
      email: {
        type: 'string',
      },
      first_name: {
        type: 'string',
      },
      last_name: {
        type: 'string',
      },
      role: {
        type: 'string',
        enum: ['admin', 'user'],
        default: 'admin',
      },
    },
  }),
  index: [
    {
      name: 'search_v1',
      value: { first_name: 'text', last_name: 'text', email: 'text' },
    },
    { name: 'email_v1', value: { email: 1 } },
  ],
}

export default USER_TABLE
