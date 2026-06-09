import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  RotateCcw,
  FileText,
  Plus,
  Award,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  Eye,
  Trash2,
  LayoutGrid,
  X,
  RefreshCw,
  CheckSquare,
  Square,
  Circle,
  Check,
  Send,
  Upload,
  Loader2,
  Monitor,
  GitBranch,
  Layers,
  ArrowLeft,
  BookMarked,
  FolderOpen,
} from 'lucide-react';
import { SUBJECTS } from './data/questionBank';
import type { Subject } from './data/questionBank';

// --- 类型定义 ---
export type QuestionType = 'single' | 'multiple' | 'boolean';

export interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  userAnswer?: number | number[] | null;
  explanation?: string;
}

export interface Chapter {
  id: string;
  title: string;
  questions: Question[];
  createDate: number;
}

type ViewMode = 'home' | 'subject' | 'study' | 'exam' | 'browse' | 'result' | 'import';

// --- 工具函数 ---

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

const checkAnswer = (q: Question, answer: number | number[] | null): boolean => {
  if (answer === null || answer === undefined) return false;
  
  if (q.type === 'multiple') {
    if (!Array.isArray(answer) || !Array.isArray(q.correctAnswer)) return false;
    if (answer.length !== q.correctAnswer.length) return false;
    const sortedAns = [...answer].sort((a, b) => a - b);
    const sortedCorr = [...(q.correctAnswer as number[])].sort((a, b) => a - b);
    return sortedAns.every((val, idx) => val === sortedCorr[idx]);
  } else {
    return answer === q.correctAnswer;
  }
};

const formatAnswerLabel = (answer: number | number[] | null): string => {
  if (answer === null) return '';
  if (Array.isArray(answer)) {
    return answer.map(i => String.fromCharCode(65 + i)).join('');
  }
  return String.fromCharCode(65 + answer);
};

// === 基于行分析的解析器 ===

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
    .trim();

  // 合并被PDF截断的行
  const lines = result.split('\n');
  const merged: string[] = [];
  const punctuation = /[.。！？；：，、)）\]】]$/;
  const newBlockPattern = /^(?:(?:第\s*)?\d{1,4}\s*[.、):：]|[A-Ha-h]\s*[.、):：]|(?:我的|正确|参考|标准)?\s*答案|AI\s*讲解)/;

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim();
    const next = lines[i + 1]?.trim();

    if (!current) continue;

    // 如果当前行包含"答案解析"，强制合并下一行（解析内容可能跨行）
    const isExplanation = /答案\s*解析/.test(current);
    const shouldMerge = current && next && (
      (isExplanation && !newBlockPattern.test(next)) ||
      (!punctuation.test(current) && !newBlockPattern.test(next))
    );

    if (shouldMerge) {
      merged.push(current + next);
      i++; // 跳过下一行
    } else {
      merged.push(current);
    }
  }

  return merged.join('\n');
};

const compactLine = (text: string): string => {
  return text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
};

const isNoiseLine = (line: string): boolean => {
  const t = line.trim();
  if (!t) return true;
  if (/^\d+\s*\/\s*\d+$/.test(t)) return true;
  if (/^(\d{1,2}\s+){3,}\d{1,2}$/.test(t)) return true;
  if (/^\d+(\.\d+)?\s*分$/.test(t)) return true;
  if (/^AI\s*讲解$/.test(t)) return true;
  if (/^(题量|满分|作答时间|智能分析|作业详情)/.test(t)) return true;
  if (/^一\s*\.\s*(?:单选|多选|判断)题/.test(t)) return true;
  if (/[-]/.test(t)) return true;
  if (/^[()（）]+$/.test(t)) return true;
  return false;
};

const detectQuestionType = (label: string, options: string[], answer: string): QuestionType => {
  if (/多选|多项|不定项/.test(label)) return 'multiple';
  if (/判断|对错|正误/.test(label)) return 'boolean';
  if (answer && /^[A-H]{2,}$/i.test(answer.trim())) return 'multiple';
  if (options.length === 2 &&
      options.some(opt => /^(对|正确|√|T|A)$/i.test(opt.trim())) &&
      options.some(opt => /^(错|错误|×|F|B)$/i.test(opt.trim()))) return 'boolean';
  return 'single';
};

const parseAnswerIndex = (answer: string, type: QuestionType): number | number[] => {
  const normalized = answer.trim().toUpperCase();
  if (type === 'boolean') {
    return /^(对|正确|√|T|A)$/i.test(answer.trim()) ? 0 : 1;
  }
  const indices = normalized.replace(/[^A-H]/g, '').split('').map(c => c.charCodeAt(0) - 65);
  return type === 'multiple' ? [...new Set(indices)].sort() : (indices[0] ?? 0);
};

