import { Inject, Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import {
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import * as schema from "@factory/db/schema";
import { outboxEvents } from "@factory/db/schema";
import { DRIZZLE } from "../db/drizzle.module";

type Db = NodePgDatabase<typeof schema>;
type Tx = Parameters<Db["transaction"]>[0] extends (
  tx: infer TTx,
) => Promise<any>
  ? TTx
  : never;

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(@Inject(DRIZZLE) private readonly db: Db) {}

  async enqueue(
    tx: Tx,
    type: string,
    payload: Record<string, unknown>,
  ) {
    await tx.insert(outboxEvents).values({
      id: randomUUID(),
      type,
      payload,
      status: "PENDING",
    });
  }

  async relayPending(limit = 10) {
    const pending = await this.db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.status, "PENDING"))
      .orderBy(outboxEvents.createdAt)
      .limit(limit);

    for (const evt of pending) {
      try {
        // Placeholder emitter: in production send to message bus (Kafka/RabbitMQ/etc.)
        this.logger.log(`Outbox relay -> ${evt.type} (${evt.id})`);

        await this.db
          .update(outboxEvents)
          .set({
            status: "PROCESSED",
            updatedAt: new Date(),
          })
          .where(eq(outboxEvents.id, evt.id));
      } catch (err) {
        this.logger.error(
          `Failed to relay outbox event ${evt.id}: ${String(err)}`,
        );
        await this.db
          .update(outboxEvents)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(outboxEvents.id, evt.id));
      }
    }
  }
}
