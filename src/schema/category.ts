import { Table } from 'types'
import { ADMIN_ROLES } from 'utils/decorators/RouteAccessRoles'
import { transformColumnsToJsonSchema } from 'utils/dbwrapper/util'

const CATEGORY_TABLE: Table = {
  table_name: 'category',
  list_roles: ADMIN_ROLES,
  schema: transformColumnsToJsonSchema({
    required: ['name'],
    properties: {
      name: {
        type: 'string',
      },
    },
  }),
  index: [{ name: 'name_v1', value: { name: 'text' } }],
}

export default CATEGORY_TABLE
