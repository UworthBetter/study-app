import { Text } from '@tarojs/components'

interface IconProps {
  size?: number
  className?: string
  color?: string
}

const iconStyle = (size: number, color?: string) => ({
  width: `${size}px`,
  height: `${size}px`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: color || 'inherit',
  fontSize: `${size}px`,
  lineHeight: 1,
  flexShrink: 0,
})

export function BookOpen({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>📖</Text>
}

export function CheckCircle({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>✓</Text>
}

export function RotateCcw({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>↺</Text>
}

export function FileText({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>📄</Text>
}

export function Plus({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>＋</Text>
}

export function Award({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>🏅</Text>
}

export function AlertCircle({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>💡</Text>
}

export function ChevronRight({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>›</Text>
}

export function ChevronLeft({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>‹</Text>
}

export function Save({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>💾</Text>
}

export function Eye({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>👁</Text>
}

export function Trash2({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>🗑</Text>
}

export function LayoutGrid({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>⊞</Text>
}

export function X({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>✕</Text>
}

export function RefreshCw({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>⟳</Text>
}

export function CheckSquare({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>☑</Text>
}

export function Square({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>☐</Text>
}

export function Circle({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>○</Text>
}

export function Check({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>✓</Text>
}

export function Send({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>➜</Text>
}

export function Upload({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>↑</Text>
}

export function Loader2({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>⏳</Text>
}

export function User({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>👤</Text>
}

export function Download({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>↓</Text>
}

export function ChevronDown({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>﹀</Text>
}

export function ChevronUp({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>﹁</Text>
}

export function Layers({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>📚</Text>
}

export function Monitor({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>🖥</Text>
}

export function GitBranch({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>🌲</Text>
}

export function ArrowLeft({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>←</Text>
}

export function FolderOpen({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>📂</Text>
}

export function BookMarked({ size = 24, color, className }: IconProps) {
  return <Text style={iconStyle(size, color)} className={className}>🔖</Text>
}
