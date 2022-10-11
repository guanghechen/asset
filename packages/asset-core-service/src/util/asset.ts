import invariant from '@guanghechen/invariant'
import fs from 'fs-extra'
import path from 'path'

export function assertSafeLocation(rootDir: string, location: string): void | never {
  invariant(
    location.startsWith(rootDir.replace(/\/?$/, '/')),
    `[assertSafeLocation] !!!unsafe location. rootDir: ${rootDir}, location: ${location}`,
  )
}

export function assertExistedLocation(location: string): void | never {
  invariant(fs.existsSync(location), `[assertExistedLocation] Cannot find file. (${location})`)
}

export function assertExistedFilepath(filepath: string): void | never {
  assertExistedLocation(filepath)
  const stat = fs.statSync(filepath)
  invariant(stat.isFile(), `[assertExistedFilepath] Not a file'. (${filepath})`)
}

export function mkdirsIfNotExists(filepath: string, isDir: boolean): void {
  const dirPath = isDir ? filepath : path.dirname(filepath)
  if (fs.existsSync(dirPath)) return
  fs.mkdirsSync(dirPath)
}
