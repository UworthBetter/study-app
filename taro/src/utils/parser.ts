import { Question, QuestionType } from '../types'

// === 基于行分析的解析器（与Web版同步） ===

const normalizeText = (text: string): string => {
  let result = text
    .replace(/[！-～]/g, char => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[　 ]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[‐-―]/g, '-')
    .replace(/[．。]/g, '.')
    .replace(/[，、]/g, '、')
    .replace(/[（）]/g, match => (match === '（' ? '(' : ')'))
    .replace(/[【［〔]/g, '[')
    .replace(/[】］〕]/g, ']')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // 合并被PDF截断的行
  const lines = result.split('\n')
  const merged: string[] = []
  const punctuation = /[.。！？；：，、)）\]】]$/
  const newBlockPattern = /^(?:(?:第\s*)?\d{1,4}\s*[.、):：]|[A-Ha-h]\s*[.、):：]|(?:我的|正确|参考|标准)?\s*答案|AI\s*讲解)/

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim()
    const next = lines[i + 1]?.trim()

    if (!current) continue

    const isExplanation = /答案\s*解析/.test(current)
    const shouldMerge = current && next && (
      (isExplanation && !newBlockPattern.test(next)) ||
      (!punctuation.test(current) && !newBlockPattern.test(next))
    )

    if (shouldMerge) {
      merged.push(current + next)
      i++ // 跳过下一行
    } else {
      merged.push(current)
    }
  }

  return merged.join('\n')
}

const isNoiseLine = (line: string): boolean => {
  const t = line.trim()
  if (!t) return true
  if (/^\d+\s*\/\s*\d+$/.test(t)) return true
  if (/^(\d{1,2}\s+){3,}\d{1,2}$/.test(t)) return true
  if (/^\d+(\.\d+)?\s*分$/.test(t)) return true
  if (/^AI\s*讲解$/.test(t)) return true
  if (/^(题量|满分|作答时间|智能分析|作业详情)/.test(t)) return true
  if (/^一\s*\.\s*(?:单选|多选|判断)题/.test(t)) return true
  if (/[-]/.test(t)) return true
  if (/^[()（）]+$/.test(t)) return true
  return false
}

const detectQuestionType = (label: string, options: string[], answer: string): QuestionType => {
  if (/多选|多项|不定项/.test(label)) return 'multiple'
  if (/判断|对错|正误/.test(label)) return 'boolean'
  if (answer && /^[A-H]{2,}$/i.test(answer.trim())) return 'multiple'
  if (options.length === 2 &&
    options.some(opt => /^(对|正确|√|T|A)$/i.test(opt.trim())) &&
    options.some(opt => /^(错|错误|×|F|B)$/i.test(opt.trim()))) return 'boolean'
  return 'single'
}

const parseAnswerIndex = (answer: string, type: QuestionType): number | number[] => {
  const normalized = answer.trim().toUpperCase()
  if (type === 'boolean') {
    return /^(对|正确|√|T|A)$/i.test(answer.trim()) ? 0 : 1
  }
  const indices = normalized.replace(/[^A-H]/g, '').split('').map(c => c.charCodeAt(0) - 65)
  return type === 'multiple' ? [...new Set(indices)].sort() : (indices[0] ?? 0)
}

type LineType = 'question' | 'option' | 'my_answer' | 'correct_answer' | 'explanation' | 'answer_line' | 'text_with_explanation' | 'noise' | 'text'

const classifyLine = (line: string): { type: LineType; value?: string } => {
  const t = line.trim()
  if (!t) return { type: 'noise' }

  const qMatch = t.match(/^(?:第\s*)?(\d{1,4})\s*[.、):：]\s*(.*)/)
  if (qMatch) return { type: 'question', value: qMatch[2] }

  const oMatch = t.match(/^([A-Ha-h])\s*[.、):：]\s*(.*)/)
  if (oMatch) return { type: 'option', value: oMatch[1].toUpperCase() + '. ' + oMatch[2] }

  // 一行中同时包含我的答案、正确答案和可能的解析
  if (/我的\s*答案/.test(t)) {
    const myMatch = t.match(/我的\s*答案\s*[:：]?\s*([A-Ha-h]+|对|错|正确|错误|√|×)/i)
    const correctMatch = t.match(/正确答案\s*[:：]?\s*([A-Ha-h]+|对|错|正确|错误|√|×)/i)
    const explanationMatch = t.match(/答案解析\s*[:：]?\s*(.*)/)

    if (myMatch || correctMatch) {
      return {
        type: 'answer_line',
        value: JSON.stringify({
          my: myMatch?.[1] || '',
          correct: correctMatch?.[1] || '',
          explanation: explanationMatch?.[1] || '',
        })
      }
    }
  }

  // 解析行（优先于答案行检测，因为"答案解析"包含"答案"）
  if (/^答案\s*解析/.test(t)) {
    return { type: 'explanation', value: t.replace(/^答案\s*解析\s*[:：]?\s*/, '') }
  }

  // 正确答案行
  if (/^(?:正确|参考|标准)?\s*答案/.test(t)) {
    const m = t.match(/(?:正确|参考|标准)?\s*答案\s*[:：]?\s*([A-Ha-h]+|对|错|正确|错误|√|×)/i)
    if (m) return { type: 'correct_answer', value: m[1] }
  }

  // 文本行中包含解析内容
  if (/答案\s*解析/.test(t)) {
    const parts = t.split(/答案\s*解析\s*[:：]?\s*/)
    if (parts.length >= 2) {
      return { type: 'text_with_explanation', value: JSON.stringify({ text: parts[0].trim(), explanation: parts.slice(1).join('答案解析').trim() }) }
    }
  }

  return { type: 'text', value: t }
}

