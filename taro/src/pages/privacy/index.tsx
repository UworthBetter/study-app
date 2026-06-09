import { View, Text } from '@tarojs/components'
import './index.scss'

export default function Privacy() {
  return (
    <View className='privacy-page'>
      <View className='title'>隐私政策</View>
      <View className='update-date'>更新日期：2026年6月9日</View>

      <View className='section'>
        <View className='section-title'>一、信息收集</View>
        <View className='content'>
          <Text>本小程序尊重并保护用户隐私，我们收集的信息类型包括：</Text>
          <Text>1. 微信唯一标识（openid）：用于区分不同用户，实现数据隔离，不含敏感个人信息。</Text>
          <Text>2. 微信昵称和头像：用于个性化展示，用户可选择不提供。</Text>
          <Text>3. 学习数据：包括导入的题目、练习记录、考试成绩等，仅存储在用户设备本地。</Text>
          <Text>3. 设备信息：用于统计分析和问题排查，不涉及个人身份信息。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>二、信息使用</View>
        <View className='content'>
          <Text>我们收集的信息将用于：</Text>
          <Text>1. 提供和改进服务：优化用户体验，修复程序问题。</Text>
          <Text>2. 数据统计：了解用户使用习惯，改进产品功能。</Text>
          <Text>3. 安全保障：防范恶意行为，保护用户权益。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>三、信息存储</View>
        <View className='content'>
          <Text>1. 本地存储：用户的学习数据（题目、成绩等）仅存储在用户设备的本地存储中。</Text>
          <Text>2. 数据安全：我们采用合理的安全措施保护用户信息，防止未经授权的访问和泄露。</Text>
          <Text>3. 数据保留：用户数据在用户主动删除或卸载小程序前持续保留。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>四、信息共享</View>
        <View className='content'>
          <Text>我们不会向第三方共享、转让或披露用户的个人信息，但以下情况除外：</Text>
          <Text>1. 获得用户明确同意。</Text>
          <Text>2. 法律法规要求或政府机关依法要求。</Text>
          <Text>3. 为维护公共利益或保护用户合法权益。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>五、用户权利</View>
        <View className='content'>
          <Text>用户享有以下权利：</Text>
          <Text>1. 访问权：用户可随时查看自己的学习数据。</Text>
          <Text>2. 删除权：用户可通过"重置数据"功能删除所有本地数据。</Text>
          <Text>3. 更正权：用户可随时修改导入的题目内容。</Text>
          <Text>4. 撤回同意：用户可随时停止使用本小程序。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>六、未成年人保护</View>
        <View className='content'>
          <Text>我们高度重视未成年人个人信息保护。如您为未成年人，建议在监护人指导下使用本小程序。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>七、政策更新</View>
        <View className='content'>
          <Text>我们可能适时修订本隐私政策，修订后的政策将在小程序内公布。继续使用本小程序即视为同意修订后的政策。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>八、联系我们</View>
        <View className='content'>
          <Text>如对本隐私政策有任何疑问或建议，请通过小程序内的反馈功能联系我们。</Text>
        </View>
      </View>
    </View>
  )
}
