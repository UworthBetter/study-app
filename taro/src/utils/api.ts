import Taro from '@tarojs/taro'
import { getStoredToken } from './auth'

const API_BASE = 'http://127.0.0.1:5000'

export async function apiRequest(options: {
  url: string
  method?: keyof Taro.request.Method
  data?: any
  needAuth?: boolean
}): Promise<any> {
  const { url, method = 'GET', data, needAuth = false } = options
  const header: Record<string, string> = {}
  if (needAuth) {
    const token = getStoredToken()
    if (!token) throw new Error('未登录')
    header['Authorization'] = `Bearer ${token}`
  }
  const res = await Taro.request({
    url: `${API_BASE}${url}`,
    method,
    data,
    header,
  })
  if (res.statusCode >= 400) {
    throw new Error(res.data?.error || '请求失败')
  }
  return res.data
}
