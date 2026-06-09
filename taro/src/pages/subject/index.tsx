import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Chapter } from '../../types'
import { SUBJECTS } from '../../data/questionBank'
import { FileText, Award, Eye, FolderOpen } from '../../components/icons'
import './index.scss'

export default function SubjectPage() {
  const instance = Taro.getCurrentInstance()
  const subjectId = instance?.router?.params?.id || ''
  const subject = SUBJECTS.find(s => s.id === subjectId)

  if (!subject) {
    return <View className='subject-page'><Text>未找到学科</Text></View>
  }

  const getStats = (questions: Chapter['questions']) => {
    const single = questions.filter(q => q.type === 'single').length
    const multiple = questions.filter(q => q.type === 'multiple').length
    const boolean = questions.filter(q => q.type === 'boolean').length
    return { single, multiple, boolean, total: questions.length }
  }

  const handleStartStudy = (id: string) => {
    Taro.navigateTo({ url: `/pages/index/index?mode=study&chapterId=${encodeURIComponent(id)}&source=subject` })
  }

  const handleStartExam = (id: string) => {
    Taro.navigateTo({ url: `/pages/index/index?mode=exam&chapterId=${encodeURIComponent(id)}&source=subject` })
  }

  const handleStartBrowse = (id: string) => {
    Taro.navigateTo({ url: `/pages/index/index?mode=browse&chapterId=${encodeURIComponent(id)}&source=subject` })
  }

  return (
    <View className='subject-page'>
      <View className='chapter-list'>
        {subject.chapters.map(chapter => {
          const stats = getStats(chapter.questions)
          return (
            <View key={chapter.id} className='chapter-card'>
              <View className='card-top'>
                <View className='card-icon'>
                  <FolderOpen size={16} color='#6366f1' />
                </View>
                <Text className='card-title'>{chapter.title}</Text>
                <Text className='card-count'>{stats.total} 题</Text>
              </View>
              <View className='card-tags'>
                {stats.single > 0 && <Text className='tag tag-single'>单选 {stats.single}</Text>}
                {stats.multiple > 0 && <Text className='tag tag-multiple'>多选 {stats.multiple}</Text>}
                {stats.boolean > 0 && <Text className='tag tag-boolean'>判断 {stats.boolean}</Text>}
              </View>
              <View className='card-actions'>
                <Button className='action-btn study-btn' onClick={() => handleStartStudy(chapter.id)}>
                  <FileText size={15} color='#1d4ed8' />
                  <Text>练习</Text>
                </Button>
                <Button className='action-btn exam-btn' onClick={() => handleStartExam(chapter.id)}>
                  <Award size={15} color='#6d28d9' />
                  <Text>考试</Text>
                </Button>
                <Button className='action-btn browse-btn' onClick={() => handleStartBrowse(chapter.id)}>
                  <Eye size={15} color='#15803d' />
                  <Text>阅览</Text>
                </Button>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
