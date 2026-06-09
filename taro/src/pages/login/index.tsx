import { useState } from 'react'
import { View, Text, Button, Input, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { wxLogin, updateProfile } from '../../utils/auth'
import { Loader2, Layers } from '../../components/icons'
import './index.scss'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  const handleWxLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await wxLogin()
      setLoggedIn(true)
      if (result.user.nickname) {
        setNickname(result.user.nickname)
      }
      if (result.user.avatarUrl) {
        setAvatarUrl(result.user.avatarUrl)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const handleChooseAvatar = (e: any) => {
    const url = e.detail.avatarUrl
    setAvatarUrl(url)
  }

  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      Taro.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    try {
      await updateProfile(nickname.trim(), avatarUrl)
      Taro.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        Taro.navigateBack()
      }, 500)
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }

  const handleSkip = () => {
    Taro.navigateBack()
  }

  return (
    <View className='login-page'>
      <View className='login-logo'>
        <Layers size={56} color='#ffffff' />
      </View>
      <Text className='login-title'>习题练习</Text>
      <Text className='login-desc'>登录后可同步题库数据</Text>

      {!loggedIn ? (
        <View className='login-actions'>
          <Button className='wx-login-btn' onClick={handleWxLogin} disabled={loading}>
            {loading ? <Loader2 size={20} className='spin' /> : '微信一键登录'}
          </Button>
          {error && <Text className='login-error'>{error}</Text>}
          <View className='skip-btn' onClick={handleSkip}>
            <Text>暂不登录</Text>
          </View>
        </View>
      ) : (
        <View className='profile-form'>
          <View className='avatar-section'>
            {avatarUrl ? (
              <Image className='avatar-preview' src={avatarUrl} />
            ) : (
              <View className='avatar-placeholder'>头像</View>
            )}
            <Button
              className='avatar-btn'
              openType='chooseAvatar'
              onChooseAvatar={handleChooseAvatar}
            >
              选择头像
            </Button>
          </View>
          <View className='nickname-section'>
            <Text className='form-label'>昵称</Text>
            <Input
              className='nickname-input'
              type='nickname'
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              placeholder='请输入昵称'
            />
          </View>
          <Button className='save-btn' onClick={handleSaveProfile}>
            保存并继续
          </Button>
          <View className='skip-btn' onClick={handleSkip}>
            <Text>跳过，稍后设置</Text>
          </View>
        </View>
      )}
    </View>
  )
}
