import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const configFaltando = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k)
if (configFaltando.length > 0) {
  console.error(
    `Configuração do Firebase incompleta. Variáveis ausentes: ${configFaltando.join(', ')}. ` +
    'Crie um arquivo .env na raiz do projeto (veja .env.example).'
  )
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export const loginAnonimo = () => signInAnonymously(auth)

export const gerarCodigo = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let cod = ''
  for (let i = 0; i < 6; i++) cod += chars.charAt(Math.floor(Math.random() * chars.length))
  return cod
}

export const criarSala = async (nomeSala, produtos, criadorNome, criadorMercado) => {
  const user = auth.currentUser
  if (!user) throw new Error('Usuário não autenticado')

  let codigo, salaRef, snap
  let tentativas = 0
  do {
    codigo = gerarCodigo()
    salaRef = doc(db, 'salas', codigo)
    snap = await getDoc(salaRef)
    tentativas++
  } while (snap.exists() && tentativas < 5)

  if (snap.exists()) {
    throw new Error('Não foi possível gerar um código de sala único. Tente novamente.')
  }

  const participantes = {}
  participantes[user.uid] = {
    nome: criadorNome,
    mercado: criadorMercado,
    uid: user.uid,
    entrouEm: new Date().toISOString(),
  }

  await setDoc(salaRef, {
    nome: nomeSala || 'Cotação',
    criadoEm: new Date().toISOString(),
    ativa: true,
    produtos: produtos.map((p, i) => ({ id: `p${i}`, nome: p.nome, quantidade: p.quantidade || '1 un', codigo: p.codigo || null })),
    participantes,
    precos: {},
  })

  return codigo
}

export const entrarSala = async (codigo, nome, mercado) => {
  const user = auth.currentUser
  const salaRef = doc(db, 'salas', codigo)
  const snap = await getDoc(salaRef)

  if (!snap.exists()) throw new Error('Sala não encontrada. Verifique o código.')

  await updateDoc(salaRef, {
    [`participantes.${user.uid}`]: {
      nome,
      mercado,
      uid: user.uid,
      entrouEm: new Date().toISOString(),
    }
  })

  return snap.data()
}

export const escutarSala = (codigo, callback) => {
  const salaRef = doc(db, 'salas', codigo)
  return onSnapshot(salaRef, (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}

export const lancarPreco = async (codigo, produtoId, mercado, preco) => {
  const salaRef = doc(db, 'salas', codigo)
  await updateDoc(salaRef, {
    [`precos.${produtoId}.${mercado}`]: parseFloat(preco),
  })
}

export const adicionarProduto = async (codigo, nome, quantidade, codigoBarras = null) => {
  const salaRef = doc(db, 'salas', codigo)
  const id = `p${Date.now()}`
  await updateDoc(salaRef, {
    produtos: arrayUnion({ id, nome, quantidade: quantidade || '1 un', codigo: codigoBarras })
  })
  return id
}
