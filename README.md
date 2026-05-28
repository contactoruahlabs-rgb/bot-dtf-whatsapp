# 🤖 Bot DTF WhatsApp - Calculadora Automática

Bot de WhatsApp que calcula automáticamente cotizaciones de estampados DTF en tiempo real.

## 📋 Requisitos

- Cuenta GitHub (gratis)
- Cuenta Railway (gratis, con límites generosos)
- Celular con WhatsApp

## 🚀 Instalación en 5 minutos

### Paso 1: Clonar el repositorio en GitHub

```bash
# Opción A: Desde tu computadora
git clone https://github.com/TU_USUARIO/bot-dtf-whatsapp.git
cd bot-dtf-whatsapp
```

**Opción B: Crear repositorio desde cero en GitHub**
1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `bot-dtf-whatsapp`
3. Haz público o privado
4. Crea el repositorio
5. Sube los archivos:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/bot-dtf-whatsapp.git
   git push -u origin main
   ```

### Paso 2: Desplegar en Railway (GRATIS)

1. Ve a [railway.app](https://railway.app)
2. Haz login con GitHub
3. Click en **"New Project"** → **"Deploy from GitHub repo"**
4. Selecciona tu repositorio `bot-dtf-whatsapp`
5. Railway automáticamente detectará `package.json` e instalará dependencias
6. Ve a la pestaña **"Deploy"** → espera a que se complete

### Paso 3: Agregar URL en Railway

1. En Railway, ve a tu proyecto
2. Click en la aplicación
3. Ve a **"Settings"** → **"Domains"**
4. Copia la URL que aparece (ej: `bot-dtf-abc123.up.railway.app`)
5. Guarda esto para después

### Paso 4: Conectar WhatsApp

1. En Railway, ve a **"Logs"** (o la pestaña de consola)
2. Deberías ver un código QR en la terminal
3. **Abre WhatsApp en tu celular**
4. Ve a **Ajustes** → **Dispositivos vinculados** → **Vincular dispositivo**
5. Escanea el código QR que aparece en Railway
6. ¡Listo! El bot está conectado

## 📱 Cómo usar el bot

Envía mensajes con este formato:

```
Polera, 20x30cm + 15x15cm, 10 prendas
```

**Desglose:**
- `Polera` = Nombre de la prenda
- `20x30cm + 15x15cm` = Dimensiones de cada estampado
- `10 prendas` = Cantidad de unidades

**Ejemplos válidos:**
```
Buzo, 25x25cm, 5
Gorro, 10x10cm + 15x15cm + 20x20cm, 20
Bolsa, 30x30cm, 1
```

El bot responderá automáticamente con:
- Prenda seleccionada
- Costo de cada estampado
- Precio por unidad
- Total de producción

## ⚙️ Personalizar la calculadora

### Editar Prendas (Catálogo)

En `bot-dtf-whatsapp.js`, línea ~10:

```javascript
const catalog = [
  { id: 'g1', name: 'Polera', basePrice: 3000 },
  { id: 'g2', name: 'Buzo', basePrice: 5500 },
  // Agrega más prendas aquí
  { id: 'g6', name: 'Remera Premium', basePrice: 4500 },
];
```

### Editar Tamaños DTF

En `bot-dtf-whatsapp.js`, línea ~18:

```javascript
const dtfSizes = [
  { id: 'sm', w: 10, h: 10, cost: 800 },
  { id: 'md', w: 15, h: 15, cost: 1200 },
  // Agrega más tamaños aquí
  { id: 'xxl', w: 35, h: 35, cost: 4500 },
];
```

Después de editar:
1. Guarda los cambios
2. `git add .`
3. `git commit -m "Actualizar catálogo"`
4. `git push`
5. Railway automáticamente redesplegará el bot

## 🔧 Troubleshooting

### "Error: Puppeteer no puede abrir navegador"
- Railway tiene limitaciones de memoria
- Solución: Usa la rama `--no-sandbox` (ya está configurada)

### "El código QR desaparece después de 30 segundos"
- Escanea más rápido
- Si no puedes, reinicia la aplicación en Railway:
  - Ve a **Deployments** → **Restart**

### "El bot no responde"
- Verifica en **Logs** de Railway que no hay errores
- Comprueba que el formato del mensaje es correcto
- Reinicia la aplicación

## 📊 Monitoreo

Desde Railway puedes:
- Ver logs en tiempo real
- Monitorear uso de CPU/memoria
- Ver historial de despliegues

## 💰 Costos

✅ **Totalmente gratis:**
- Railway: 500 horas/mes gratis (suficiente para 24/7)
- GitHub: Repositorio gratis
- WhatsApp Web: Gratis

## 📞 Soporte

Si necesitas ayuda:
1. Verifica los logs en Railway
2. Comprueba el formato de tu mensaje
3. Reinicia la aplicación

---

**Creado con ❤️ para Ruah Labs**
