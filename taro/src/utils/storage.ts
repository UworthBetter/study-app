import Taro from '@tarojs/taro'
import { Chapter } from '../types'

const STORAGE_KEY_PREFIX = 'study-app-data'

function getStorageKey(openid: string): string {
  return `${STORAGE_KEY_PREFIX}-${openid}`
}

export function loadChapters(openid: string): Chapter[] | null {
  try {
    return Taro.getStorageSync(getStorageKey(openid)) || null
  } catch {
    return null
  }
}

export function saveChapters(openid: string, chapters: Chapter[]): void {
  try {
    Taro.setStorageSync(getStorageKey(openid), chapters)
  } catch (e) {
    console.error('保存数据失败', e)
  }
}

export function migrateGenericData(openid: string): boolean {
  try {
    const oldData = Taro.getStorageSync(STORAGE_KEY_PREFIX)
    if (oldData && Array.isArray(oldData) && oldData.length > 0) {
      const newKey = getStorageKey(openid)
      const existing = Taro.getStorageSync(newKey)
      if (!existing) {
        Taro.setStorageSync(newKey, oldData)
        return true
      }
    }
  } catch {
    // ignore
  }
  return false
}
