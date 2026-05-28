INSTRUCCIONES PARA CREAR EL ARCHIVO EN GITHUB DIRECTAMENTE
===========================================================

Ya que no puedes descargar, crea el archivo directamente en GitHub:

PASO 1: Ve a tu repositorio en GitHub
- github.com/tuusuario/bot-dtf-whatsapp

PASO 2: Click en "Add file" → "Create new file"

PASO 3: En el campo de nombre, escribe:
bot-dtf-light.js

PASO 4: Copia TODO el siguiente código en el editor (área grande):

---COMIENZA AQUÍ---

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// ─── DATOS DE LA CALCULADORA DTF ───────────────────────────────────────────

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

// ─── FUNCIONES DE CÁLCULO ───────────────────────────────────────────────────

function findGarment(name) {
  const search = name.toLowerCase().trim();
  return garments.find(g => 
    g.name.toLowerCase().includes(search) || 
    search.includes(g.name.toLowerCase().split(' ')[0])
  );
}

function findDTFSize(width, height) {
  return dtfSizes.find(d => d.w === width && d.h === height);
}

function calculateDTFPrice(garmentName, stamps, quantity) {
  try {
    const garment = findGarment(garmentName);
    if (!garment) {
      const availableNames = garments.map(g => g.name).join(', ');
      return { 
        error: `❌ Prenda no encontrada: "${garmentName}"\n\nDisponibles: ${availableNames}` 
      };
    }

    let totalStampCost = 0;
    const stampDetails = [];
    const invalidStamps = [];

    stamps.forEach((dimension) => {
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

    if (invalidStamps.length > 0) {
      const availableSizes = dtfSizes.map(s => `${s.w}×${s.h}cm`).join(', ');
      return {
        error: `❌ Tamaños no válidos: ${invalidStamps.join(', ')}\n\nDisponibles: ${availableSizes}`
      };
    }

    const unitPrice = garment.basePrice + totalStampCost;
    const totalPrice = unitPrice * quantity;
    const profitMargin = totalPrice * 0.15;
    const finalPrice = totalPrice + profitMargin;

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
      finalPrice: finalPrice,
      costPerStamp: stampDetails.length
    };
  } catch (error) {
    return { error: `⚠️ Error: ${error.message}` };
  }
}

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

  return `✨ *COTIZACIÓN DTF - RUAH*

📦 *${garment}*
   Base: $${basePrice.toLocaleString('es-CL')}

🎨 *Estampados (${costPerStamp}):*
${stampLine}
   Subtotal: $${totalStampCost.toLocaleString('es-CL')}

━━━━━━━━━━━━━━━━━━━━━━
💰 *Valor/unidad:* $${unitPrice.toLocaleString('es-CL')}
📊 *Cantidad:* ${quantity} unid.

*Costo producción:* $${totalPrice.toLocaleString('es-CL')}
*Margen (15%):* $${profitMargin.toLocaleString('es-CL')}
━━━━━━━━━━━━━━━━━━━━━━
✅ *PRECIO VENTA:* $${finalPrice.toLocaleString('es-CL')}
━━━━━━━━━━━━━━━━━━━━━━

💡 *Formato:* "Prenda, 20x30 + 15x15, 10"`;
}

function parseUserMessage(text) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  let parts = cleanText.split(',').map(s => s.trim());
  
  if (parts.length < 3) {
    parts = cleanText.split(/[;|]/).map(s => s.trim());
  }

  if (parts.length < 2) {
    return {
      error: `❌ Formato inválido\n\nUsa: *Prenda, 20x30cm + 15x15cm, 10*\n\nEj:\n  Polera, 20x30 + 15x15, 10\n  Buzo, 25x25, 5\n  Gorro, 10x10 + 15x15, 20`
    };
  }

  const garmentName = parts[0].trim();
  const stampText = parts.slice(1, -1).join(',');
  const stampRegex = /(\d+)\s*x\s*(\d+)/gi;
  const stamps = [];
  let match;

  while ((match = stampRegex.exec(stampText)) !== null) {
    stamps.push(`${match[1]}x${match[2]}`);
  }

  const qtyText = parts[parts.length - 1];
  const qtyMatch = qtyText.match(/(\d+)/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

  if (!garmentName || stamps.length === 0 || quantity < 1) {
    return {
      error: `❌ Datos incompletos. Necesitas:\n  • Nombre prenda\n  • Al menos 1 estampado\n  • Cantidad`
    };
  }

  return { garmentName, stamps, quantity };
}

// ─── CLIENTE WHATSAPP ──────────────────────────────────────────────────────

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--single-process',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-background-networking',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-id-driven-feature-variations',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-device-discovery-notifications',
      '--disable-extensions',
      '--disable-features=InterestFeedContentSuggestions',
      '--disable-sync'
    ]
  }
});

let isReady = false;

client.on('qr', (qr) => {
  console.clear();
  console.log('\n╔════════════════════════════════╗');
  console.log('║  🤖 BOT DTF RUAH LABS          ║');
  console.log('╚════════════════════════════════╝\n');
  console.log('📱 Escanea este código QR:\n');
  qrcode.generate(qr, { small: true });
  console.log('\n✓ WhatsApp → Ajustes');
  console.log('✓ Dispositivos vinculados');
  console.log('✓ Escanea el código\n');
});

client.on('ready', () => {
  isReady = true;
  console.clear();
  console.log('\n╔════════════════════════════════╗');
  console.log('║  ✅ BOT ACTIVO - ESPERANDO    ║');
  console.log('╚════════════════════════════════╝\n');
});

client.on('message', async (message) => {
  if (!isReady) return;

  const userText = message.body.trim();
  if (userText.length < 3) return;

  console.log(`\n📨 ${message.from}: "${userText}"`);

  try {
    const parsed = parseUserMessage(userText);

    if (parsed.error) {
      await message.reply(parsed.error);
      console.log('   ❌ Error de formato');
      return;
    }

    const result = calculateDTFPrice(
      parsed.garmentName,
      parsed.stamps,
      parsed.quantity
    );

    const response = formatResponse(result);
    await message.reply(response);
    console.log(`   ✅ Cotización enviada`);

    if (result.success) {
      console.log(`   → ${result.garment}: $${result.finalPrice.toLocaleString('es-CL')}`);
    }
  } catch (error) {
    console.error('   ⚠️ Error:', error.message);
    await message.reply(`⚠️ Error: ${error.message}`);
  }
});

client.on('disconnected', () => {
  isReady = false;
  console.log('\n⚠️ Bot desconectado');
  process.exit(0);
});

client.on('error', (error) => {
  console.error('⚠️ Error:', error);
});

client.initialize();
console.log('\n⏳ Iniciando...\n');
