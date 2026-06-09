import { Question } from '../types'

export const checkAnswer = (q: Question, answer: number | number[] | null): boolean => {
  if (answer === null || answer === undefined) return false

  if (q.type === 'multiple') {
    if (!Array.isArray(answer) || !Array.isArray(q.correctAnswer)) return false
    if (answer.length !== q.correctAnswer.length) return false
    const sortedAns = [...answer].sort((a, b) => a - b)
    const sortedCorr = [...(q.correctAnswer as number[])].sort((a, b) => a - b)
    return sortedAns.every((val, idx) => val === sortedCorr[idx])
  } else {
    return answer === q.correctAnswer
  }
}

export const formatAnswerLabel = (answer: number | number[] | null): string => {
  if (answer === null) return ''
  if (Array.isArray(answer)) {
    return answer.map(i => String.fromCharCode(65 + i)).join('')
  }
  return String.fromCharCode(65 + answer)
}

export const getOptionLabel = (index: number): string => String.fromCharCode(65 + index)
