import AppService from 'utils/base/AppService'
import { Controller } from 'utils/decorators/Controller'
import { Get } from 'utils/decorators/Routes'
import { jsonPlaceholderClient } from 'utils/tools'

@Controller('/jsonplaceholder', 'JSON-Placeholder')
export default class BaseController extends AppService {
  @Get('/todos', {})
  async getJsonPlaceholder() {
    return jsonPlaceholderClient.request({
      url: '/todos',
    })
  }
}
