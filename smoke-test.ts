const API_URL = 'http://localhost:3000/api';

async function runSmokeTest() {
  const RED = '\x1b[31m';
  const GREEN = '\x1b[32m';
  const RESET = '\x1b[0m';

  console.log('🚀 Starting Factory Nervous System Smoke Test...\n');

  const post = async (path: string, body: any, headers: any = {}) => {
    try {
      const url = `${API_URL}${path}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    } catch (e) {
      return { status: 0, data: e };
    }
  };

  const get = async (path: string) => {
    try {
      const url = `${API_URL}${path}`;
      console.log(`[DEBUG] Fetching: ${url}`);
      const res = await fetch(url);
      console.log(`[DEBUG] Response status: ${res.status}`);
      const data = await res.json().catch(() => ({}));
      console.log(`[DEBUG] Response data:`, data);
      return { status: res.status, data };
    } catch (e) {
      console.log(`[DEBUG] Fetch error:`, e);
      return { status: 0, data: e };
    }
  };

  try {
    // 1. POBRANIE DANYCH (METADATA)
    console.log('📡 Fetching metadata...');
    const locRes = await get('/locations');
    const itemsRes = await get('/items');

    console.log('Locations response:', JSON.stringify(locRes, null, 2));
    console.log('Items response:', JSON.stringify(itemsRes, null, 2));

    if (!locRes.data || locRes.data.length < 2) {
      console.error(`${RED}❌ Need at least 2 locations! Run seed first.${RESET}`);
      return;
    }
    if (!itemsRes.data || itemsRes.data.length < 1) {
      console.error(`${RED}❌ Need at least 1 item! Run seed first.${RESET}`);
      return;
    }

    const fromLoc = locRes.data[0].id;
    const toLoc = locRes.data[1].id;
    const itemId = itemsRes.data[0].id;

    console.log(`   Source: ${locRes.data[0].name}`);
    console.log(`   Target: ${locRes.data[1].name}`);
    console.log(`   Item:   ${itemsRes.data[0].sku}`);

    // 2. INBOUND (Dodanie towaru na stan)
    console.log(`\n📦 Step 1: Receiving Inventory (100 qty)...`);
    const inboundRes = await post('/inventory/inbound', {
      locationId: fromLoc,
      itemId: itemId,
      quantity: 100,
      operatorId: 'test-admin'
    });

    if (inboundRes.status === 201 || inboundRes.status === 200) {
      console.log(`${GREEN}✅ Inbound Success${RESET}`);
    } else {
      console.log(`${RED}❌ Inbound Failed (${inboundRes.status})${RESET}`, inboundRes.data);
    }

    // 3. TRANSFER & IDEMPOTENCY (Przesunięcie + Test dublowania)
    const idempotencyKey = `key-${Date.now()}`;
    console.log(`\n🚚 Step 2: Transferring 50 units (Key: ${idempotencyKey})...`);

    const transferPayload = {
      fromLocationId: fromLoc,
      toLocationId: toLoc,
      itemId: itemId,
      quantity: 50,
      operatorId: 'test-admin'
    };

    // Próba 1
    const transfer1 = await post('/inventory/transfer', transferPayload, {
      'Idempotency-Key': idempotencyKey
    });

    if (transfer1.status === 201 || transfer1.status === 200) {
      console.log(`${GREEN}✅ Transfer 1 Success${RESET}`);
    } else {
      console.log(`${RED}❌ Transfer 1 Failed:${RESET}`, transfer1.data);
      return;
    }

    // Próba 2 (To samo zapytanie - powinno zwrócić ten sam wynik bez błędu)
    console.log(`\n🔄 Step 3: Repeating Transfer (Idempotency Check)...`);
    const transfer2 = await post('/inventory/transfer', transferPayload, {
      'Idempotency-Key': idempotencyKey
    });

    if (JSON.stringify(transfer1.data) === JSON.stringify(transfer2.data)) {
      console.log(`${GREEN}✅ IDEMPOTENCY PASSED!${RESET}`);
      console.log(`   System correctly returned cached response.`);
    } else {
      console.log(`${RED}❌ IDEMPOTENCY FAILED${RESET}`);
      console.log('   Run 1:', transfer1.data);
      console.log('   Run 2:', transfer2.data);
    }
  } catch (e) {
    console.error(`${RED}❌ CRITICAL ERROR:${RESET}`, e);
  }
}

runSmokeTest();
