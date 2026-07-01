import fs from 'node:fs'
import path from 'node:path'

/** 清空目录内的全部条目，但保留目录本身（与 readdirSync + 逐个 unlinkSync 等价） */
export function emptyDirSync(dir: string): void {
  for (const entry of fs.readdirSync(dir)) {
    fs.unlinkSync(path.join(dir, entry))
  }
}
