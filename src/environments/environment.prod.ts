export const environment = {
  production: true,
  maptilerApiKey: process.env['MAPTILER_API_KEY']?.replace(/[{}]/g, '') || '',
  apiUrl: process.env['API_URL'] || 'http://localhost:9000',
}
