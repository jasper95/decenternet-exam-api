import { database, schema } from 'config'
import { InitializerContext } from 'types'
import serviceLocator from 'utils/serviceLocator'
import { MongoClient } from 'mongodb'
import { createProxy, getMongoDBConnectionString } from 'utils/tools'
import QueryWrapper from 'utils/dbwrapper'

export default async function initializeDB(self: InitializerContext) {
  const client = await MongoClient.connect(getMongoDBConnectionString(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  const DB = createProxy(new QueryWrapper(schema, client))
  serviceLocator.registerService('DB', DB)
  serviceLocator.registerService('db_client', client)
  const { database: db_name, host } = database.connection
  self.logger.info('Connected to Database [Connection: %s, Name: %s]', host, db_name)
}
