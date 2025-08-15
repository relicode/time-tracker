#!/usr/bin/env node
import { readFile } from 'node:fs/promises'

const args = process.argv.slice(2)

if (!args.length) {
  console.log('Usage: time-report [<report-file...>]')
}

const toHoursAndMinutes = (milliSeconds: number) => {
  const minutes = milliSeconds / 1000 / 60
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${Math.round(minutes % 60)}mins`
}

type TimeRecord = {
  start: string
  end: string
  task: string
  comment?: string
}

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

const main = async () => {
  const files = await Promise.all(args.map((a) => readFile(a, 'utf8')))
  const days = files.map((f) => JSON.parse(f))
  const records: (TimeRecord & { duration: string })[] = []

  for (const timeRecords of days) {
    for (const record of timeRecords.reverse()) {
      if (isRecord(record))
        records.push({
          ...record,
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

  console.table(formatted)

  console.log(
    `In total: ${toHoursAndMinutes(records.reduce((acc, cur) => acc + (new Date(cur.end).getTime() - new Date(cur.start).getTime()), 0))}`
  )
}

main()