type LineType = 'question' | 'option' | 'my_answer' | 'correct_answer' | 'explanation' | 'answer_line' | 'text_with_explanation' | 'noise' | 'text';

const classifyLine = (line: string): { type: LineType; value?: string } => {
  const t = line.trim();
  if (!t) return { type: 'noise' };

  const qMatch = t.match(/^(?:第\s*)?(\d{1,4})\s*[.、):：]\s*(.*)/);
  if (qMatch) return { type: 'question', value: qMatch[2] };

  const oMatch = t.match(/^([A-Ha-h])\s*[.、):：]\s*(.*)/);
  if (oMatch) return { type: 'option', value: oMatch[1].toUpperCase() + '. ' + oMatch[2] };

  // 一行中同时包含我的答案、正确答案和可能的解析
  if (/我的\s*答案/.test(t)) {
    const myMatch = t.match(/我的\s*答案\s*[:：]?\s*([A-Ha-h]+|对|错|正确|错误|√|×)/i);
    const correctMatch = t.match(/正确答案\s*[:：]?\s*([A-Ha-h]+|对|错|正确|错误|√|×)/i);
    const explanationMatch = t.match(/答案解析\s*[:：]?\s*(.*)/);

    // 如果有解析内容，需要在主循环中特殊处理
    // 返回一个复合信息
    if (myMatch || correctMatch) {
      return {
        type: 'answer_line',
        value: JSON.stringify({
          my: myMatch?.[1] || '',
          correct: correctMatch?.[1] || '',
          explanation: explanationMatch?.[1] || '',
        })
      };
    }
  }

  // 解析行（优先于答案行检测，因为"答案解析"包含"答案"）
  if (/^答案\s*解析/.test(t)) {
    return { type: 'explanation', value: t.replace(/^答案\s*解析\s*[:：]?\s*/, '') };
  }

  // 正确答案行
  if (/^(?:正确|参考|标准)?\s*答案/.test(t)) {
    const m = t.match(/(?:正确|参考|标准)?\s*答案\s*[:：]?\s*([A-Ha-h]+|对|错|正确|错误|√|×)/i);
    if (m) return { type: 'correct_answer', value: m[1] };
  }

  // 文本行中包含解析内容（如题目和解析在同一行）
  if (/答案\s*解析/.test(t)) {
    const parts = t.split(/答案\s*解析\s*[:：]?\s*/);
    if (parts.length >= 2) {
      return { type: 'text_with_explanation', value: JSON.stringify({ text: parts[0].trim(), explanation: parts.slice(1).join('答案解析').trim() }) };
    }
  }

  return { type: 'text', value: t };
};

const parseQuestionsFromText = (rawText: string): Question[] => {
  const text = normalizeText(rawText);
  const lines = text.split('\n').filter(line => !isNoiseLine(line));

  const questions: Question[] = [];
  let cur: {
    number: number;
    label: string;
    textParts: string[];
    options: string[];
    myAnswer: string;
    correctAnswer: string;
    explanation: string;
  } | null = null;

  const flush = () => {
    if (!cur) return;
    const questionText = cur.textParts.join(' ').trim();
    const answer = cur.correctAnswer || cur.myAnswer;
    const type = detectQuestionType(cur.label, cur.options, answer);

    if (type === 'boolean' && cur.options.length === 0) cur.options = ['对', '错'];
    if (!questionText) { cur = null; return; }
    if (type !== 'boolean' && cur.options.length < 2 && !answer) { cur = null; return; }

    questions.push({
      id: 0,
      type,
      question: questionText,
      options: cur.options,
      correctAnswer: answer ? parseAnswerIndex(answer, type) : (type === 'multiple' ? [] : 0),
      explanation: cur.explanation,
    });
    cur = null;
  };

  for (const line of lines) {
    const cls = classifyLine(line);

    if (cls.type === 'question') {
      flush();
      const num = parseInt(line.match(/^(?:第\s*)?(\d{1,4})/)?.[1] || '0');
      cur = {
        number: num,
        label: cls.value || '',
        textParts: [],
        options: [],
        myAnswer: '',
        correctAnswer: '',
        explanation: '',
      };
      if (cls.value) {
        const cleanText = cls.value.replace(/^\(?\s*(?:单选|多选|判断|多项|不定项)\s*题?\s*\)?\s*/i, '').trim();
        if (cleanText) cur.textParts.push(cleanText);
      }
      continue;
    }

    if (!cur) continue;

    if (cls.type === 'option') {
      cur.options.push(cls.value!.replace(/^[A-Ha-h]\s*[.、):：]\s*/, ''));
    } else if (cls.type === 'answer_line') {
      // 复合答案行：包含我的答案、正确答案和可能的解析
      try {
        const data = JSON.parse(cls.value!);
        if (data.my) cur.myAnswer = data.my;
        if (data.correct) cur.correctAnswer = data.correct;
        if (data.explanation) cur.explanation += (cur.explanation ? ' ' : '') + data.explanation;
      } catch {}
    } else if (cls.type === 'correct_answer') {
      cur.correctAnswer = cls.value!;
    } else if (cls.type === 'my_answer') {
      cur.myAnswer = cls.value!;
    } else if (cls.type === 'explanation') {
      cur.explanation += (cur.explanation ? ' ' : '') + cls.value!;
    } else if (cls.type === 'text_with_explanation') {
      // 文本行中包含解析内容
      try {
        const data = JSON.parse(cls.value!);
        if (data.text) cur.textParts.push(data.text);
        if (data.explanation) cur.explanation += (cur.explanation ? ' ' : '') + data.explanation;
      } catch {}
    } else if (cls.type === 'text') {
      cur.textParts.push(cls.value!);
    }
  }

  flush();
  return questions.map((q, i) => ({ ...q, id: i + 1 }));
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};


