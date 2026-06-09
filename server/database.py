import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'study.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            openid TEXT UNIQUE NOT NULL,
            nickname TEXT DEFAULT '',
            avatar_url TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            openid TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS official_banks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            questions TEXT NOT NULL,
            category TEXT DEFAULT '',
            question_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            bank_id INTEGER NOT NULL REFERENCES official_banks(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, bank_id)
        );

        CREATE TABLE IF NOT EXISTS pending_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            title TEXT NOT NULL,
            questions TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            admin_note TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            reviewed_at TIMESTAMP
        );
    """)
    conn.commit()

    # 初始化种子数据
    _seed_official_banks(conn)
    conn.close()


def _seed_official_banks(conn):
    count = conn.execute("SELECT COUNT(*) FROM official_banks").fetchone()[0]
    if count > 0:
        return

    gailun_questions = [
        {"id": 1, "type": "single", "question": "1. (单选题)科学发展观的第一要义是( )。", "options": ["科教兴国", "要用新的发展思路实现更快更好地发展", "发展", "发展战略"], "correctAnswer": 2, "explanation": ""},
        {"id": 2, "type": "single", "question": "2. (单选题)科学发展观的基本要求是( )。", "options": ["促进人的全面发展", "坚持以人为本", "全面协调可持续", "大力发展循环经济"], "correctAnswer": 2, "explanation": ""},
        {"id": 3, "type": "single", "question": "3. (单选题)必须坚持正确处理( )的关系,把改革的力度、发展的速度和社会可承受的程度统一起来...", "options": ["改革开放发展", "改革发展稳定", "内政国防外交", "经济政治文化"], "correctAnswer": 1, "explanation": ""},
        {"id": 4, "type": "single", "question": "4. (单选题)和谐社会的特征不包括( )。", "options": ["绝对稳定", "公平正义", "充满活力", "民主法治"], "correctAnswer": 0, "explanation": ""},
        {"id": 5, "type": "single", "question": "5. (单选题)科学发展观提出的背景之一是2003年的( )。", "options": ["禽流感疫情", "口蹄疫疫情", "疯牛病疫情", "非典疫情"], "correctAnswer": 3, "explanation": ""},
        {"id": 6, "type": "single", "question": "6. (单选题)科学发展观回答了新形势下( )的重大问题...", "options": ["建设什么样的党,怎样建设党", "实现什么样的发展,怎样发展", "什么是社会主义,怎样建设社会主义", "什么是中国特色社会主义,怎样建设中国特色社会主义"], "correctAnswer": 1, "explanation": ""},
        {"id": 7, "type": "single", "question": "7. (单选题)建设( )、环境友好型社会...", "options": ["循环利用型", "资源节约型", "生态优美型", "污染零排放"], "correctAnswer": 1, "explanation": ""},
        {"id": 8, "type": "single", "question": "8. (单选题)( )是党和国家到二〇二〇年的奋斗目标...", "options": ["全面建成小康社会", "基本建成小康社会", "基本实现现代化", "走出社会主义初级阶段"], "correctAnswer": 0, "explanation": ""},
        {"id": 9, "type": "single", "question": "9. (单选题)构建社会主义和谐社会要求着力解决( )。", "options": ["GDP速度问题", "政治不民主问题", "人民最关心、最直接、最现实的利益问题", "生态破坏问题"], "correctAnswer": 2, "explanation": ""},
        {"id": 10, "type": "single", "question": "10. (单选题)要坚持把( )作为正确处理改革发展稳定关系的结合点...", "options": ["改善人民生活", "解决社会矛盾", "促进对外开放", "增进政治民主"], "correctAnswer": 0, "explanation": ""},
        {"id": 11, "type": "single", "question": "11. (单选题)2006年,中共( )通过了《关于构建社会主义和谐社会若干重大问题的决定》。", "options": ["十六大", "十六届六中全会", "十七大", "十七届三中全会"], "correctAnswer": 1, "explanation": ""},
        {"id": 12, "type": "single", "question": "12. (单选题)\"五个统筹\"不包括( )。", "options": ["统筹经济社会发展", "统筹阶层矛盾解决", "统筹区域发展", "统筹国内发展和对外开放"], "correctAnswer": 1, "explanation": ""},
        {"id": 13, "type": "single", "question": "13. (单选题)必须坚持在( )下,全社会共同建设社会主义和谐社会。", "options": ["改革开放", "深化改革", "经济发展", "党的领导"], "correctAnswer": 3, "explanation": ""},
        {"id": 14, "type": "single", "question": "14. (单选题)科学发展过程中,要更加注重解决( )问题...", "options": ["发展不平衡", "发展速度慢", "发展效率", "发展环境"], "correctAnswer": 0, "explanation": ""},
        {"id": 15, "type": "single", "question": "15. (单选题)构建和谐社会应逐步实现( )。", "options": ["公共服务均等化", "基本公共服务均等化", "税收应收皆收", "财政支出缩小化"], "correctAnswer": 1, "explanation": ""},
        {"id": 16, "type": "single", "question": "16. (单选题)改革开放以来,我国发展所积累的丰富经验包括把坚持社会主义基本制度同( )结合起来。", "options": ["发展计划经济", "发展市场经济", "市场为主", "计划为主"], "correctAnswer": 1, "explanation": ""},
        {"id": 17, "type": "single", "question": "17. (单选题)胡锦涛指出,( )是解决中国一切问题的总钥匙。", "options": ["发展", "改革", "开放", "稳定"], "correctAnswer": 0, "explanation": ""},
        {"id": 18, "type": "single", "question": "18. (单选题)坚持科学发展,要把( )作为根本出发点和落脚点。", "options": ["保障和改善民生", "保护生态环境", "提升经济发展速度", "政治进步"], "correctAnswer": 0, "explanation": ""},
        {"id": 19, "type": "single", "question": "19. (单选题)科学发展观中的\"全面\"发展指的是包括经济建设等在内的( )的发展。", "options": ["五位一体", "四位一体", "三位一体", "六位一体"], "correctAnswer": 0, "explanation": ""},
        {"id": 20, "type": "multiple", "question": "20. (多选题)我们要更好实施( ),着力把握发展规律...", "options": ["科教兴国战略", "人才强国战略", "可持续发展战略", "计划生育战略"], "correctAnswer": [0, 1, 2], "explanation": ""},
        {"id": 21, "type": "multiple", "question": "21. (多选题)深入贯彻落实科学发展观,要求我们( )。", "options": ["始终坚持\"一个中心、两个基本点\"的基本路线", "积极构建社会主义和谐社会", "继续深化改革开放", "切实加强和改进党的建设"], "correctAnswer": [0, 1, 2, 3], "explanation": ""},
        {"id": 22, "type": "multiple", "question": "22. (多选题)我国已进入改革发展的关键时期,( )...", "options": ["经济体制深刻变革", "社会结构深刻变动", "利益格局深刻调整", "思想观念深刻变化"], "correctAnswer": [0, 1, 2, 3], "explanation": ""},
        {"id": 23, "type": "multiple", "question": "23. (多选题)在经济发展的基础上,我们要更加注重社会公平,( ),促进共同富裕。", "options": ["着力提高低收入者收入水平", "逐步扩大中等收入者比重", "有效调节过高收入", "坚决取缔非法收入"], "correctAnswer": [0, 1, 2, 3], "explanation": ""},
        {"id": 24, "type": "multiple", "question": "24. (多选题)中国特色社会主义理论体系,就是包括( )在内的科学理论体系。", "options": ["邓小平理论", "\"三个代表\"重要思想", "科学发展观", "习近平新时代中国特色社会主义思想"], "correctAnswer": [0, 1, 2, 3], "explanation": ""},
        {"id": 25, "type": "multiple", "question": "25. (多选题)加快转变经济发展方式,推动产业结构优化升级...", "options": ["科技进步", "劳动者素质提高", "管理创新", "服务业发展"], "correctAnswer": [0, 1, 2], "explanation": ""},
        {"id": 26, "type": "multiple", "question": "26. (多选题)实施可持续发展战略,就要实现经济发展同人口、资源、环境相协调,坚持走( )的文明发展道路。", "options": ["高度自主", "生产发展", "生活富裕", "生态良好"], "correctAnswer": [1, 2, 3], "explanation": ""},
        {"id": 27, "type": "multiple", "question": "27. (多选题)新形势下,党面临的考验包括( )。", "options": ["执政考验", "改革开放考验", "市场经济考验", "外部环境考验"], "correctAnswer": [0, 1, 2, 3], "explanation": ""},
        {"id": 28, "type": "multiple", "question": "28. (多选题)新形势下,党面临的危险包括( )。", "options": ["精神懈怠的危险", "能力不足的危险", "脱离群众的危险", "消极腐败的危险"], "correctAnswer": [0, 1, 2, 3], "explanation": ""},
        {"id": 29, "type": "multiple", "question": "29. (多选题)科学发展观是( )。", "options": ["对经济社会发展一般规律认识的深化", "马克思主义关于发展的世界观和方法论的集中体现", "中国特色社会主义理论体系的重要组成部分", "马克思主义中国化的最新理论成果"], "correctAnswer": [0, 1, 2], "explanation": ""},
        {"id": 30, "type": "boolean", "question": "30. (判断题)当前中国协调发展取得显著成绩...缩小城乡、区域发展差距和促进经济社会协调发展任务不再艰巨。", "options": ["对", "错"], "correctAnswer": 1, "explanation": "任务依然艰巨。"},
        {"id": 31, "type": "boolean", "question": "31. (判断题)科学发展观的可持续发展,就是既要考虑当前发展的需要...为子孙后代着想。", "options": ["对", "错"], "correctAnswer": 0, "explanation": ""},
        {"id": 32, "type": "boolean", "question": "32. (判断题)统筹兼顾是科学发展观的核心。", "options": ["对", "错"], "correctAnswer": 1, "explanation": "核心是以人为本，根本方法是统筹兼顾。"},
        {"id": 33, "type": "boolean", "question": "33. (判断题)科学发展观回答的是在全面建设小康社会和实现现代化的进程中...", "options": ["对", "错"], "correctAnswer": 1, "explanation": "回答了\"实现什么样的发展、怎样发展\"等重大问题。"},
        {"id": 34, "type": "boolean", "question": "34. (判断题)目前,我国社会总体上是和谐的。不存在影响社会和谐的矛盾和问题。", "options": ["对", "错"], "correctAnswer": 1, "explanation": "矛盾和问题依然存在。"},
        {"id": 35, "type": "boolean", "question": "35. (判断题)社会和谐在很大程度上取决于社会生产力的发展水平,取决于发展的协调性。", "options": ["对", "错"], "correctAnswer": 0, "explanation": ""},
        {"id": 36, "type": "boolean", "question": "36. (判断题)必须坚持用发展的办法解决前进中的问题...", "options": ["对", "错"], "correctAnswer": 0, "explanation": ""},
        {"id": 37, "type": "boolean", "question": "37. (判断题)社会主义协商民主充分体现了社会主义民主的真实性广泛性、包容性。", "options": ["对", "错"], "correctAnswer": 0, "explanation": ""},
        {"id": 38, "type": "boolean", "question": "38. (判断题)社会主义愈发展,民主就愈发展。", "options": ["对", "错"], "correctAnswer": 0, "explanation": ""},
        {"id": 39, "type": "boolean", "question": "39. (判断题)转变经济增长方式包含着转变经济发展方式的内容。", "options": ["对", "错"], "correctAnswer": 1, "explanation": "转变经济发展方式包含着转变经济增长方式，后者是前者的基础和重要组成部分，范围不同。"},
        {"id": 40, "type": "boolean", "question": "40. (判断题)全面深化经济体制改革是加快转变经济发展方式的关键。", "options": ["对", "错"], "correctAnswer": 0, "explanation": ""},
    ]

    file_mgmt_questions = [
        {"id": 1, "type": "single", "question": "设置当前工作目录的主要目的是（   ）。", "options": ["节省外存空间", "节省内存空间", "加快文件的检索速度", "加快文件的读写速度"], "correctAnswer": 2, "explanation": "设置当前工作目录可以大大减少路径名的字符数，从而加快文件的检索速度。"},
    ]

    banks = [
        {"title": "概论练习8 (含多选)", "questions": gailun_questions, "category": "政治理论"},
        {"title": "第8、9章（文件管理）大作业", "questions": file_mgmt_questions, "category": "操作系统"},
    ]

    for bank in banks:
        questions_json = json.dumps(bank["questions"], ensure_ascii=False)
        conn.execute(
            "INSERT INTO official_banks (title, questions, category, question_count) VALUES (?, ?, ?, ?)",
            (bank["title"], questions_json, bank["category"], len(bank["questions"])),
        )
    conn.commit()
