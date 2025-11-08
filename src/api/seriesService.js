import axios from 'axios'

const seriesClient = axios.create({
  baseURL: 'https://api.pornwatchtv.com/api/v1',
  timeout: 10000,
})

export async function fetchSeriesList({ limit = 20, offset = 0 } = {}) {
  const response = await seriesClient.get('/series', {
    params: { limit, offset },
  })
  return response.data
}

export async function fetchSeriesDetail(id) {
  const response = await seriesClient.get(`/series/${id}`)
  return response.data
}

export async function fetchSeriesByCategory(categoryId, { limit = 20, offset = 0 } = {}) {
  if (!categoryId) {
    throw new Error('Kategori kimliği gerekli')
  }
  const response = await seriesClient.get(`/content/categories/${categoryId}/series`, {
    params: { limit, offset },
  })
  return response.data
}
