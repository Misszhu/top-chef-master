import { View, Text, Input, Textarea } from '@tarojs/components'
import { AtButton, AtSwitch } from 'taro-ui'
import { useState } from 'react'
import Taro from '@tarojs/taro'
import { createDish } from '../../services/dish'
import type { DishCreateDTO } from '../../types/dish'
import { getApiErrorMessage } from '../../utils/api-error'
import './index.scss'

type IngredientRow = { name: string; quantity: string; unit: string }
type StepRow = { description: string }

const emptyIng = (): IngredientRow => ({ name: '', quantity: '', unit: '' })
const emptyStep = (): StepRow => ({ description: '' })

export default function AddDish() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [cookingTime, setCookingTime] = useState('30')
  const [servings, setServings] = useState('2')
  const [tagsStr, setTagsStr] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'followers' | 'public'>('private')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIng()])
  const [steps, setSteps] = useState<StepRow[]>([emptyStep()])
  const [submitting, setSubmitting] = useState(false)

  const updateIng = (i: number, patch: Partial<IngredientRow>) => {
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }

  const updateStep = (i: number, desc: string) => {
    setSteps((prev) => prev.map((row, idx) => (idx === i ? { description: desc } : row)))
  }

  const handleSubmit = async () => {
    const n = name.trim()
    if (!n) {
      Taro.showToast({ title: '请填写菜名', icon: 'none' })
      return
    }
    const ings = ingredients
      .map((r) => ({
        name: r.name.trim(),
        quantity: r.quantity.trim() ? Number(r.quantity) : null,
        unit: r.unit.trim() || null,
        sequence: null as number | null,
      }))
      .filter((r) => r.name)
    if (ings.length < 1) {
      Taro.showToast({ title: '至少添加一种食材', icon: 'none' })
      return
    }
    const st = steps.map((s) => s.description.trim()).filter(Boolean)
    if (st.length < 1) {
      Taro.showToast({ title: '至少填写一个步骤', icon: 'none' })
      return
    }
    const ct = parseInt(cookingTime, 10)
    const sv = parseInt(servings, 10)
    const tags = tagsStr
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5)

    const payload: DishCreateDTO = {
      name: n,
      description: description.trim() || undefined,
      difficulty,
      cooking_time: Number.isNaN(ct) ? undefined : ct,
      servings: Number.isNaN(sv) ? undefined : sv,
      tags,
      visibility,
      comments_enabled: commentsEnabled,
      ingredients: ings.map((ing, i) => ({ ...ing, sequence: i + 1 })),
      steps: st.map((desc, i) => ({
        step_number: i + 1,
        description: desc,
      })),
    }

    setSubmitting(true)
    try {
      const dish = await createDish(payload)
      Taro.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/dish-detail/index?id=${dish.id}` })
      }, 400)
    } catch (err: any) {
      Taro.showToast({ title: getApiErrorMessage(err, '发布失败'), icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className='dish-form-page'>
      <View className='field'>
        <Text className='label'>菜名 *</Text>
        <Input className='input' value={name} onInput={(e) => setName(e.detail.value)} placeholder='例如：红烧肉' />
      </View>

      <View className='field'>
        <Text className='label'>描述</Text>
        <Textarea
          className='textarea'
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          placeholder='口味、小贴士…'
        />
      </View>

      <View className='field'>
        <Text className='label'>难度</Text>
        <View className='seg-group'>
          {(
            [
              ['easy', '简单'],
              ['medium', '中等'],
              ['hard', '困难'],
            ] as const
          ).map(([v, label]) => (
            <Text
              key={v}
              className={`seg-btn ${difficulty === v ? 'active' : ''}`}
              onClick={() => setDifficulty(v)}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      <View className='field'>
        <Text className='label'>烹饪时间（分钟）</Text>
        <Input
          className='input'
          type='number'
          value={cookingTime}
          onInput={(e) => setCookingTime(e.detail.value)}
        />
      </View>

      <View className='field'>
        <Text className='label'>份量（人份）</Text>
        <Input
          className='input'
          type='number'
          value={servings}
          onInput={(e) => setServings(e.detail.value)}
        />
      </View>

      <View className='field'>
        <Text className='label'>标签（逗号分隔，最多5个）</Text>
        <Input
          className='input'
          value={tagsStr}
          onInput={(e) => setTagsStr(e.detail.value)}
          placeholder='家常菜, 快手菜'
        />
      </View>

      <View className='field'>
        <Text className='label'>谁可以看</Text>
        <View className='seg-group'>
          {(
            [
              ['private', '仅自己'],
              ['followers', '关注者'],
              ['public', '公开'],
            ] as const
          ).map(([v, label]) => (
            <Text
              key={v}
              className={`seg-btn ${visibility === v ? 'active' : ''}`}
              onClick={() => setVisibility(v)}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      <View className='field row-inline'>
        <Text className='label' style={{ marginBottom: 0 }}>
          允许评论
        </Text>
        <AtSwitch border={false} checked={commentsEnabled} onChange={setCommentsEnabled} />
      </View>

      <View className='sub-block'>
        <Text className='sub-title'>食材 *</Text>
        {ingredients.map((row, i) => (
          <View key={i} className='field'>
            <Input
              className='input'
              value={row.name}
              onInput={(e) => updateIng(i, { name: e.detail.value })}
              placeholder='食材名称'
            />
            <View style={{ display: 'flex', gap: '12rpx', marginTop: '12rpx' }}>
              <Input
                className='input'
                style={{ flex: 1 }}
                type='digit'
                value={row.quantity}
                onInput={(e) => updateIng(i, { quantity: e.detail.value })}
                placeholder='用量'
              />
              <Input
                className='input'
                style={{ flex: 1 }}
                value={row.unit}
                onInput={(e) => updateIng(i, { unit: e.detail.value })}
                placeholder='单位'
              />
            </View>
          </View>
        ))}
        <AtButton size='small' onClick={() => setIngredients((p) => [...p, emptyIng()])}>
          添加食材行
        </AtButton>
      </View>

      <View className='sub-block'>
        <Text className='sub-title'>步骤 *</Text>
        {steps.map((row, i) => (
          <View key={i} className='field'>
            <Text className='label'>步骤 {i + 1}</Text>
            <Textarea
              className='textarea'
              value={row.description}
              onInput={(e) => updateStep(i, e.detail.value)}
              placeholder='这一步怎么做…'
            />
          </View>
        ))}
        <AtButton size='small' onClick={() => setSteps((p) => [...p, emptyStep()])}>
          添加步骤
        </AtButton>
      </View>

      <View className='footer-actions'>
        <AtButton type='primary' loading={submitting} onClick={handleSubmit}>
          发布菜谱
        </AtButton>
      </View>
    </View>
  )
}
