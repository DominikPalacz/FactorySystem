import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@factory/db/schema';
import { ConfigService } from '@nestjs/config';

// Eksportujemy stałą, żeby inne moduły mogły jej używać
export const DRIZZLE = 'DRIZZLE';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Próbujemy pobrać URL z configu lub bezpośrednio z env
        const connectionString = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        
        if (!connectionString) {
          throw new Error('❌ BŁĄD KRYTYCZNY: Nie znaleziono DATABASE_URL w pliku .env!');
        }

        const pool = new Pool({
          connectionString,
        });

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}