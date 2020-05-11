import * as Models from './models'
import * as Mappers from './models/mappers'
import { WebsiteAPI } from './websiteAPI'
import { WebsiteAPIContext } from './websiteAPIContext'
import {
  HttpOperationResponse,
  BaseRequestPolicy,
  RequestPolicy,
  RequestPolicyOptions,
  WebResource,
  RequestPolicyFactory,
} from '@azure/ms-rest-js'

export type ErrorType = 'ApiError' | 'BadRequest' | 'Unauthorized' | 'Forbidden' | 'NotFound' | 'InternalServerError'
export class BaseApiError extends Error {
  errorType: ErrorType
  innerResponse?: HttpOperationResponse

  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error.message)
    Object.setPrototypeOf(this, BaseApiError.prototype)
    this.errorType = error.error
    this.innerResponse = response
  }
}

export class UnexpectedApiError extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'UnexpectedApiError'
    Object.setPrototypeOf(this, UnexpectedApiError.prototype)
  }
}

export class ApiNotAvailable extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'ApiNotAvailable'
    Object.setPrototypeOf(this, ApiNotAvailable.prototype)
  }
}

export class BadRequestApiError extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'BadRequestApiError'
    Object.setPrototypeOf(this, BadRequestApiError.prototype)
  }
}

export class UnauthorizedApiError extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'UnauthorizedApiError'
    Object.setPrototypeOf(this, UnauthorizedApiError.prototype)
  }
}

export class ForbiddenApiError extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'ForbiddenApiError'
    Object.setPrototypeOf(this, ForbiddenApiError.prototype)
  }
}

export class NotFoundApiError extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'NotFoundApiError'
    Object.setPrototypeOf(this, NotFoundApiError.prototype)
  }
}

export class InternalServerApiError extends BaseApiError {
  constructor(error: Models.ApiErrorUnion, response?: HttpOperationResponse) {
    super(error, response)
    this.name = 'InternalServerApiError'
    Object.setPrototypeOf(this, InternalServerApiError.prototype)
  }
}

class ApiErrorHandlerPolicy extends BaseRequestPolicy {
  public constructor(readonly _nextPolicy: RequestPolicy, readonly _options: RequestPolicyOptions) {
    super(_nextPolicy, _options)
  }

  public async sendRequest(webResource: WebResource): Promise<HttpOperationResponse> {
    try {
      const result = await this._nextPolicy.sendRequest(webResource)
      const body = result.parsedBody

      if (body !== undefined && 'error' in body && 'message' in body) {
        // the API responded with an expected error response
        const exception = body as Models.ApiErrorUnion

        switch (exception.error) {
          case 'BadRequest':
            throw new BadRequestApiError(exception, result)
          case 'Unauthorized':
            throw new UnauthorizedApiError(exception, result)
          case 'Forbidden':
            throw new ForbiddenApiError(exception, result)
          case 'NotFound':
            throw new NotFoundApiError(exception, result)
          case 'InternalServerError':
            throw new InternalServerApiError(exception, result)
          default:
            throw new UnexpectedApiError(exception, result)
        }
      } else if (result.status < 200 || result.status >= 300) {
        // the API responded with an error status code, but not formed as an error - THIS SHOULD NEVER HAPPEN
        throw new UnexpectedApiError(
          { message: `Unexpected error with code ${result.status}.`, error: 'ApiError' },
          result
        )
      }

      return result
    } catch (err) {
      // totally unexpected error, assume the API is not configured or broken
      throw new ApiNotAvailable({
        message: 'Codacy API was not found, is not available, or responded with an unexpected behaviour.',
        error: 'ApiError',
      })
    }
  }
}

const apiErrorHandlerPolicyFactory: RequestPolicyFactory = {
  create: (nextPolicy: RequestPolicy, options: RequestPolicyOptions) => new ApiErrorHandlerPolicy(nextPolicy, options),
}

class Client extends WebsiteAPI {
  /**
   * Initializes a new instance of the WebsiteAPI class.
   * @param [options] The parameter options
   */
  constructor(options?: Omit<Models.WebsiteAPIOptions, 'requestPolicyFactories'>) {
    super({
      ...options,
      requestPolicyFactories: (defaultRequestPolicyFactories) => {
        return [apiErrorHandlerPolicyFactory, ...defaultRequestPolicyFactories]
      },
    })
  }
}

export { Client, WebsiteAPI, WebsiteAPIContext, Models as WebsiteAPIModels, Mappers as WebsiteAPIMappers }
