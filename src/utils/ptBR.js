export const formatarMoeda = (valor) => {
  if (valor === undefined || valor === null || isNaN(valor)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export const formatarInputPreco = (valor) => {
  if (valor === undefined || valor === null || isNaN(valor)) return ''
  return valor.toFixed(2).replace('.', ',')
}

export const parsePreco = (valor) => {
  const limpo = String(valor).replace(/[^\d,]/g, '').replace(',', '.')
  const num = parseFloat(limpo)
  return isNaN(num) || num <= 0 ? null : num
}

export const formatarData = (isoString) => {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const formatarDataRelativa = (isoString) => {
  if (!isoString) return '—'
  const agora = new Date()
  const data = new Date(isoString)
  const diffMs = agora - data
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)
  if (diffMin < 1) return 'agora mesmo'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHrs < 24) return `há ${diffHrs}h`
  if (diffDias === 1) return 'ontem'
  if (diffDias < 7) return `há ${diffDias} dias`
  return formatarData(isoString)
}
