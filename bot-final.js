const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const garments = [
  { name: 'Polera', price: 3500 },
  { name: 'Buzo', price: 6000 },
  { name: 'Gorro', price: 4500 },
  { name: 'Bolsa', price: 3000 },
  { name: 'Chaleco', price: 7000 },
  { name: 'Short', price: 4000 },
];

const sizes = [
  { w: 8, h: 8, cost: 600 },
  { w: 10, h: 10, cost: 800 },
  { w: 15, h: 15, cost: 1200 },
  { w: 20, h: 20, cost: 1800 },
  { w: 25, h: 25, cost: 2500 },
  { w: 30, h: 30, cost: 3500 },
  { w: 35, h: 35, cost: 4500 },
];

function findGarment(name) {
  return garments.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
}

function findSize(w, h) {
  return sizes.find(s => s.w == w && s.h == h);
}

function calculate(garmentName, stamps, qty) {
  const g = findGarment(garmentName);
  if (!g) return { error: 'Prenda no encontrada' };
  
  let stampCost = 0;
  const details = [];
  
  stamps.forEach(s => {
    const [w, h] = s.split('x').map(x => parseInt(x));
    const sz = findSize(w, h);
    if (sz) {
      stampCost += sz.cost;
      details.push(w + 'x' + h + ': $' + sz.cost);
    }
  });
  
  const unitPrice = g.price + stampCost;
  const total = unitPrice * qty;
  const margin = Math.round(total * 0.15);
  const final = total + margin;
  
  return {
    garment: g.name,
    details,
    stampCost,
    unitPrice,
    qty,
    total,
    margin,
    final
  };
}

function format(r) {
  if (r.error) return r.error;
  return '*COTIZACION DTF*\n\n' +
    '*' + r.garment + '*\n' +
    'Estampados:\n' +
    r.details.map(d => '• ' + d).join('\n') + '\n\n' +
    'Valor unidad: $' + r.unitPrice + '\n' +
    'Cantidad: ' + r.qty + '\n\n' +
    '*TOTAL: $' + r.final + '*';
}

function parse(text) {
  const parts = text.split(',').map(p => p.trim());
  if (parts.length < 3) return { error: 'Formato: Prenda, 20x30 + 15x15, 10' };
  
  const garment = parts[0];
  const stampText = parts.slice(1, -1).join(',');
  const stamps = [];
  const regex = /(\d+)x(\d+)/gi;
  let m;
  while ((m = regex.exec(stampText))) {
    stamps.push(m[1] + 'x' + m[2]);
  }
  
  const qty = parseInt(parts[parts.length - 1]);
  if (!garment || stamps.length === 0 || !qty) return { error: 'Datos incompletos' };
  
  return { garment, stamps, qty };
}

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--single-process']
  }
});

client.on('qr', qr => {
  console.clear();
  console.log('\n=== BOT DTF RUAH ===\n');
  qrcode.generate(qr, { small: true });
  console.log('\nEscanea en WhatsApp\n');
});

client.on('ready', () => {
  console.clear();
  console.log('\n=== BOT LISTO ===\n');
});

client.on('message', async msg => {
  const text = msg.body.trim();
  if (text.length < 3) return;
  
  console.log('Mensaje: ' + text);
  
  const p = parse(text);
  if (p.error) {
    await msg.reply(p.error);
    return;
  }
  
  const r = calculate(p.garment, p.stamps, p.qty);
  const resp = format(r);
  await msg.reply(resp);
  console.log('Respuesta enviada');
});

client.on('error', err => console.error('Error: ' + err));
client.on('disconnected', () => process.exit(0));

client.initialize();
