import React, { useState } from 'react'
import { Box, Newline, Text, useApp, useInput } from 'ink'
import useDimensions from './use-dimensions.js'
import { writeFile } from 'node:fs/promises'
import Spinner from 'ink-spinner'
import TextInput from './TextInput.js'

const TASKS = ['DEVELOPMENT', 'MEETING', 'DOCUMENTATION', 'RESEARCH'] as const
type Task = (typeof TASKS)[number]
const taskKeys = new Array(TASKS.length).fill(undefined).map((_t, idx) => String(idx + 1))
type ActiveTask = { task: Task; start: Date; comment?: string }
export type LogEntry = ActiveTask & { end: ActiveTask['start'] }

const parseLogEntry = (entry: LogEntry) =>
  `${entry.start.toLocaleString()} - ${entry.end.toLocaleString()} - ${entry.task}`

type Props = {
  dataFile: string
  entries: LogEntry[]
}

const exitKeys = ['q', 'Q'] as const
const commentKeys = ['c', 'C'] as const

type Includes = <T>(arr: readonly T[], element: unknown) => boolean
const includes: Includes = (arr, elem): elem is typeof arr => arr.includes(elem as (typeof arr)[number])

export default function App({ dataFile, entries }: Props) {
  const [activeTask, setActiveTask] = useState<ActiveTask>()
  const [logEntries, setLogEntries] = useState(entries)
  const [commentFocused, setCommentFocused] = useState(false)
  const [comment, setComment] = useState<string>()
  const [columns, rows] = useDimensions()
  const { exit } = useApp()

  const saveActiveTask = async () => {
    if (activeTask) {
      const entries = [{ ...activeTask, end: new Date() }, ...logEntries]
      setLogEntries(entries)
      await writeFile(dataFile, JSON.stringify(entries), 'utf8')
    }
  }

  useInput(async (input) => {
    if (commentFocused) return
    if (includes(exitKeys, input)) {
      await saveActiveTask()
      exit()
    }
    if (includes(commentKeys, input) && activeTask) {
      setCommentFocused(true)
    }

    if (!taskKeys.includes(input)) return
    const taskIndex = parseInt(input, 10) - 1
    const task = TASKS[taskIndex]
    if (!task) return

    const newActiveTask: ActiveTask = {
      start: new Date(),
      task,
    }

    await saveActiveTask()

    const taskToSet = newActiveTask.task === activeTask?.task ? undefined : newActiveTask
    setActiveTask(taskToSet)
    setComment(taskToSet?.comment)
  })

  if (!columns && !rows) return null

  return (
    <Box justifyContent="center">
      <Box borderStyle="round" flexDirection="column" flexGrow={0} height={22} minWidth={63}>
        {commentFocused && activeTask ? (
          <Box justifyContent="center">
            <TextInput
              placeholder={`Enter comment for task ${activeTask.task}`}
              value={comment || ''}
              focus={activeTask && commentFocused}
              onChange={setComment}
              onSubmit={() => {
                delete activeTask.comment
                setActiveTask(() => ({
                  ...activeTask,
                  ...(comment && { comment }),
                }))
                setCommentFocused(false)
              }}
            />
          </Box>
        ) : (
          <Box justifyContent="center">
            {activeTask ? (
              <Text color="green">
                Working on {activeTask.task} <Spinner type="dots" />
                <Newline />
                {activeTask.comment ? <Text>({activeTask.comment})</Text> : null}
              </Text>
            ) : (
              <Text>
                Sleeping <Spinner type="simpleDotsScrolling" /> <Newline />
              </Text>
            )}
          </Box>
        )}

        <Box flexDirection="column" alignItems="center" flexGrow={0} marginTop={1} overflowY="hidden">
          <Box borderStyle="round" flexDirection="column" padding={1}>
            {TASKS.map((t, idx) => (
              <Text color={TASKS.findIndex((t) => t === activeTask?.task) === idx ? 'green' : 'white'} key={t}>
                {idx + 1}. {t}
              </Text>
            ))}
          </Box>
        </Box>
        {logEntries.length ? (
          <Box flexDirection="column" flexGrow={0} borderStyle="doubleSingle" overflowY="hidden">
            {logEntries.slice(0, 5).map((e) => (
              <Text key={e.start.getTime() + e.end.getTime()}>{parseLogEntry(e)}</Text>
            ))}
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}
