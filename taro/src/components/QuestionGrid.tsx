import { View, Text, Button } from '@tarojs/components'
import { Question } from '../types'
import { checkAnswer } from '../utils/check'
import { X } from './icons'
import './QuestionGrid.scss'

interface Props {
  questions: Question[]
  currentIndex: number
  userAnswers: (number | number[] | null)[]
  confirmedQuestions: Set<number>
  isStudy: boolean
  onSelect: (idx: number) => void
  onClose: () => void
}

export default function QuestionGrid({
  questions,
  currentIndex,
  userAnswers,
  confirmedQuestions,
  isStudy,
  onSelect,
  onClose,
}: Props) {
  return (
    <View className='grid-overlay'>
      <View className='grid-modal'>
        <View className='grid-header'>
          <Text className='grid-title'>答题卡</Text>
          <View className='grid-close' onClick={onClose}>
            <X size={20} color='#64748b' />
          </View>
        </View>
        <View className='grid-body'>
          {questions.map((ques, idx) => {
            const hasAns = userAnswers[idx] !== null
            const isQConfirmed = isStudy && confirmedQuestions.has(idx)
            const isRight = checkAnswer(ques, userAnswers[idx])

            let cellClass = 'grid-cell'
            if (isStudy) {
              if (isQConfirmed) {
                cellClass += isRight ? ' correct' : ' wrong'
              } else if (hasAns) {
                cellClass += ' answered'
              }
            } else {
              if (hasAns) cellClass += ' exam-answered'
            }

            if (currentIndex === idx) cellClass += ' current'

            return (
              <View key={idx} className={cellClass} onClick={() => onSelect(idx)}>
                <Text>{idx + 1}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
