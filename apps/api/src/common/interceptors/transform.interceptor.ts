import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ApiResponseSuccess } from '@sfera/contracts'

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponseSuccess<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponseSuccess<T>> {
    return next.handle().pipe(
      map((result) => {
        // Controllers that already return a fully-formed envelope (e.g. a
        // `{ data, meta }` payload) are passed through with their meta/message.
        if (result && typeof result === 'object' && 'data' in result) {
          return result as ApiResponseSuccess<T>
        }

        return { success: true, data: result } as ApiResponseSuccess<T>
      })
    )
  }
}

