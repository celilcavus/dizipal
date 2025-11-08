import AxiosMockAdapter from 'axios-mock-adapter'
import {
  authLoginSuccess,
  authRegisterSuccess,
  categoriesData,
  detailMap,
  homepageData,
  videoDetailMap,
  videosListData,
} from './mockData'

const COLLECTION_DELAY = 350

export function setupMockServer(client) {
  const mock = new AxiosMockAdapter(client, { delayResponse: COLLECTION_DELAY })

  mock.onGet('/homepage').reply(200, homepageData)
  mock.onGet('/v1/content/categories').reply(200, categoriesData)
  mock.onGet('/v1/content/videos').reply(200, videosListData)
  mock.onPost('/v1/auth/register').reply(200, authRegisterSuccess)
  mock.onPost('/v1/auth/login').reply(200, authLoginSuccess)
  mock.onGet(/\/v1\/content\/videos\/([^/]+)/).reply((config) => {
    const match = config.url?.match(/\/v1\/content\/videos\/([^/]+)/)
    const videoId = match?.[1]

    if (videoId && videoDetailMap[videoId]) {
      return [200, videoDetailMap[videoId]]
    }

    return [404, { message: 'Video bulunamadı.' }]
  })

  mock.onGet(/\/details\/([^/]+)/).reply((config) => {
    const match = config.url?.match(/\/details\/([^/]+)/)
    const detailId = match?.[1]

    if (detailId && detailMap[detailId]) {
      return [200, detailMap[detailId]]
    }

    return [404, { message: 'İçerik bulunamadı.' }]
  })

  return mock
}

