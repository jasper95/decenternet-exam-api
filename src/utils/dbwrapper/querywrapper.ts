import { MongoClient, ObjectID, Db } from 'mongodb'
import { JSONSchema7 } from 'json-schema'
import {
  TableJsonSchema,
  Pagination,
  Sort,
  Identifiable,
  MaybeArray,
  DatabaseSchema,
  SafePartial,
  FilterType,
  Search,
  FilterOptions,
  Table,
  TableIndex,
} from 'types'
import { BadRequestError } from 'restify-errors'
import { validateSchema, attachId, objectStringToObjectID } from './util'
import omit from 'lodash/omit'

class QueryWrapper {
  schema: TableJsonSchema[]
  db: Db

  constructor(schema: DatabaseSchema, client: MongoClient) {
    this.schema = schema.tables.map(table => ({
      schema: table.schema,
      name: table.table_name,
    }))
    this.db = client.db(schema.db_name)
  }

  _checkDatabase() {
    return this.db.admin().listDatabases({ nameOnly: true })
  }

  _listTables() {
    return this.db.listCollections({}, { nameOnly: true }).toArray() as Promise<[{ name: string }]>
  }

  _listIndices(table: string) {
    return this.db
      .collection(table)
      .listIndexes()
      .toArray()
      .catch(() => []) as Promise<[{ name: string }]>
  }

  _getTableSchema(table: string): JSONSchema7 {
    const { schema = null } = this.schema.find(e => e.name === table) || {}
    if (!schema) {
      throw new BadRequestError(`table ${table} does not exists`)
    }
    return schema
  }

  _getTableColumns(schema: JSONSchema7) {
    if (schema) {
      return ['_id', 'created_date', 'updated_date', 'status', ...Object.keys(schema.properties)]
    }
    return []
  }

  _getCommonParams(table: string, fields: string[]) {
    const schema = this._getTableSchema(table)
    const columns = fields.length > 0 ? fields : this._getTableColumns(schema)
    return { schema, columns }
  }

  _attachRecordInfo(data: any, is_update = false) {
    const args = [
      this._transformDates(data),
      !is_update && !data.created_date && { created_date: new Date().toISOString() },
      { updated_date: new Date().toISOString() },
    ].filter(Boolean)
    return Object.assign({}, ...args)
  }

  _transformDates(data: any) {
    return Object.keys(data).reduce((acc: any, el) => {
      if (data[el] instanceof Date) {
        acc[el] = data[el].toISOString()
      } else {
        acc[el] = data[el]
      }
      return acc
    }, {})
  }

  async _createOrDropDatabase(action: string) {
    // const temp_config = cloneDeep({
    //   ...this.config,
    //   pool: { min: 0, max: 1 },
    // })
    // set(temp_config, 'connection.database', 'postgres')
    // const temp_knex = knex(temp_config)
    // await temp_knex.raw(action.toLowerCase()).catch(err => {
    //   false
    // })
    // temp_knex.destroy()
    // return true
  }

  async createDatabase(database: string) {
    // return this._createOrDropDatabase(`CREATE DATABASE ${database}`)
  }

  createTable(table: Table) {
    return this.db.createCollection(table.table_name)
  }

  createIndex(table: string, index: TableIndex) {
    return this.db.collection(table).createIndex(index.value, { name: index.name })
  }

  async dropDatabase() {
    return this.db.dropDatabase()
  }

  dropTable(table: string) {
    return this.db.dropCollection(table)
  }

  dropIndex(table: string, name: string) {
    return this.db.collection(table).dropIndex(name)
  }

  async find<T = any>(table: string, id: string, fields: string[] = [], key_filter = '_id'): Promise<T> {
    const filter = key_filter.includes('_id') ? { [key_filter]: new ObjectID(id) } : { [key_filter]: id }
    const projection = fields.reduce((acc, el) => {
      return {
        ...acc,
        [el]: 1,
      }
    }, {})
    return this.db
      .collection(table)
      .findOne(filter, { projection })
      .then(attachId)
  }

  filter<T extends object = any>(
    table: string,
    filter: FilterType<T>,
    options?: Omit<FilterOptions, 'pagination'>,
  ): Promise<T[]>
  filter<T extends object = any>(
    table: string,
    filter: FilterType<T>,
    options?: FilterOptions,
  ): Promise<{ data: T[]; count: number }>

