import { View, Text, Image, Textarea } from '@tarojs/components'
import { AtButton } from 'taro-ui'
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { uploadRecipeImage } from '../../services/upload'
import { getApiErrorMessage } from '../../utils/api-error'
import './index.scss'

export type RecipeStepRow = { description: string; image_url: string | null }

export function emptyRecipeStep(): RecipeStepRow {
  return { description: '', image_url: null }
}

type Props = {
  steps: RecipeStepRow[]
  onChange: (next: RecipeStepRow[]) => void
}

async function pickOneImagePath(): Promise<string | null> {
  try {
    const r = await Taro.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
    })
    const p = r.tempFiles && r.tempFiles[0] ? r.tempFiles[0].tempFilePath : ''
    if (p) return p
  } catch {
    // 降级
  }
  try {
    const r = await Taro.chooseImage({ count: 1, sourceType: ['album', 'camera'] })
    return r.tempFilePaths && r.tempFilePaths[0] ? r.tempFilePaths[0] : null
  } catch (e: any) {
    if (String(e && e.errMsg ? e.errMsg : '').includes('cancel')) return null
    throw e
  }
}

async function pickManyImagePaths(max: number): Promise<string[]> {
  try {
    const r = await Taro.chooseMedia({
      count: max,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
    })
    const files = r.tempFiles || []
    return files.map((f) => f.tempFilePath).filter(Boolean)
  } catch {
    return []
  }
}

export default function RecipeStepsEditor({ steps, onChange }: Props) {
  const stepsRef = useRef(steps)
  useEffect(() => {
    stepsRef.current = steps
  }, [steps])

  const [portrait, setPortrait] = useState(false)
  const [batchBusy, setBatchBusy] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const updateStep = (i: number, patch: Partial<RecipeStepRow>) => {
    onChange(steps.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  }

  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    const t = next[i]
    next[i] = next[j]
    next[j] = t
    onChange(next)
  }

  const addStep = () => {
    onChange([...steps, emptyRecipeStep()])
  }

  const ensureLoggedIn = (): boolean => {
    if (!Taro.getStorageSync('token')) {
      Taro.showToast({ title: '请先登录后再上传图片', icon: 'none' })
      return false
    }
    return true
  }

  const handleStepImageTap = async (index: number) => {
    if (uploadingIndex !== null) return
    let path: string | null
    try {
      path = await pickOneImagePath()
    } catch {
      Taro.showToast({ title: '无法选择图片', icon: 'none' })
      return
    }
    if (!path) return
    if (!ensureLoggedIn()) return

    setUploadingIndex(index)
    Taro.showLoading({ title: '上传中...' })
    try {
      const url = await uploadRecipeImage(path)
      updateStep(index, { image_url: url })
    } catch (e: any) {
      Taro.showToast({ title: getApiErrorMessage(e, '上传失败'), icon: 'none' })
    } finally {
      Taro.hideLoading()
      setUploadingIndex(null)
    }
  }

  const handleBatchUpload = async () => {
    if (batchBusy) return
    if (!ensureLoggedIn()) return

    const paths = await pickManyImagePaths(9)
    if (paths.length === 0) return

    setBatchBusy(true)
    Taro.showLoading({ title: '上传中 0/' + paths.length })
    const urls: string[] = []
    try {
      for (let k = 0; k < paths.length; k++) {
        Taro.showLoading({ title: `上传中 ${k + 1}/${paths.length}` })
        const url = await uploadRecipeImage(paths[k])
        urls.push(url)
      }

      const prev = stepsRef.current
      const next = [...prev]
      let ui = 0
      for (let i = 0; i < next.length && ui < urls.length; i++) {
        if (!next[i].image_url) {
          next[i] = { ...next[i], image_url: urls[ui] }
          ui++
        }
      }
      while (ui < urls.length) {
        next.push({ description: '', image_url: urls[ui] })
        ui++
      }
      onChange(next)

      Taro.showToast({ title: '已批量添加步骤图', icon: 'success' })
    } catch (e: any) {
      Taro.showToast({ title: getApiErrorMessage(e, '批量上传失败'), icon: 'none' })
    } finally {
      Taro.hideLoading()
      setBatchBusy(false)
    }
  }

  const showAdjustHint = () => {
    Taro.showToast({
      title: '请使用各步骤下方的「上移」「下移」调整顺序',
      icon: 'none',
      duration: 2600,
    })
  }

  return (
    <View className='recipe-steps-editor'>
      <View className='steps-section-head'>
        <Text className='steps-section-title'>做法</Text>
        <View className='steps-head-actions'>
          <Text
            className={`steps-chip ${portrait ? 'active' : ''}`}
            onClick={() => setPortrait(!portrait)}
          >
            切换竖图
          </Text>
          <Text
            className={`steps-chip ${batchBusy ? 'steps-chip--disabled active' : ''}`}
            onClick={handleBatchUpload}
          >
            批量传图
          </Text>
        </View>
      </View>
      <Text className='steps-order-hint'>排序：使用各步的「上移 / 下移」。步骤需填写说明或上传步骤图至少一项。</Text>

      {steps.map((row, i) => (
        <View key={i} className='step-card'>
          <Text className='label'>步骤 {i + 1}</Text>
          <View
            className={`step-image-box ${portrait ? 'step-image-box--portrait' : ''}`}
            onClick={() => handleStepImageTap(i)}
          >
            {row.image_url ? (
              <Image className='step-image-full' src={row.image_url} mode='aspectFill' />
            ) : (
              <View className='step-image-placeholder'>
                <Text className='step-image-plus'>+ 步骤图</Text>
                <Text className='step-image-hint'>清晰的步骤会让菜谱更受欢迎</Text>
              </View>
            )}
            {uploadingIndex === i ? (
              <View className='step-image-loading'>
                <Text>上传中...</Text>
              </View>
            ) : null}
          </View>
          {row.image_url ? (
            <Text className='step-remove-img' onClick={() => updateStep(i, { image_url: null })}>
              移除步骤图
            </Text>
          ) : null}
          <Textarea
            className='step-textarea'
            value={row.description}
            onInput={(e) => updateStep(i, { description: e.detail.value })}
            placeholder='添加步骤说明'
          />
          <View className='step-reorder'>
            <Text
              className={`step-reorder-btn ${i === 0 ? 'step-reorder-btn--muted' : ''}`}
              onClick={() => moveStep(i, -1)}
            >
              上移
            </Text>
            <Text
              className={`step-reorder-btn ${i === steps.length - 1 ? 'step-reorder-btn--muted' : ''}`}
              onClick={() => moveStep(i, 1)}
            >
              下移
            </Text>
          </View>
        </View>
      ))}

      <View className='steps-bottom-bar'>
        <AtButton size='small' onClick={showAdjustHint}>
          调整步骤
        </AtButton>
        <AtButton size='small' onClick={addStep}>
          再增加一步
        </AtButton>
      </View>
    </View>
  )
}
