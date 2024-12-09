export const environment = {
  production: true,
  maptilerApiKey: process.env['MAPTILER_API_KEY']?.replace(/[{}]/g, '') || ''
}
