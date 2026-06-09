import { View, Text } from '@tarojs/components'
import './index.scss'

export default function Agreement() {
  return (
    <View className='agreement-page'>
      <View className='title'>用户协议</View>
      <View className='update-date'>更新日期：2025年1月1日</View>

      <View className='section'>
        <View className='section-title'>一、服务说明</View>
        <View className='content'>
          <Text>习题练习小程序（以下简称"本小程序"）是一款面向学生和学习者的题库练习工具，提供题目导入、练习、考试等功能。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>二、用户权利与义务</View>
        <View className='content'>
          <Text>1. 用户有权使用本小程序提供的各项功能进行学习和练习。</Text>
          <Text>2. 用户应保证导入的内容不侵犯他人知识产权，不包含违法违规信息。</Text>
          <Text>3. 用户应妥善保管自己的学习数据，本小程序不对数据丢失承担责任。</Text>
          <Text>4. 用户不得利用本小程序进行任何违法或有害活动。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>三、知识产权</View>
        <View className='content'>
          <Text>1. 本小程序的程序代码、界面设计、商标等知识产权归开发者所有。</Text>
          <Text>2. 用户导入的题目内容版权归原作者所有，本小程序仅提供存储和展示服务。</Text>
          <Text>3. 预置题库内容仅供学习参考，不得用于商业用途。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>四、免责声明</View>
        <View className='content'>
          <Text>1. 本小程序提供的题目和答案仅供参考，不保证完全准确。</Text>
          <Text>2. 因网络故障、系统维护等原因导致的服务中断，本小程序不承担责任。</Text>
          <Text>3. 用户因使用本小程序产生的任何损失，本小程序不承担赔偿责任。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>五、协议修改</View>
        <View className='content'>
          <Text>本小程序有权根据需要修改本协议，修改后的协议将在小程序内公布。继续使用本小程序即视为同意修改后的协议。</Text>
        </View>
      </View>

      <View className='section'>
        <View className='section-title'>六、联系方式</View>
        <View className='content'>
          <Text>如对本协议有任何疑问，请通过小程序内的反馈功能联系我们。</Text>
        </View>
      </View>
    </View>
  )
}
