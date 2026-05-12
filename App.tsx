import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';

export default function App() {
  useEffect(() => {
    // Substitua pela URL real do seu Replit
    const serverUrl = 'https://seu-projeto.replit.app/api/inventory/report';

    const registerDevice = async () => {
      try {
        await axios.post(serverUrl, {
          id: "Dispositivo_Android",
          model: "ZEUS_CLIENT",
          status: "online"
        });
        console.log("Conectado ao painel!");
      } catch (err) {
        console.log("Erro de conexão");
      }
    };

    registerDevice();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0b10' }}>
      <Text style={{ color: '#00ff88', fontSize: 20 }}>ZEUS MOB ATIVO</Text>
    </View>
  );
}
