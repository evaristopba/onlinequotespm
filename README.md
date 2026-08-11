# 🛒 Cotação Online

App PWA de cotação de preços entre supermercados em grupo, com scanner de código de barras.
**Stack:** React + Vite + Firebase + Vercel · **Região:** pt-BR · **Fuso:** America/Sao_Paulo

---

## 🚀 Setup

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar projeto Firebase
- Acesse [console.firebase.google.com](https://console.firebase.google.com)
- Crie um projeto novo
- **IMPORTANTE:** Ao criar o Firestore, escolha a região **`southamerica-east1` (São Paulo)**
- Ative **Authentication** → método **Anônimo**
- Ative **Firestore Database**

### 3. Pegar credenciais
Firebase Console → ⚙️ Configurações do projeto → Seus apps → `</>` Web
Copie o objeto `firebaseConfig` e crie o arquivo `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. Regras do Firestore
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /salas/{sala} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Rodar local
```bash
npm run dev
```

### 6. Deploy no Vercel
```bash
npm i -g vercel
vercel --prod
```

---

## 📷 Scanner de Código de Barras

O app usa a câmera do celular para escanear códigos de barras (EAN-13, UPC, etc.) e busca automaticamente o nome do produto na base **Open Food Facts**.

- Ao criar uma sala ou dentro da sala, clique em **"📷 Escanear"**
- Aponte a câmera para o código de barras do produto
- O nome é preenchido automaticamente — você só digita a quantidade
- Se o produto não estiver na base, você digita o nome manualmente

**Permissões:** No primeiro uso, o navegador pedirá acesso à câmera. Aceite para usar o scanner.

---

## 🎮 Como usar

1. **Criar:** uma pessoa cria a sala → escaneia/adiciona produtos → recebe código `#X7K9P2`
2. **Compartilhar:** manda o link ou código no WhatsApp
3. **Entrar:** os outros acessam com código + nome + mercado
4. **Lançar:** cada um digita os preços que encontrou
5. **Resultado:** lista otimizada aparece em tempo real para todos

---

## 🌎 Configuração Regional (pt-BR)

| Aspecto | Implementação |
|---|---|
| **Moeda** | `Intl.NumberFormat('pt-BR', {currency: 'BRL'})` |
| **Data/Hora** | `toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})` |
| **Input de preço** | Vírgula decimal: digita `22,50` → salva `22.50` |
| **HTML lang** | `pt-BR` |
| **PWA manifest** | `lang: pt-BR` |
| **Fuso** | São Paulo (BRT, UTC-3) |

---

## 📁 Estrutura

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Rotas + tratamento de erro Firebase
├── firebase.js           # SDK + funções da sala
├── index.css             # Estilos base
├── utils/
│   ├── ptBR.js           # Helpers: moeda, data, parse de preço
│   └── barcode.js        # Busca produto por código de barras (Open Food Facts)
└── components/
    ├── CriarSala.jsx     # Criação com scanner
    ├── EntrarSala.jsx
    ├── Sala.jsx          # Cotação com scanner
    ├── TabelaCotacao.jsx
    ├── ListaOtimizada.jsx
    ├── Participantes.jsx
    └── BarcodeScanner.jsx # Componente de scanner (html5-qrcode)
```