export const parseQuestionsFromText = (rawText: string): Question[] => {
  console.log('=== 开始解析 ===')
  console.log('原始文本长度:', rawText.length)

  const text = normalizeText(rawText)
  const lines = text.split('\n').filter(line => !isNoiseLine(line))

  console.log('过滤后行数:', lines.length)

  const questions: Question[] = []
  let cur: {
    number: number
    label: string
    textParts: string[]
    options: string[]
    myAnswer: string
    correctAnswer: string
    explanation: string
  } | null = null

  const flush = () => {
    if (!cur) return
    const questionText = cur.textParts.join(' ').trim()
    const answer = cur.correctAnswer || cur.myAnswer
    const type = detectQuestionType(cur.label, cur.options, answer)

    if (type === 'boolean' && cur.options.length === 0) cur.options = ['对', '错']
    if (!questionText) { cur = null; return }
    if (type !== 'boolean' && cur.options.length < 2 && !answer) { cur = null; return }

    questions.push({
      id: 0,
      type,
      question: questionText,
      options: cur.options,
      correctAnswer: answer ? parseAnswerIndex(answer, type) : (type === 'multiple' ? [] : 0),
      explanation: cur.explanation,
    })

    console.log('✓ 添加题目:', questionText.substring(0, 30), '选项数:', cur.options.length, '答案:', answer)
    cur = null
  }

  for (const line of lines) {
    const cls = classifyLine(line)

    if (cls.type === 'question') {
      flush()
      const num = parseInt(line.match(/^(?:第\s*)?(\d{1,4})/)?.[1] || '0')
      cur = {
        number: num,
        label: cls.value || '',
        textParts: [],
        options: [],
        myAnswer: '',
        correctAnswer: '',
        explanation: '',
      }
      if (cls.value) {
        const cleanText = cls.value.replace(/^\(?\s*(?:单选|多选|判断|多项|不定项)\s*题?\s*\)?\s*/i, '').trim()
        if (cleanText) cur.textParts.push(cleanText)
      }
      continue
    }

    if (!cur) continue

    if (cls.type === 'option') {
      cur.options.push(cls.value!.replace(/^[A-Ha-h]\s*[.、):：]\s*/, ''))
    } else if (cls.type === 'answer_line') {
      try {
        const data = JSON.parse(cls.value!)
        if (data.my) cur.myAnswer = data.my
        if (data.correct) cur.correctAnswer = data.correct
        if (data.explanation) cur.explanation += (cur.explanation ? ' ' : '') + data.explanation
      } catch {}
    } else if (cls.type === 'correct_answer') {
      cur.correctAnswer = cls.value!
    } else if (cls.type === 'my_answer') {
      cur.myAnswer = cls.value!
    } else if (cls.type === 'explanation') {
      cur.explanation += (cur.explanation ? ' ' : '') + cls.value!
    } else if (cls.type === 'text_with_explanation') {
      try {
        const data = JSON.parse(cls.value!)
        if (data.text) cur.textParts.push(data.text)
        if (data.explanation) cur.explanation += (cur.explanation ? ' ' : '') + data.explanation
      } catch {}
    } else if (cls.type === 'text') {
      cur.textParts.push(cls.value!)
    }
  }

  flush()

  console.log('=== 解析完成 ===')
  console.log('识别题目数:', questions.length)

  return questions.map((q, i) => ({ ...q, id: i + 1 }))
}

// 兼容旧版本的导出
export const normalizeImportText = normalizeText
export const stripDocumentNoise = (text: string): string => {
  return text.split('\n').filter(line => !isNoiseLine(line)).join('\n')
}
