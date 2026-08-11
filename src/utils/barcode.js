export const buscarProdutoPorCodigo = async (codigo) => {
  if (!codigo || codigo.length < 8) return null
  try {
    const resBR = await fetch(`https://br.openfoodfacts.org/api/v0/product/${codigo}.json`, {
      headers: { 'User-Agent': 'CotacaoOnline/1.0' }
    })
    const dataBR = await resBR.json()
    if (dataBR.status === 1 && dataBR.product) {
      return extrairDados(dataBR.product)
    }
    const resWorld = await fetch(`https://world.openfoodfacts.org/api/v0/product/${codigo}.json`, {
      headers: { 'User-Agent': 'CotacaoOnline/1.0' }
    })
    const dataWorld = await resWorld.json()
    if (dataWorld.status === 1 && dataWorld.product) {
      return extrairDados(dataWorld.product)
    }
    return null
  } catch (err) {
    console.error('Erro ao buscar código de barras:', err)
    return null
  }
}

function extrairDados(product) {
  const nome = product.product_name_pt || product.product_name || 'Produto sem nome'
  const marca = product.brands || ''
  const qtd = product.quantity || product.serving_size || ''
  const nomeCompleto = marca ? `${nome} (${marca})${qtd ? ' — ' + qtd : ''}` : `${nome}${qtd ? ' — ' + qtd : ''}`
  return {
    nome: nomeCompleto,
    nomeBase: nome,
    marca,
    quantidade: qtd,
    codigo: product.code,
    imagem: product.image_url || product.image_front_url || null,
  }
}
