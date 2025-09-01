#!/usr/bin/env node

import React from 'react'
import { render, Box, Text, type BoxProps } from 'ink'

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

const noBorder: BoxProps = {
  borderStyle: 'single',
  borderRight: false,
  borderLeft: false,
  borderTop: false,
  borderBottom: false,
}

const columnProps: BoxProps = {
  flexDirection: 'column',
  paddingX: 1,
  ...noBorder,
}

const Column = ({ heading, items, last }: { heading: string; items: string[]; last?: boolean }) => (
  <Box {...columnProps} borderRight={last ? false : true} flexGrow={1}>
    {items.map((i, idx) => (
      <>
        {!idx && (
          <Box {...noBorder} borderBottom justifyContent="center">
            <Text bold>{heading}</Text>
          </Box>
        )}
        <Text key={idx}>{i}</Text>
      </>
    ))}
  </Box>
)

const main = async () => {
  const files = await Promise.all(args.map((a) => readFile(a, 'utf8')))
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

  return render(
    <Box width={100} flexDirection="column">
      <Box borderStyle="round">
        <Column heading="Task" items={formatted.map((f) => f.task)} />
        <Column heading="From - To" items={formatted.map((f) => f.fromTo)} />
        <Column heading="Duration" items={formatted.map((f) => f.duration)} />
        <Column last heading="Comment" items={formatted.map((f) => f.comment)} />
      </Box>
      <Box borderStyle="round" justifyContent="center">
        <Text>{`In total: ${toHoursAndMinutes(records.reduce((acc, cur) => acc + (new Date(cur.end).getTime() - new Date(cur.start).getTime()), 0))}`}</Text>
      </Box>
    </Box>
  )
}

main()
