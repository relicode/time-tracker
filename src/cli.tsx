#!/usr/bin/env node
import { hideBin } from 'yargs/helpers'
import { readFile, writeFile } from 'node:fs/promises'
import { render } from 'ink'
import React from 'react'
import yargs from 'yargs'

import App, { LogEntry } from './app.js'
import Report, { type TimeRecord } from './report.js'
import { toHoursAndMinutes } from './utils.js'

const isRecord = (obj?: Partial<TimeRecord>): obj is TimeRecord => {
  if (!obj || typeof obj !== 'object') return false
  for (const prop of ['start', 'end', 'task'] as (keyof TimeRecord)[]) {
    if (!obj[prop]) {
      console.error(obj)
      throw new Error(`Property missing: ${prop}`)
    }
  }
  return true
}

const argv = yargs(hideBin(process.argv))
  .scriptName('time-tracker')
  .strict(true)
  .wrap(100)
  .command('* <data file>', 'Run and write to data file', (y) =>
    y.positional('data file', {
      describe: 'path to the data file',
      type: 'string',
    })
  )
  .command('report [<data files>...]', 'Print report for data file(s)', (y) =>
    y.positional('data files', {
      describe: 'path to the data file',
      type: 'string',
    })
  )

const main = async () => {
  // Run interactive time tracker
  if ('datafile' in argv.argv && typeof argv.argv['datafile'] === 'string') {
    const dataFile = argv.argv['datafile']
    let entries: LogEntry[] = []
    try {
      const content = await readFile(dataFile, 'utf8')
      entries = content
        ? JSON.parse(content).map(({ start, task, end }: { start: string; task: string; end: string }) => ({
            start: new Date(start),
            task,
            end: new Date(end),
          }))
        : []
    } catch {
      await writeFile(dataFile, JSON.stringify(entries), 'utf8')
    }

    const props = { dataFile, entries }
    console.clear()
    render(<App {...props} />)
  }

  // Run reporting tool
  else if ('datafiles' in argv.argv && Array.isArray(argv.argv['datafiles'])) {
    const files = await Promise.all(argv.argv['datafiles'].map((a) => readFile(a, 'utf8')))
    const days = files.map((f) => JSON.parse(f))
    const records = new Array<TimeRecord & { comment: string; duration: string }>()

    for (const timeRecords of days) {
      for (const record of timeRecords.reverse()) {
        if (isRecord(record))
          records.push({
            ...record,
            comment: record.comment || '',
            duration: toHoursAndMinutes(new Date(record.end).getTime() - new Date(record.start).getTime()),
          })
      }
    }

    const formatDate = (d: string) => {
      const date = new Date(d)
      return [date.getHours(), date.getMinutes()].map((n) => String(n).padStart(2, '0')).join(':')
    }

    const formatted = records.map(({ task, start, end, duration, comment }) => ({
      task,
      fromTo: `${new Date(start).toLocaleString()} - ${formatDate(end)}`,
      duration,
      comment,
    }))

    const total = `In total: ${toHoursAndMinutes(records.reduce((acc, cur) => acc + (new Date(cur.end).getTime() - new Date(cur.start).getTime()), 0))}`

    render(<Report {...{ formatted, total }} />)
  }
}

main()
