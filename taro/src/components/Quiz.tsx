import { View, Text, Button } from '@tarojs/components'
import { Question } from '../types'
import { checkAnswer, formatAnswerLabel, getOptionLabel } from '../utils/check'
import {
  LayoutGrid, CheckCircle, Circle, CheckSquare, Square,
  AlertCircle, ChevronLeft, ChevronRight, Save, Send, RotateCcw,
} from './icons'
import QuestionGrid from './QuestionGrid'
import './Quiz.scss'

interface Props {
  questions: Question[]
  currentIndex: number
  userAnswers: (number | number[] | null)[]
  confirmedQuestions: Set<number>
  isStudy: boolean
  isReview?: boolean
  showGrid: boolean
  onSetCurrentIndex: (idx: number) => void
  onAnswerSelect: (optionIndex: number) => void
  onConfirm: () => void
  onFinish: () => void
  onBack: () => void
  onShowGrid: (show: boolean) => void
}

export default function Quiz({
  questions,
  currentIndex,
  userAnswers,
  confirmedQuestions,
  isStudy,
  isReview = false,
  showGrid,
  onSetCurrentIndex,
  onAnswerSelect,
  onConfirm,
  onFinish,
  onBack,
  onShowGrid,
}: Props) {
  if (questions.length === 0) return <View><Text>暂无题目</Text></View>

  const q = questions[currentIndex]
  const currentAns = userAnswers[currentIndex]
  const isConfirmed = isStudy && confirmedQuestions.has(currentIndex)
  const showResult = isReview || isConfirmed
  const isMultiCorrect = q.type === 'multiple' && checkAnswer(q, currentAns)
  const isSingleCorrect = q.type !== 'multiple' && checkAnswer(q, currentAns)
  const isCorrect = q.type === 'multiple' ? isMultiCorrect : isSingleCorrect

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      onSetCurrentIndex(currentIndex + 1)
    } else {
      onFinish()
    }
  }

  const prevQuestion = () => {
    if (currentIndex > 0) {
      onSetCurrentIndex(currentIndex - 1)
    }
  }

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <View className='quiz'>
      <View className='quiz-meta-row'>
          {!isReview && (
            <View className='grid-btn' onClick={() => onShowGrid(true)}>
              <LayoutGrid size={16} color='#475569' />
              <Text className='grid-text'>{currentIndex + 1}/{questions.length}</Text>
            </View>
          )}
          {isReview && (
            <View className='grid-btn'>
              <Text className='grid-text'>{currentIndex + 1}/{questions.length}</Text>
            </View>
          )}
          <View className={`mode-tag ${isReview ? 'review' : (isStudy ? 'study' : 'exam')}`}>
            <Text>{isReview ? '回顾' : (isStudy ? '练习' : '考试')}</Text>
          </View>
      </View>

      {showGrid && !isReview && (
        <QuestionGrid
          questions={questions}
          currentIndex={currentIndex}
          userAnswers={userAnswers}
          confirmedQuestions={confirmedQuestions}
          isStudy={isStudy}
          onSelect={(idx) => {
            onSetCurrentIndex(idx)
            onShowGrid(false)
          }}
          onClose={() => onShowGrid(false)}
        />
      )}

      {!isReview && (
        <View className='progress-bar'>
          <View
            className={`progress-fill ${isStudy ? 'study' : 'exam'}`}
            style={{ width: `${progress}%` }}
          />
        </View>
      )}

      <View className='question-area'>
        <View className='question-header'>
          <Text className='question-label'>Question {currentIndex + 1}</Text>
          <View className={`type-tag ${q.type}`}>
            <Text>{q.type === 'multiple' ? '多选' : q.type === 'boolean' ? '判断' : '单选'}</Text>
          </View>
        </View>
        <Text className='question-text'>{q.question}</Text>
      </View>

      <View className='options'>
        {q.options.map((opt, idx) => {
          const isSelected = q.type === 'multiple'
            ? (currentAns as number[] || []).includes(idx)
            : currentAns === idx
          const isActualCorrect = q.type === 'multiple'
            ? (q.correctAnswer as number[]).includes(idx)
            : q.correctAnswer === idx

          let optClass = 'option-item'
          if (showResult) {
            if (isActualCorrect) optClass += ' correct'
            else if (isSelected) optClass += ' wrong'
            else optClass += ' dimmed'
          } else if (isStudy) {
            if (isSelected) optClass += ' selected-study'
          } else {
            if (isSelected) optClass += ' selected-exam'
          }

          const iconColor = showResult
            ? (isActualCorrect ? '#16a34a' : isSelected ? '#ef4444' : undefined)
            : (isStudy ? '#2563eb' : '#7c3aed')

          return (
            <View
              key={idx}
              className={optClass}
              onClick={() => !showResult && !(isStudy && isConfirmed) && onAnswerSelect(idx)}
            >
              <View className='option-icon'>
                {q.type === 'multiple' ? (
                  isSelected
                    ? <CheckSquare size={20} color={iconColor} />
                    : <Square size={20} color='#94a3b8' />
                ) : (
                  isSelected
                    ? <CheckCircle size={20} color={iconColor} />
                    : <Circle size={20} color='#94a3b8' />
                )}
              </View>
              <Text className='option-text'>{getOptionLabel(idx)}. {opt}</Text>
            </View>
          )
        })}
      </View>

      {q.type === 'multiple' && isStudy && !isConfirmed && !isReview && (
        <Button
          className='confirm-btn'
          disabled={currentAns === null || currentAns === undefined}
          onClick={onConfirm}
        >
          <Send size={18} color='#ffffff' />
          <Text>确认答案</Text>
        </Button>
      )}

      {showResult && (
        <View className='explanation'>
          <View className='explanation-header'>
            <AlertCircle size={20} color='#6366f1' />
            <Text className='explanation-title'>答案解析</Text>
          </View>
          <Text className='explanation-text'>
            正确答案：{formatAnswerLabel(q.correctAnswer)}。
            {q.type === 'multiple' && !isCorrect && ' (多选题需全对)'}
          </Text>
          {q.explanation && (
            <Text className='explanation-detail'>{q.explanation}</Text>
          )}
        </View>
      )}

      <View className='quiz-footer'>
        <Button
          className={`nav-btn prev-btn ${currentIndex === 0 ? 'disabled' : ''}`}
          onClick={prevQuestion}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={20} color='#64748b' />
          <Text>上一题</Text>
        </Button>
        {isReview && currentIndex === questions.length - 1 ? (
          <Button className='nav-btn submit-btn' onClick={onBack}>
            <RotateCcw size={18} color='#ffffff' />
            <Text>返回结果</Text>
          </Button>
        ) : currentIndex === questions.length - 1 ? (
          <Button className='nav-btn submit-btn' onClick={onFinish}>
            <Save size={18} color='#ffffff' />
            <Text>交卷</Text>
          </Button>
        ) : (
          <Button className={`nav-btn next-btn ${isStudy ? 'study' : 'exam'}`} onClick={nextQuestion}>
            <Text>下一题</Text>
            <ChevronRight size={20} color='#ffffff' />
          </Button>
        )}
      </View>
    </View>
  )
}
