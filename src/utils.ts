import fs from 'node:fs'
import chalk from 'chalk'

export function checkTazeInstalled(): boolean {
  try {

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'))


    return !!(
      (packageJson.dependencies && packageJson.dependencies.taze) ||
      (packageJson.devDependencies && packageJson.devDependencies.taze)
    )
  }
  catch (error) {
    console.error(chalk.red('读取 package.json 失败:'), error)
    return false
  }
}



