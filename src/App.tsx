import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
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
  Send 
} from 'lucide-react';

// --- 类型定义 ---
type QuestionType = 'single' | 'multiple' | 'boolean';

interface Question {
  id: number;
  type: QuestionType; 
  question: string;
  options: string[];
  correctAnswer: number | number[]; 
  userAnswer?: number | number[] | null;
  explanation?: string;
}

interface Chapter {
  id: string;
  title: string;
  questions: Question[];
  createDate: number;
}

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

// --- 预置数据 ---

const FILE_MANAGEMENT_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'single',
    question: "设置当前工作目录的主要目的是（   ）。",
    options: ["节省外存空间", "节省内存空间", "加快文件的检索速度", "加快文件的读写速度"],
    correctAnswer: 2,
    explanation: "设置当前工作目录可以大大减少路径名的字符数，从而加快文件的检索速度。"
  },
];

const GAILUN_QUESTIONS: Question[] = [
  // --- 单选题 ---
  { id: 1, type: 'single', question: "1. (单选题)科学发展观的第一要义是( )。", options: ["科教兴国", "要用新的发展思路实现更快更好地发展", "发展", "发展战略"], correctAnswer: 2, explanation: "" },
  { id: 2, type: 'single', question: "2. (单选题)科学发展观的基本要求是( )。", options: ["促进人的全面发展", "坚持以人为本", "全面协调可持续", "大力发展循环经济"], correctAnswer: 2, explanation: "" },
  { id: 3, type: 'single', question: "3. (单选题)必须坚持正确处理( )的关系,把改革的力度、发展的速度和社会可承受的程度统一起来...", options: ["改革开放发展", "改革发展稳定", "内政国防外交", "经济政治文化"], correctAnswer: 1, explanation: "" },
  { id: 4, type: 'single', question: "4. (单选题)和谐社会的特征不包括( )。", options: ["绝对稳定", "公平正义", "充满活力", "民主法治"], correctAnswer: 0, explanation: "" },
  { id: 5, type: 'single', question: "5. (单选题)科学发展观提出的背景之一是2003年的( )。", options: ["禽流感疫情", "口蹄疫疫情", "疯牛病疫情", "非典疫情"], correctAnswer: 3, explanation: "" },
  { id: 6, type: 'single', question: "6. (单选题)科学发展观回答了新形势下( )的重大问题...", options: ["建设什么样的党,怎样建设党", "实现什么样的发展,怎样发展", "什么是社会主义,怎样建设社会主义", "什么是中国特色社会主义,怎样建设中国特色社会主义"], correctAnswer: 1, explanation: "" },
  { id: 7, type: 'single', question: "7. (单选题)建设( )、环境友好型社会...", options: ["循环利用型", "资源节约型", "生态优美型", "污染零排放"], correctAnswer: 1, explanation: "" },
  { id: 8, type: 'single', question: "8. (单选题)( )是党和国家到二〇二〇年的奋斗目标...", options: ["全面建成小康社会", "基本建成小康社会", "基本实现现代化", "走出社会主义初级阶段"], correctAnswer: 0, explanation: "" },
  { id: 9, type: 'single', question: "9. (单选题)构建社会主义和谐社会要求着力解决( )。", options: ["GDP速度问题", "政治不民主问题", "人民最关心、最直接、最现实的利益问题", "生态破坏问题"], correctAnswer: 2, explanation: "" },
  { id: 10, type: 'single', question: "10. (单选题)要坚持把( )作为正确处理改革发展稳定关系的结合点...", options: ["改善人民生活", "解决社会矛盾", "促进对外开放", "增进政治民主"], correctAnswer: 0, explanation: "" },
  { id: 11, type: 'single', question: "11. (单选题)2006年,中共( )通过了《关于构建社会主义和谐社会若干重大问题的决定》。", options: ["十六大", "十六届六中全会", "十七大", "十七届三中全会"], correctAnswer: 1, explanation: "" },
  { id: 12, type: 'single', question: "12. (单选题)“五个统筹”不包括( )。", options: ["统筹经济社会发展", "统筹阶层矛盾解决", "统筹区域发展", "统筹国内发展和对外开放"], correctAnswer: 1, explanation: "" },
  { id: 13, type: 'single', question: "13. (单选题)必须坚持在( )下,全社会共同建设社会主义和谐社会。", options: ["改革开放", "深化改革", "经济发展", "党的领导"], correctAnswer: 3, explanation: "" },
  { id: 14, type: 'single', question: "14. (单选题)科学发展过程中,要更加注重解决( )问题...", options: ["发展不平衡", "发展速度慢", "发展效率", "发展环境"], correctAnswer: 0, explanation: "" },
  { id: 15, type: 'single', question: "15. (单选题)构建和谐社会应逐步实现( )。", options: ["公共服务均等化", "基本公共服务均等化", "税收应收皆收", "财政支出缩小化"], correctAnswer: 1, explanation: "" },
  { id: 16, type: 'single', question: "16. (单选题)改革开放以来,我国发展所积累的丰富经验包括把坚持社会主义基本制度同( )结合起来。", options: ["发展计划经济", "发展市场经济", "市场为主", "计划为主"], correctAnswer: 1, explanation: "" },
  { id: 17, type: 'single', question: "17. (单选题)胡锦涛指出,( )是解决中国一切问题的总钥匙。", options: ["发展", "改革", "开放", "稳定"], correctAnswer: 0, explanation: "" },
  { id: 18, type: 'single', question: "18. (单选题)坚持科学发展,要把( )作为根本出发点和落脚点。", options: ["保障和改善民生", "保护生态环境", "提升经济发展速度", "政治进步"], correctAnswer: 0, explanation: "" },
  { id: 19, type: 'single', question: "19. (单选题)科学发展观中的“全面”发展指的是包括经济建设等在内的( )的发展。", options: ["五位一体", "四位一体", "三位一体", "六位一体"], correctAnswer: 0, explanation: "" },
  
  // --- 多选题 ---
  { id: 20, type: 'multiple', question: "20. (多选题)我们要更好实施( ),着力把握发展规律...", options: ["科教兴国战略", "人才强国战略", "可持续发展战略", "计划生育战略"], correctAnswer: [0, 1, 2], explanation: "" },
  { id: 21, type: 'multiple', question: "21. (多选题)深入贯彻落实科学发展观,要求我们( )。", options: ["始终坚持“一个中心、两个基本点”的基本路线", "积极构建社会主义和谐社会", "继续深化改革开放", "切实加强和改进党的建设"], correctAnswer: [0, 1, 2, 3], explanation: "" },
  { id: 22, type: 'multiple', question: "22. (多选题)我国已进入改革发展的关键时期,( )...", options: ["经济体制深刻变革", "社会结构深刻变动", "利益格局深刻调整", "思想观念深刻变化"], correctAnswer: [0, 1, 2, 3], explanation: "" },
  { id: 23, type: 'multiple', question: "23. (多选题)在经济发展的基础上,我们要更加注重社会公平,( ),促进共同富裕。", options: ["着力提高低收入者收入水平", "逐步扩大中等收入者比重", "有效调节过高收入", "坚决取缔非法收入"], correctAnswer: [0, 1, 2, 3], explanation: "" },
  { id: 24, type: 'multiple', question: "24. (多选题)中国特色社会主义理论体系,就是包括( )在内的科学理论体系。", options: ["邓小平理论", "“三个代表”重要思想", "科学发展观", "习近平新时代中国特色社会主义思想"], correctAnswer: [0, 1, 2, 3], explanation: "" },
  { id: 25, type: 'multiple', question: "25. (多选题)加快转变经济发展方式,推动产业结构优化升级...", options: ["科技进步", "劳动者素质提高", "管理创新", "服务业发展"], correctAnswer: [0, 1, 2], explanation: "" },
  { id: 26, type: 'multiple', question: "26. (多选题)实施可持续发展战略,就要实现经济发展同人口、资源、环境相协调,坚持走( )的文明发展道路。", options: ["高度自主", "生产发展", "生活富裕", "生态良好"], correctAnswer: [1, 2, 3], explanation: "" },
  { id: 27, type: 'multiple', question: "27. (多选题)新形势下,党面临的考验包括( )。", options: ["执政考验", "改革开放考验", "市场经济考验", "外部环境考验"], correctAnswer: [0, 1, 2, 3], explanation: "" },
  { id: 28, type: 'multiple', question: "28. (多选题)新形势下,党面临的危险包括( )。", options: ["精神懈怠的危险", "能力不足的危险", "脱离群众的危险", "消极腐败的危险"], correctAnswer: [0, 1, 2, 3], explanation: "" },
  { id: 29, type: 'multiple', question: "29. (多选题)科学发展观是( )。", options: ["对经济社会发展一般规律认识的深化", "马克思主义关于发展的世界观和方法论的集中体现", "中国特色社会主义理论体系的重要组成部分", "马克思主义中国化的最新理论成果"], correctAnswer: [0, 1, 2], explanation: "" },

  // --- 判断题 ---
  { id: 30, type: 'boolean', question: "30. (判断题)当前中国协调发展取得显著成绩...缩小城乡、区域发展差距和促进经济社会协调发展任务不再艰巨。", options: ["对", "错"], correctAnswer: 1, explanation: "任务依然艰巨。" },
  { id: 31, type: 'boolean', question: "31. (判断题)科学发展观的可持续发展,就是既要考虑当前发展的需要...为子孙后代着想。", options: ["对", "错"], correctAnswer: 0, explanation: "" },
  { id: 32, type: 'boolean', question: "32. (判断题)统筹兼顾是科学发展观的核心。", options: ["对", "错"], correctAnswer: 1, explanation: "核心是以人为本，根本方法是统筹兼顾。" },
  { id: 33, type: 'boolean', question: "33. (判断题)科学发展观回答的是在全面建设小康社会和实现现代化的进程中...", options: ["对", "错"], correctAnswer: 1, explanation: "回答了“实现什么样的发展、怎样发展”等重大问题。" },
  { id: 34, type: 'boolean', question: "34. (判断题)目前,我国社会总体上是和谐的。不存在影响社会和谐的矛盾和问题。", options: ["对", "错"], correctAnswer: 1, explanation: "矛盾和问题依然存在。" },
  { id: 35, type: 'boolean', question: "35. (判断题)社会和谐在很大程度上取决于社会生产力的发展水平,取决于发展的协调性。", options: ["对", "错"], correctAnswer: 0, explanation: "" },
  { id: 36, type: 'boolean', question: "36. (判断题)必须坚持用发展的办法解决前进中的问题...", options: ["对", "错"], correctAnswer: 0, explanation: "" },
  { id: 37, type: 'boolean', question: "37. (判断题)社会主义协商民主充分体现了社会主义民主的真实性广泛性、包容性。", options: ["对", "错"], correctAnswer: 0, explanation: "" },
  { id: 38, type: 'boolean', question: "38. (判断题)社会主义愈发展,民主就愈发展。", options: ["对", "错"], correctAnswer: 0, explanation: "" },
  { id: 39, type: 'boolean', question: "39. (判断题)转变经济增长方式包含着转变经济发展方式的内容。", options: ["对", "错"], correctAnswer: 1, explanation: "转变经济发展方式包含着转变经济增长方式，后者是前者的基础和重要组成部分，范围不同。" },
  { id: 40, type: 'boolean', question: "40. (判断题)全面深化经济体制改革是加快转变经济发展方式的关键。", options: ["对", "错"], correctAnswer: 0, explanation: "" },
];

