import React from 'react'
import classes from '../style/index.styl'
import type { RouteTreeNodeData } from './node'
import { RouteTreeNode } from './node'

export interface RouteTreeComponentProps {
  /**
   * 树形控件中的节点
   */
  nodes: RouteTreeNodeData[]
  /**
   * 是否折叠路径
   * @default false
   */
  foldEmptyPath?: boolean
  /**
   * 默认的路径（非叶子节点）图标
   */
  defaultPathIcon?: React.ReactNode
  /**
   * 默认的叶子节点的图标
   */
  defaultLeafIcon?: React.ReactNode
}

export function RouteTreeComponent(
  props: RouteTreeComponentProps,
): React.ReactElement {
  const {
    nodes,
    foldEmptyPath = false,
    // defaultPathIcon = '',
    // defaultLeafIcon = '',
  } = props

  return (
    <ul className={classes.routeTree}>
      {nodes.map(o => (
        <RouteTreeNode
          key={o.pathname}
          foldedParents={[]}
          foldEmptyPath={foldEmptyPath}
          {...o}
        />
      ))}
    </ul>
  )
}
