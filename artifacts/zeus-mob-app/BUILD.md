# ZEUS MOB — Build do APK com espelhamento real

O espelhamento completo da tela do Android (home, qualquer app, qualquer coisa) usa o módulo nativo `modules/screen-capture` (MediaProjection API). Esse módulo **não funciona no Expo Go nem em build managed** — precisa de um **development/preview build**.

## Opção A — EAS Build (recomendado, builda na nuvem)

Pré-requisitos:
- Conta gratuita em https://expo.dev/
- Node 20+ instalado localmente
- `npm install -g eas-cli`

Passos (rodar **no seu computador**, não no Replit):

```bash
git clone <este-repo>
cd artifacts/zeus-mob-app
pnpm install
eas login
eas build:configure
# Edite eas.json e troque EXPO_PUBLIC_DOMAIN pelo domínio do Replit
eas build --platform android --profile preview
```

Quando terminar (~10-15 min), o EAS te dá um link pra baixar o APK. Instale no celular.

## Opção B — Build local com Android Studio

Pré-requisitos:
- Android Studio + SDK 34 + JDK 17
- Node 20+

```bash
cd artifacts/zeus-mob-app
EXPO_PUBLIC_DOMAIN=<seu-dominio-replit> npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease
# APK em android/app/build/outputs/apk/release/app-release.apk
```

## Como usar depois de instalar

1. Abra o app ZEUS MOB no celular. Ele se registra automaticamente.
2. No painel web, abra o dispositivo e clique em **[ INICIAR STREAM ]**.
3. **No celular vai aparecer um popup do Android pedindo permissão para capturar a tela** — toque em "Começar agora".
4. Volte pra home / abra qualquer app — tudo aparece em tempo real no painel.

Uma notificação "ZEUS MOB — Espelhamento ativo" fica visível enquanto a captura está ligada (exigência do Android). Quando você clica em [ PARAR ], a notificação some.

## Comportamento de fallback

Se o módulo nativo não estiver presente (APK antigo, sem prebuild), o app cai automaticamente em `view-shot` (captura só o conteúdo do app ZEUS MOB). Ou seja: o APK antigo continua funcionando, só não mostra a tela do sistema inteiro.
