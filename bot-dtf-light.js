const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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
        error: 'Prenda no encontrada: ' + garmentName + '\n\nDisponibles: ' + availableNames
      };
    }

    let totalStampCost = 0;
    const stampDetails = [];
    const invalidStamps = [];

    stamps.forEach((dimension) => {
      const parts = dimension.split('x').map(x => parseInt(x.trim()));
      const w = parts[0];
      const h = parts[1];
      
      if (isNaN(w) || isNaN(h)) {
        invalidStamps.push(dimension);
        return;
      }

      const dtf = findDTFSize(w, h);
      if (!dtf) {
        invalidStamps.push(w + 'x' + h + 'cm');
      } else {
        totalStampCost += dtf.cost;
        stampDetails.push({
          dimension: w + 'x' + h + 'cm',
          cost: dtf.cost
        });
      }
    });

    if (invalidStamps.length > 0) {
      const availableSizes = dtfSizes.map(s => s.w + 'x' + s.h + 'cm').join(', ');
      return {
        error: 'Tamaños no validos: ' + invalidStamps.join(', ') + '\n\nDisponibles: ' + availableSizes
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
    return { error: 'Error: ' + error.message };
  }
}

function formatResponse(result) {
  if (result.error) {
    return result.error;
  }

  const garment = result.garment;
  const basePrice = result.basePrice;
  const stampDetails = result.stampDetails;
  const totalStampCost = result.totalStampCost;
  const unitPrice = result.unitPrice;
  const quantity = result.quantity;
  const totalPrice = result.totalPrice;
  const profitMargin = result.profitMargin;
  const finalPrice = result.finalPrice;
  const costPerStamp = result.costPerStamp;

  let stampLine = '';
  if (stampDetails.length > 0) {
    stampLine = stampDetails
      .map(s => '  + ' + s.dimension + ': $' + s.cost)
      .join('\n');
  }

  return '*COTIZACION DTF - RUAH*\n\n' +
    '*Prenda:* ' + garment + '\n' +
    'Base: $' + basePrice + '\n\n' +
    '*Estampados (' + costPerStamp + '):*\n' +
    stampLine + '\n' +
    'Subtotal: $' + totalStampCost + '\n\n' +
    '━━━━━━━━━━━━━━━━━━━\n' +
    '*Valor/unidad:* $' + unitPrice + '\n' +
    '*Cantidad:* ' + quantity + ' unid.\n\n' +
    'Costo produccion: $' + totalPrice + '\n' +
    'Margen (15%): $' + Math.round(profitMargin) + '\n' +
    '━━━━━━━━━━━━━━━━━━━\n' +
    '*PRECIO VENTA: $' + Math.round(finalPrice) + '*\n' +
    '━━━━━━━━━━━━━━━━━━━\n\n' +
    'Formato: "Prenda, 20x30 + 15x15, 10"';
}

function parseUserMessage(text) {
  const cleanText = text.replace(/\s+/g, ' ').trim();
  let parts = cleanText.split(',').map(s => s.trim());
  
  if (parts.length < 3) {
    parts = cleanText.split(/[;|]/).map(s => s.trim());
  }

  if (parts.length < 2) {
    return {
      error: 'Formato invalido\n\nUsa: Prenda, 20x30 + 15x15, 10\n\nEj:\n  Polera, 20x30 + 15x15, 10\n  Buzo, 25x25, 5'
    };
  }

  const garmentName = parts[0].trim();
  const stampText = parts.slice(1, -1).join(',');
  const stampRegex = /(\d+)\s*x\s*(\d+)/gi;
  const stamps = [];
  let match;

  while ((match = stampRegex.exec(stampText)) !== null) {
    stamps.push(match[1] + 'x' + match[2]);
  }

  const qtyText = parts[parts.length - 1];
  const qtyMatch = qtyText.match(/(\d+)/);
  const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;

  if (!garmentName || stamps.length === 0 || quantity < 1) {
    return {
      error: 'Datos incompletos. Necesitas:\n  - Nombre prenda\n  - Al menos 1 estampado\n  - Cantidad'
    };
  }

  return { garmentName, stamps, quantity };
}

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
      '--disable-sync'
    ]
  }
});

let isReady = false;

client.on('qr', (qr) => {
  console.clear();
  console.log('\n╔════════════════════════════════╗');
  console.log('║  BOT DTF RUAH LABS             ║');
  console.log('╚════════════════════════════════╝\n');
  console.log('Escanea este codigo QR:\n');
  qrcode.generate(qr, { small: true });
  console.log('\nWhatsApp > Ajustes > Dispositivos vinculados > Escanea\n');
});

client.on('ready', () => {
  isReady = true;
  console.clear();
  console.log('\n╔════════════════════════════════╗');
  console.log('║  BOT ACTIVO - ESPERANDO       ║');
  console.log('╚════════════════════════════════╝\n');
});

client.on('message', async (message) => {
  if (!isReady) return;

  const userText = message.body.trim();
  if (userText.length < 3) return;

  console.log('\nMensaje: ' + userText);

  try {
    const parsed = parseUserMessage(userText);

    if (parsed.error) {
      await message.reply(parsed.error);
      console.log('Error de formato');
      return;
    }

    const result = calculateDTFPrice(
      parsed.garmentName,
      parsed.stamps,
      parsed.quantity
    );

    const response = formatResponse(result);
    await message.reply(response);
    console.log('Cotizacion enviada');

    if (result.success) {
      console.log('> ' + result.garment + ': $' + Math.round(result.finalPrice));
    }
  } catch (error) {
    console.error('Error: ' + error.message);
    await message.reply('Error: ' + error.message);
  }
});

client.on('disconnected', () => {
  isReady = false;
  console.log('\nBot desconectado');
  process.exit(0);
});

client.on('error', (error) => {
  console.error('Error: ' + error.message);
});

client.initialize();
console.log('\nIniciando...\n');
