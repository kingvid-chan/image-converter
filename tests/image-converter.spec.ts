import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures')

const BASE = '/projects/image-converter/'

/**
 * 辅助函数：在浏览器中通过 Canvas 生成指定格式的 Blob，然后下载到本地
 * 用于动态创建测试用的 JPEG/WebP/BMP 文件
 */
async function generateTestImage(
  page: import('@playwright/test').Page,
  format: 'image/jpeg' | 'image/webp' | 'image/bmp' | 'image/png',
  quality = 0.92,
): Promise<{ name: string; path: string }> {
  // 在浏览器中生成图片 Blob
  const result = await page.evaluate(async ({ format, quality }) => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    // 绘制彩色方块
    ctx.fillStyle = '#FF6B6B'
    ctx.fillRect(0, 0, 50, 50)
    ctx.fillStyle = '#4ECDC4'
    ctx.fillRect(50, 0, 50, 50)
    ctx.fillStyle = '#45B7D1'
    ctx.fillRect(0, 50, 50, 50)
    ctx.fillStyle = '#96CEB4'
    ctx.fillRect(50, 50, 50, 50)

    if (format === 'image/bmp') {
      // BMP: 手动编码（简化版）
      const imageData = ctx.getImageData(0, 0, 100, 100)
      const { data, width, height } = imageData
      const rowBytes = Math.floor((width * 3 + 3) / 4) * 4
      const pixelSize = rowBytes * height
      const fileSize = 54 + pixelSize
      const buf = new ArrayBuffer(fileSize)
      const dv = new DataView(buf)
      let off = 0
      dv.setUint8(off, 0x42); dv.setUint8(off + 1, 0x4D); off += 2
      dv.setUint32(off, fileSize, true); off += 4
      dv.setUint32(off, 0, true); off += 4
      dv.setUint32(off, 54, true); off += 4
      dv.setUint32(off, 40, true); off += 4
      dv.setInt32(off, width, true); off += 4
      dv.setInt32(off, height, true); off += 4
      dv.setUint16(off, 1, true); off += 2
      dv.setUint16(off, 24, true); off += 2
      dv.setUint32(off, 0, true); off += 4
      dv.setUint32(off, pixelSize, true); off += 4
      dv.setInt32(off, 2835, true); off += 4
      dv.setInt32(off, 2835, true); off += 4
      dv.setUint32(off, 0, true); off += 4
      dv.setUint32(off, 0, true); off += 4
      for (let y = 0; y < height; y++) {
        const srcRow = (height - 1 - y) * width * 4
        const dstRow = 54 + y * rowBytes
        for (let x = 0; x < width; x++) {
          const si = srcRow + x * 4, di = dstRow + x * 3
          dv.setUint8(di, data[si + 2])
          dv.setUint8(di + 1, data[si + 1])
          dv.setUint8(di + 2, data[si])
        }
      }
      return Array.from(new Uint8Array(buf))
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return reject('toBlob failed')
        const arr = new Uint8Array(await blob.arrayBuffer())
        resolve(Array.from(arr))
      }, format, quality)
    })
  }, { format, quality })

  // 将字节数组写入临时文件
  const fs = await import('fs')
  const ext = format.split('/')[1] === 'jpeg' ? 'jpg' : format.split('/')[1]
  const filePath = path.join(FIXTURES, `gen-test.${ext}`)
  fs.writeFileSync(filePath, Buffer.from(result))
  return { name: `gen-test.${ext}`, path: filePath }
}

test.describe('图片格式转换器 — 单文件模式', () => {
  test('页面加载正确显示标题和版本', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('h1')).toContainText('图片格式转换器')
    await expect(page.locator('text=v0.0.1')).toBeVisible()
    await expect(page.locator('text=单文件转换')).toBeVisible()
    await expect(page.locator('text=批量转换')).toBeVisible()
  })

  test('拖拽区域显示正确', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.locator('text=拖拽图片到此处')).toBeVisible()
    await expect(page.locator('text=PNG')).toBeVisible()
    await expect(page.locator('text=JPEG')).toBeVisible()
  })

  test('单文件 PNG→JPEG 转换流程', async ({ page }) => {
    await page.goto(BASE)

    // 选择测试 PNG 文件
    const pngFile = path.join(FIXTURES, 'test-image.png')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(pngFile)

    // 验证文件已选择
    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()

    // 选择目标格式 JPEG
    await page.locator('select').selectOption('image/jpeg')

    // 点击转换
    await page.locator('button:has-text("开始转换")').click()

    // 等待转换完成 — 应该显示预览和结果
    await expect(page.locator('text=原图')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=转换后')).toBeVisible({ timeout: 5000 })

    // 验证文件大小对比区域出现
    await expect(page.locator('text=文件大小对比')).toBeVisible()

    // 应该有下载按钮
    await expect(page.locator('button:has-text("下载转换后图片")')).toBeVisible()
  })

  test('单文件 PNG→BMP 转换流程', async ({ page }) => {
    await page.goto(BASE)

    const pngFile = path.join(FIXTURES, 'test-image.png')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(pngFile)

    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()

    // 选择 BMP 目标格式
    await page.locator('select').selectOption('image/bmp')

    // 转换
    await page.locator('button:has-text("开始转换")').click()

    // 验证转换完成
    await expect(page.locator('text=原图')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=转换后')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=BMP')).toBeVisible()
  })

  test('模式切换清空状态', async ({ page }) => {
    await page.goto(BASE)

    // 先加载一个文件
    const pngFile = path.join(FIXTURES, 'test-image.png')
    await page.locator('input[type="file"]').setInputFiles(pngFile)
    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()

    // 切换到批量模式
    await page.locator('button:has-text("批量转换")').click()
    // 切换后文件应清空
    await expect(page.locator('text=拖拽图片到此处')).toBeVisible()

    // 切回单文件模式
    await page.locator('button:has-text("单文件转换")').click()
    await expect(page.locator('text=拖拽图片到此处')).toBeVisible()
  })
})

