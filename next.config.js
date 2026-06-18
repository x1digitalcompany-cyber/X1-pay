/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      { source: '/admin/carrinho-abandonado', destination: '/admin/carrinhos', permanent: true },
      { source: '/admin/roleta', destination: '/admin/vendedores/roleta', permanent: true },
      { source: '/admin/acerto-logistica', destination: '/admin/relatorios/logistica', permanent: true },
      { source: '/admin/acerto-logistica/pagamentos', destination: '/admin/relatorios/logistica', permanent: true },
      { source: '/admin/vendedores/lista', destination: '/admin/vendedores', permanent: true },
      { source: '/admin/configuracoes', has: [{ type: 'query', key: 'tab', value: 'rastreamento' }], destination: '/admin/configuracoes?tab=track', permanent: true },
      { source: '/admin/configuracoes', has: [{ type: 'query', key: 'tab', value: 'webhook' }], destination: '/admin/configuracoes?tab=track', permanent: true },
    ]
  },
}

module.exports = nextConfig
