import { View, Text, Button, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { AlertCircle, Upload, FileText, Loader2 } from './icons'
import './Import.scss'

interface Props {
  title: string
  text: string
  error: string
  onTitleChange: (val: string) => void
  onTextChange: (val: string) => void
  onParse: () => void
}

// 服务器地址，开发时使用本地地址
const API_BASE = 'http://127.0.0.1:5000'

export default function ImportComp({
  title,
  text,
  error,
  onTitleChange,
  onTextChange,
  onParse,
}: Props) {
  const [isReading, setIsReading] = useState(false)
  const [hint, setHint] = useState('')

  const handleChooseFile = () => {
    Taro.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.txt', '.docx', '.pdf', '.doc'],
      success: (res) => {
        if (res.tempFiles.length === 0) return

        const file = res.tempFiles[0]
        const fileName = file.name
        const extension = fileName.split('.').pop()?.toLowerCase()

        if (extension === 'txt') {
          // 读取txt文件
          readTxtFile(file.path, fileName)
        } else if (extension === 'docx' || extension === 'pdf') {
          // 通过服务器解析Word和PDF
          uploadToServer(file.path, fileName, extension)
        } else if (extension === 'doc') {
          Taro.showToast({
            title: '暂不支持.doc，请先转为.docx',
            icon: 'none',
            duration: 2000
          })
        } else {
          Taro.showToast({
            title: '仅支持 .txt/.docx/.pdf 文件',
            icon: 'none'
          })
        }
      },
      fail: () => {
        // 用户取消选择
      }
    })
  }

  const readTxtFile = (filePath: string, fileName: string) => {
    const fs = Taro.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      encoding: 'utf-8',
      success: (result) => {
        const content = result.data as string
        if (content && content.trim()) {
          onTextChange(content.trim())
          if (!title.trim()) {
            onTitleChange(fileName.replace(/\.[^.]+$/, ''))
          }
          setHint(`已从 ${fileName} 提取 ${content.length} 个字符`)
        } else {
          Taro.showToast({ title: '文件内容为空', icon: 'none' })
        }
      },
      fail: () => {
        Taro.showToast({ title: '读取文件失败', icon: 'none' })
      }
    })
  }

  const uploadToServer = (filePath: string, fileName: string, type: string) => {
    setIsReading(true)
    setHint('')

    Taro.showLoading({ title: '正在解析文档...' })

    Taro.uploadFile({
      url: `${API_BASE}/api/parse-pdf`,
      filePath: filePath,
      name: 'file',
      success: (res) => {
        Taro.hideLoading()

        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            if (data.text && data.text.trim()) {
              onTextChange(data.text.trim())
              if (!title.trim()) {
                onTitleChange(fileName.replace(/\.[^.]+$/, ''))
              }
              setHint(`已从 ${fileName} 提取 ${data.text.length} 个字符`)
            } else {
              Taro.showToast({
                title: '未能提取到文字内容',
                icon: 'none'
              })
            }
          } catch (e) {
            Taro.showToast({
              title: '解析结果异常',
              icon: 'none'
            })
          }
        } else {
          Taro.showToast({
            title: '服务器解析失败，请复制内容粘贴',
            icon: 'none',
            duration: 3000
          })
        }
      },
      fail: (err) => {
        Taro.hideLoading()
        console.error('上传失败:', err)
        Taro.showToast({
          title: '无法连接服务器，请复制内容粘贴',
          icon: 'none',
          duration: 3000
        })
      },
      complete: () => {
        setIsReading(false)
      }
    })
  }

  const handleTextChange = (val: string) => {
    onTextChange(val)
    setHint('')
  }

  return (
    <View className='import-page'>
      <View className='import-body'>
        <View className='form-group'>
          <Text className='form-label'>章节名称</Text>
          <Input
            className='form-input'
            value={title}
            onInput={(e) => onTitleChange(e.detail.value)}
            placeholder='例如：期末模拟考'
          />
        </View>

        <View className='form-group'>
          <Text className='form-label'>上传文档</Text>
          <View
            className={`upload-area ${isReading ? 'reading' : ''}`}
            onClick={!isReading ? handleChooseFile : undefined}
          >
            <View className='upload-icon'>
              {isReading ? <Loader2 size={22} className='spin' color='#ffffff' /> : <Upload size={22} color='#ffffff' />}
            </View>
            <View className='upload-info'>
              <Text className='upload-title'>
                {isReading ? '正在解析文档...' : '选择 Word、PDF 或 TXT 文件'}
              </Text>
              <Text className='upload-desc'>
                {isReading ? '请稍候' : '支持 .txt .docx .pdf 格式'}
              </Text>
            </View>
            <Text className='upload-action'>上传</Text>
          </View>
        </View>

        <View className='form-group'>
          <Text className='form-label'>题目文本 (自动识别单/多/判断)</Text>
          <Textarea
            className='form-textarea'
            value={text}
            onInput={(e) => handleTextChange(e.detail.value)}
            placeholder='上传文档后会自动填入，也可以直接粘贴题目文本...'
            maxlength={-1}
          />
        </View>

        {hint && (
          <View className='hint-msg'>
            <FileText size={16} color='#4338ca' />
            <Text>{hint}</Text>
          </View>
        )}

        {error && (
          <View className='error-msg'>
            <AlertCircle size={16} color='#dc2626' />
            <Text>{error}</Text>
          </View>
        )}
      </View>

      <Button
        className={`parse-btn ${isReading ? 'disabled' : ''}`}
        onClick={!isReading ? onParse : undefined}
        disabled={isReading}
      >
        识别并保存
      </Button>
    </View>
  )
}
