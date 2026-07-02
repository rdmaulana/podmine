import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function snakeCaseKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => snakeCaseKeys(item));
  }
  
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      newObj[camelToSnake(key)] = snakeCaseKeys(obj[key]);
    }
    return newObj;
  }
  
  return obj;
}

@Injectable()
export class SnakeCaseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => snakeCaseKeys(data)));
  }
}
