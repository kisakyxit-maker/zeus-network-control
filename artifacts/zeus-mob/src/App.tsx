import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';

export default function App() {
  return (
    <LinearGradient 
      colors={['#0a0b10', '#1a1c24']} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.content}>

        {/* Card Principal ZEUS MOB */}
        <BlurView intensity={25} tint="dark" style={styles.glassCard}>
          <View style={styles.header}>
            <Text style={styles.title}>
              ZEUS <Text style={{color: '#00ff88'}}>MOB</Text>
            </Text>
            <Feather name="shield" size={24} color="#00ff88" />
          </View>

          <Text style={styles.subtitle}>Sistema de Monitoramento Ativo</Text>

          <View style={styles.divider} />

          <View style={styles.infoBox}>
            <View style={styles.statusRow}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>SERVIDOR ONLINE</Text>
            </View>
            <Text style={styles.version}>v2.0.4 - Alpha</Text>
          </View>
        </BlurView>

        {/* Botões de Ação */}
        <TouchableOpacity style={styles.neonButton} activeOpacity={0.8}>
          <Text style={styles.buttonText}>INICIAR DASHBOARD</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>CONFIGURAÇÕES</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  glassCard: {
    width: '100%',
    padding: 25,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888b94',
    marginTop: 5,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    marginVertical: 25,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff88',
    marginRight: 10,
    shadowColor: '#00ff88',
    shadowRadius: 5,
    shadowOpacity: 1,
  },
  statusText: {
    color: '#00ff88',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  version: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
  },
  neonButton: {
    width: '100%',
    height: 65,
    backgroundColor: '#00ff88',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#0a0b10',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  secondaryButton: {
    padding: 15,
  },
  secondaryButtonText: {
    color: '#888b94',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  }
});