const DEFAULT_CHAPTERS: Chapter[] = [
  {
    id: 'gailun-ex8',
    title: '概论练习8 (含多选)',
    questions: GAILUN_QUESTIONS,
    createDate: Date.now()
  },
  {
    id: 'file-mgmt-hw',
    title: '第8、9章（文件管理）大作业',
    questions: FILE_MANAGEMENT_QUESTIONS,
    createDate: Date.now()
  }
];

export default function App() {
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    try {
      const saved = localStorage.getItem('study-app-data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CHAPTERS;
  });
  
  const [activeChapterId, setActiveChapterId] = useState<string>(() => {
      return chapters.length > 0 ? chapters[0].id : '';
  });

  const [currentMode, setCurrentMode] = useState<'chapter_list' | 'study' | 'exam' | 'browse' | 'result' | 'import'>('chapter_list');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(number | number[] | null)[]>([]);
  // 新增: confirmedQuestions 用于练习模式下追踪哪些题目已经“提交/确认”了
  const [confirmedQuestions, setConfirmedQuestions] = useState<Set<number>>(new Set());
  
  const [showQuestionGrid, setShowQuestionGrid] = useState(false); 
  const [score, setScore] = useState(0);
  
  const [importText, setImportText] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    localStorage.setItem('study-app-data', JSON.stringify(chapters));
  }, [chapters]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || chapters[0];
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
      const newChapters = chapters.filter(c => c.id !== id);
      setChapters(newChapters);
      if (activeChapterId === id && newChapters.length > 0) {
        setActiveChapterId(newChapters[0].id);
      }
    }
  };

  const resetData = () => {
    if (window.confirm('重置将丢失所有导入数据，恢复默认题库？')) {
      setChapters(DEFAULT_CHAPTERS);
      localStorage.setItem('study-app-data', JSON.stringify(DEFAULT_CHAPTERS));
      alert('已恢复。');
    }
  };

  // --- 智能解析引擎 (修复 D 选项粘连) ---
  const parseImportText = () => {
    setImportError('');
    if (!importTitle.trim()) { setImportError("请输入章节名称"); return; }

    try {
      const newQuestions: Question[] = [];
      const lines = importText.split('\n');
      
      let currentQ: Partial<Question> | null = null;
      let options: string[] = [];
      // 新增状态：是否处于解析选项的阶段
      let isParsingOptions = false; 
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const questionMatch = line.match(/^(\d+)[\.、]\s*(.*)/);
        
        if (questionMatch) {
          if (currentQ && options.length > 0) {
            currentQ.options = [...options];
            if (currentQ.correctAnswer === undefined) currentQ.correctAnswer = 0; 
            newQuestions.push(currentQ as Question);
          }

          let qType: QuestionType = 'single';
          const content = questionMatch[2];
          if (content.includes('多选') || content.includes('多项')) qType = 'multiple';
          else if (content.includes('判断') || content.includes('对错')) qType = 'boolean';

          currentQ = {
            id: newQuestions.length + 1,
            type: qType,
            question: content,
            options: [],
            explanation: ''
          };
          options = [];
          isParsingOptions = true; // 开始新题，默认进入选项/题目解析阶段
        } else if (currentQ) {
            // 1. 关键检测：检查这行是否是“页脚信息”或“答案开始”
            // 优化：增加 \s* 以兼容行首空格，增加对 : 开头的行的检测
            const isFooterLine = 
                /^\s*(?:我的)?答案[:：]/.test(line) || 
                /^\s*正确答案[:：]/.test(line) ||
                /^\s*[:：]/.test(line) || // 识别以冒号开头的解析行 (如 ":命令方式;")
                /^\s*\d+\s*分\s*$/.test(line) || // 识别 "1分", " 1 分 "
                /^\s*(?:知识点|AI讲解|解析)[:：]?/.test(line);

            if (isFooterLine) {
                isParsingOptions = false;
            }

            // 2. 尝试提取正确答案
            const correctMatch = line.match(/正确答案[:：]?\s*([A-E]+|对|错)/i);
            if (correctMatch) {
                let ansStr = correctMatch[1].toUpperCase();
                
                if (currentQ.type === 'boolean') {
                    currentQ.correctAnswer = (ansStr === '对' || ansStr === 'A') ? 0 : 1;
                    if (options.length === 0) options = ["对", "错"];
                } else if (currentQ.type === 'multiple') {
                    const indices: number[] = [];
                    for(let char of ansStr) {
                        const code = char.charCodeAt(0) - 65;
                        if (code >= 0 && code <= 10) indices.push(code);
                    }
                    currentQ.correctAnswer = indices.sort((a,b)=>a-b);
                } else {
                    currentQ.correctAnswer = ansStr.charCodeAt(0) - 65;
                }

                // 同行解析提取
                const expl = line.replace(/.*(?:正确)?答案[:：]?\s*[A-E对错]+[;；]?/gi, '').replace(/AI讲解|解析|知识点[:：]?/g, '').trim();
                if (expl) currentQ.explanation = expl;
                continue;
            }

            // 3. 遇到“我的答案”，也标志着选项结束，但不提取内容
            if (/^\s*(?:我的)?答案[:：]/.test(line)) {
                isParsingOptions = false;
                continue;
            }

            // 4. 识别选项 (A. xxx)
            const optionMatches = [...line.matchAll(/(?:●\s*)?([A-E])[\.、]\s*(.*?)(?=\s+(?:●\s*)?[A-E][\.、]|$)/g)];
            if (optionMatches.length > 0) {
                isParsingOptions = true; // 确认是选项
                optionMatches.forEach(m => options.push(m[2].trim()));
            } else if (line.match(/^\s*(?:●\s*)?[A-E][\.、]/)) {
                 isParsingOptions = true;
                 options.push(line.replace(/^\s*(?:●\s*)?[A-E][\.、]\s*/, '').trim());
            } else {
                 // 5. 续行处理：只有当 isParsingOptions 为 true 且不是页脚行时，才追加到选项
                 if (isParsingOptions && !isFooterLine) {
                     if (options.length === 0) {
                         currentQ.question += "\n" + line;
                     } else {
                         // 追加到最后一个选项
                         options[options.length - 1] += " " + line;
                     }
                 } else {
                     // 否则，追加到解析（过滤掉分值等无用信息）
                     if (!/^\s*\d+\s*分\s*$/.test(line) && !/^\s*[:：]/.test(line)) {
                        const cleanLine = line.replace(/^(?:AI讲解|解析|知识点)[:：]?\s*/, '');
                        if (cleanLine.trim()) currentQ.explanation = (currentQ.explanation ? currentQ.explanation + "\n" : "") + cleanLine;
                     }
                 }
            }
        }
      }

      if (currentQ && options.length > 0) {
        currentQ.options = [...options];
        if (currentQ.correctAnswer === undefined) currentQ.correctAnswer = (currentQ.type === 'multiple' ? [] : 0);
        newQuestions.push(currentQ as Question);
      }

      if (newQuestions.length === 0) { setImportError("未识别到题目"); return; }

      const newChapter: Chapter = {
        id: Date.now().toString(),
        title: importTitle,
        questions: newQuestions,
        createDate: Date.now()
      };

      setChapters([...chapters, newChapter]);
      setCurrentMode('chapter_list');
      setImportText('');
      setImportTitle('');
    } catch (e) {
      setImportError("解析错误: " + e);
    }
  };

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  // --- 界面渲染 ---

  const renderChapterList = () => (
    <div className="flex flex-col min-h-[500px] animate-in fade-in duration-500 pb-10">
      <div className="text-center space-y-4 mb-8 pt-4">
        <div className="bg-blue-100 p-4 rounded-full inline-block shadow-sm">
          <BookOpen size={40} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的习题库</h1>
          <p className="text-gray-500 text-sm mt-1">支持单选、多选、判断题</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full">
        {chapters.map(chapter => (
          <div key={chapter.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 active:scale-[0.99] transition-transform">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{chapter.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{chapter.questions.length} 道题目</p>
              </div>
              {chapters.length > 1 && (
                <button onClick={(e) => deleteChapter(e, chapter.id)} className="text-gray-300 hover:text-red-500 p-2">
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('study'); }} className="flex-1 flex items-center justify-center py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
                <FileText size={16} className="mr-1.5" /> 练习
              </button>
              <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('exam'); }} className="flex-1 flex items-center justify-center py-2.5 bg-purple-50 text-purple-700 rounded-lg font-medium text-sm">
                <Award size={16} className="mr-1.5" /> 考试
              </button>
              <button onClick={() => { setActiveChapterId(chapter.id); setCurrentMode('browse'); }} className="flex-1 flex items-center justify-center py-2.5 bg-green-50 text-green-700 rounded-lg font-medium text-sm">
                <Eye size={16} className="mr-1.5" /> 阅览
              </button>
            </div>
          </div>
        ))}
        <button onClick={() => setCurrentMode('import')} className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-gray-400 active:bg-gray-50 flex items-center justify-center font-medium">
          <Plus size={20} className="mr-2" /> 导入新章节
        </button>
        <div className="pt-8 flex justify-center">
            <button onClick={resetData} className="text-xs text-gray-400 flex items-center hover:text-gray-600">
              <RefreshCw size={12} className="mr-1" /> 恢复默认题库
            </button>
        </div>
      </div>
    </div>
  );

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
          <button onClick={() => setCurrentMode('chapter_list')} className="text-gray-500 active:text-gray-800 flex items-center text-sm p-2 -ml-2 rounded-lg">
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
          <p className="text-gray-500">得分率 {percentage}% · {activeChapter.title}</p>
        </div>
        <div className="flex flex-col w-full max-w-xs space-y-3">
          <button onClick={() => setCurrentMode('chapter_list')} className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl active:bg-gray-50 font-medium">
            返回列表
          </button>
        </div>
      </div>
    );
  };

  // 浏览模式 (简单列表展示)
  const renderBrowse = () => (
    <div className="max-w-3xl mx-auto min-h-[600px] animate-in slide-in-from-right-4 pb-20">
      <div className="flex items-center justify-between mb-4 pb-3 border-b sticky top-0 bg-white/95 backdrop-blur-sm z-10 pt-2">
        <button onClick={() => setCurrentMode('chapter_list')} className="text-gray-600 flex items-center text-sm px-2 py-1"><ChevronLeft size={20} /> 返回</button>
        <div className="text-base font-bold text-gray-800 truncate max-w-[150px]">{activeChapter.title}</div>
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
        <button onClick={() => setCurrentMode('chapter_list')} className="mr-3 p-2 -ml-2 rounded-full text-gray-600"><ChevronLeft size={24} /></button>
        <h2 className="text-xl font-bold">导入新章节</h2>
      </div>
      <div className="flex-grow space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">章节名称</label>
          <input type="text" value={importTitle} onChange={(e) => setImportTitle(e.target.value)} placeholder="例如：期末模拟考" className="w-full p-4 bg-gray-50 border-2 rounded-xl" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">题目文本 (自动识别单/多/判断)</label>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="粘贴PDF复制的文本..." className="w-full h-64 p-4 bg-gray-50 border-2 rounded-xl resize-none" />
        </div>
        {importError && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl"><AlertCircle size={16} className="inline mr-2" />{importError}</div>}
      </div>
      <button onClick={parseImportText} className="w-full py-4 mt-6 bg-blue-600 text-white rounded-xl font-bold">识别并保存</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 py-0 md:py-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-xl min-h-screen md:min-h-[600px] p-5 md:p-8 transition-all">
        {currentMode === 'chapter_list' && renderChapterList()}
        {(currentMode === 'study' || currentMode === 'exam') && renderQuiz()}
        {currentMode === 'browse' && renderBrowse()}
        {currentMode === 'result' && renderResult()}
        {currentMode === 'import' && renderImport()}
      </div>
    </div>
  );
}