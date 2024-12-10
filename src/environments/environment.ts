export const environment = {
  production: false,
  maptilerApiKey: process.env['MAPTILER_API_KEY']?.replace(/[{}]/g, '') || '',
  apiUrl: 'http://localhost:9000',
}
