import path from 'path'
import AppService from 'utils/base/AppService'
import { Request, File } from 'types'
import { Controller } from 'utils/decorators/Controller'
import { Post } from 'utils/decorators/Routes'
import { generateUUID } from 'utils/tools'

@Controller('/file', 'File')
export default class FileController extends AppService {
  @Post('/upload')
  async uploadFile({ params, files }: Request) {
    const { file } = files
    const { entity, entity_id, property } = params
    const file_path = await this.Model.file.moveUploadedFile(file as File, path.join(entity, property, generateUUID()))
    if (entity && entity_id) {
      const record = await this.DB.find<{ [key in string]: string }>(entity, entity_id)
      if (record) {
        record[property] && (await this.Model.file.removeOldFile(record[property]))
        await this.DB.updateById(entity, { id: entity_id, [`${property}_url`]: file_path })
      }
    }
    return {
      file_path,
    }
  }
}
