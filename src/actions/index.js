import { debug } from '../'

// User Actions Types:

export const FOCUS_TAB = 'FOCUS_TAB'
export const FOCUS_PANEL = 'FOCUS_PANEL'
export const SELECT_FILE = 'SELECT_FILE'

// Operational Action Types:

export const ERROR = 'ERROR'
export const RECEIVE_SOURCES = 'RECEIVE_SOURCES'
export const RECEIVE_CALLSTACK = 'RECEIVE_CALLSTACK'
export const RECEIVE_BREAKPOINTS = 'RECEIVE_BREAKPOINTS'
export const RECEIVE_SCOPE = 'RECEIVE_SCOPE'
export const RECEIVE_SOURCE = 'RECEIVE_SOURCE'
export const SET_FILE_INDEX = 'SET_FILE_INDEX'
export const SET_EDITOR_LINE = 'SET_EDITOR_LINE'
export const TOGGLE_BREAKPOINT = 'TOGGLE_BREAKPOINT'

// Debugger Action Types
export const PAUSE = 'PAUSE'
export const RESUME = 'RESUME'
export const STEP_OVER = 'STEP_OVER'
export const STEP_INTO = 'STEP_INTO'
export const STEP_OUT = 'STEP_OUT'
export const NEXT_FRAME = 'NEXT_FRAME'
export const PREVIOUS_FRAME = 'PREVIOUS_FRAME'
export const SELECT_FRAME = 'SELECT_FRAME'

// Configuration Action Types:

export const SET_DIMENSIONS = 'SET_DIMENSIONS'
export const TOGGLE_TOOLTIPS = 'TOGGLE_TOOLTIPS'

// User Action Creators:

export function focusTab (payload) {
  return {
    type: FOCUS_TAB,
    payload
  }
}
export function focusPanel (payload) {
  return {
    type: FOCUS_PANEL,
    payload
  }
}
export function selectFile (payload) {
  return (dispatch, getState) => {
    const {sources, files = []} = getState()
    if (!sources.length) return
    const payloadIsObject = Object(payload) === payload

    const script = payloadIsObject
      ? sources.find(s => +s.id === +payload.scriptId)
      : sources.find(s => s.name === payload)

    const {source, name} = script

    dispatch({type: SELECT_FILE, payload: name})
    dispatch({type: SET_FILE_INDEX, payload: files.indexOf(name)})

    if (payloadIsObject) {
      let { lineNumber = 0 } = payload
      lineNumber += 1 // accounts for added module function wrapper
      dispatch(setEditorLine(lineNumber))
    }

    if (source) {
      dispatch(receiveSource(source))
    }
  }
}

export function setEditorLine (payload) {
  return {
    type: SET_EDITOR_LINE,
    payload
  }
}

export function toggleBreakpoint () {
  return (dispatch, getState) => {
    const {editorLine, file, breaks} = getState()
    dispatch({type: TOGGLE_BREAKPOINT})

    const isSet = breaks.find(({line, script_name: name}) => (name === file && line === editorLine))

    if (isSet) {
      debug.clearBreakpoint(isSet.number, (err, result) => {
        if (err) { return error(err) }
        debug.breakpoints((err, {breakpoints}) => {
          if (err) { return error(err) }
          dispatch(receiveBreakpoints(breakpoints))
        })
      })
      return
    }

    debug.setBreakpoint({line: editorLine, file}, (err, result) => {
      if (err) { return error(err) }
      debug.breakpoints((err, {breakpoints}) => {
        if (err) { return error(err) }
        dispatch(receiveBreakpoints(breakpoints))
      })
    })
  }
}

export function selectFrame (payload) {
  return (dispatch, getState) => {
    const {frames} = getState()
    const frameIndex = payload
    const frame = frames[frameIndex]
    const {location} = frame
    dispatch({type: SELECT_FRAME, payload: frame})
    dispatch(selectFile(location))

    debug.scopes(frame, (err, scopes) => {
      if (err) {
        return dispatch(error(err))
      }
      const {local} = scopes

      debug.scope(local, (err, scope) => {
        if (err) {
          return dispatch(error(err))
        }
        dispatch(receiveScope({area: 'local', scope}))
      })
    })
  }
}

// Operational Action Creators:

export function error (payload) {
  return {
    type: ERROR,
    payload
  }
}

export function receiveSources (payload) {
  return {
    type: RECEIVE_SOURCES,
    payload
  }
}

export function receiveCallstack (payload) {
  return {
    type: RECEIVE_CALLSTACK,
    payload
  }
}

export function receiveBreakpoints (payload) {
  return {
    type: RECEIVE_BREAKPOINTS,
    payload
  }
}

export function receiveScope (payload) {
  return {
    type: RECEIVE_SCOPE,
    payload
  }
}

export function receiveSource (payload) {
  return {
    type: RECEIVE_SOURCE,
    payload: (payload + '').split('\n')
  }
}

// Debugger Action Creators

export function pause () {
  return dispatch => {
    dispatch({type: PAUSE})
    debug.pause((err, callstack) => {
      if (err) {
        return dispatch(error(err))
      }
      if (!callstack || !callstack.length) {
        return receiveCallstack([])
      }
      dispatch(receiveCallstack(callstack))
      dispatch(selectFile(callstack[0].location))
    })
  }
}

export function resume () {
  return dispatch => {
    dispatch({type: RESUME})
    dispatch(receiveCallstack([]))
    debug.resume(() => {
    })
  }
}

export function stepOver () {
  return step('Over', STEP_OVER)
}

export function stepInto (payload) {
  return step('Into', STEP_INTO)
}

export function stepOut (payload) {
  return step('Out', STEP_OUT)
}

export function nextFrame (payload) {
  return {
    type: NEXT_FRAME,
    payload
  }
}

export function previousFrame (payload) {
  return {
    type: PREVIOUS_FRAME,
    payload
  }
}

// Configuration Action Creators:

export function setDimensions (payload) {
  return {
    type: SET_DIMENSIONS,
    payload
  }
}

export function toggleTooltips () {
  return {
    type: TOGGLE_TOOLTIPS,
    payload: {}
  }
}

// utils:

function step (act, type) {
  return dispatch => {
    dispatch({type})

    debug.instance.once('unpaused', () => {
      dispatch({type: RESUME})
    })

    debug['step' + act]((err, callstack) => {
      if (err) {
        return dispatch(error(err))
      }
      if (!callstack || !callstack.length) {
        return receiveCallstack([])
      }
      dispatch(receiveCallstack(callstack))
      dispatch(selectFile(callstack[0].location))
    })
  }
}
