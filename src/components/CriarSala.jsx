import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { criarSala } from '../firebase.js'
import { buscarProdutoPorCodigo } from '../utils/barcode.js'
import BarcodeScanner from './BarcodeScanner.jsx'

export default function CriarSala() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [mercado, setMercado] = useState('')
  const [nomeSala, setNomeSala] = useState('')
  const [produtos, setProdutos] = useState([])
  const [mostrarScanner, setMostrarScanner] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [buscando, setBuscando] = useState(false)

  const addManual = () => {
    const nomeProd = prompt('Nome do produto:')
    if (!nomeProd) return
    const qtd = prompt('Quantidade:', '1 unidade') || '1 unidade'
    setProdutos(prev => [...prev, { nome: nomeProd, quantidade: qtd }])
  }

  const handleScan = async (codigo) => {
    setMostrarScanner(false)
    setBuscando(true)
    const produto = await buscarProdutoPorCodigo(codigo)
    setBuscando(false)

    if (produto) {
      const qtd = prompt(`Produto encontrado: ${produto.nome}\n\nQuantidade:`, '1 unidade') || '1 unidade'
      setProdutos(prev => [...prev, { nome: produto.nome, quantidade: qtd, codigo: produto.codigo }])
    } else {
      const nomeProd = prompt(`Código ${codigo} não encontrado na base.\nDigite o nome do produto:`)
      if (nomeProd) {
        const qtd = prompt('Quantidade:', '1 unidade') || '1 unidade'
        setProdutos(prev => [...prev, { nome: nomeProd, quantidade: qtd, codigo }])
      }
    }
  }

  const removerProduto = (idx) => {
    setProdutos(prev => prev.filter((_, i) => i !== idx))
  }

  const handleCriar = async () => {
    if (!nome.trim() || !mercado.trim()) return alert('Preencha seu nome e o mercado')
    if (produtos.length === 0) return alert('Adicione pelo menos um produto')
    setCarregando(true)

    try {
      const codigo = await criarSala(nomeSala || 'Cotação', produtos, nome, mercado)
      navigate(`/sala/${codigo}`)
    } catch (err) {
      alert('Não foi possível criar a sala: ' + err.message)
      setCarregando(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <h2 style={{ marginBottom: 20 }}>➕ Criar Cotação</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <input placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
        <input placeholder="Mercado que você vai cotar (ex: Carrefour)" value={mercado} onChange={e => setMercado(e.target.value)} style={inputStyle} />
        <input placeholder="Nome da cotação (opcional)" value={nomeSala} onChange={e => setNomeSala(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>📦 Produtos ({produtos.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMostrarScanner(true)}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
              📷 Escanear
            </button>
            <button onClick={addManual}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', color: '#1e293b', fontWeight: 600, fontSize: '0.85rem' }}>
              ✏️ Manual
            </button>
          </div>
        </div>

        {buscando && <p style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>🔍 Buscando produto na base...</p>}

        {produtos.length === 0 ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem', padding: '10px 0' }}>
            Nenhum produto ainda. Escaneie o código de barras ou adicione manualmente.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {produtos.map((p, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{p.nome}</strong>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{p.quantidade} {p.codigo && `· Cód: ${p.codigo}`}</div>
                </div>
                <button onClick={() => removerProduto(idx)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '1.1rem', cursor: 'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleCriar} disabled={carregando}
        style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '1rem', opacity: carregando ? 0.6 : 1 }}>
        {carregando ? 'Criando...' : '🚀 Criar Sala'}
      </button>

      {mostrarScanner && <BarcodeScanner onScan={handleScan} onClose={() => setMostrarScanner(false)} />}
    </div>
  )
}

const inputStyle = { padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.95rem', outline: 'none', width: '100%' }
