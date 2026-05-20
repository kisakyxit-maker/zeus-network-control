import React, { useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import io from 'socket.io-client';

// Substitua pelo endereço do seu Replit (ex: https://nome-do-projeto.replit.app)
const socket = io("SUA_URL_DO_REPLIT_AQUI");

export default function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Conectado ao servidor!');
    });
  }, []);

  const enviarTeste = () => {
    socket.emit('test', 'Oi, Replit!');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Teste de Conexão</Text>
      <Button title="Enviar Oi" onPress={enviarTeste} />
    </View>
  );
}
