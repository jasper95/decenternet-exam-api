import logger from './logger'
import { ServiceLocator } from 'types'
import sendgrid from '@sendgrid/mail'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY)
const serviceLocator: ServiceLocator = {
  services: {
    // DB,
    // knex: DB.knex,
    logger,
    sendgrid,
  },
  registerService(service_name: string, service: object) {
    if (!this.services[service_name]) {
      this.services[service_name] = service
    }
  },
  get(service_name: string) {
    return this.services[service_name]
  },
}

export default serviceLocator
