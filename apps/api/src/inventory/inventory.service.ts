import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { and, eq, sql } from "drizzle-orm";
import { DRIZZLE } from "../db/drizzle.module";
import { inventoryBalance, inventoryLedger, outboxEvents } from "@factory/db/schema";
import { InboundDto } from "./dto/inbound.dto";
import { TransferDto } from "./dto/transfer.dto";
import * as schema from "@factory/db/schema";
import { OutboxService } from "../events/outbox.service";

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DRIZZLE) private readonly db: NodePgDatabase<typeof schema>,
    private readonly outbox: OutboxService,
  ) {}

  async receive(dto: InboundDto) {
    const transactionGroupId = randomUUID();
    const operatorId = dto.operatorId ?? "system";

    await this.db.transaction(async (tx) => {
      await tx
        .insert(inventoryBalance)
        .values({
          locationId: dto.locationId,
          itemId: dto.itemId,
          quantity: dto.quantity,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [inventoryBalance.locationId, inventoryBalance.itemId],
          set: {
            quantity: sql`${inventoryBalance.quantity} + ${dto.quantity}`,
            lastUpdated: new Date(),
          },
        });

      await tx.insert(inventoryLedger).values({
        transactionGroupId,
        locationId: dto.locationId,
        itemId: dto.itemId,
        quantityChange: dto.quantity,
        referenceType: "INBOUND",
        operatorId,
        metadata: dto.metadata ?? null,
      });

      await this.outbox.enqueue(tx, "InventoryInbound", {
        transactionGroupId,
        locationId: dto.locationId,
        itemId: dto.itemId,
        quantity: dto.quantity,
        operatorId,
        metadata: dto.metadata ?? null,
      });
    });

    return { ok: true, transactionGroupId };
  }

  async transfer(dto: TransferDto) {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException("Source and target locations must differ");
    }

    const transactionGroupId = randomUUID();
    const operatorId = dto.operatorId ?? "system";

    await this.db.transaction(async (tx) => {
      const [source] = await tx
        .select({
          quantity: inventoryBalance.quantity,
        })
        .from(inventoryBalance)
        .where(
          and(
            eq(inventoryBalance.locationId, dto.fromLocationId),
            eq(inventoryBalance.itemId, dto.itemId),
          ),
        )
        .for("update");

      if (!source || source.quantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock at source. Available: ${source?.quantity ?? 0}, requested: ${dto.quantity}`,
        );
      }

      await tx
        .update(inventoryBalance)
        .set({
          quantity: source.quantity - dto.quantity,
          lastUpdated: new Date(),
        })
        .where(
          and(
            eq(inventoryBalance.locationId, dto.fromLocationId),
            eq(inventoryBalance.itemId, dto.itemId),
          ),
        );

      await tx
        .insert(inventoryBalance)
        .values({
          locationId: dto.toLocationId,
          itemId: dto.itemId,
          quantity: dto.quantity,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [inventoryBalance.locationId, inventoryBalance.itemId],
          set: {
            quantity: sql`${inventoryBalance.quantity} + ${dto.quantity}`,
            lastUpdated: new Date(),
          },
        });

      await tx.insert(inventoryLedger).values([
        {
          transactionGroupId,
          locationId: dto.fromLocationId,
          itemId: dto.itemId,
          quantityChange: -dto.quantity,
          referenceType: "TRANSFER",
          operatorId,
          metadata: dto.metadata ?? null,
        },
        {
          transactionGroupId,
          locationId: dto.toLocationId,
          itemId: dto.itemId,
          quantityChange: dto.quantity,
          referenceType: "TRANSFER",
          operatorId,
          metadata: dto.metadata ?? null,
        },
      ]);

      // Transactional Outbox (must use *tx* inside this transaction)
      await tx.insert(outboxEvents).values({
        type: "INVENTORY_TRANSFERRED",
        payload: {
          dto,
          transactionGroupId,
        },
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    return { ok: true, transactionGroupId };
  }
}
