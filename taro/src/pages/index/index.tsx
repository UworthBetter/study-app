import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { View } from '@tarojs/components'
import Taro, { useShareAppMessage } from '@tarojs/taro'
import { Chapter, Question, User, OfficialBank, OfficialBankDetail } from '../../types'
import { parseQuestionsFromText } from '../../utils/parser'
import { shuffleArray } from '../../utils/shuffle'
import { checkAnswer } from '../../utils/check'
import { loadChapters, saveChapters, migrateGenericData } from '../../utils/storage'
import { getStoredUser, getStoredToken, wxLogin as doWxLogin, clearAuth } from '../../utils/auth'
import { apiRequest } from '../../utils/api'
import { DEFAULT_CHAPTERS } from '../../data/questions'
import { SUBJECTS } from '../../data/questionBank'
import ChapterList from '../../components/ChapterList'
import Quiz from '../../components/Quiz'
import Browse from '../../components/Browse'
import Result from '../../components/Result'
import ImportComp from '../../components/Import'
import './index.scss'

type Mode = 'home' | 'study' | 'exam' | 'browse' | 'result' | 'review' | 'import'
const ROUTE_MODES: Mode[] = ['study', 'exam', 'browse', 'import']

export default function Index() {
  const [chapters, setChapters] = useState<Chapter[]>(DEFAULT_CHAPTERS)
  const [activeChapterId, setActiveChapterId] = useState<string>('')
  const [currentMode, setCurrentMode] = useState<Mode>('home')
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<(number | number[] | null)[]>([])
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<number>>(new Set())
  const [showQuestionGrid, setShowQuestionGrid] = useState(false)
  const [score, setScore] = useState(0)
  const [importText, setImportText] = useState('')
  const [importTitle, setImportTitle] = useState('')
  const [importError, setImportError] = useState('')
  const [ready, setReady] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // 新增：用户和官方题库状态
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [officialBanks, setOfficialBanks] = useState<OfficialBank[]>([])

  // 保存页面初始参数（从学科页跳转来时使用）
  const initialParams = useRef(Taro.getCurrentInstance()?.router?.params)

  // 获取当前用户的 openid（用于 storage key）
  const storageId = useMemo(() => user?.openid || 'guest', [user])

  const enterModeFromParams = useCallback((params?: Record<string, any>) => {
    if (!params?.mode) return false
    if (!ROUTE_MODES.includes(params.mode as Mode)) return false

    if (params.chapterId) {
      setActiveChapterId(params.chapterId)
    }
    setCurrentMode(params.mode as Mode)
    return true
  }, [])

  const navigateToMode = useCallback((mode: Mode, chapterId?: string) => {
    const chapterQuery = chapterId ? `&chapterId=${encodeURIComponent(chapterId)}` : ''
    Taro.navigateTo({ url: `/pages/index/index?mode=${mode}${chapterQuery}` })
  }, [])

  // 静默登录
  const silentLogin = useCallback(async () => {
    try {
      const result = await doWxLogin()
      setUser(result.user)
      setToken(result.token)

      // 尝试迁移旧数据
      const migrated = migrateGenericData(result.user.openid)
      if (migrated) {
        const loaded = loadChapters(result.user.openid)
        setChapters(loaded || DEFAULT_CHAPTERS)
      } else {
        const saved = loadChapters(result.user.openid)
        setChapters(saved && saved.length > 0 ? saved : DEFAULT_CHAPTERS)
      }
    } catch (e) {
      console.warn('静默登录失败，使用游客模式:', e)
      const saved = loadChapters('guest')
      setChapters(saved && saved.length > 0 ? saved : DEFAULT_CHAPTERS)
    } finally {
      setActiveChapterId(SUBJECTS[0]?.chapters[0]?.id || '')
      setReady(true)
    }
  }, [])

  useEffect(() => {
    // 1. 检查隐私协议
    const privacyAgreed = Taro.getStorageSync('privacy_agreed')
    if (!privacyAgreed) {
      setShowPrivacy(true)
      return
    }

    // 2. 尝试恢复已存储的登录态
    const storedUser = getStoredUser()
    const storedToken = getStoredToken()

    if (storedUser && storedToken) {
      setUser(storedUser)
      setToken(storedToken)

      // 迁移或加载用户数据
      const migrated = migrateGenericData(storedUser.openid)
      if (migrated) {
        const loaded = loadChapters(storedUser.openid)
        setChapters(loaded || DEFAULT_CHAPTERS)
      } else {
        const saved = loadChapters(storedUser.openid)
        setChapters(saved && saved.length > 0 ? saved : DEFAULT_CHAPTERS)
      }
      setActiveChapterId(SUBJECTS[0]?.chapters[0]?.id || '')
      setReady(true)
    } else {
      // 3. 无登录态，静默登录
      silentLogin()
    }
  }, [])

  // 自动保存章节数据（按用户隔离）
  useEffect(() => {
    if (ready) {
      saveChapters(storageId, chapters)
    }
  }, [chapters, ready, storageId])

  // ready 后处理初始 URL 参数（修复从学科页跳转时 ready 未就绪导致参数丢失）
  useEffect(() => {
    if (!ready) return
    const params = initialParams.current
    if (enterModeFromParams(params)) {
      initialParams.current = undefined
    }
  }, [ready, enterModeFromParams])

  // 加载官方题库列表
  useEffect(() => {
    if (!ready) return
    fetchOfficialBanks()
  }, [ready])

  const fetchOfficialBanks = async () => {
    try {
      const data = await apiRequest({ url: '/api/official-banks' })
      setOfficialBanks(data.banks || [])
    } catch (e) {
      console.warn('获取官方题库失败:', e)
    }
  }

  const activeChapter = useMemo(() => {
    // 优先从官方题库找（确保官方数据完整，不受 storage 中旧数据干扰）
    for (const subj of SUBJECTS) {
      const found = subj.chapters.find((c) => c.id === activeChapterId)
      if (found) return found
    }
    // 再从用户章节找（仅限用户自定义的章节）
    const userCh = chapters.find((c) => c.id === activeChapterId)
    if (userCh) return userCh
    // fallback
    return chapters[0] || SUBJECTS[0]?.chapters[0]
  }, [chapters, activeChapterId])

  // 分享功能
  useShareAppMessage(() => {
    return {
      title: activeChapter ? `${activeChapter.title} - 习题练习` : '习题练习小程序',
      path: '/pages/index/index',
    }
  })

  const originalQuestions = useMemo(
    () => (activeChapter ? activeChapter.questions : []),
    [activeChapter]
  )

  const resetQuizState = useCallback((count: number) => {
    setCurrentQuestionIndex(0)
    setUserAnswers(new Array(count).fill(null))
    setConfirmedQuestions(new Set())
    setShowQuestionGrid(false)
    setScore(0)
  }, [])

  useEffect(() => {
    if (!ready) return
    if (currentMode === 'study') {
      setActiveQuestions([...originalQuestions])
      resetQuizState(originalQuestions.length)
    } else if (currentMode === 'exam') {
      const shuffled = shuffleArray(originalQuestions)
      setActiveQuestions(shuffled)
      resetQuizState(shuffled.length)
    }
  }, [currentMode, activeChapterId, ready])

  useEffect(() => {
    const titleMap: Record<Mode, string> = {
      home: '习题练习',
      study: '练习模式',
      exam: '考试模式',
      browse: activeChapter?.title || '题目阅览',
      result: '考试结果',
      review: '错题回顾',
      import: '导入新章节',
    }
    Taro.setNavigationBarTitle({ title: titleMap[currentMode] })
  }, [currentMode, activeChapter?.title])

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQ = activeQuestions[currentQuestionIndex]
    if (currentMode === 'study' && confirmedQuestions.has(currentQuestionIndex)) return

    const currentAns = userAnswers[currentQuestionIndex]
    let newAns: number | number[] | null = null

    if (currentQ.type === 'multiple') {
      const selected = (currentAns as number[]) || []
      if (selected.includes(optionIndex)) {
        newAns = selected.filter((i) => i !== optionIndex).sort((a, b) => a - b)
      } else {
        newAns = [...selected, optionIndex].sort((a, b) => a - b)
      }
      if (newAns.length === 0) newAns = null
    } else {
      if (currentMode === 'exam' && currentAns === optionIndex) {
        newAns = null
      } else {
        newAns = optionIndex
      }
    }

    const newAnswers = [...userAnswers]
    newAnswers[currentQuestionIndex] = newAns
    setUserAnswers(newAnswers)

    if (currentMode === 'study' && currentQ.type !== 'multiple' && newAns !== null) {
      const newConfirmed = new Set(confirmedQuestions)
      newConfirmed.add(currentQuestionIndex)
      setConfirmedQuestions(newConfirmed)
    }
  }

  const handleConfirm = () => {
    if (userAnswers[currentQuestionIndex] === null) return
    const newConfirmed = new Set(confirmedQuestions)
    newConfirmed.add(currentQuestionIndex)
    setConfirmedQuestions(newConfirmed)
  }

  const finishQuiz = () => {
    let correctCount = 0
    activeQuestions.forEach((q, idx) => {
      if (checkAnswer(q, userAnswers[idx])) correctCount++
    })
    setScore(correctCount)
    setCurrentMode('result')
  }

  const handleDeleteChapter = (id: string) => {
    const newChapters = chapters.filter((c) => c.id !== id)
    setChapters(newChapters)
    if (activeChapterId === id) {
      setActiveChapterId(newChapters[0]?.id || SUBJECTS[0]?.chapters[0]?.id || '')
    }
  }

  const handlePrivacyAgree = () => {
    Taro.setStorageSync('privacy_agreed', true)
    setShowPrivacy(false)
    // 同意隐私后执行静默登录
    silentLogin()
  }

  const handlePrivacyReject = () => {
    Taro.showModal({
      title: '提示',
      content: '您需要同意隐私政策才能使用本小程序',
      showCancel: false,
    })
  }

  const handleReset = () => {
    Taro.showModal({
      title: '重置数据',
      content: '重置将丢失所有导入数据，恢复默认题库？',
      success: (res) => {
        if (res.confirm) {
          setChapters(DEFAULT_CHAPTERS)
          saveChapters(storageId, DEFAULT_CHAPTERS)
          Taro.showToast({ title: '已恢复', icon: 'success' })
        }
      },
    })
  }

  const handleStartStudy = (id: string) => {
    navigateToMode('study', id)
  }

  const handleStartExam = (id: string) => {
    navigateToMode('exam', id)
  }

  const handleStartBrowse = (id: string) => {
    navigateToMode('browse', id)
  }

  // 智能解析引擎
  const handleParse = () => {
    setImportError('')
    if (!importTitle.trim()) {
      setImportError('请输入章节名称')
      return
    }

    try {
      const newQuestions = parseQuestionsFromText(importText)

      if (newQuestions.length === 0) {
        setImportError('未识别到题目')
        return
      }

      const newChapter: Chapter = {
        id: Date.now().toString(),
        title: importTitle,
        questions: newQuestions,
        createDate: Date.now(),
      }

      const nextChapters = [...chapters, newChapter]
      setChapters(nextChapters)
      saveChapters(storageId, nextChapters)
      setImportText('')
      setImportTitle('')
      Taro.showToast({ title: `导入成功，共 ${newQuestions.length} 题`, icon: 'success' })
      if (Taro.getCurrentPages().length > 1) {
        Taro.navigateBack({ delta: 1 })
      } else {
        setCurrentMode('home')
      }
    } catch (e) {
      setImportError('解析错误: ' + e)
    }
  }

  // 收藏官方题库
  const handleFavoriteBank = async (bankId: number) => {
    if (!token) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    try {
      await apiRequest({
        url: `/api/official-banks/${bankId}/favorite`,
        method: 'POST',
        needAuth: true,
      })
      // 获取完整题库数据并添加到个人题库
      const data = await apiRequest({ url: `/api/official-banks/${bankId}` })
      const bank: OfficialBankDetail = data.bank
      const newChapter: Chapter = {
        id: `official-${bank.id}`,
        title: bank.title,
        questions: bank.questions,
        createDate: Date.now(),
      }
      setChapters((prev) => [...prev, newChapter])
      Taro.showToast({ title: '已添加到我的题库', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: e.message || '添加失败', icon: 'none' })
    }
  }

  const handleLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '退出后数据不会丢失，重新登录即可恢复',
      success: (res) => {
        if (res.confirm) {
          clearAuth()
          setUser(null)
          setToken(null)
          Taro.showToast({ title: '已退出', icon: 'success' })
        }
      },
    })
  }

  // 处理页面显示：从学科页跳转来的参数 + 用户状态恢复
  Taro.useDidShow(() => {
    if (!ready) return

    // 检查从学科页跳转来的参数
    const instance = Taro.getCurrentInstance()
    const params = instance?.router?.params
    if (enterModeFromParams(params)) {
      return // 不需要恢复用户状态
    }

    // 恢复用户状态
    const storedUser = getStoredUser()
    const storedToken = getStoredToken()
    if (storedUser && storedToken) {
      if (!user || user.openid !== storedUser.openid) {
        setUser(storedUser)
        setToken(storedToken)
      }
      const saved = loadChapters(storedUser.openid)
      setChapters(saved && saved.length > 0 ? saved : DEFAULT_CHAPTERS)
    } else if (currentMode === 'home') {
      const saved = loadChapters('guest')
      setChapters(saved && saved.length > 0 ? saved : DEFAULT_CHAPTERS)
    }
  })

  return (
    <View className='container'>
      {currentMode === 'home' && (
        <ChapterList
          chapters={chapters}
          user={user}
          onDelete={handleDeleteChapter}
          onStartStudy={handleStartStudy}
          onStartExam={handleStartExam}
          onStartBrowse={handleStartBrowse}
          onImport={() => navigateToMode('import')}
          onReset={handleReset}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      )}

      {(currentMode === 'study' || currentMode === 'exam') && (
        <Quiz
          questions={activeQuestions}
          currentIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          confirmedQuestions={confirmedQuestions}
          isStudy={currentMode === 'study'}
          showGrid={showQuestionGrid}
          onSetCurrentIndex={setCurrentQuestionIndex}
          onAnswerSelect={handleAnswerSelect}
          onConfirm={handleConfirm}
          onFinish={finishQuiz}
          onBack={() => setCurrentMode('home')}
          onShowGrid={setShowQuestionGrid}
        />
      )}

      {currentMode === 'review' && (
        <Quiz
          questions={activeQuestions}
          currentIndex={currentQuestionIndex}
          userAnswers={userAnswers}
          confirmedQuestions={confirmedQuestions}
          isStudy={true}
          isReview={true}
          showGrid={false}
          onSetCurrentIndex={setCurrentQuestionIndex}
          onAnswerSelect={() => {}}
          onConfirm={() => {}}
          onFinish={() => setCurrentMode('result')}
          onBack={() => setCurrentMode('result')}
          onShowGrid={() => {}}
        />
      )}

      {currentMode === 'browse' && (
        <Browse
          questions={originalQuestions}
          title={activeChapter?.title || ''}
        />
      )}

      {currentMode === 'result' && (
        <Result
          score={score}
          total={activeQuestions.length}
          title={activeChapter?.title || ''}
          questions={activeQuestions}
          userAnswers={userAnswers}
          onReviewQuestion={(idx) => {
            setCurrentQuestionIndex(idx)
            setCurrentMode('review')
          }}
        />
      )}

      {currentMode === 'import' && (
        <ImportComp
          title={importTitle}
          text={importText}
          error={importError}
          onTitleChange={setImportTitle}
          onTextChange={setImportText}
          onParse={handleParse}
        />
      )}

      {/* 隐私弹窗 */}
      {showPrivacy && (
        <View className='privacy-modal'>
          <View className='privacy-mask' />
          <View className='privacy-dialog'>
            <View className='privacy-title'>隐私政策</View>
            <View className='privacy-content'>
              <View>欢迎使用习题练习小程序！</View>
              <View style={{ marginTop: '16rpx' }}>
                我们非常重视您的隐私保护。为了给您提供更好的服务，我们需要收集以下信息：
              </View>
              <View style={{ marginTop: '12rpx' }}>1. 微信唯一标识（用于账号识别，不含敏感信息）</View>
              <View>2. 微信昵称和头像（可选，用于个人资料展示）</View>
              <View>3. 您导入的学习数据（仅存储在您的设备上）</View>
              <View style={{ marginTop: '16rpx' }}>
                我们承诺：您的学习数据仅存储在您的设备上，不会上传到服务器。
              </View>
              <View style={{ marginTop: '12rpx' }}>
                请阅读
                <View
                  className='privacy-link'
                  onClick={() => Taro.navigateTo({ url: '/pages/privacy/index' })}
                >
                  《隐私政策》
                </View>
                和
                <View
                  className='privacy-link'
                  onClick={() => Taro.navigateTo({ url: '/pages/agreement/index' })}
                >
                  《用户协议》
                </View>
                了解详情。
              </View>
            </View>
            <View className='privacy-buttons'>
              <View className='privacy-btn reject' onClick={handlePrivacyReject}>
                不同意
              </View>
              <View className='privacy-btn agree' onClick={handlePrivacyAgree}>
                同意并继续
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
