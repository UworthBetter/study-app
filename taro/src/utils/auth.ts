import Taro from '@tarojs/taro'
import { User } from '../types'

const TOKEN_KEY = 'auth-token'
const USER_KEY = 'auth-user'
const API_BASE = 'http://127.0.0.1:5000'

export function getStoredUser(): User | null {
  try {
    return Taro.getStorageSync(USER_KEY) || null
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  try {
    return Taro.getStorageSync(TOKEN_KEY) || null
  } catch {
    return null
  }
}

export function saveAuth(token: string, user: User): void {
  Taro.setStorageSync(TOKEN_KEY, token)
  Taro.setStorageSync(USER_KEY, user)
}

export function clearAuth(): void {
  Taro.removeStorageSync(TOKEN_KEY)
  Taro.removeStorageSync(USER_KEY)
}

export function isLoggedIn(): boolean {
  return !!getStoredToken()
}

export async function wxLogin(): Promise<{ user: User; token: string }> {
  const loginRes = await Taro.login()
  if (!loginRes.code) {
    throw new Error('Taro.login 失败')
  }

  const res = await Taro.request({
    url: `${API_BASE}/api/auth/wx-login`,
    method: 'POST',
    data: { code: loginRes.code },
  })

  if (res.statusCode !== 200) {
    throw new Error(res.data?.error || '登录失败')
  }

  const { token, user } = res.data
  saveAuth(token, user)
  return { user, token }
}

export async function updateProfile(nickname: string, avatarUrl: string): Promise<void> {
  const token = getStoredToken()
  if (!token) return

  await Taro.request({
    url: `${API_BASE}/api/auth/update-profile`,
    method: 'POST',
    data: { nickname, avatarUrl },
    header: { Authorization: `Bearer ${token}` },
  })

  const user = getStoredUser()
  if (user) {
    saveAuth(token, { ...user, nickname, avatarUrl })
  }
}