  async filter<T extends object = any>(
    table: string,
    filter: FilterType<T> = {},
    options: FilterOptions = {},
  ): Promise<{ data: T[]; count: number } | T[]> {
    const pagination: Pagination = options.pagination || {}
    const sort: Sort[] = options.sort || [{ column: 'created_date', direction: 'asc' }]
    const fields: string[] = options.fields || []
    const search: Search = options.search || { fields: [], value: '' }
    const { page, size } = pagination
    filter = objectStringToObjectID(filter)
    if (search.value) {
      filter = {
        ...filter,
        $text: { $search: search.value },
      }
    }
    const projection = fields.reduce(
      (acc, el) => ({
        ...acc,
        [el]: 1,
      }),
      {},
    )
    const sorting = sort.reduce((acc, el) => ({ ...acc, [el.column]: el.direction === 'asc' ? 1 : -1 }), {})
    if (![page, size].includes(undefined)) {
      const data = this.db
        .collection(table)
        .find(filter, { limit: Number(size), skip: Number(page), projection })
        .sort(sorting)
        .toArray()
        .then(response => response.map(attachId))
      const count = this.db.collection(table).countDocuments(filter)
      return Promise.props({
        data,
        count,
      })
    }
    return this.db
      .collection(table)
      .find(filter)
      .sort(sorting)
      .toArray()
      .map(attachId)
  }

  async insert<T extends Identifiable = any>(
    table: string,
    data: SafePartial<T>,
    fields?: string[],
    options?: { batch_size: number },
  ): Promise<T>
  async insert<T extends Identifiable = any>(
    table: string,
    data: SafePartial<T>[],
    fields?: string[],
    options?: { batch_size: number },
  ): Promise<T[]>
  async insert<T extends Identifiable = any>(
    table: string,
    data: MaybeArray<SafePartial<T>>,
    fields: string[] = [],
    options = { batch_size: 1000 },
  ): Promise<MaybeArray<T>> {
    const { schema } = this._getCommonParams(table, fields)
    if (Array.isArray(data)) {
      data = await Promise.map(data, e =>
        validateSchema({ data: this._attachRecordInfo(e, false), schema, action: 'create' }),
      )
      return this.db
        .collection(table)
        .insertMany(data.map(e => ({ ...e, _id: new ObjectID(e.id) })))
        .then(response => response.ops.map(attachId))
    }
    const single_data = await validateSchema({ data: this._attachRecordInfo(data, false), schema, action: 'create' })
    return this.db
      .collection(table)
      .insertOne({ ...single_data, _id: new ObjectID(single_data.id) })
      .then(response => attachId(response.ops[0]))
  }

  async upsert<T extends Identifiable = any>(table: string, data: MaybeArray<T>, fields: string[] = []) {
    const { schema } = this._getCommonParams(table, fields)
    const validate = async (e: T) => validateSchema({ data: e, schema, action: 'create' })
    const upsertData = (e: T) =>
      this.db
        .collection(table)
        .replaceOne(
          {
            _id: new ObjectID(e.id),
          },
          omit(objectStringToObjectID(e), 'id'),
          { upsert: true },
        )
        .then(() => e)
    if (Array.isArray(data)) {
      data = await Promise.map(data, e => validate(this._attachRecordInfo(e, true)))
      return Promise.map(data, upsertData)
    }
    data = (await validate(this._attachRecordInfo(data, true))) as T
    return upsertData(data)
  }

  async updateById<T extends Identifiable = any>(table: string, data: MaybeArray<T>, fields: string[] = []) {
    const { schema } = this._getCommonParams(table, fields)
    const validate = async (e: T) => validateSchema({ data: e, schema, action: 'updateById' })
    const update = (e: T) =>
      this.db
        .collection(table)
        .updateOne({ _id: new ObjectID(e.id) }, { $set: omit(objectStringToObjectID(e), 'id') })
        .then(() => e)

    if (Array.isArray(data)) {
      data = await Promise.map(data, e => validate(this._attachRecordInfo(e, true)))
      return Promise.map(data, update)
    }
    data = (await validate(this._attachRecordInfo(data, true))) as T
    return update(data)
  }

  async updateByFilter<T = any>(table: string, data: T, filter: object, fields: string[] = []) {
    return this.db.collection(table).updateMany(objectStringToObjectID(filter), { $set: objectStringToObjectID(data) })
  }

  deleteById(table: string, id: string | string[]) {
    return this.db
      .collection(table)
      .deleteMany({ _id: { $in: Array.isArray(id) ? id.map(e => new ObjectID(e)) : [new ObjectID(id)] } })
      .then(() => id)
  }

  deleteByFilter(table: string, filter: object) {
    if (Object.keys(filter).length) {
      return this.db.collection(table).deleteMany(filter)
    }
    return Promise.resolve([])
  }
}

export default QueryWrapper
