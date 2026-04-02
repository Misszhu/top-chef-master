import { View, Text, Input, Textarea, Image } from '@tarojs/components'
import { AtButton, AtSwitch, AtActivityIndicator } from 'taro-ui'
import { useCallback, useEffect, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import RecipeStepsEditor, { emptyRecipeStep } from '../../../components/recipe-steps-editor'
import { getDishById, updateDish, uploadDishCover } from '../../../services/dish'
import type { Dish, DishCreateDTO } from '../../../types/dish'
import { getApiErrorCode, getApiErrorMessage } from '../../../utils/api-error'
import './index.scss'

type IngredientRow = { name: string; quantity: string; unit: string }

const emptyIng = (): IngredientRow => ({ name: '', quantity: '', unit: '' })

export default function EditDish() {
  const router = useRouter()
  const { id } = router.params

  const [loading, setLoading] = useState(true)
  const [dishVersion, setDishVersion] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [cookingTime, setCookingTime] = useState('30')
  const [servings, setServings] = useState('2')
  const [tagsStr, setTagsStr] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'followers' | 'public'>('private')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [ingredients, setIngredients] = useState<IngredientRow[]>([emptyIng()])
  const [steps, setSteps] = useState([emptyRecipeStep()])
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  const applyDishToForm = useCallback((d: Dish) => {
    setDishVersion(d.version)
    setName(d.name)
    setDescription(d.description || '')
    setDifficulty((d.difficulty as 'easy' | 'medium' | 'hard') || 'easy')
    setCookingTime(String(d.cooking_time != null ? d.cooking_time : ''))
    setServings(String(d.servings != null ? d.servings : ''))
    setTagsStr((d.tags || []).join(', '))
    setVisibility(d.visibility)
    setCommentsEnabled(d.comments_enabled)
    setImageUrl(d.image_url || null)
    if (d.ingredients && d.ingredients.length) {
      setIngredients(
        d.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity != null ? String(ing.quantity) : '',
          unit: ing.unit || '',
        }))
      )
    } else {
      setIngredients([emptyIng()])
    }
    if (d.steps && d.steps.length) {
      setSteps(
        d.steps
          .slice()
          .sort((a, b) => a.step_number - b.step_number)
          .map((s) => ({
            description: s.description,
            image_url: s.image_url || null,
          }))
      )
    } else {
      setSteps([emptyRecipeStep()])
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const d: Dish = await getDishById(id as string)
        applyDishToForm(d)
      } catch {
        Taro.showToast({ title: '加载失败', icon: 'error' })
        setTimeout(() => Taro.navigateBack(), 500)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, applyDishToForm])

  const pickTempImagePath = async (): Promise<string | null> => {
    try {
      const r = await Taro.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
      })
      const p = r.tempFiles?.[0]?.tempFilePath
      if (p) return p
    } catch {
      // 部分端不支持 chooseMedia 时降级
    }
    try {
      const r = await Taro.chooseImage({ count: 1, sourceType: ['album', 'camera'] })
      return r.tempFilePaths?.[0] ?? null
    } catch (e: any) {
      if (String(e?.errMsg || '').includes('cancel')) return null
      throw e
    }
  }

  const handleUploadCover = async () => {
    if (!id) return
    let path: string | null
    try {
      path = await pickTempImagePath()
    } catch {
      Taro.showToast({ title: '无法选择图片', icon: 'none' })
      return
    }
    if (!path) return

    setCoverUploading(true)
    Taro.showLoading({ title: '上传中...' })
    try {
      const updated = await uploadDishCover(id as string, path, dishVersion)
      setImageUrl(updated.image_url || null)
      setDishVersion(updated.version)
      Taro.showToast({ title: '封面已更新', icon: 'success' })
    } catch (err: any) {
      const code = getApiErrorCode(err)
      if (code === 'VERSION_CONFLICT') {
        Taro.showModal({
          title: '内容已在其他端更新',
          content: '是否重新加载最新内容？当前选择的图片未上传。',
          success: async (res) => {
            if (res.confirm && id) {
              try {
                const d = await getDishById(id as string)
                applyDishToForm(d)
                Taro.showToast({ title: '已刷新', icon: 'none' })
              } catch {
                Taro.showToast({ title: '刷新失败', icon: 'none' })
              }
            }
          },
        })
      } else {
        Taro.showToast({ title: getApiErrorMessage(err, '上传失败'), icon: 'none' })
      }
    } finally {
      Taro.hideLoading()
      setCoverUploading(false)
    }
  }

  const updateIng = (i: number, patch: Partial<IngredientRow>) => {
    setIngredients((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }

  const handleSubmit = async () => {
    if (!id) return
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
    const validSteps = steps.filter((s) => s.description.trim() || s.image_url)
    if (validSteps.length < 1) {
      Taro.showToast({ title: '至少添加一个步骤（说明或步骤图）', icon: 'none' })
      return
    }
    const ct = parseInt(cookingTime, 10)
    const sv = parseInt(servings, 10)
    const tags = tagsStr
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 5)

    const payload: Partial<DishCreateDTO> & { ifMatchVersion: number } = {
      name: n,
      description: description.trim() || undefined,
      difficulty,
      cooking_time: Number.isNaN(ct) ? undefined : ct,
      servings: Number.isNaN(sv) ? undefined : sv,
      tags,
      visibility,
      comments_enabled: commentsEnabled,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ingredients: ings.map((ing, i) => ({ ...ing, sequence: i + 1 })),
      steps: validSteps.map((s, i) => ({
        step_number: i + 1,
        description: s.description.trim() || '',
        ...(s.image_url ? { image_url: s.image_url } : {}),
      })),
      ifMatchVersion: dishVersion,
    }

    setSubmitting(true)
    try {
      const updated = await updateDish(id as string, payload)
      setDishVersion(updated.version)
      Taro.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 400)
    } catch (err: any) {
      const code = getApiErrorCode(err)
      if (code === 'VERSION_CONFLICT') {
        Taro.showModal({
          title: '内容已在其他端更新',
          content: '是否重新加载最新内容？未保存的修改将丢失。',
          success: async (res) => {
            if (res.confirm && id) {
              try {
                const d = await getDishById(id as string)
                applyDishToForm(d)
                Taro.showToast({ title: '已刷新', icon: 'none' })
              } catch {
                Taro.showToast({ title: '刷新失败', icon: 'none' })
              }
            }
          },
        })
      } else {
        Taro.showToast({ title: getApiErrorMessage(err, '保存失败'), icon: 'none' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={{ padding: '80rpx' }}>
        <AtActivityIndicator mode='center' content='加载中...' />
      </View>
    )
  }

  return (
    <View className='dish-form-page'>
      <View className='field cover-field'>
        <Text className='label'>封面图</Text>
        <View className='cover-row'>
          <View className='cover-preview-wrap'>
            {imageUrl ? (
              <Image className='cover-preview' src={imageUrl} mode='aspectFill' />
            ) : (
              <View className='cover-placeholder'>
                <Text className='cover-placeholder-text'>暂无封面</Text>
              </View>
            )}
          </View>
          <View className='cover-actions'>
            <AtButton size='small' loading={coverUploading} onClick={handleUploadCover}>
              {imageUrl ? '更换封面' : '上传封面'}
            </AtButton>
            <Text className='cover-hint'>支持相册或拍照，jpg/png/webp/gif，最大 5MB</Text>
          </View>
        </View>
      </View>

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
        <RecipeStepsEditor steps={steps} onChange={setSteps} />
      </View>

      <View className='footer-actions'>
        <AtButton type='primary' loading={submitting} onClick={handleSubmit}>
          保存修改
        </AtButton>
      </View>
    </View>
  )
}
