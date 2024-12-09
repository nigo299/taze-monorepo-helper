import { execSync } from 'node:child_process'
import path from 'node:path'
import * as glob from 'glob'
import inquirer from 'inquirer'
import chalk from 'chalk'
import { checkTazeInstalled } from './utils'

async function main() {
  // 检查 taze 是否已安装
  if (!checkTazeInstalled()) {
    console.error(chalk.red('错误: 项目中未找到 taze 依赖'))
    console.log(chalk.yellow('请先在项目中安装 taze:'))
    process.exit(1)
  }

  // 查找所有包含 package.json 的目录
  const packages = glob.sync('**/package.json', {
    ignore: ['**/node_modules/**', '**/dist/**'],
  }).map(p => path.dirname(p))

  const choices = packages.map(pkg => ({
    name: pkg === '.' ? chalk.green('根目录 (Root)') : chalk.cyan(pkg),
    value: pkg,
  }))

  // 选择要更新的包
  const { selectedPackages } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedPackages',
      message: '请选择需要更新依赖的包:',
      choices,
      validate: (answer) => {
        if (answer.length < 1) {
          return '请至少选择一个包进行更新'
        }
        return true
      },
    },
  ])

  // 选择更新模式
  const { updateMode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'updateMode',
      message: '请选择更新模式:',
      choices: [
        { name: '补丁更新 (patch)', value: 'patch' },
        { name: '次要版本更新 (minor)', value: 'minor' },
        { name: '主要版本更新 (major)', value: 'major' },
      ],
    },
  ])

  // 选择是否直接写入
  const { writeMode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'writeMode',
      message: '是否直接写入更新？',
      choices: [
        { name: '仅检查可更新的依赖', value: 'check' },
        { name: '直接写入更新', value: 'write' },
      ],
    },
  ])
  // 如果选择了根目录，询问是否递归更新所有子项目
  const isRootSelected = selectedPackages.includes('.')
  let recursive = false
  if (isRootSelected) {
    const { isRecursive } = await inquirer.prompt([
      {
        type: 'list',
        name: 'isRecursive',
        message: '是否递归更新所有子项目？',
        choices: [
          { name: '是，递归更新所有子项目 (-r)', value: true },
          { name: '否，仅更新根目录', value: false },
        ],
      },
    ])
    recursive = isRecursive
  }

  // 执行更新
  for (const pkg of selectedPackages) {
    console.log(chalk.blue(`\n正在${writeMode === 'check' ? '检查' : '更新'} ${pkg === '.' ? chalk.green('根目录 (Root)') : chalk.cyan(pkg)} 的依赖...`))
    try {
      const recursiveFlag = pkg === '.' && recursive ? ' -r' : ''
      const command = writeMode === 'write'
        ? `cd ${pkg} && npx taze ${updateMode}${recursiveFlag} -w`
        : `cd ${pkg} && npx taze ${updateMode}${recursiveFlag}`
      execSync(command, { stdio: 'inherit' })
    } catch (error) {
      console.error(chalk.red(`在处理 ${pkg} 时发生错误:`), error)
      process.exit(1)
    }
  }
}

main().catch((err) => {
  console.error(chalk.red('Error:'), err)
  process.exit(1)
})
