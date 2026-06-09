import { View, Text } from '@tarojs/components'
import { Question } from '../types'
import { getOptionLabel } from '../utils/check'
import { Check } from './icons'
import './Browse.scss'

interface Props {
  questions: Question[]
  title: string
}

export default function Browse({ questions, title }: Props) {
  return (
    <View className='browse'>
      <View className='browse-list'>
        {questions.map((q, idx) => (
          <View key={idx} className='browse-card'>
            <View className='browse-card-header'>
              <Text className='question-num'>#{idx + 1}</Text>
              <View className={`type-tag ${q.type}`}>
                <Text>{q.type === 'multiple' ? '多选' : q.type === 'boolean' ? '判断' : '单选'}</Text>
              </View>
              <Text className='browse-question'>{q.question}</Text>
            </View>
            <View className='browse-options'>
              {q.options.map((opt, i) => {
                const isCorrect = Array.isArray(q.correctAnswer)
                  ? q.correctAnswer.includes(i)
                  : q.correctAnswer === i
                return (
                  <View key={i} className={`browse-option ${isCorrect ? 'correct' : ''}`}>
                    <Text className='opt-label'>{getOptionLabel(i)}.</Text>
                    <Text className='opt-text'>{opt}</Text>
                    {isCorrect && <Check size={16} color='#059669' />}
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
