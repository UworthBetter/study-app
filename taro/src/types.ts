export type QuestionType = 'single' | 'multiple' | 'boolean'

export interface Question {
  id: number
  type: QuestionType
  question: string
  options: string[]
  correctAnswer: number | number[]
  userAnswer?: number | number[] | null
  explanation?: string
}

export interface Chapter {
  id: string
  title: string
  questions: Question[]
  createDate: number
}

export interface Subject {
  id: string
  name: string
  icon: string
  color: string
  bgColor: string
  chapters: Chapter[]
}

export interface User {
  openid: string
  nickname: string
  avatarUrl: string
}

export interface OfficialBank {
  id: number
  title: string
  questionCount: number
  category: string
}

export interface OfficialBankDetail extends OfficialBank {
  questions: Question[]
}
