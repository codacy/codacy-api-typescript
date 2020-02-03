import * as Models from './models'
import * as Mappers from './models/mappers'
import { WebsiteAPI } from './websiteAPI'
import { WebsiteAPIContext } from './websiteAPIContext'

class Client extends WebsiteAPI {
  /**
   * Initializes a new instance of the WebsiteAPI class.
   * @param [options] The parameter options
   */
  constructor(options?: Models.WebsiteAPIOptions) {
    super(options)
  }
}

export { Client, WebsiteAPI, WebsiteAPIContext, Models as WebsiteAPIModels, Mappers as WebsiteAPIMappers }
