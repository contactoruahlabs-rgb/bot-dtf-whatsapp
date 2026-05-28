const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ─── INTEGRACIÓN COMPLETA DE TU CALCULADORA DTF ────────────────────────────
// Datos extraídos directamente de tu HTML

const garments = [
  { id: 'g1', name: 'Polera Básica', basePrice: 3500 },
  { id: 'g2', name: 'Buzo', basePrice: 6000 },
  { id: 'g3', name: 'Gorro', basePrice: 4500 },
  { id: 'g4', name: 'Bolsa', basePrice: 3000 },
  { id: 'g5', name: 'Chaleco', basePrice: 7000 },
  { id: 'g6', name: 'Polera Premium', basePrice: 4500 },
  { id: 'g7', name: 'Short', basePrice: 4000 },
];

const dtfSizes = [
  { id: 'xs', w: 8, h: 8, cost: 600 },
  { id: 'sm', w: 10, h: 10, cost: 800 },
  { id: 'md', w: 15, h: 15, cost: 1200 },
  { id: 'lg', w: 20, h: 20, cost: 1800 },
  { id: 'xl', w: 25, h: 25, cost: 2500 },
  { id: '2xl', w: 30, h: 30, cost: 3500 },
  { id: '3xl', w: 35, h: 35, cost: 4500 },
];

// ─── FUNCIÓN: BUSCAR PRENDA ────────────────────────────────────────────────
function findGarment(name) {
  const search = name.toLowerCase().trim();
  return garments.find(g => 
    g.name.toLowerCase().includes(search) || 
    search.includes(g.name.toLowerCase().split(' ')[0])
  );
}

// ─── FUNCIÓN: BUSCAR TAMAÑO DTF ─────────────────────────────────────────────
function findDTFSize(width, height) {
  return dtfSizes.find(d => d.w === width && d.h === height);
}

// ─── FUNCIÓN: CALCULAR PRECIO COMPLETO ──────────────────────────────────────
function calculateDTFPrice(garmentName, stamps, quantity) {
  try {
    // Validar prenda
    const garment = findGarment(garmentName);
    if (!garment) {
      const availableNames = garments.map(g => g.name).join('\n  • ');
      return { 
        error: `❌ Prenda "${garmentName}" no encontrada\n\nPrendas disponibles:\n  • ${availableNames}` 
      };
    }

    // Procesar estampados
    let totalStampCost = 0;
    const stampDetails = [];
    const invalidStamps = [];

    stamps.forEach((dimension, index) => {
      const [w, h] = dimension.split('x').map(x => parseInt(x.trim()));
      
      if (isNaN(w) || isNaN(h)) {
        invalidStamps.push(dimension);
        return;
      }

      const dtf = findDTFSize(w, h);
      
      if (!dtf) {
        invalidStamps.push(`${w}×${h}cm`);
      } else {
        totalStampCost += dtf.cost;
        stampDetails.push({
          dimension: `${w}×${h}cm`,
          cost: dtf.cost
        });
      }
    });

    // Validar estampados
    if (invalidStamps.length > 0) {
      const availableSizes = dtfSizes.map(s => `${s.w}×${s.h}cm`).join(', ');
      return {
        error: `❌ Tamaños no disponibles: ${invalidStamps.join(', ')}\n\nTamaños permitidos: ${availableSizes}`
      };
    }

    // Calcular precios
    const unitPrice = garment.basePrice + totalStampCost;
    const totalPrice = unitPrice * quantity;
    const profitMargin = totalPrice * 0.15; // 15% margen de ganancia

    return {
      success: true,
      garment: garment.name,
      basePrice: garment.basePrice,
      stampDetails: stampDetails,
      totalStampCost: totalStampCost,
      unitPrice: unitPrice,
      quantity: quantity,
      totalPrice: totalPrice,
      profitMargin: profitMargin,
      finalPrice: totalPrice + profitMargin,
      costPerStamp: stampDetails.length
    };
  } catch (error) {
    return { error: `⚠️ Error en cálculo: ${error.message}` };
  }
}

