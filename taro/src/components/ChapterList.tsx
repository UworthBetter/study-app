import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Chapter, User, Subject } from '../types'
import { FileText, Award, Eye, Trash2, Plus, RefreshCw, User as UserIcon, Layers, ChevronRight, Monitor, GitBranch } from './icons'
import { SUBJECTS } from '../data/questionBank'
import './ChapterList.scss'

interface Props {
  chapters: Chapter[]
  user: User | null
  onDelete: (id: string) => void
  onStartStudy: (id: string) => void
  onStartExam: (id: string) => void
  onStartBrowse: (id: string) => void
  onImport: () => void
  onReset: () => void
  onLogin: () => void
  onLogout: () => void
}

const getChapterStats = (questions: Chapter['questions']) => {
  const single = questions.filter(q => q.type === 'single').length
  const multiple = questions.filter(q => q.type === 'multiple').length
  const boolean = questions.filter(q => q.type === 'boolean').length
  return { single, multiple, boolean, total: questions.length }
}

const getSubjectStats = (subject: Subject) => {
  let single = 0, multiple = 0, boolean = 0
  for (const ch of subject.chapters) {
    const s = getChapterStats(ch.questions)
    single += s.single; multiple += s.multiple; boolean += s.boolean
  }
  return { single, multiple, boolean, total: single + multiple + boolean, chapters: subject.chapters.length }
}

const SUBJECT_ICONS: Record<string, any> = {
  'Monitor': Monitor,
  'GitBranch': GitBranch,
}

export default function ChapterList({
  chapters,
  user,
  onDelete,
  onStartStudy,
  onStartExam,
  onStartBrowse,
  onImport,
  onReset,
  onLogin,
  onLogout,
}: Props) {
  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个章节吗？',
      success: (res) => {
        if (res.confirm) {
          onDelete(id)
        }
      },
    })
  }

  return (
    <View className='chapter-list'>
      {/* 用户信息栏 */}
      <View className='user-bar' onClick={!user ? onLogin : undefined}>
        {user?.avatarUrl ? (
          <Image className='user-avatar' src={user.avatarUrl} />
        ) : (
          <View className='user-avatar-placeholder'>
            <UserIcon size={28} color='#6366f1' />
          </View>
        )}
        <View className='user-info'>
          {user ? (
            <>
              <Text className='user-name'>{user.nickname || '微信用户'}</Text>
              <Text className='user-hint'>已登录</Text>
            </>
          ) : (
            <>
              <Text className='user-name'>点击登录</Text>
              <Text className='user-hint'>登录后可同步数据</Text>
            </>
          )}
        </View>
        {user && (
          <View className='logout-btn' onClick={(e) => { e.stopPropagation(); onLogout() }}>
            <Text>退出</Text>
          </View>
        )}
      </View>

      {/* 头部标题 */}
      <View className='home-header'>
        <View className='header-icon'>
          <Layers size={36} color='#ffffff' />
        </View>
        <View className='header-text'>
          <Text className='header-title'>学习题库</Text>
          <Text className='header-subtitle'>
            {SUBJECTS.reduce((sum, s) => sum + getSubjectStats(s).chapters, 0)} 个题库 · {SUBJECTS.reduce((sum, s) => sum + getSubjectStats(s).total, 0)} 道题目
          </Text>
        </View>
      </View>

      {/* 学科分类 */}
      <View className='section-label'>
        <Text className='section-label-text'>学科分类</Text>
      </View>

      {SUBJECTS.map(subject => {
        const stats = getSubjectStats(subject)
        const IconComp = SUBJECT_ICONS[subject.icon]
        return (
          <View key={subject.id} className='subject-card' onClick={() => {
            Taro.navigateTo({ url: `/pages/subject/index?id=${subject.id}` })
          }}>
            <View className={`subject-icon ${subject.bgColor}`}>
              {IconComp && <IconComp size={28} color={subject.bgColor === 'bg-blue-50' ? '#2563eb' : '#059669'} />}
            </View>
            <View className='subject-info'>
              <Text className='subject-name'>{subject.name}</Text>
              <Text className='subject-meta'>{stats.chapters} 个题库 · {stats.total} 道题</Text>
              <View className='subject-tags'>
                {stats.single > 0 && <Text className='tag tag-single'>单选 {stats.single}</Text>}
                {stats.multiple > 0 && <Text className='tag tag-multiple'>多选 {stats.multiple}</Text>}
                {stats.boolean > 0 && <Text className='tag tag-boolean'>判断 {stats.boolean}</Text>}
              </View>
            </View>
            <View className='subject-arrow'>
              <ChevronRight size={20} color='#cbd5e1' />
            </View>
          </View>
        )
      })}

      {/* 用户自定义章节 */}
      {chapters.length > 0 && (
        <>
          <View className='section-label' style={{ marginTop: '24px' }}>
            <Text className='section-label-text'>自定义题库</Text>
          </View>
          <View className='card-list'>
            {chapters.map((chapter) => {
              const stats = getChapterStats(chapter.questions)
              return (
                <View key={chapter.id} className='chapter-card'>
                  <View className='card-header'>
                    <View className='card-info'>
                      <Text className='card-title'>{chapter.title}</Text>
                      <View className='card-tags'>
                        {stats.single > 0 && <Text className='tag tag-single'>单选 {stats.single}</Text>}
                        {stats.multiple > 0 && <Text className='tag tag-multiple'>多选 {stats.multiple}</Text>}
                        {stats.boolean > 0 && <Text className='tag tag-boolean'>判断 {stats.boolean}</Text>}
                        <Text className='card-count'>{stats.total} 题</Text>
                      </View>
                    </View>
                    <View className='delete-btn' onClick={() => handleDelete(chapter.id)}>
                      <Trash2 size={18} color='#94a3b8' />
                    </View>
                  </View>
                  <View className='card-actions'>
                    <Button className='action-btn study-btn' onClick={() => onStartStudy(chapter.id)}>
                      <FileText size={16} color='#1d4ed8' />
                      <Text>练习</Text>
                    </Button>
                    <Button className='action-btn exam-btn' onClick={() => onStartExam(chapter.id)}>
                      <Award size={16} color='#6d28d9' />
                      <Text>考试</Text>
                    </Button>
                    <Button className='action-btn browse-btn' onClick={() => onStartBrowse(chapter.id)}>
                      <Eye size={16} color='#15803d' />
                      <Text>阅览</Text>
                    </Button>
                  </View>
                </View>
              )
            })}
          </View>
        </>
      )}

      {/* 快速操作 */}
      <View className='card-list'>
        <Button className='import-btn' onClick={onImport}>
          <Plus size={20} color='#ffffff' />
          <Text>导入新题库</Text>
        </Button>
        <View className='reset-area'>
          <View className='reset-btn' onClick={onReset}>
            <RefreshCw size={12} color='#94a3b8' />
            <Text>清除自定义数据</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