const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, 'document.pdf');

  const response = await fetch('http://127.0.0.1:5000/api/parse-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `PDF 解析服务响应错误: ${response.status}`);
  }

  const data = await response.json();
  if (!data.text || !data.text.trim()) {
    throw new Error('没有提取到可用文字。如果这是扫描版 PDF，需要后续接 OCR 兜底。');
  }

  return data.text;
};

const htmlToReadableText = (html: string): string => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: string[] = [];

  doc.body.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6').forEach(element => {
    if (element.closest('table')) return;
    const text = compactLine(element.textContent || '');
    if (text) blocks.push(text);
  });

  doc.body.querySelectorAll('tr').forEach(row => {
    const cells = Array.from(row.querySelectorAll('th, td'))
      .map(cell => compactLine(cell.textContent || ''))
      .filter(Boolean);
    if (cells.length === 0) return;

    const merged = cells
      .join(' ')
      .replace(/\b([A-Ha-h])\s+([.、:：)])\s*/g, '$1$2 ')
      .replace(/\b([A-Ha-h])\s+([\u4e00-\u9fa5A-Za-z0-9])/g, '$1. $2');
    blocks.push(compactLine(merged));
  });

  if (blocks.length === 0) {
    return compactLine(doc.body.textContent || '');
  }

  return blocks.join('\n');
};

const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const mammoth = await import('mammoth');
  const htmlResult = await mammoth.default.convertToHtml({ arrayBuffer });
  const text = htmlToReadableText(htmlResult.value);

  if (text.trim()) return text;

  const rawResult = await mammoth.default.extractRawText({ arrayBuffer });
  return rawResult.value;
};

// --- 辅助：获取题库统计 ---
const getChapterStats = (questions: Question[]) => {
  const single = questions.filter(q => q.type === 'single').length;
  const multiple = questions.filter(q => q.type === 'multiple').length;
  const boolean = questions.filter(q => q.type === 'boolean').length;
  return { single, multiple, boolean, total: questions.length };
};

const getSubjectStats = (subject: Subject) => {
  let single = 0, multiple = 0, boolean = 0;
  for (const ch of subject.chapters) {
    const s = getChapterStats(ch.questions);
    single += s.single;
    multiple += s.multiple;
    boolean += s.boolean;
  }
  return { single, multiple, boolean, total: single + multiple + boolean, chapters: subject.chapters.length };
};

const SUBJECT_ICON_MAP: Record<string, React.ReactNode> = {
  'Monitor': <Monitor size={28} />,
  'GitBranch': <GitBranch size={28} />,
};

