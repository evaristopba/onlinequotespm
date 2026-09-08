import { db, auth } from './firebase.js'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'

function extrairQuantidadeUnidade(texto) {
  if (!texto) return { quantidade: 1, unidade: 'un' }
  const str = String(texto).trim()
  const regex = /^([\d,.]+)\s*([a-zA-Z]{1,3})$/
  const match = str.match(regex)
  let numeroStr = str
  let unidade = 'un'
  if (match) {
    numeroStr = match[1]
    unidade = match[2].toLowerCase()
  }
  let numeroLimpo = numeroStr.replace(/[^\d,.]/g, '')
  if (numeroLimpo.includes(',')) {
    const partes = numeroLimpo.split(',')
    const parteInteira = partes[0].replace(/\./g, '')
    const parteDecimal = partes[1] || ''
    numeroLimpo = `${parteInteira}.${parteDecimal}`
  } else if (numeroLimpo.includes('.')) {
    const partes = numeroLimpo.split('.')
    if (partes.length === 2 && partes[1].length === 3) {
      numeroLimpo = partes.join('')
    }
  }
  const valor = parseFloat(numeroLimpo)
  return { quantidade: isNaN(valor) ? 1 : valor, unidade: unidade || 'un' }
}

export async function migrarProdutos() {
  if (!db || !auth?.currentUser) {
    console.error('⚠️ Firebase não inicializado ou usuário não autenticado.')
    return { erro: 'Não autenticado' }
  }
  console.log('🚀 Iniciando migração...')
  try {
    const snapshot = await getDocs(collection(db, 'produtos'))
    let atualizados = 0, ignorados = 0
    for (const docSnap of snapshot.docs) {
      const dados = docSnap.data()
      const id = docSnap.id
      const jaMigrado = typeof dados.quantidade === 'number' && dados.unidade
      if (jaMigrado && dados.unidade) { ignorados++; continue }
      const texto = dados.quantidade || ''
      const { quantidade, unidade } = extrairQuantidadeUnidade(texto)
      await updateDoc(doc(db, 'produtos', id), { quantidade, unidade: unidade || 'un' })
      atualizados++
      console.log(`✅ "${dados.nome}" → ${quantidade} ${unidade}`)
    }
    console.log(`🎉 ${atualizados} atualizados, ${ignorados} já ok.`)
    return { atualizados, ignorados }
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}

export async function previewMigracao() {
  if (!db) return { erro: 'Firebase não inicializado' }
  try {
    const snapshot = await getDocs(collection(db, 'produtos'))
    const lista = []
    for (const docSnap of snapshot.docs) {
      const dados = docSnap.data()
      const texto = dados.quantidade || ''
      const jaMigrado = typeof dados.quantidade === 'number' && dados.unidade
      if (jaMigrado && dados.unidade) continue
      const { quantidade, unidade } = extrairQuantidadeUnidade(texto)
      lista.push({ nome: dados.nome || 'Sem nome', antes: texto || '—', depois: `${quantidade} ${unidade}` })
    }
    return { pendentes: lista.length, lista }
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  }
}