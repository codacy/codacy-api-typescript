import * as Models from './models'
import * as Mappers from './models/mappers'
import { CodacyAPI } from './codacyAPI'
import { CodacyAPIContext } from './codacyAPIContext'
import {
  HttpOperationResponse,
  BaseRequestPolicy,
  RequestPolicy,
  RequestPolicyOptions,
  WebResource,
  RequestPolicyFactory,
} from '@azure/ms-rest-js'

export type ErrorType =
  | 'ApiError'
  | 'BadRequest'
  | 'Unauthorized'
  | 'Forbidden'
  | 'NotFound'
  | 'Conflict'
  | 'InternalServerError'

export type ApiErrorUnion =
  | Models.BadRequest
  | Models.Forbidden
  | Models.Unauthorized
  | Models.PaymentRequired
  | Models.NotFound
  | Models.Conflict
  | Models.InternalServerError

export class BaseApiError extends Error {
  errorType: string
  innerResponse?: HttpOperationResponse
  innerException?: Error
  actions: Models.ProblemLink[]

  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error.message)
    Object.setPrototypeOf(this, BaseApiError.prototype)
    this.errorType = error.error
    this.actions = error.actions

    this.innerResponse = response
    this.innerException = exception
  }
}

export class UnexpectedApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'UnexpectedApiError'
    Object.setPrototypeOf(this, UnexpectedApiError.prototype)
  }
}

export class MalformedApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'MalformedApiError'
    Object.setPrototypeOf(this, MalformedApiError.prototype)
  }
}

export class ApiRequestFailed extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'ApiRequestFailed'
    Object.setPrototypeOf(this, ApiRequestFailed.prototype)
  }
}

export class AbortedRequest extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'AbortedRequest'
    Object.setPrototypeOf(this, AbortedRequest.prototype)
  }
}

export class BadRequestApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'BadRequestApiError'
    Object.setPrototypeOf(this, BadRequestApiError.prototype)
  }
}

export class UnauthorizedApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'UnauthorizedApiError'
    Object.setPrototypeOf(this, UnauthorizedApiError.prototype)
  }
}

export class PaymentRequiredApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'PaymentRequiredApiError'
    Object.setPrototypeOf(this, PaymentRequiredApiError.prototype)
  }
}

export class ForbiddenApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'ForbiddenApiError'
    Object.setPrototypeOf(this, ForbiddenApiError.prototype)
  }
}

export class NotFoundApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'NotFoundApiError'
    Object.setPrototypeOf(this, NotFoundApiError.prototype)
  }
}

export class ConflictApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'ConflictApiError'
    Object.setPrototypeOf(this, ConflictApiError.prototype)
  }
}

export class InternalServerApiError extends BaseApiError {
  constructor(error: ApiErrorUnion, response?: HttpOperationResponse, exception?: Error) {
    super(error, response, exception)
    this.name = 'InternalServerApiError'
    Object.setPrototypeOf(this, InternalServerApiError.prototype)
  }
}

class ApiErrorHandlerPolicy extends BaseRequestPolicy {
  public constructor(readonly _nextPolicy: RequestPolicy, readonly _options: RequestPolicyOptions) {
    super(_nextPolicy, _options)
  }

  public async sendRequest(webResource: WebResource): Promise<HttpOperationResponse> {
    let result
    let body
    try {
      result = await this._nextPolicy.sendRequest(webResource)
      body = result.parsedBody
    } catch (err) {
      if (err.code === 'REQUEST_ABORTED_ERROR') {
        // request was aborted
        throw new AbortedRequest(
          {
            message: 'Request was aborted.',
            error: 'AbortedRequest',
            actions: [],
          },
          undefined,
          err
        )
      } else {
        // totally unexpected error, assume the API is not configured or broken
        throw new ApiRequestFailed(
          {
            message: 'Codacy API was not found, is not available, or responded with an unexpected behaviour.',
            error: 'ApiError',
            actions: [],
          },
          undefined,
          err
        )
      }
    }

    if (body !== undefined && 'error' in body && 'message' in body) {
      // the API responded with an expected error response
      const exception = body as ApiErrorUnion

      switch (exception.error) {
        case 'BadRequest':
          throw new BadRequestApiError(exception, result)
        case 'Unauthorized':
          throw new UnauthorizedApiError(exception, result)
        case 'PaymentRequired':
          throw new PaymentRequiredApiError(exception, result)
        case 'Forbidden':
          throw new ForbiddenApiError(exception, result)
        case 'NotFound':
          throw new NotFoundApiError(exception, result)
        case 'Conflict':
          throw new ConflictApiError(exception, result)
        case 'InternalServerError':
          throw new InternalServerApiError(exception, result)
        default:
          throw new UnexpectedApiError(exception, result)
      }
    } else if (result.status < 200 || result.status >= 300) {
      // the API responded with an error status code, but not formed as an error - THIS SHOULD NEVER HAPPEN
      throw new MalformedApiError(
        {
          message: `The API responded with an error code ${result.status}. The result was not properly formed by the API.`,
          error: 'ApiError',
          actions: [],
        },
        result
      )
    }

    return result
  }
}

const apiErrorHandlerPolicyFactory: RequestPolicyFactory = {
  create: (nextPolicy: RequestPolicy, options: RequestPolicyOptions) => new ApiErrorHandlerPolicy(nextPolicy, options),
}

class Client extends CodacyAPI {
  /**
   * Initializes a new instance of the WebsiteAPI class.
   * @param [options] The parameter options
   */
  constructor(options?: Omit<Models.CodacyAPIOptions, 'requestPolicyFactories'>) {
    super({
      ...options,
      requestPolicyFactories: (defaultRequestPolicyFactories) => {
        return [apiErrorHandlerPolicyFactory, ...defaultRequestPolicyFactories]
      },
    })
  }
}

export { Client, CodacyAPI, CodacyAPIContext, Models as WebsiteAPIModels, Mappers as WebsiteAPIMappers }
