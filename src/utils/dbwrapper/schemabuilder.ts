import { Table, Column, DatabaseSchema } from 'types'
import QueryWrapper from './querywrapper'

class SchemaBuilder {
  schema: DatabaseSchema
  query_wrapper: QueryWrapper

  constructor(schema: DatabaseSchema, query_wrapper: QueryWrapper) {
    this.schema = schema
    this.query_wrapper = query_wrapper
  }

  async setupSchema() {
    const created_tables = await this.query_wrapper._listTables().map(e => e.name)
    const current_tables = this.schema.tables.map(e => e.table_name)
    const drop_tables = created_tables.filter(e => !current_tables.includes(e))

    const setupTables = (tables: Table[]) => Promise.mapSeries(tables, e => this.setupTable(e, current_tables))
    const dropTables = (tables: string[]) => Promise.map(tables, e => this.query_wrapper.dropTable(e))

    await Promise.all([setupTables(this.schema.tables), dropTables(drop_tables)])
  }

  async setupTable(table: Table, current_tables: string[]) {
    if (!current_tables.includes(table.table_name)) {
      await this.query_wrapper.createTable(table)
    }
    const created_indexes = await this.query_wrapper
      ._listIndices(table.table_name)
      .filter(e => e.name !== '_id_')
      .map(e => e.name)

    const current_indexes = table.index?.map(e => e.name)
    const drop_indexes = created_indexes.filter(e => !current_indexes.includes(e))
    const new_indexes = table.index?.filter(e => !created_indexes.includes(e.name))

    await Promise.map(new_indexes, e => this.query_wrapper.createIndex(table.table_name, e))
    await Promise.map(drop_indexes, e => this.query_wrapper.dropIndex(table.table_name, e))
  }
}

export default SchemaBuilder
