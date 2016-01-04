import React from 'React'
import {basename} from 'path'
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import {log} from 'blessed'
import {
  BreakPoints, CallStack, Console, Editor, EditorStatus, Navigator, Scope
} from '../../components'
import * as actionCreators from '../../actions'

const Sources = ({
  layout, 
  source, 
  filename,
  files, 
  fileIndex,
  editorLine,
  callstack, 
  breakpoints, 
  scope, 
  panel,
  actions,
  tooltips
}) => (
  <element {...layout.element}>
    <Navigator tooltips={tooltips} items={files} index={fileIndex} focused={panel === 'navigator'} actions={actions} {...layout.navigator}/>
    <Editor  tooltips={tooltips} items={source} selected={editorLine} focused={panel === 'editor'} actions={actions} {...layout.editor}/>
    <EditorStatus  tooltips={tooltips} line={editorLine} file={filename} {...layout.editorstatus}/>
    <CallStack  tooltips={tooltips} items={callstack} focused={panel === 'callstack'} actions={actions} {...layout.callstack}/>
    <BreakPoints  tooltips={tooltips} items={breakpoints} focused={panel === 'breakpoints'} actions={actions} {...layout.breakpoints}/>
    <Scope  tooltips={tooltips} items={scope} focused={panel === 'scope'} actions={actions} {...layout.scope}/>
    <Console  tooltips={tooltips} focused={panel === 'console'} actions={actions} {...layout.console}/>
  </element>
)

const mapState = ({
  layout, 
  file,
  fileIndex,
  editorLine,
  source, 
  files, 
  callstack, 
  breakpoints, 
  scope, 
  panel,
  tooltips
}) => ({
  layout: layout.sources, 
  source,
  filename: file[0] === '/' ? basename(file) : file,
  files,
  fileIndex,
  editorLine,
  callstack, 
  breakpoints, 
  scope, 
  panel,
  tooltips

})

const mapDispatch = dispatch => ({
  actions: bindActionCreators(actionCreators, dispatch)
})

export default connect(mapState, mapDispatch)(Sources)