export default function App() {
  // 用户自定义章节（存储在 localStorage）
  const [userChapters, setUserChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem('study-app-user-chapters');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [currentMode, setCurrentMode] = useState<ViewMode>('home');
  const [activeSubjectId, setActiveSubjectId] = useState<string>('');
  const [activeChapterId, setActiveChapterId] = useState<string>('');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | number[] | null)[]>([]);
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<number>>(new Set());
  const [showQuestionGrid, setShowQuestionGrid] = useState(false);
  const [score, setScore] = useState(0);
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importError, setImportError] = useState('');
  const [importHint, setImportHint] = useState('');
  const [isReadingDocument, setIsReadingDocument] = useState(false);

  // 持久化用户自定义章节
  useEffect(() => {
    localStorage.setItem('study-app-user-chapters', JSON.stringify(userChapters));
  }, [userChapters]);

  // 查找当前激活的章节（优先从官方题库找，再从用户章节找）
  const findChapter = (id: string): Chapter | undefined => {
    for (const subj of SUBJECTS) {
      const ch = subj.chapters.find(c => c.id === id);
      if (ch) return ch;
    }
    return userChapters.find(c => c.id === id);
  };

  const activeChapter = findChapter(activeChapterId);
  const originalQuestions = activeChapter ? activeChapter.questions : [];

  useEffect(() => {
    if (currentMode === 'study') {
      setActiveQuestions([...originalQuestions]);
      resetQuizState(originalQuestions.length);
    } else if (currentMode === 'exam') {
      const shuffled = shuffleArray(originalQuestions);
      setActiveQuestions(shuffled);
      resetQuizState(shuffled.length);
    }
  }, [currentMode, activeChapterId]); 

  const resetQuizState = (count: number) => {
    setCurrentQuestionIndex(0);
    setUserAnswers(new Array(count).fill(null));
    setConfirmedQuestions(new Set()); // 重置确认状态
    setShowQuestionGrid(false);
    setScore(0);
  };

  useEffect(() => {
    if (currentMode !== 'study' && currentMode !== 'exam') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      const currentQ = activeQuestions[currentQuestionIndex];

      if (!currentQ) return;

      if (['a','b','c','d'].includes(key)) {
        const idx = key.charCodeAt(0) - 97;
        if (idx < currentQ.options.length) {
           handleAnswerSelect(idx);
        }
      }
      
      if (key === 'enter') {
        e.preventDefault();
        // 如果是多选题且未确认，回车 = 确认
        if (currentQ.type === 'multiple' && currentMode === 'study' && !confirmedQuestions.has(currentQuestionIndex)) {
            handleConfirm();
        } else {
            // 否则回车 = 下一题
            nextQuestion();
        }
      } else if (key === 'arrowright') {
        e.preventDefault();
        nextQuestion();
      } else if (key === 'arrowleft') {
        prevQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMode, currentQuestionIndex, userAnswers, activeQuestions, confirmedQuestions]); 

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQ = activeQuestions[currentQuestionIndex];
    // 练习模式：如果题目已经确认了，就不能再改了
    if (currentMode === 'study' && confirmedQuestions.has(currentQuestionIndex)) return; 
    
    // 考试模式：不需要确认，但这里保持一致性，未交卷前都可以改

    const currentAns = userAnswers[currentQuestionIndex];
    let newAns: number | number[] | null = null;

    if (currentQ.type === 'multiple') {
        const selected = (currentAns as number[]) || [];
        if (selected.includes(optionIndex)) {
            newAns = selected.filter(i => i !== optionIndex).sort((a, b) => a - b);
        } else {
            newAns = [...selected, optionIndex].sort((a, b) => a - b);
        }
        if (newAns.length === 0) newAns = null;
    } else {
        // 单选/判断
        if (currentMode === 'exam' && currentAns === optionIndex) {
            newAns = null; 
        } else {
            newAns = optionIndex;
        }
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = newAns;
    setUserAnswers(newAnswers);

    // 练习模式下，单选/判断题自动确认
    if (currentMode === 'study' && currentQ.type !== 'multiple' && newAns !== null) {
        const newConfirmed = new Set(confirmedQuestions);
        newConfirmed.add(currentQuestionIndex);
        setConfirmedQuestions(newConfirmed);
    }
  };

  const handleConfirm = () => {
      if (userAnswers[currentQuestionIndex] === null) return; // 未选择不能确认
      const newConfirmed = new Set(confirmedQuestions);
      newConfirmed.add(currentQuestionIndex);
      setConfirmedQuestions(newConfirmed);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    activeQuestions.forEach((q, idx) => {
      if (checkAnswer(q, userAnswers[idx])) correctCount++;
    });
    setScore(correctCount);
    setCurrentMode('result');
  };

  const deleteChapter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个章节吗？')) {
      setUserChapters(prev => prev.filter(c => c.id !== id));
    }
  };

  const resetData = () => {
    if (window.confirm('重置将丢失所有自定义数据，确认？')) {
      setUserChapters([]);
      localStorage.removeItem('study-app-user-chapters');
      alert('已恢复。');
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImportError('');
    setImportHint('');
    setIsReadingDocument(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();
      let extractedText = '';

      if (extension === 'docx') {
        extractedText = await extractDocxText(arrayBuffer);
      } else if (extension === 'pdf') {
        extractedText = await extractPdfText(arrayBuffer);
      } else if (extension === 'doc') {
        throw new Error('暂不支持旧版 .doc，请先另存为 .docx 后再导入。');
      } else {
        throw new Error('目前支持 .docx 和文字版 .pdf。');
      }

      const cleanText = extractedText.trim();
      if (!cleanText) {
        throw new Error('没有提取到可用文字。如果这是扫描版 PDF，需要后续接 OCR 兜底。');
      }

      const detectedCount = parseQuestionsFromText(cleanText).length;
      setImportText(cleanText);
      if (!importTitle.trim()) {
        setImportTitle(file.name.replace(/\.[^.]+$/, ''));
      }
      setImportHint(
        detectedCount > 0
          ? `已从 ${file.name} 提取 ${cleanText.length} 个字符，初步识别 ${detectedCount} 道题。`
          : `已从 ${file.name} 提取 ${cleanText.length} 个字符，但暂未识别到完整题目，可先检查下方文本格式。`
      );
    } catch (error) {
      setImportError(`文档读取失败：${getErrorMessage(error)}`);
    } finally {
      setIsReadingDocument(false);
    }
  };

  const parseImportText = () => {
    setImportError('');
    if (!importTitle.trim()) { setImportError("请输入章节名称"); return; }
    if (!importText.trim()) { setImportError("请先上传文档或粘贴题目文本"); return; }

    try {
      const newQuestions = parseQuestionsFromText(importText);
      if (newQuestions.length === 0) { setImportError("未识别到题目"); return; }

      const newChapter: Chapter = {
        id: Date.now().toString(),
        title: importTitle,
        questions: newQuestions,
        createDate: Date.now()
      };

      setUserChapters(prev => [...prev, newChapter]);
      setCurrentMode('home');
      setImportText('');
      setImportTitle('');
      setImportHint('');
    } catch (error) {
      setImportError(`解析错误：${getErrorMessage(error)}`);
    }
  };

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  // --- 界面渲染 ---

  // 主页：学科分类
  const renderHome = () => {
    const totalQuestions = SUBJECTS.reduce((sum, s) => sum + getSubjectStats(s).total, 0);
    const totalChapters = SUBJECTS.reduce((sum, s) => sum + s.chapters.length, 0);

    return (
      <div className="flex flex-col min-h-[500px] animate-in fade-in duration-500 pb-10">
        {/* 头部 */}
        <div className="text-center space-y-3 mb-8 pt-4">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl inline-block shadow-lg shadow-blue-200">
            <Layers size={36} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">学习题库</h1>
            <p className="text-gray-400 text-sm mt-1">{totalChapters} 个题库 · {totalQuestions} 道题目</p>
          </div>
        </div>

        {/* 学科分类卡片 */}
        <div className="space-y-4 max-w-2xl mx-auto w-full">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">学科分类</h2>
          {SUBJECTS.map(subject => {
            const stats = getSubjectStats(subject);
            return (
              <button
                key={subject.id}
                onClick={() => { setActiveSubjectId(subject.id); setCurrentMode('subject'); }}
                className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-5 active:scale-[0.99] transition-all text-left hover:shadow-md group"
              >
                <div className="flex items-center gap-4">
                  <div className={`${subject.bgColor} p-3 rounded-xl ${subject.color} group-hover:scale-105 transition-transform`}>
                    {SUBJECT_ICON_MAP[subject.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-800">{subject.name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">{stats.chapters} 个题库 · {stats.total} 道题</p>
                    <div className="flex gap-2 mt-2">
                      {stats.single > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">单选 {stats.single}</span>}
                      {stats.multiple > 0 && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">多选 {stats.multiple}</span>}
                      {stats.boolean > 0 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">判断 {stats.boolean}</span>}
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            );
          })}

          {/* 用户自定义章节 */}
          {userChapters.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1 pt-4">自定义题库</h2>
              {userChapters.map(chapter => (
                <div key={chapter.id} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 active:scale-[0.99] transition-transform">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <BookMarked size={18} className="text-gray-400" />
                      <h3 className="text-base font-bold text-gray-800 line-clamp-1">{chapter.title}</h3>
                    </div>
                    <button onClick={(e) => deleteChapter(e, chapter.id)} className="text-gray-300 hover:text-red-500 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    {(() => {
                      const s = getChapterStats(chapter.questions);
                      return <>
                        {s.single > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">单选 {s.single}</span>}
                        {s.multiple > 0 && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">多选 {s.multiple}</span>}
                        {s.boolean > 0 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">判断 {s.boolean}</span>}
                      </>;
                    })()}
                    <span className="text-xs text-gray-400 ml-auto">{chapter.questions.length} 题</span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('study'); }} className="flex-1 flex items-center justify-center py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                      <FileText size={15} className="mr-1" /> 练习
                    </button>
                    <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('exam'); }} className="flex-1 flex items-center justify-center py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                      <Award size={15} className="mr-1" /> 考试
                    </button>
                    <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('browse'); }} className="flex-1 flex items-center justify-center py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
                      <Eye size={15} className="mr-1" /> 阅览
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 快速操作 */}
          <div className="pt-4 space-y-3">
            <button onClick={() => setCurrentMode('import')} className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 text-gray-400 active:bg-gray-50 flex items-center justify-center font-medium hover:border-blue-300 hover:text-blue-500 transition-colors">
              <Plus size={20} className="mr-2" /> 导入新题库
            </button>
            <div className="flex justify-center">
              <button onClick={resetData} className="text-xs text-gray-400 flex items-center hover:text-gray-600">
                <RefreshCw size={12} className="mr-1" /> 清除自定义数据
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 学科详情页：章节列表
  const renderSubject = () => {
    const subject = SUBJECTS.find(s => s.id === activeSubjectId);
    if (!subject) return null;

    return (
      <div className="max-w-2xl mx-auto animate-in slide-in-from-right-4">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => setCurrentMode('home')} className="p-2 -ml-2 rounded-full text-gray-600 hover:bg-gray-100">
            <ArrowLeft size={22} />
          </button>
          <div className={`${subject.bgColor} p-2.5 rounded-xl ${subject.color}`}>
            {SUBJECT_ICON_MAP[subject.icon]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{subject.name}</h2>
            <p className="text-sm text-gray-400">{subject.chapters.length} 个题库</p>
          </div>
        </div>

        <div className="space-y-3">
          {subject.chapters.map(chapter => {
            const stats = getChapterStats(chapter.questions);
            return (
              <div key={chapter.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 active:scale-[0.99] transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={16} className="text-gray-400" />
                    <h3 className="font-bold text-gray-800 line-clamp-1">{chapter.title}</h3>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{stats.total} 题</span>
                </div>
                <div className="flex gap-1.5 mb-3">
                  {stats.single > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">单选 {stats.single}</span>}
                  {stats.multiple > 0 && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">多选 {stats.multiple}</span>}
                  {stats.boolean > 0 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">判断 {stats.boolean}</span>}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('study'); }} className="flex-1 flex items-center justify-center py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                    <FileText size={15} className="mr-1" /> 练习
                  </button>
                  <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('exam'); }} className="flex-1 flex items-center justify-center py-2 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                    <Award size={15} className="mr-1" /> 考试
                  </button>
                  <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('browse'); }} className="flex-1 flex items-center justify-center py-2 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
                    <Eye size={15} className="mr-1" /> 阅览
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (activeQuestions.length === 0) return <div>No questions</div>;
    const q = activeQuestions[currentQuestionIndex];
    const isStudy = currentMode === 'study';
    const currentAns = userAnswers[currentQuestionIndex];
    
    // 在练习模式下，只有确认了(confirmed)才算回答了(isAnswered)
    const isConfirmed = isStudy && confirmedQuestions.has(currentQuestionIndex);
    
    // 多选是否完全正确
    const isMultiCorrect = q.type === 'multiple' && checkAnswer(q, currentAns);
    // 单选是否正确
    const isSingleCorrect = q.type !== 'multiple' && checkAnswer(q, currentAns);
    const isCorrect = q.type === 'multiple' ? isMultiCorrect : isSingleCorrect;

    return (
      <div className="max-w-3xl mx-auto flex flex-col h-full relative">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <button onClick={() => setCurrentMode('home')} className="text-gray-500 active:text-gray-800 flex items-center text-sm p-2 -ml-2 rounded-lg">
            <RotateCcw size={18} />
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={() => setShowQuestionGrid(true)} className="flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              <LayoutGrid size={16} className="mr-1.5" /> 
              <span className="text-xs">{currentQuestionIndex + 1}/{activeQuestions.length}</span>
            </button>
            <div className={`text-xs font-bold px-2 py-1 rounded-md ${isStudy ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
              {isStudy ? '练习' : '考试'}
            </div>
          </div>
        </div>

        {/* 答题卡弹窗 */}
        {showQuestionGrid && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center p-4 border-b">
                <span className="font-bold text-gray-800 text-lg">答题卡</span>
                <button onClick={() => setShowQuestionGrid(false)} className="p-2 bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto grid grid-cols-5 gap-3">
                {activeQuestions.map((ques, idx) => {
                  const hasAns = userAnswers[idx] !== null;
                  const isQConfirmed = isStudy && confirmedQuestions.has(idx);
                  const isRight = checkAnswer(ques, userAnswers[idx]);
                  
                  let bg = "bg-gray-100 text-gray-500";
                  if (isStudy) {
                      if (isQConfirmed) bg = isRight ? "bg-green-100 text-green-700 border-green-200 border" : "bg-red-100 text-red-700 border-red-200 border";
                      else if (hasAns) bg = "bg-blue-50 text-blue-600 border-blue-200 border"; // 已选但未确认
                  } else {
                      if (hasAns) bg = "bg-purple-100 text-purple-700 border-purple-200 border";
                  }
                  
                  return (
                    <button key={idx} onClick={() => { setCurrentQuestionIndex(idx); setShowQuestionGrid(false); }} 
                      className={`h-10 rounded-lg text-sm font-bold ${bg} ${currentQuestionIndex === idx ? 'ring-2 ring-blue-400' : ''}`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-6 overflow-hidden">
          <div className={`${isStudy ? 'bg-blue-500' : 'bg-purple-500'} h-full rounded-full transition-all duration-300`} style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}></div>
        </div>

        <div className="flex-grow">
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Question {currentQuestionIndex + 1}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${
                    q.type === 'multiple' ? 'bg-orange-400' : (q.type === 'boolean' ? 'bg-indigo-400' : 'bg-blue-400')
                }`}>
                    {q.type === 'multiple' ? '多选' : (q.type === 'boolean' ? '判断' : '单选')}
                </span>
            </div>
            <h2 className="text-lg md:text-xl font-medium text-gray-900 leading-relaxed">{q.question}</h2>
          </div>

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              // 状态判断逻辑
              const isSelected = q.type === 'multiple' 
                  ? (currentAns as number[] || []).includes(idx)
                  : currentAns === idx;
              
              const isActualCorrect = q.type === 'multiple'
                  ? (q.correctAnswer as number[]).includes(idx)
                  : q.correctAnswer === idx;

              let btnClass = "w-full p-4 text-left border-2 rounded-xl transition-all relative flex items-start ";
              
              if (isStudy) {
                if (isConfirmed) {
                    // 练习模式已确认：显示对错
                    if (isActualCorrect) btnClass += "bg-green-50 border-green-500 text-green-800 "; 
                    else if (isSelected) btnClass += "bg-red-50 border-red-500 text-red-800 "; 
                    else btnClass += "border-gray-100 opacity-50 ";
                } else {
                    // 练习模式未确认：显示选中状态（蓝色）
                    if (isSelected) btnClass += "bg-blue-50 border-blue-500 text-blue-800 shadow-sm ";
                    else btnClass += "border-gray-100 bg-white hover:border-blue-300 hover:bg-blue-50/50 ";
                }
              } else {
                // 考试模式：只显示选中（蓝色/紫色），不显示对错
                if (isSelected) btnClass += "bg-purple-50 border-purple-500 text-purple-800 shadow-sm ";
                else btnClass += "border-gray-100 bg-white hover:border-blue-300 hover:bg-blue-50/50 ";
              }

              return (
                <button key={idx} onClick={() => handleAnswerSelect(idx)} className={btnClass} disabled={isStudy && isConfirmed}>
                  <div className="mr-3 mt-0.5">
                    {q.type === 'multiple' 
                        ? (isSelected 
                            ? <CheckSquare size={20} className={isStudy && isConfirmed ? (isActualCorrect ? "text-green-600" : "text-red-500") : (isStudy ? "text-blue-600" : "text-purple-600")} /> 
                            : <Square size={20} className="text-gray-300" />)
                        : (isSelected 
                            ? <CheckCircle size={20} className={isStudy && isConfirmed ? (isActualCorrect ? "text-green-600" : "text-red-500") : (isStudy ? "text-blue-600" : "text-purple-600")} /> 
                            : <Circle size={20} className="text-gray-300" />)
                    }
                  </div>
                  <span className="leading-snug">{getOptionLabel(idx)}. {opt}</span>
                </button>
              );
            })}
          </div>

          {/* 多选题提交按钮 */}
          {q.type === 'multiple' && isStudy && !isConfirmed && (
              <div className="mt-6">
                  <button 
                    onClick={handleConfirm}
                    disabled={currentAns === null}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md active:scale-[0.99] transition-all"
                  >
                    <Send size={18} className="mr-2" /> 确认答案
                  </button>
              </div>
          )}

          {isStudy && isConfirmed && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in slide-in-from-bottom-2">
              <div className="flex items-start space-x-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800">
                  <span className="font-bold block mb-1">答案解析</span>
                  <p className="leading-relaxed opacity-90">
                    正确答案：<span className="font-bold">{formatAnswerLabel(q.correctAnswer)}</span>。
                    {q.type === 'multiple' && !isCorrect && " (多选题需全对)"}
                    <br/>{q.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 pb-4 border-t flex justify-between items-center sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-4 px-4">
          <button onClick={prevQuestion} disabled={currentQuestionIndex === 0} className={`flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${currentQuestionIndex === 0 ? 'text-gray-300' : 'text-gray-600 active:bg-gray-100'}`}>
            <ChevronLeft size={20} className="mr-1" /> 上一题
          </button>
          {currentQuestionIndex === activeQuestions.length - 1 ? (
             <button onClick={finishQuiz} className="flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl shadow-lg active:scale-95 transition-all font-bold">
               <Save size={18} className="mr-2" /> 交卷
             </button>
          ) : (
            <button onClick={nextQuestion} className={`flex items-center px-6 py-3 text-white rounded-xl shadow-lg active:scale-95 transition-all font-bold ${isStudy ? 'bg-blue-600' : 'bg-purple-600'}`}>
              下一题 <ChevronRight size={20} className="ml-1" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const percentage = Math.round((score / activeQuestions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] animate-in zoom-in-95 duration-300 py-10">
        <div className="text-center mb-10">
          <div className="inline-block p-8 rounded-full bg-gray-50 mb-6 shadow-inner ring-8 ring-gray-50/50">
             <span className={`text-6xl font-bold ${percentage >= 60 ? 'text-green-600' : 'text-orange-600'}`}>{score}</span>
             <span className="text-gray-400 text-2xl font-medium"> / {activeQuestions.length}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{percentage >= 60 ? '考试合格 🎉' : '继续努力 💪'}</h2>
          <p className="text-gray-500">得分率 {percentage}% · {activeChapter?.title || ""}</p>
        </div>
        <div className="flex flex-col w-full max-w-xs space-y-3">
          <button onClick={() => setCurrentMode('home')} className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl active:bg-gray-50 font-medium">
            返回主页
          </button>
        </div>
      </div>
    );
  };

  // 浏览模式 (简单列表展示)
  const renderBrowse = () => (
    <div className="max-w-3xl mx-auto min-h-[600px] animate-in slide-in-from-right-4 pb-20">
      <div className="flex items-center justify-between mb-4 pb-3 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-2">
        <button onClick={() => setCurrentMode('home')} className="text-gray-600 flex items-center text-sm px-2 py-1"><ChevronLeft size={20} /> 返回</button>
        <div className="text-base font-bold text-gray-800 truncate max-w-[150px]">{activeChapter?.title || ""}</div>
      </div>
      <div className="space-y-6">
        {originalQuestions.map((q, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-start mb-2">
              <span className="text-xs bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded mr-2 mt-1">#{idx+1}</span>
              <span className={`text-xs text-white font-bold px-1.5 py-0.5 rounded mr-2 mt-1 ${q.type==='multiple'?'bg-orange-400':q.type==='boolean'?'bg-indigo-400':'bg-blue-400'}`}>{q.type==='multiple'?'多选':q.type==='boolean'?'判断':'单选'}</span>
              <h3 className="text-gray-900 font-medium">{q.question}</h3>
            </div>
            <div className="pl-0 md:pl-2 space-y-1">
              {q.options.map((opt, i) => {
                const isCorrect = Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(i) : q.correctAnswer === i;
                return (
                  <div key={i} className={`text-sm flex ${isCorrect ? 'text-green-700 font-bold' : 'text-gray-600'}`}>
                    <span className="w-5">{getOptionLabel(i)}.</span>
                    <span>{opt}</span>
                    {isCorrect && <Check size={16} className="ml-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderImport = () => (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center mb-6 pt-2">
        <button onClick={() => setCurrentMode('home')} className="mr-3 p-2 -ml-2 rounded-full text-gray-600"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-bold">导入新章节</h2>
      </div>
      <div className="flex-grow space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">章节名称</label>
          <input type="text" value={importTitle} onChange={(e) => setImportTitle(e.target.value)} placeholder="例如：期末模拟考" className="w-full p-4 bg-gray-50 border-2 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">上传文档</label>
          <label className={`flex items-center justify-between gap-4 rounded-xl border-2 border-dashed p-4 transition ${isReadingDocument ? 'bg-blue-50 border-blue-200 cursor-wait' : 'bg-gray-50 border-gray-200 cursor-pointer hover:border-blue-300 hover:bg-blue-50'}`}>
            <div className="flex items-center min-w-0">
              <div className="mr-3 rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                {isReadingDocument ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-gray-900">{isReadingDocument ? '正在读取文档' : '选择 Word 或学习通 PDF'}</div>
                <div className="text-xs text-gray-500 truncate">学习通导出 PDF 会自动清理题号导航、作业详情和跨页噪声</div>
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-blue-600">上传</span>
            <input
              type="file"
              accept=".docx,.pdf,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleDocumentUpload}
              disabled={isReadingDocument}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">题目文本 (自动识别单/多/判断)</label>
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportHint('');
            }}
            placeholder="上传文档后会自动填入，也可以直接粘贴题目文本..."
            className="w-full h-64 p-4 bg-gray-50 border-2 rounded-xl resize-none"
          />
        </div>
        {importHint && <div className="text-blue-700 text-sm bg-blue-50 p-3 rounded-xl"><FileText size={16} className="inline mr-2" />{importHint}</div>}
        {importError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle size={16} className="inline mr-2" />{importError}</div>}
      </div>
      <button
        onClick={parseImportText}
        disabled={isReadingDocument}
        className={`w-full py-4 mt-6 rounded-xl font-bold text-white ${isReadingDocument ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        识别并保存
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 py-0 md:py-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-xl min-h-screen md:min-h-[600px] p-5 md:p-8 transition-all">
        {currentMode === 'home' && renderHome()}
        {currentMode === 'subject' && renderSubject()}
        {(currentMode === 'study' || currentMode === 'exam') && renderQuiz()}
        {currentMode === 'browse' && renderBrowse()}
        {currentMode === 'result' && renderResult()}
        {currentMode === 'import' && renderImport()}
      </div>
    </div>
  );
}