test.describe('图片格式转换器 — 批量模式', () => {
  test('批量模式：多文件选择并显示缩略图', async ({ page }) => {
    await page.goto(BASE)

    // 切换到批量模式
    await page.locator('button:has-text("批量转换")').click()

    // 选择多个文件
    const pngFile = path.join(FIXTURES, 'test-image.png')
    const redFile = path.join(FIXTURES, 'red-1x1.png')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles([pngFile, redFile])

    // 验证显示了文件数量
    await expect(page.locator('text=已选择 2 个文件')).toBeVisible()
  })

  test('批量模式：转换并打包下载 ZIP', async ({ page }) => {
    await page.goto(BASE)

    // 切换到批量模式
    await page.locator('button:has-text("批量转换")').click()

    // 选择文件
    const pngFile = path.join(FIXTURES, 'test-image.png')
    const redFile = path.join(FIXTURES, 'red-1x1.png')
    await page.locator('input[type="file"]').setInputFiles([pngFile, redFile])

    // 选择目标格式
    await page.locator('select').selectOption('image/jpeg')

    // 点击批量转换
    await page.locator('button:has-text("开始批量转换")').click()

    // 等待转换完成
    await expect(page.locator('text=全部转换完成')).toBeVisible({ timeout: 15000 })

    // 验证结果列表
    await expect(page.locator('text=转换结果')).toBeVisible()

    // 下载按钮可见
    await expect(page.locator('button:has-text("打包下载 ZIP")')).toBeVisible()

    // 触发下载
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("打包下载 ZIP")').click(),
    ])

    // 验证 ZIP 文件名
    expect(download.suggestedFilename()).toContain('.zip')
  })

  test('批量模式：可移除单个文件', async ({ page }) => {
    await page.goto(BASE)
    await page.locator('button:has-text("批量转换")').click()

    const pngFile = path.join(FIXTURES, 'test-image.png')
    const redFile = path.join(FIXTURES, 'red-1x1.png')
    await page.locator('input[type="file"]').setInputFiles([pngFile, redFile])

    await expect(page.locator('text=已选择 2 个文件')).toBeVisible()

    // 鼠标悬停显示移除按钮并点击
    const firstFileCard = page.locator('.group').first()
    await firstFileCard.hover()
    const removeBtn = firstFileCard.locator('button[title="移除"]')
    await removeBtn.click()

    // 验证只剩余 1 个文件
    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()
  })
})

test.describe('图片格式转换器 — 异常处理', () => {
  test('非图片文件拖入应显示错误提示', async ({ page }) => {
    await page.goto(BASE)

    const nonImageFile = path.join(FIXTURES, 'not-image.pdf')
    await page.locator('input[type="file"]').setInputFiles(nonImageFile)

    // 应该显示错误提示
    await expect(page.locator('text=不支持的文件格式')).toBeVisible({ timeout: 5000 })
  })

  test('损坏图片应显示错误提示', async ({ page }) => {
    await page.goto(BASE)

    // 选择一个有效文件先
    const pngFile = path.join(FIXTURES, 'test-image.png')
    await page.locator('input[type="file"]').setInputFiles(pngFile)
    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()

    // 重新选择损坏文件
    const corruptedFile = path.join(FIXTURES, 'corrupted.png')
    await page.locator('input[type="file"]').setInputFiles(corruptedFile)

    // 可能触发格式校验错误或转换时损坏检测 — 需要页面有文件才能点转换
    // 先检查是否已经在拖拽区显示了错误
    const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false)
    if (!hasError) {
      // 如果校验通过了(因为文件扩展名是.png)，尝试转换触发损坏检测
      const hasFile = await page.locator('text=已选择 1 个文件').isVisible().catch(() => false)
      if (hasFile) {
        await page.locator('select').selectOption('image/jpeg')
        await page.locator('button:has-text("开始转换")').click()
        // 等待错误提示（可能转换失败）
        await page.waitForTimeout(3000)
      }
    }
    // 无论哪条路径，应该有错误提示
    // corrupted.png 的 magic bytes 是随机的，可能被 validator 检测为非图片
    const errorVisible = await page.locator('[role="alert"]').isVisible()
      .catch(() => false)
    const errorText = await page.locator('text=不支持|损坏|失败|无法解析').isVisible()
      .catch(() => false)
    expect(errorVisible || errorText).toBeTruthy()
  })

  test('同格式转换应显示提示', async ({ page }) => {
    await page.goto(BASE)

    const pngFile = path.join(FIXTURES, 'test-image.png')
    await page.locator('input[type="file"]').setInputFiles(pngFile)
    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()

    // 目标格式也是 PNG（与源格式相同）
    await page.locator('select').selectOption('image/png')

    // 应显示同格式提示
    await expect(page.locator('text=已是 PNG 格式')).toBeVisible()
  })

  test('重新选择按钮重置状态', async ({ page }) => {
    await page.goto(BASE)

    const pngFile = path.join(FIXTURES, 'test-image.png')
    await page.locator('input[type="file"]').setInputFiles(pngFile)
    await expect(page.locator('text=已选择 1 个文件')).toBeVisible()

    await page.locator('select').selectOption('image/jpeg')
    await page.locator('button:has-text("开始转换")').click()
    await expect(page.locator('text=转换后')).toBeVisible({ timeout: 10000 })

    // 点击重新选择
    await page.locator('button:has-text("重新选择")').click()
    // 状态应重置
    await expect(page.locator('text=拖拽图片到此处')).toBeVisible({ timeout: 3000 })
  })
})
