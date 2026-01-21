import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, from, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { Inject } from "@nestjs/common";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import * as schema from "@factory/db/schema";
import { idempotencyKeys } from "@factory/db/schema";
import { DRIZZLE } from "../db/drizzle.module";

type Db = NodePgDatabase<typeof schema>;

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const keyRaw =
      req?.headers?.["idempotency-key"] ?? req?.headers?.["Idempotency-Key"];
    const key = typeof keyRaw === "string" ? keyRaw.trim() : undefined;

    // Optional mode: if missing, proceed normally
    if (!key) {
      return next.handle();
    }

    return from(this.lookup(key)).pipe(
      mergeMap((hit) => {
        if (hit?.responseBody != null) {
          return of(hit.responseBody);
        }

        return next.handle().pipe(
          mergeMap((responseBody) =>
            from(this.store(key, responseBody)).pipe(
              mergeMap(() => of(responseBody)),
            ),
          ),
        );
      }),
    );
  }

  private async lookup(key: string) {
    const [row] = await this.db
      .select({
        responseBody: idempotencyKeys.responseBody,
      })
      .from(idempotencyKeys)
      .where(eq(idempotencyKeys.key, key))
      .limit(1);
    return row;
  }

  private async store(key: string, responseBody: unknown) {
    await this.db
      .insert(idempotencyKeys)
      .values({
        key,
        responseBody: responseBody as any,
        createdAt: new Date(),
        lastUsedAt: new Date(),
      })
      .onConflictDoNothing();
  }
}

