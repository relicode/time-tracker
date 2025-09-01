#!/usr/bin/env node

import React from 'react'
import { Box, Text, type BoxProps } from 'ink'

const args = process.argv.slice(2)

if (!args.length) {
  console.log('Usage: time-report [<report-file...>]')
}

export type TimeRecord = {
  start: string
  end: string
  task: string
  comment?: string
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
      <React.Fragment key={idx}>
        {!idx && (
          <Box {...noBorder} borderBottom justifyContent="center">
            <Text bold>{heading}</Text>
          </Box>
        )}
        <Text>{i}</Text>
      </React.Fragment>
    ))}
  </Box>
)

const Report = ({
  formatted,
  total,
}: {
  formatted: { task: string; fromTo: string; duration: string; comment: string }[]
  total: string
}) => (
  <Box width={100} flexDirection="column">
    <Box borderStyle="round">
      <Column heading="Task" items={formatted.map((f) => f.task)} />
      <Column heading="From - To" items={formatted.map((f) => f.fromTo)} />
      <Column heading="Duration" items={formatted.map((f) => f.duration)} />
      <Column last heading="Comment" items={formatted.map((f) => f.comment)} />
    </Box>
    <Box borderStyle="round" justifyContent="center">
      <Text>{total}</Text>
    </Box>
  </Box>
)

export default Report
