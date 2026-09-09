import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appPath = path.join(root, 'src', 'App.refreshed.jsx')

function replaceOnce(source, from, to, label) {
  const index = source.indexOf(from)
  if (index === -1) throw new Error(`Chat context injection anchor missing: ${label}`)
  if (source.indexOf(from, index + from.length) !== -1) {
    throw new Error(`Chat context injection anchor is not unique: ${label}`)
  }
  return source.slice(0, index) + to + source.slice(index + from.length)
}

export function injectChatContext(source) {
  let next = replaceOnce(
    source,
    'import React, { useState, useCallback, useRef } from "react";',
    'import React, { useState, useCallback, useRef, useEffect } from "react";',
    'React hook import',
  )

  const renderAnchor = `  const showFlash      = inWeeks && subscreen==="flash";\n\n  return (`
  const bridge = `  const showFlash      = inWeeks && subscreen==="flash";\n\n  useEffect(() => {\n    const week = weekIdx !== null ? WEEKS[weekIdx] : null;\n    const lesson = showLesson && lessonIdx !== null ? week?.lessons?.[lessonIdx] : null;\n    const view = showLesson ? "lesson"\n      : showQuiz ? "quiz"\n      : showFlash ? "flashcards"\n      : showWeekDetail ? "week"\n      : showWeekList ? "course"\n      : screen;\n\n    window.__NETWORKPLUS_CHAT_CONTEXT__ = {\n      view,\n      week: week?.week ?? null,\n      weekTitle: week?.title ?? null,\n      lessonId: lesson?.id ?? null,\n      lessonTitle: lesson?.title ?? null,\n      lessonExcerpt: lesson?.content?.slice(0, 1800) ?? null,\n      activity: subscreen ?? screen,\n      quizTopic: showQuiz ? week?.title ?? null : null,\n      labTopic: screen === "subnet" ? "Subnetting lab" : null,\n    };\n    window.dispatchEvent(new CustomEvent("networkplus:chat-context"));\n  }, [screen, weekIdx, subscreen, lessonIdx, showLesson, showQuiz, showFlash, showWeekDetail, showWeekList]);\n\n  return (`

  next = replaceOnce(next, renderAnchor, bridge, 'App render bridge')
  return next
}

export function injectGeneratedApp() {
  const source = fs.readFileSync(appPath, 'utf8')
  const injected = injectChatContext(source)
  fs.writeFileSync(appPath, injected)
  return { appPath, bytes: Buffer.byteLength(injected) }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = injectGeneratedApp()
  console.log(`Injected Network+ chat context into ${path.relative(root, result.appPath)} (${result.bytes} bytes)`)
}
