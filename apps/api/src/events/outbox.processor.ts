import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { OutboxService } from "./outbox.service";

@Injectable()
export class OutboxProcessor implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private readonly outbox: OutboxService) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      this.outbox.relayPending().catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Outbox relay error", err);
      });
    }, 5000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
