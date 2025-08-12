#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import App, { LogEntry } from './app.js'
import { readFile, writeFile } from 'node:fs/promises'

const cli = meow(
  `
	Usage
	  $ ./time-tracker

	Options
		--data  Data file (default: time-tracker.json)

	Examples
	  $ ./time-tracker --data=custom.json
`,
  {
    importMeta: import.meta,
    flags: {
      data: {
        isRequired: false,
        type: 'string',
      },
    },
  }
)

const dataFile = cli.flags.data || 'time-tracker.json'

const main = async () => {
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

main()
