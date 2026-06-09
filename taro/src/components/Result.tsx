import { View, Text } from '@tarojs/components'
import { Question } from '../types'
import { checkAnswer } from '../utils/check'
import './Result.scss'

interface Props {
  score: number
  total: number
  title: string
  questions: Question[]
  userAnswers: (number | number[] | null)[]
  onReviewQuestion: (idx: number) => void
}

export default function Result({ score, total, title, questions, userAnswers, onReviewQuestion }: Props) {
  const percentage = Math.round((score / total) * 100)
  const passed = percentage >= 60

  return (
    <View className='result'>
      <View className='result-main'>
        <View className={`score-circle ${passed ? 'pass' : 'fail'}`}>
          <Text className={`score-number ${passed ? 'pass' : 'fail'}`}>{score}</Text>
          <Text className='score-total'> / {total}</Text>
        </View>
        <Text className='result-title'>{passed ? '考试合格' : '继续努力'}</Text>
        <Text className='result-detail'>得分率 {percentage}% · {title}</Text>
      </View>

      <View className='result-summary'>
        <View className='summary-item correct'>
          <Text className='summary-count'>{score}</Text>
          <Text className='summary-label'>答对</Text>
        </View>
        <View className='summary-item wrong'>
          <Text className='summary-count'>{total - score}</Text>
          <Text className='summary-label'>答错</Text>
        </View>
      </View>

      <View className='result-grid'>
        <Text className='grid-title'>答题回顾</Text>
        <View className='grid-body'>
          {questions.map((q, idx) => {
            const isCorrect = checkAnswer(q, userAnswers[idx])
            return (
              <View
                key={q.id}
                className={`grid-cell ${isCorrect ? 'correct' : 'wrong'}`}
                onClick={() => onReviewQuestion(idx)}
              >
                <Text>{idx + 1}</Text>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