// ─── FUNCIÓN: FORMATEAR RESPUESTA ──────────────────────────────────────────
function formatResponse(result) {
  if (result.error) {
    return result.error;
  }

  const {
    garment,
    basePrice,
    stampDetails,
    totalStampCost,
    unitPrice,
    quantity,
    totalPrice,
    profitMargin,
    finalPrice,
    costPerStamp
  } = result;

  let stampLine = '';
  if (stampDetails.length > 0) {
    stampLine = stampDetails
      .map(s => `  • ${s.dimension}: $${s.cost.toLocaleString('es-CL')}`)
      .join('\n');
  }

  const response = `
╔════════════════════════════════╗
║    ✨ COTIZACIÓN DTF - RUAH    ║
╚════════════════════════════════╝

📦 *Prenda:* ${garment}
   *Valor base:* $${basePrice.toLocaleString('es-CL')}

🎨 *Estampados (${costPerStamp}):*
${stampLine}
   *Subtotal estampados:* $${totalStampCost.toLocaleString('es-CL')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Valor por unidad:* $${unitPrice.toLocaleString('es-CL')}
📊 *Cantidad:* ${quantity} unidades

*COSTO PRODUCCIÓN:* $${totalPrice.toLocaleString('es-CL')}
*Margen (15%):* $${profitMargin.toLocaleString('es-CL')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *PRECIO VENTA SUGERIDO:* $${finalPrice.toLocaleString('es-CL')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 *Formato para otra cotización:*
   "Prenda, 20x30cm + 15x15cm, 10"
  `;

  return response.trim();
}

// ─── FUNCIÓN: PARSEAR MENSAJE ─────────────────────────────────────────────
function parseUserMessage(text) {
  // Formatos aceptados:
  // "Polera, 20x30cm + 15x15cm, 10"
  // "Polera, 20x30 + 15x15, 10"
  // "Polera 20x30 15x15 10"

  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Intentar separar por comas primero
  let parts = cleanText.split(',').map(s => s.trim());
  
  if (parts.length < 3) {
    // Intentar otro formato
    parts = cleanText.split(/[;|]/).map(s => s.trim());
  }

  if (parts.length < 2) {
    return {
      error: `❌ Formato inválido\n\nUsa: *Prenda, 20x30cm + 15x15cm, 10*\n\nEjemplos:\n  • Polera, 20x30cm + 15x15cm, 10\n  • Buzo, 25x25cm, 5\n  • Gorro, 10x10 + 15x15 + 20x20, 20`
    };
  }

  const garmentName = parts[0].trim();
  
  // Extraer dimensiones
  const stampText = parts.slice(1, -1).join(',');
  const stampRegex = /(\d+)\s*x\s*(\d+)/gi;
  const stamps = [];
  let match;

  while ((match = stampRegex.exec(stampText)) !== null) {
    stamps.push(`${match[1]}x${match[2]}`);
  }

  // Extraer cantidad
  const qtyText = parts[parts.length - 1];
  const qtyMatch = qtyText.match(/(\d+)/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

  if (!garmentName || stamps.length === 0 || quantity < 1) {
    return {
      error: `❌ Datos incompletos\n\nAsegúrate de incluir:\n  • Nombre de prenda\n  • Al menos 1 estampado (ej: 20x30)\n  • Cantidad (número)`
    };
  }

  return {
    garmentName,
    stamps,
    quantity
  };
}

// ─── INICIALIZAR BOT ──────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--single-process'
    ]
  }
});

let isReady = false;

client.on('qr', (qr) => {
  console.clear();
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  🤖 BOT DTF - RUAH LABS                   ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log('📱 Escanea este código QR en WhatsApp:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n✓ Abre WhatsApp en tu celular');
  console.log('✓ Ve a Ajustes → Dispositivos vinculados');
  console.log('✓ Escanea el código QR arriba\n');
});

client.on('ready', () => {
  isReady = true;
  console.clear();
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║  ✅ BOT DTF CONECTADO - ESPERANDO MSG     ║');
  console.log('╚════════════════════════════════════════════╝\n');
});

client.on('message', async (message) => {
  if (!isReady) return;

  const userText = message.body.trim();
  
  // Ignorar mensajes vacíos o muy cortos
  if (userText.length < 3) return;

  console.log(`\n📨 Mensaje recibido de ${message.from}:`);
  console.log(`   "${userText}"`);

  try {
    // Parsear mensaje
    const parsed = parseUserMessage(userText);

    if (parsed.error) {
      await message.reply(parsed.error);
      console.log('   ❌ Formato inválido');
      return;
    }

    // Calcular precio
    const result = calculateDTFPrice(
      parsed.garmentName,
      parsed.stamps,
      parsed.quantity
    );

    const response = formatResponse(result);

    // Enviar respuesta
    await message.reply(response);
    console.log('   ✅ Cotización enviada');

    // Guardar en log
    if (result.success) {
      console.log(`   → ${result.garment}: $${result.finalPrice.toLocaleString('es-CL')}`);
    }
  } catch (error) {
    console.error('   ⚠️ Error:', error.message);
    await message.reply(`⚠️ Error inesperado: ${error.message}`);
  }
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.log('\n⚠️ Bot desconectado:', reason);
  process.exit(0);
});

client.on('error', (error) => {
  console.error('⚠️ Error del cliente:', error);
});

// Inicializar
client.initialize();

console.log('\n⏳ Inicializando bot DTF...\n');
