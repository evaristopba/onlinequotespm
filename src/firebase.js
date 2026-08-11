import{initializeApp}from'firebase/app'
import{getAuth,signInAnonymously}from'firebase/auth'
import{getFirestore,doc,setDoc,getDoc,updateDoc,onSnapshot,arrayUnion,collection,query,where,getDocs,addDoc}from'firebase/firestore'

const cfg={
  apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:import.meta.env.VITE_FIREBASE_APP_ID,
}
const miss=Object.entries(cfg).filter(([,v])=>!v).map(([k])=>k)
if(miss.length>0)console.error('Firebase config incompleta:',miss.join(', '))

const app=initializeApp(cfg)
export const auth=getAuth(app)
export const db=getFirestore(app)

export const loginAnonimo=()=>signInAnonymously(auth)
export const gerarCodigo=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<6;i++)r+=c[Math.floor(Math.random()*c.length)];return r}

// ===== BASE PRÓPRIA DE PRODUTOS =====
export const buscarProdutoBasePropria=async(codigoBarras)=>{
  const qry=query(collection(db,'produtos'),where('codigoBarras','==',codigoBarras),where('ativo','==',true))
  const snap=await getDocs(qry)
  if(snap.empty)return null
  const d=snap.docs[0].data()
  return{id:snap.docs[0].id,...d}
}

export const salvarProdutoBasePropria=async(dados)=>{
  const docRef=await addDoc(collection(db,'produtos'),{
    codigoBarras:dados.codigoBarras,
    nome:dados.nome,
    marca:dados.marca||'',
    categoria:dados.categoria||'Outros',
    quantidade:dados.quantidade||'',
    unidade:dados.unidade||'',
    imagem:dados.imagem||null,
    ativo:true,
    cadastradoEm:new Date().toISOString(),
    cadastradoPor:auth.currentUser?.uid||null,
  })
  return docRef.id
}

// ===== SALAS =====
export const criarSala=async(nomeSala,produtos,criadorNome,criadorMercado)=>{
  const user=auth.currentUser;if(!user)throw new Error('Não autenticado')
  let codigo,salaRef,snap,tentativas=0
  do{codigo=gerarCodigo();salaRef=doc(db,'salas',codigo);snap=await getDoc(salaRef);tentativas++}
  while(snap.exists()&&tentativas<5)
  if(snap.exists())throw new Error('Código indisponível. Tente novamente.')
  const participantes={}
  participantes[user.uid]={nome:criadorNome,mercado:criadorMercado,uid:user.uid,entrouEm:new Date().toISOString()}
  await setDoc(salaRef,{
    nome:nomeSala||'Cotação',criadoEm:new Date().toISOString(),ativa:true,
    produtos:produtos.map((p,i)=>({id:`p${i}`,nome:p.nome,quantidade:p.quantidade||'1 un',codigo:p.codigo||null,categoria:p.categoria||'Outros'})),
    participantes,precos:{},
  })
  return codigo
}

export const entrarSala=async(codigo,nome,mercado)=>{
  const user=auth.currentUser
  const salaRef=doc(db,'salas',codigo)
  const snap=await getDoc(salaRef)
  if(!snap.exists())throw new Error('Sala não encontrada.')
  await updateDoc(salaRef,{[`participantes.${user.uid}`]:{nome,mercado,uid:user.uid,entrouEm:new Date().toISOString()}})
  return snap.data()
}

export const escutarSala=(codigo,cb)=>{
  const ref=doc(db,'salas',codigo)
  return onSnapshot(ref,(s)=>cb(s.exists()?s.data():null))
}

export const lancarPreco=async(codigo,produtoId,mercado,preco)=>{
  await updateDoc(doc(db,'salas',codigo),{[`precos.${produtoId}.${mercado}`]:parseFloat(preco)})
}

export const adicionarProduto=async(codigo,nome,quantidade,codigoBarras=null,categoria='Outros')=>{
  const id=`p${Date.now()}`
  await updateDoc(doc(db,'salas',codigo),{produtos:arrayUnion({id,nome,quantidade:quantidade||'1 un',codigo:codigoBarras,categoria})})
  return id
}
