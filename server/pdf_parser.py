import fitz  # PyMuPDF
import re


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """使用 PyMuPDF 从 PDF 中提取文本"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    all_text = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        # 使用 "text" 模式直接提取文本，保持阅读顺序
        text = page.get_text("text")
        if text.strip():
            all_text.append(text)

    doc.close()
    return "\n\n".join(all_text)


def clean_pdf_noise(text: str) -> str:
    """清理 PDF 中常见的噪声文本"""
    # 移除私有使用区字符（学习通PDF中的特殊标记）
    text = re.sub(r'[-]', '', text)

    # 移除 "一. 单选题（100分）" 和 "作业详情" 之间的所有内容（包括跨行）
    text = re.sub(r'一\s*\.\s*(?:单选|多选|判断)题[\s\S]{0,300}?作业详情', '', text)

    # 移除重复的 "AI讲解"
    text = re.sub(r'(?:AI\s*讲解\s*)+', '', text)

    # 移除分值标记
    text = re.sub(r'\d+(?:\.\d+)?\s*分', '', text)

    # 移除页码
    text = re.sub(r'^\s*\d+\s*/\s*\d+\s*$', '', text, flags=re.MULTILINE)

    # 移除纯数字行（题号导航）
    text = re.sub(r'^\s*(?:\d{1,2}\s+){2,}\d{1,2}\s*$', '', text, flags=re.MULTILINE)

    # 移除空行
    text = re.sub(r'\n{3,}', '\n\n', text)

    return text.strip()


def parse_pdf(pdf_bytes: bytes) -> str:
    """解析 PDF 并返回清理后的文本"""
    raw_text = extract_text_from_pdf(pdf_bytes)
    cleaned = clean_pdf_noise(raw_text)
    return cleaned