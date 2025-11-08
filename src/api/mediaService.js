import client from './client'
import { fetchSeriesByCategory, fetchSeriesDetail, fetchSeriesList } from './seriesService'

export async function fetchHomepage() {
  const response = await client.get('/homepage')
  return response.data
}

export async function fetchDetail(detailId) {
  const response = await client.get(`/details/${detailId}`)
  return response.data
}

export async function fetchCategories() {
  const response = await client.get('/v1/content/categories')
  return response.data
}

export async function fetchVideosList({ page = 1, limit = 10 } = {}) {
  const response = await client.get('/v1/content/videos', {
    params: { page, limit },
  })
  return response.data
}

export async function fetchVideoDetail(videoId) {
  const response = await client.get(`/v1/content/videos/${videoId}`)
  return response.data
}

export async function fetchVideosByCategory(categoryId, { page = 1, limit = 10 } = {}) {
  if (!categoryId) {
    throw new Error('Kategori kimliği gerekli')
  }
  const response = await client.get(`/v1/content/categories/${categoryId}/videos`, {
    params: { page, limit },
  })
  return response.data
}

export { fetchSeriesList, fetchSeriesDetail, fetchSeriesByCategory }

